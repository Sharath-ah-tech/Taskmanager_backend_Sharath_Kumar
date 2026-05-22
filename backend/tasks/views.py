from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from groups.models import GroupMembership
from .filters import TaskFilter
from .models import Task, TaskComment, TaskAttachment
from .serializers import (
    TaskSerializer, TaskListSerializer, TaskCreateUpdateSerializer,
    CommentSerializer, AttachmentSerializer,
)

ALLOWED_ORDERINGS = {'created_at', '-created_at', 'due_date', '-due_date', 'priority', '-priority', 'status'}


def is_platform_superuser(user):
    return bool(user and user.is_authenticated and user.is_superuser)


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if is_platform_superuser(request.user):
            qs = Task.objects.all().select_related('created_by', 'assigned_to', 'group')
        else:
            user_groups = GroupMembership.objects.filter(user=request.user).values_list('group_id', flat=True)
            qs = Task.objects.filter(group__in=user_groups).select_related('created_by', 'assigned_to', 'group')

        qs = TaskFilter(request.query_params, queryset=qs).qs

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)

        ordering = request.query_params.get('ordering', '-created_at')
        if ordering in ALLOWED_ORDERINGS:
            qs = qs.order_by(ordering)

        return Response(TaskListSerializer(qs, many=True).data)

    def post(self, request):
        if not (request.user.is_active and request.user.can_add_task):
            return Response(
                {'error': 'You do not have permission to create tasks.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TaskCreateUpdateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save(created_by=request.user)
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _check_membership(self, task, user):
        return GroupMembership.objects.filter(user=user, group=task.group).exists()

    def _check_edit_permission(self, task, user):
        if is_platform_superuser(user):
            return True
        if task.created_by == user:
            return True
        return GroupMembership.objects.filter(
            user=user, group=task.group, role__in=['owner', 'admin']
        ).exists()

    def get(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if not (is_platform_superuser(request.user) or self._check_membership(task, request.user)):
            return Response({'error': 'Not a member of this group.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(TaskSerializer(task).data)

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if is_platform_superuser(request.user):
            pass
        elif not self._check_membership(task, request.user):
            return Response({'error': 'Not a member of this group.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            allowed_fields = {'status'}
            invalid_fields = set(request.data.keys()) - allowed_fields
            if invalid_fields:
                return Response(
                    {'error': 'Only task status can be changed by regular users.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = TaskCreateUpdateSerializer(
            task, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if not is_platform_superuser(request.user):
            return Response({'error': 'Only admins can delete tasks.'}, status=status.HTTP_403_FORBIDDEN)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskCommentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        if not GroupMembership.objects.filter(user=request.user, group=task.group).exists():
            return Response({'error': 'Not a group member.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(CommentSerializer(task.comments.select_related('user'), many=True).data)

    def post(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        if not GroupMembership.objects.filter(user=request.user, group=task.group).exists():
            return Response({'error': 'Not a group member.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskCommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id, comment_id):
        comment = get_object_or_404(TaskComment, pk=comment_id, task_id=task_id)
        if comment.user != request.user:
            return Response({'error': 'You can only edit your own comments.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, task_id, comment_id):
        comment = get_object_or_404(TaskComment, pk=comment_id, task_id=task_id)
        is_author = comment.user == request.user
        is_admin  = GroupMembership.objects.filter(
            user=request.user, group=comment.task.group, role__in=['owner', 'admin']
        ).exists()
        if not (is_author or is_admin):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskAttachmentListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def get(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        if not GroupMembership.objects.filter(user=request.user, group=task.group).exists():
            return Response({'error': 'Not a group member.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(AttachmentSerializer(task.attachments.select_related('uploaded_by'), many=True).data)

    def post(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        if not GroupMembership.objects.filter(user=request.user, group=task.group).exists():
            return Response({'error': 'Not a group member.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = AttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskAttachmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, task_id, attachment_id):
        attachment = get_object_or_404(TaskAttachment, pk=attachment_id, task_id=task_id)
        is_uploader = attachment.uploaded_by == request.user
        is_admin    = GroupMembership.objects.filter(
            user=request.user, group=attachment.task.group, role__in=['owner', 'admin']
        ).exists()
        if not (is_uploader or is_admin):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
