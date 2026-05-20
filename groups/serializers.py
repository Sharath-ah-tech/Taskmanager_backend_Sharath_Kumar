from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Group, GroupMembership

User = get_user_model()


class MemberSerializer(serializers.ModelSerializer):
    email      = serializers.EmailField(source='user.email',      read_only=True)
    username   = serializers.CharField(source='user.username',    read_only=True)
    avatar_url = serializers.URLField(source='user.avatar_url',   read_only=True)

    class Meta:
        model  = GroupMembership
        fields = ('id', 'user', 'email', 'username', 'avatar_url', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')


class GroupSerializer(serializers.ModelSerializer):
    members      = MemberSerializer(source='memberships', many=True, read_only=True)
    member_count = serializers.IntegerField(source='memberships.count', read_only=True)
    created_by   = serializers.StringRelatedField(read_only=True)

    class Meta:
        model  = Group
        fields = (
            'id', 'name', 'description', 'created_by',
            'member_count', 'members', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')


class GroupCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Group
        fields = ('name', 'description')


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role  = serializers.ChoiceField(choices=['admin', 'member'], default='member')

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('No user with this email exists.')
        return value


class UpdateMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['admin', 'member'])