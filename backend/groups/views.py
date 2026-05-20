from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Group, GroupMembership
from .serializers import (
    GroupSerializer, GroupCreateUpdateSerializer,
    InviteMemberSerializer, UpdateMemberRoleSerializer, MemberSerializer,
)

User = get_user_model()


class GroupListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """All groups the current user belongs to."""
        groups = Group.objects.filter(
            memberships__user=request.user
        ).distinct().prefetch_related('memberships__user')
        return Response(GroupSerializer(groups, many=True).data)

    def post(self, request):
        """Create group; creator automatically becomes owner."""
        serializer = GroupCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save(created_by=request.user)
            GroupMembership.objects.create(user=request.user, group=group, role='owner')
            return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_group_for_member(self, pk, user):
        group = get_object_or_404(Group, pk=pk)
        if not GroupMembership.objects.filter(user=user, group=group).exists():
            return None
        return group

    def get(self, request, pk):
        group = self._get_group_for_member(pk, request.user)
        if not group:
            return Response({'error': 'Not a member of this group.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(GroupSerializer(group).data)

    def patch(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        if not GroupMembership.objects.filter(
            user=request.user, group=group, role__in=['owner', 'admin']
        ).exists():
            return Response({'error': 'Only admins/owners can edit the group.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = GroupCreateUpdateSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(GroupSerializer(group).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        if not GroupMembership.objects.filter(
            user=request.user, group=group, role='owner'
        ).exists():
            return Response({'error': 'Only the owner can delete this group.'}, status=status.HTTP_403_FORBIDDEN)
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({'error': 'Not a member.'}, status=status.HTTP_403_FORBIDDEN)
        members = GroupMembership.objects.filter(group=group).select_related('user')
        return Response(MemberSerializer(members, many=True).data)

    def post(self, request, group_id):
        """Invite a user by email (admin/owner only)."""
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMembership.objects.filter(
            user=request.user, group=group, role__in=['owner', 'admin']
        ).exists():
            return Response({'error': 'Only admins/owners can invite members.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = InviteMemberSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitee = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response({'error': 'No user found with this email address.'}, status=status.HTTP_404_NOT_FOUND)
        membership, created = GroupMembership.objects.get_or_create(
            user=invitee,
            group=group,
            defaults={'role': serializer.validated_data['role']},
        )
        if not created:
            return Response({'error': 'User is already a member.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MemberSerializer(membership).data, status=status.HTTP_201_CREATED)


class GroupMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, group_id, user_id):
        """Change a member's role. Admin/owner only."""
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMembership.objects.filter(
            user=request.user, group=group, role__in=['owner', 'admin']
        ).exists():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        membership = get_object_or_404(GroupMembership, group=group, user_id=user_id)
        if membership.role == 'owner':
            return Response({'error': "Cannot change the owner's role."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UpdateMemberRoleSerializer(data=request.data)
        if serializer.is_valid():
            membership.role = serializer.validated_data['role']
            membership.save()
            return Response(MemberSerializer(membership).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, group_id, user_id):
        """Remove a member. Members can remove themselves; admins can remove anyone."""
        group      = get_object_or_404(Group, pk=group_id)
        membership = get_object_or_404(GroupMembership, group=group, user_id=user_id)

        is_self      = request.user.pk == int(user_id)
        is_admin     = GroupMembership.objects.filter(
            user=request.user, group=group, role__in=['owner', 'admin']
        ).exists()

        if not (is_self or is_admin):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if membership.role == 'owner':
            return Response({'error': 'Owner cannot be removed.'}, status=status.HTTP_400_BAD_REQUEST)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)