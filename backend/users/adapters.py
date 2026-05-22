from allauth.account.adapter import DefaultAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.shortcuts import redirect


class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return True

    def get_login_redirect_url(self, request):
        return f"{settings.FRONTEND_URL}/oauth-callback"

    def get_signup_redirect_url(self, request):
        return f"{settings.FRONTEND_URL}/oauth-callback"


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def on_authentication_error(
        self,
        request,
        provider,
        error=None,
        exception=None,
        extra_context=None,
    ):
        raise ImmediateHttpResponse(
            redirect(f"{settings.FRONTEND_URL}/oauth-callback?error=oauth_failed")
        )

    def pre_social_login(self, request, sociallogin):
        """Link OAuth login to an existing account with the same email."""
        user = sociallogin.user
        if user.id:
            return
        if not user.email:
            return
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            existing = User.objects.get(email=user.email)
            sociallogin.connect(request, existing)
        except User.DoesNotExist:
            pass

    def populate_user(self, request, sociallogin, data):
        user     = super().populate_user(request, sociallogin, data)
        provider = sociallogin.account.provider
        extra    = sociallogin.account.extra_data

        user.oauth_provider    = provider
        user.oauth_provider_id = str(sociallogin.account.uid)

        if provider == 'google':
            user.avatar_url = extra.get('picture', '')
            if not user.username:
                user.username = extra.get('email', '').split('@')[0]
        elif provider == 'github':
            user.avatar_url = extra.get('avatar_url', '')
            if not user.username:
                user.username = extra.get('login', '')
        return user
