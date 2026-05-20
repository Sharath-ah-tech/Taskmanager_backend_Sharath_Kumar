from django.db import models
from django.conf import settings


class Group(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_groups',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'groups_group'

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    ROLE_CHOICES = [
        ('owner',  'Owner'),
        ('admin',  'Admin'),
        ('member', 'Member'),
    ]
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    group     = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    role      = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table       = 'groups_membership'
        unique_together = ('user', 'group')

    def __str__(self):
        return f"{self.user.email} — {self.group.name} ({self.role})"