from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ('user', 'type', 'task', 'is_read', 'created_at')
    list_filter   = ('type', 'is_read')
    list_editable = ('is_read',)
    search_fields = ('user__email',)