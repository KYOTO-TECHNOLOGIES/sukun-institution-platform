from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ('-date_joined',)
    list_display = (
        'phone_number',
        'email',
        'first_name',
        'last_name',
        'user_type',
        'institution',
        'is_phone_verified',
        'is_staff',
        'is_active',
    )
    search_fields = ('phone_number', 'email', 'first_name', 'last_name')
    readonly_fields = ('last_login', 'date_joined', 'updated_at')

    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        (
            _('Personal info'),
            {
                'fields': (
                    'first_name',
                    'last_name',
                    'email',
                    'user_type',
                    'address',
                    'profile_picture',
                    'institution',
                    'date_of_birth',
                    'blood_group',
                    'is_phone_verified',
                )
            },
        ),
        (
            _('Permissions'),
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                )
            },
        ),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'updated_at')}),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'phone_number',
                    'email',
                    'first_name',
                    'last_name',
                    'user_type',
                    'institution',
                    'password1',
                    'password2',
                    'is_staff',
                    'is_active',
                ),
            },
        ),
    )
