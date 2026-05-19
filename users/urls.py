from django.urls import path 
from .views import OAuthCallbackView, LogoutView, MeView

urlpatterns = [
    path('oauth/callback/', OAuthCallbackView, name='oauth-callback'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
]