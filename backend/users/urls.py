from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, OAuthCallbackView,
    LogoutView, MeView, ChangePasswordView,
    PasswordResetRequestView, PasswordResetConfirmView,
    EmailVerificationRequestView, EmailVerifyView,
    AuthRootView, AdminUserListView
)

urlpatterns = [
    # Root auth endpoint
    path('', AuthRootView.as_view(), name='auth-root'),
    
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('oauth/callback/', OAuthCallbackView.as_view(), name='oauth_callback'),
    
    # User profile
    path('me/', MeView.as_view(), name='me'),
    path('me/password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Password reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/<uidb64>/<token>/', 
         PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Email verification
    path('email-verify-request/', EmailVerificationRequestView.as_view(), name='email-verify-request'),
    path('email-verify/<uidb64>/<token>/', EmailVerifyView.as_view(), name='email-verify'),
    
    # Admin routes
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
]