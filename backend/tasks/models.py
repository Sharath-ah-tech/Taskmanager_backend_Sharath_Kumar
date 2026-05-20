from django.db import models
from django.conf import settings
from groups.models import Group


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('completed', 'Completed'),
    ]
    PRIORITY_CHOICES = [
        ('green_light',  'Green Light'),
        ('yellow_light', 'Yellow Light'),
        ('red_light',    'Red Light'),
    ]

    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status      = models.CharField(max_length=15, choices=STATUS_CHOICES,  default='pending')
    priority    = models.CharField(max_length=15, choices=PRIORITY_CHOICES, default='green_light')
    due_date    = models.DateTimeField(null=True, blank=True)
    is_enabled  = models.BooleanField(default=True)

    group       = models.ForeignKey(Group,                    on_delete=models.CASCADE,  related_name='tasks')
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,  related_name='created_tasks')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_tasks',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks_task'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class TaskComment(models.Model):
    task       = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks_comment'
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.email} on {self.task.title}"


class TaskAttachment(models.Model):
    task        = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attachments')
    file        = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_name   = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tasks_attachment'

    def __str__(self):
        return self.file_name