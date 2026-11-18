from rest_framework.throttling import UserRateThrottle


class PasswordChangeThrottle(UserRateThrottle):
    scope = 'password_change'
