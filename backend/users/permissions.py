from rest_framework.permissions import BasePermission
from groups.models import GroupMembership


class IsAdminUser(BasePermission):
    """Only users with is_admin=True."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class CanAddTask(BasePermission):
    """User must be active AND have can_add_task=True (toggled by admin)."""
    message = 'You do not have permission to create tasks. Contact an admin.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.can_add_task
        )


class IsGroupMember(BasePermission):
    """User must be a member of the group referenced in the request."""
    message = 'You are not a member of this group.'

    def has_permission(self, request, view):
        group_id = (
            view.kwargs.get('group_id') or
            request.data.get('group') or
            request.query_params.get('group')
        )
        if not group_id:
            return True
        return GroupMembership.objects.filter(
            user=request.user, group_id=group_id
        ).exists()


class IsGroupAdminOrOwner(BasePermission):
    """User must have role=owner or role=admin in the group."""
    def has_permission(self, request, view):
        group_id = view.kwargs.get('group_id') or request.data.get('group')
        if not group_id:
            return False
        return GroupMembership.objects.filter(
            user=request.user, group_id=group_id, role__in=['owner', 'admin']
        ).exists()


class IsTaskOwnerOrGroupAdmin(BasePermission):
    """Task creator or group admin/owner can edit/delete."""
    def has_object_permission(self, request, view, obj):
        if request.user == obj.created_by:
            return True
        return GroupMembership.objects.filter(
            user=request.user, group=obj.group, role__in=['owner', 'admin']
        ).exists()