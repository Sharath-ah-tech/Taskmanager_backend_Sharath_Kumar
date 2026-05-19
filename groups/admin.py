from django.contrib import admin
from .models import Group, GroupMembership


class MembershipInline(admin.TabularInline):
    model  = GroupMembership
    extra  = 0
    fields = ('user', 'role', 'joined_at')
    readonly_fields = ('joined_at',)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display  = ('name', 'created_by', 'created_at')
    search_fields = ('name',)
    inlines       = [MembershipInline]


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display  = ('user', 'group', 'role', 'joined_at')
    list_filter   = ('role',)
    search_fields = ('user__email', 'group__name')