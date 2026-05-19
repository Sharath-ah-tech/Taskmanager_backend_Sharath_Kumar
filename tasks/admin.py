from django.contrib import admin
from .models import Task, TaskComment, TaskAttachment


class CommentInline(admin.TabularInline):
    model  = TaskComment
    extra  = 0
    fields = ('user', 'content', 'created_at')
    readonly_fields = ('created_at',)


class AttachmentInline(admin.TabularInline):
    model  = TaskAttachment
    extra  = 0
    fields = ('uploaded_by', 'file_name', 'file', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display   = ('title', 'group', 'status', 'priority', 'created_by', 'assigned_to', 'due_date')
    list_filter    = ('status', 'priority', 'group')
    search_fields  = ('title', 'created_by__email')
    inlines        = [CommentInline, AttachmentInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'user', 'created_at')

@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'task', 'uploaded_by', 'uploaded_at')