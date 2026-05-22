from django.db import models
from django.conf import settings
from tasks.models import Task


class Notification(models.Model):
    TYPE_CHOICES = [
        ('task_created',   'Task created in your group'),
        ('task_assigned',  'Task assigned to you'),
        ('task_updated',   'Task you created was updated'),
        ('comment_added',  'Comment added to your task'),
        ('task_completed', 'Task marked as done'),
        ('member_invited', 'Member added to group'),
    ]

    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    task       = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True, blank=True,
    )
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} -> {self.user.email}"
