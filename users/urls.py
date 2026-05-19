from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, OAuthCallbackView,
    LogoutView, MeView, ChangePasswordView,
)

urlpatterns = [
    path('register/',       RegisterView.as_view(),       name='register'),
    path('login/',          LoginView.as_view(),          name='login'),
    path('logout/',         LogoutView.as_view(),         name='logout'),
    path('token/refresh/',  TokenRefreshView.as_view(),   name='token_refresh'),
    path('oauth/callback/', OAuthCallbackView.as_view(),  name='oauth_callback'),
    path('me/',             MeView.as_view(),             name='me'),
    path('me/password/',    ChangePasswordView.as_view(), name='change_password'),
]