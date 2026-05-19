from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['email'] = user.email
    refresh['username'] = user.username
    refresh['is_admin'] = user.is_admin
    refresh['can_add_task'] = user.can_add_task
    return{
        'refresh' : str(refresh),
        'access' : str(refresh.access_token),
    }

def  OAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response(
                {
                    'error':'OAuth authentication failed'
                },
                status = status.HTTP_401_UNAUTHORIZED
            )
        if not user.is_active:
            return Response(
                {'error' : 'Your account has been disabled by admin'},
                status = status.HTTP_403_FORBIDDEN
            )
        tokens = get_tokens_for_user(user)
        return Response({
            'tokens': tokens,
            'user':{
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'avatar_url': user.avatar_url,
                'is_admin':user.is_admin,
                'can_add_task':user.can_add_task,
            }
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message':'Logged out succesfullly'})
        except Exception:
            return Response(
                {'error': 'Invalid Token'},
                status=status.HTTP_400_BAD_REQUEST
            )

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user 
        return Response({
            'id' : user.id,
            'email' : user.email,
            'username' : user.username,
            'avatar_url' : user.avatar_url,
            'is_admin' : user.is_admin,
            'can_add_task' : user.can_add_task,
            'oauth_provider': user.oauth_provider,
        })