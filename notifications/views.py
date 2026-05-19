from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        List notifications for the current user.
        ?unread=true  ->  only unread
        """
        qs = Notification.objects.filter(user=request.user).select_related('task')
        if request.query_params.get('unread') == 'true':
            qs = qs.filter(is_read=False)
        return Response(NotificationSerializer(qs, many=True).data)


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'marked_read': updated})


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        """Mark a single notification as read or unread."""
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.is_read = request.data.get('is_read', True)
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)

    def delete(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)