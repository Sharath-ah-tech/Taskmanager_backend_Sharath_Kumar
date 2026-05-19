from django.db.models.signals import post_save
from django.dispatch import receiver
from tasks.models import Task, TaskComment
from groups.models import GroupMembership
from .models import Notification


@receiver(post_save, sender=Task)
def notify_on_task_save(sender, instance, created, **kwargs):
    task = instance

    if created:
        # Notify all group members (except the creator) that a new task was added
        members = GroupMembership.objects.filter(
            group=task.group
        ).exclude(user=task.created_by).select_related('user')

        notifications = [
            Notification(
                user=m.user,
                task=task,
                type='task_created',
                message=f'New task "{task.title}" was added to {task.group.name}'
            )
            for m in members
        ]
        Notification.objects.bulk_create(notifications)

    # If task is assigned, notify the assigned user
    if task.assigned_to and task.assigned_to != task.created_by:
        Notification.objects.get_or_create(
            user=task.assigned_to,
            task=task,
            type='task_assigned',
            defaults={
                'message': f'You were assigned to "{task.title}"'
            }
        )

    # Notify creator when someone else updates the task status
    if not created and task.created_by:
        Notification.objects.create(
            user=task.created_by,
            task=task,
            type='task_updated',
            message=f'Your task "{task.title}" was updated to {task.get_status_display()}'
        )


@receiver(post_save, sender=TaskComment)
def notify_on_comment(sender, instance, created, **kwargs):
    if not created:
        return
    comment = instance
    task    = comment.task

    # Notify the task creator when someone comments
    if task.created_by != comment.user:
        Notification.objects.create(
            user=task.created_by,
            task=task,
            type='comment_added',
            message=f'{comment.user.username} commented on "{task.title}"'
        )