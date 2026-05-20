from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ('email', 'username', 'is_admin', 'can_add_task', 'is_active', 'oauth_provider', 'date_joined')
    list_filter    = ('is_admin', 'can_add_task', 'is_active', 'oauth_provider')
    list_editable  = ('is_admin', 'can_add_task', 'is_active')
    search_fields  = ('email', 'username')
    ordering       = ('-date_joined',)

    fieldsets = (
        (None,          {'fields': ('email', 'password')}),
        ('Profile',     {'fields': ('username', 'avatar_url')}),
        ('OAuth',       {'fields': ('oauth_provider', 'oauth_provider_id')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                    'is_admin', 'can_add_task',
                                    'groups', 'user_permissions')}),
        ('Dates',       {'fields': ('date_joined', 'last_login')}),
    )
    readonly_fields = ('date_joined', 'last_login')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'username', 'is_admin', 'can_add_task'),
        }),
    )