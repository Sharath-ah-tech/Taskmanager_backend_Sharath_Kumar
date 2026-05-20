from django.urls import path
from .views import (
    GroupListCreateView,
    GroupDetailView,
    GroupMembersView,
    GroupMemberDetailView,
)

urlpatterns = [
    path('',                                      GroupListCreateView.as_view(),   name='group-list-create'),
    path('<int:pk>/',                              GroupDetailView.as_view(),       name='group-detail'),
    path('<int:group_id>/members/',                GroupMembersView.as_view(),      name='group-members'),
    path('<int:group_id>/members/<int:user_id>/',  GroupMemberDetailView.as_view(), name='group-member-detail'),
]