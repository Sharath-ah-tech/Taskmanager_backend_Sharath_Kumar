from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings

class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return True
    
class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
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
        user = super().populate_user(request, sociallogin, data)
        provider = sociallogin.account.provider
        extra_data = sociallogin.account.extra_data

        user.oauth_provider = provider
        user.oauth_provider_id = str(sociallogin.account.uid)

        if provider == 'google':
            user.avatar_url = extra_data.get('picture', ''),
            if not user.username:
                user.username = extra_data.get('email', '').split('@')[0]
        elif provider == 'github':
            user.avatar_url = extra_data.get('avatar_url', '')
            if not user.username:
                user.username = extra_data.get('login', '')
        return user
