from django.conf import settings


def _cookie_settings():
    return settings.JWT_AUTH


def set_auth_cookies(response, access_token: str, refresh_token: str | None = None):
    cookie_settings = _cookie_settings()

    response.set_cookie(
        cookie_settings["ACCESS_COOKIE_NAME"],
        access_token,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        httponly=cookie_settings["COOKIE_HTTP_ONLY"],
        secure=cookie_settings["COOKIE_SECURE"],
        samesite=cookie_settings["COOKIE_SAMESITE"],
        domain=cookie_settings["COOKIE_DOMAIN"],
        path=cookie_settings["COOKIE_PATH"],
    )

    if refresh_token:
        response.set_cookie(
            cookie_settings["REFRESH_COOKIE_NAME"],
            refresh_token,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            httponly=cookie_settings["COOKIE_HTTP_ONLY"],
            secure=cookie_settings["COOKIE_SECURE"],
            samesite=cookie_settings["COOKIE_SAMESITE"],
            domain=cookie_settings["COOKIE_DOMAIN"],
            path=cookie_settings["COOKIE_PATH"],
        )


def clear_auth_cookies(response):
    cookie_settings = _cookie_settings()

    response.delete_cookie(
        cookie_settings["ACCESS_COOKIE_NAME"],
        domain=cookie_settings["COOKIE_DOMAIN"],
        path=cookie_settings["COOKIE_PATH"],
        samesite=cookie_settings["COOKIE_SAMESITE"],
    )
    response.delete_cookie(
        cookie_settings["REFRESH_COOKIE_NAME"],
        domain=cookie_settings["COOKIE_DOMAIN"],
        path=cookie_settings["COOKIE_PATH"],
        samesite=cookie_settings["COOKIE_SAMESITE"],
    )
