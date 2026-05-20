from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework.reverse import reverse_lazy

def api_home(request):
    """API root endpoint showing available endpoints"""
    return JsonResponse({
        "message": "Welcome to Task Manager API",
        "version": "1.0.0",
        "documentation": {
            "admin_panel": "/admin/",
            "authentication": {
                "register": "/api/auth/register/",
                "login": "/api/auth/login/",
                "logout": "/api/auth/logout/",
                "refresh_token": "/api/auth/token/refresh/",
                "me": "/api/auth/me/",
                "change_password": "/api/auth/me/password/"
            },
            "groups": {
                "list_create": "/api/groups/",
                "detail": "/api/groups/{id}/",
                "members": "/api/groups/{id}/members/",
                "member_detail": "/api/groups/{id}/members/{user_id}/"
            },
            "tasks": {
                "list_create": "/api/tasks/",
                "detail": "/api/tasks/{id}/",
                "comments": "/api/tasks/{id}/comments/",
                "attachments": "/api/tasks/{id}/attachments/"
            },
            "notifications": {
                "list": "/api/notifications/",
                "unread_count": "/api/notifications/unread-count/",
                "mark_all_read": "/api/notifications/mark-all-read/"
            }
        },
        "auth_required": "Most endpoints require Bearer token authentication",
        "status": "running"
    })