from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from tasks.models import Task, TaskComment
from groups.models import GroupMembership
from .models import Notification


@receiver(pre_save, sender=Task)
def remember_previous_task_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return
    instance._previous_status = (
        Task.objects.filter(pk=instance.pk)
        .values_list('status', flat=True)
        .first()
    )


@receiver(post_save, sender=Task)
def notify_on_task_save(sender, instance, created, **kwargs):
    task = instance

    if created:
        # Notify all group members except the creator
        members = GroupMembership.objects.filter(
            group=task.group
        ).exclude(user=task.created_by).select_related('user')

        Notification.objects.bulk_create([
            Notification(
                user=m.user,
                task=task,
                type='task_created',
                message=f'New task "{task.title}" was added to {task.group.name}.',
            )
            for m in members
        ])

    # Notify the assigned user
    if task.assigned_to and task.assigned_to != task.created_by:
        Notification.objects.get_or_create(
            user=task.assigned_to,
            task=task,
            type='task_assigned',
            defaults={'message': f'You were assigned to "{task.title}".'},
        )

    # Notify creator when status changes (not on creation)
    if not created and task.created_by:
        Notification.objects.create(
            user=task.created_by,
            task=task,
            type='task_updated',
            message=f'Your task "{task.title}" was updated to "{task.get_status_display()}".',
        )

    # Separate completed notification
    if not created and task.status == 'completed' and getattr(task, '_previous_status', None) != 'completed':
        members = GroupMembership.objects.filter(
            group=task.group
        ).exclude(user=task.created_by).select_related('user')
        Notification.objects.bulk_create([
            Notification(
                user=m.user,
                task=task,
                type='task_completed',
                message=f'Task "{task.title}" has been marked as done.',
            )
            for m in members
        ])


@receiver(post_save, sender=TaskComment)
def notify_on_comment(sender, instance, created, **kwargs):
    if not created:
        return
    comment = instance
    task    = comment.task

    if task.created_by != comment.user:
        Notification.objects.create(
            user=task.created_by,
            task=task,
            type='comment_added',
            message=f'{comment.user.username or comment.user.email} commented on "{task.title}".',
        )
