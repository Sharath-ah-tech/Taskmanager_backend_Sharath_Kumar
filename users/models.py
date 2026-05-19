from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('can_add_task', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email             = models.EmailField(unique=True)
    username          = models.CharField(max_length=50, blank=True)
    avatar_url        = models.URLField(blank=True)

    # OAuth
    oauth_provider    = models.CharField(max_length=20, blank=True)
    oauth_provider_id = models.CharField(max_length=100, blank=True)

    # App-level flags controlled by admin
    is_admin          = models.BooleanField(default=False)
    can_add_task      = models.BooleanField(default=True)

    # Django internals
    is_active         = models.BooleanField(default=True)
    is_staff          = models.BooleanField(default=False)
    date_joined       = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users_user'

    def __str__(self):
        return self.email