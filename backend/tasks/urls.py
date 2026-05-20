from django.urls import path
from .views import (
    TaskListCreateView, TaskDetailView,
    TaskCommentListCreateView, TaskCommentDetailView,
    TaskAttachmentListCreateView, TaskAttachmentDetailView,
)

urlpatterns = [
    path('',                                              TaskListCreateView.as_view(),           name='task-list-create'),
    path('<int:pk>/',                                     TaskDetailView.as_view(),               name='task-detail'),
    path('<int:task_id>/comments/',                       TaskCommentListCreateView.as_view(),    name='task-comments'),
    path('<int:task_id>/comments/<int:comment_id>/',      TaskCommentDetailView.as_view(),        name='task-comment-detail'),
    path('<int:task_id>/attachments/',                    TaskAttachmentListCreateView.as_view(), name='task-attachments'),
    path('<int:task_id>/attachments/<int:attachment_id>/', TaskAttachmentDetailView.as_view(),   name='task-attachment-detail'),
]