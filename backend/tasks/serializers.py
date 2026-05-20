from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Task, TaskComment, TaskAttachment

User = get_user_model()


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model  = TaskAttachment
        fields = ('id', 'file', 'file_name', 'uploaded_by', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at', 'file_name')

    def create(self, validated_data):
        validated_data['file_name'] = validated_data['file'].name
        return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    user       = serializers.StringRelatedField(read_only=True)
    avatar_url = serializers.URLField(source='user.avatar_url', read_only=True)

    class Meta:
        model  = TaskComment
        fields = ('id', 'user', 'avatar_url', 'content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'avatar_url', 'created_at', 'updated_at')


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight — no nested comments or attachments. Used for list views."""
    created_by       = serializers.StringRelatedField(read_only=True)
    assigned_to      = serializers.StringRelatedField(read_only=True)
    comment_count    = serializers.IntegerField(source='comments.count',    read_only=True)
    attachment_count = serializers.IntegerField(source='attachments.count', read_only=True)

    class Meta:
        model  = Task
        fields = (
            'id', 'title', 'status', 'priority', 'due_date', 'is_enabled',
            'group', 'created_by', 'assigned_to',
            'comment_count', 'attachment_count',
            'created_at', 'updated_at',
        )


class TaskSerializer(serializers.ModelSerializer):
    """Full detail — includes nested comments and attachments."""
    created_by       = serializers.StringRelatedField(read_only=True)
    assigned_to      = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False,
    )
    comments         = CommentSerializer(many=True, read_only=True)
    attachments      = AttachmentSerializer(many=True, read_only=True)
    comment_count    = serializers.IntegerField(source='comments.count',    read_only=True)
    attachment_count = serializers.IntegerField(source='attachments.count', read_only=True)

    class Meta:
        model  = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority', 'due_date', 'is_enabled',
            'group', 'created_by', 'assigned_to',
            'comment_count', 'attachment_count',
            'comments', 'attachments',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Task
        fields = ('title', 'description', 'status', 'priority', 'due_date', 'group', 'assigned_to', 'is_enabled')

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.is_admin:
            # Non-admins cannot modify priority or is_enabled
            if 'priority' in attrs:
                attrs.pop('priority')
            if 'is_enabled' in attrs:
                attrs.pop('is_enabled')
        return super().validate(attrs)

    def validate_group(self, group):
        from groups.models import GroupMembership
        if not GroupMembership.objects.filter(
            user=self.context['request'].user, group=group
        ).exists():
            raise serializers.ValidationError('You are not a member of this group.')
        return group

    def validate_assigned_to(self, user):
        """Ensure the assigned user is a member of the chosen group."""
        if user is None:
            return user
        group_id = self.initial_data.get('group') or (self.instance.group_id if self.instance else None)
        if group_id:
            from groups.models import GroupMembership
            if not GroupMembership.objects.filter(user=user, group_id=group_id).exists():
                raise serializers.ValidationError('Assigned user is not a member of this group.')
        return user