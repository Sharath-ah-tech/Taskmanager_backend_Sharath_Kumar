from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from groups.models import Group, GroupMembership
from tasks.models import Task

User = get_user_model()


class PlatformAdminAccessTests(APITestCase):
    def setUp(self):
        self.regular = User.objects.create_user(
            email='member@example.com',
            username='member',
            password='StrongPass123!',
        )
        self.app_admin = User.objects.create_user(
            email='flagged@example.com',
            username='flagged',
            password='StrongPass123!',
            is_admin=True,
        )
        self.superuser = User.objects.create_superuser(
            email='owner@example.com',
            username='owner',
            password='StrongPass123!',
        )

    def test_registration_creates_regular_user_not_superuser(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'new@example.com',
            'username': 'newbie',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='new@example.com')
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_admin)
        self.assertFalse(response.data['user']['is_superuser'])

    def test_admin_user_api_requires_real_superuser(self):
        self.client.force_authenticate(self.app_admin)
        response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.superuser)
        response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_update_member_controls(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.patch(f'/api/auth/admin/users/{self.regular.id}/', {
            'username': 'renamed',
            'is_active': False,
            'can_add_task': False,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.regular.refresh_from_db()
        self.assertEqual(self.regular.username, 'renamed')
        self.assertFalse(self.regular.is_active)
        self.assertFalse(self.regular.can_add_task)

    def test_superuser_can_manage_task_without_group_membership(self):
        group = Group.objects.create(name='Operations', created_by=self.regular)
        GroupMembership.objects.create(user=self.regular, group=group, role='owner')
        task = Task.objects.create(
            title='Quarterly report',
            group=group,
            created_by=self.regular,
        )

        self.client.force_authenticate(self.superuser)
        detail_response = self.client.get(f'/api/tasks/{task.id}/')
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

        update_response = self.client.patch(f'/api/tasks/{task.id}/', {
            'status': 'completed',
            'due_date': '2026-06-01T10:00:00Z',
            'is_enabled': False,
        }, format='json')

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, 'completed')
        self.assertFalse(task.is_enabled)
        self.assertIsNotNone(task.due_date)
