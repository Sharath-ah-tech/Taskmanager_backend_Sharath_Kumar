from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer, UserSerializer,
    UserUpdateSerializer, ChangePasswordSerializer,
)

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['email'] = user.email
    refresh['username'] = user.username
    refresh['is_admin'] = user.is_admin
    refresh['can_add_task'] = user.can_add_task
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ============ AUTH ROOT VIEW ============
class AuthRootView(APIView):
    """Root endpoint for authentication API"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            "message": "Authentication API - Task Manager",
            "version": "1.0",
            "endpoints": {
                "register": {
                    "url": "/api/auth/register/",
                    "method": "POST",
                    "body": {"email": "string", "username": "string", "password": "string", "password2": "string"}
                },
                "login": {
                    "url": "/api/auth/login/",
                    "method": "POST", 
                    "body": {"email": "string", "password": "string"}
                },
                "logout": {
                    "url": "/api/auth/logout/",
                    "method": "POST",
                    "body": {"refresh": "string"}
                },
                "refresh_token": {
                    "url": "/api/auth/token/refresh/",
                    "method": "POST",
                    "body": {"refresh": "string"}
                },
                "me": {
                    "url": "/api/auth/me/",
                    "method": "GET/PATCH"
                },
                "change_password": {
                    "url": "/api/auth/me/password/",
                    "method": "POST",
                    "body": {"old_password": "string", "new_password": "string"}
                },
                "password_reset": {
                    "url": "/api/auth/password-reset/",
                    "method": "POST",
                    "body": {"email": "string"}
                },
                "email_verify": {
                    "url": "/api/auth/email-verify-request/",
                    "method": "POST"
                }
            }
        })


# ============ REGISTER VIEW ============
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            
            # Send welcome email (optional - will work after SMTP setup)
            #try:
            #    subject = 'Welcome to Task Manager!'
            #    html_message = render_to_string('emails/welcome.html', {'username': user.username})
            #    plain_message = f"Welcome {user.username}! Thank you for joining Task Manager."
            #    send_mail(
            #        subject,
            #        plain_message,
            #        settings.DEFAULT_FROM_EMAIL,
            #        [user.email],
            #        html_message=html_message,
            #        fail_silently=True,
            #    )
            #except Exception:
            #    pass  # Don't fail registration if email fails
            
            return Response(
                {'tokens': tokens, 'user': UserSerializer(user).data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ LOGIN VIEW ============
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({'error': 'Your account has been disabled.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        return Response({'tokens': tokens, 'user': UserSerializer(user).data})


# ============ OAUTH CALLBACK VIEW ============
class OAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'OAuth authentication failed.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({'error': 'Your account has been disabled by admin.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        return Response({'tokens': tokens, 'user': UserSerializer(user).data})


# ============ LOGOUT VIEW ============
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid or already blacklisted token.'}, status=status.HTTP_400_BAD_REQUEST)


# ============ ME VIEW ============
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ CHANGE PASSWORD VIEW ============
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ PASSWORD RESET REQUEST VIEW ============
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            reset_url = f"http://localhost:3000/reset-password/{uid}/{token}/"
            
            # try:
            #     subject = 'Password Reset Request - Task Manager'
            #     html_message = render_to_string('emails/password_reset.html', {
            #         'username': user.username,
            #         'reset_url': reset_url
            #     })
            #     plain_message = f"Click to reset password: {reset_url}"
            #     send_mail(
            #         subject,
            #         plain_message,
            #         settings.DEFAULT_FROM_EMAIL,
            #         [email],
            #         html_message=html_message,
            #         fail_silently=True,
            #     )
            # except Exception:
            #     pass
            
            return Response({'message': 'Password reset email sent if account exists'})
        except User.DoesNotExist:
            return Response({'message': 'Password reset email sent if account exists'})


# ============ PASSWORD RESET CONFIRM VIEW ============
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired reset link'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'New password required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password reset successful'})


# ============ EMAIL VERIFICATION REQUEST VIEW ============
class EmailVerificationRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        if hasattr(user, 'is_verified') and user.is_verified:
            return Response({'error': 'Email already verified'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        from .tokens import account_activation_token
        token = account_activation_token.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verify_url = f"http://localhost:3000/verify-email/{uid}/{token}/"
        
        # try:
        #     send_mail(
        #         'Verify Your Email',
        #         f'Click to verify: {verify_url}',
        #         settings.DEFAULT_FROM_EMAIL,
        #         [user.email],
        #         fail_silently=True,
        #     )
        # except Exception:
        #     pass
        
        return Response({'message': 'Verification email sent'})


# ============ EMAIL VERIFY VIEW ============
class EmailVerifyView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid verification link'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        from .tokens import account_activation_token
        if account_activation_token.check_token(user, token):
            user.is_verified = True
            user.save()
            return Response({'message': 'Email verified successfully'})
        
        return Response({'error': 'Invalid verification link'}, 
                      status=status.HTTP_400_BAD_REQUEST)