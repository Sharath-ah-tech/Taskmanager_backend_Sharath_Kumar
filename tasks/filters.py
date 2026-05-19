import django_filters
from .models import Task


class TaskFilter(django_filters.FilterSet):
    status      = django_filters.CharFilter(field_name='status')
    priority    = django_filters.CharFilter(field_name='priority')
    group       = django_filters.NumberFilter(field_name='group__id')
    assigned_to = django_filters.NumberFilter(field_name='assigned_to__id')
    created_by  = django_filters.NumberFilter(field_name='created_by__id')
    due_before  = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='lte')
    due_after   = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='gte')

    class Meta:
        model  = Task
        fields = ['status', 'priority', 'group', 'assigned_to', 'created_by']