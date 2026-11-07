from django.conf import settings

from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.password = "StrongPass123!"
        self.user = User.objects.create_user(
            phone_number="+919876543210",
            password=self.password,
            first_name="Sukun",
            last_name="Admin",
        )
        self.login_url = "/api/auth/login/"
        self.refresh_url = "/api/auth/refresh/"
        self.logout_url = "/api/auth/logout/"
        self.me_url = "/api/auth/me/"

    def test_login_returns_tokens_and_sets_cookies(self):
        response = self.client.post(
            self.login_url,
            {"phone_number": "9876543210", "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["phone_number"], self.user.phone_number)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertIn(settings.JWT_AUTH["ACCESS_COOKIE_NAME"], response.cookies)
        self.assertIn(settings.JWT_AUTH["REFRESH_COOKIE_NAME"], response.cookies)

    def test_refresh_accepts_refresh_token_from_cookie(self):
        login_response = self.client.post(
            self.login_url,
            {"phone_number": self.user.phone_number, "password": self.password},
            format="json",
        )
        original_refresh = login_response.data["tokens"]["refresh"]
        self.client.cookies[settings.JWT_AUTH["REFRESH_COOKIE_NAME"]] = original_refresh

        response = self.client.post(self.refresh_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertNotEqual(response.data["tokens"]["refresh"], original_refresh)

    def test_refresh_accepts_refresh_token_from_authorization_header(self):
        login_response = self.client.post(
            self.login_url,
            {"phone_number": self.user.phone_number, "password": self.password},
            format="json",
        )
        refresh_token = login_response.data["tokens"]["refresh"]

        response = self.client.post(
            self.refresh_url,
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {refresh_token}",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["tokens"])

    def test_access_cookie_authenticates_me_endpoint(self):
        login_response = self.client.post(
            self.login_url,
            {"phone_number": self.user.phone_number, "password": self.password},
            format="json",
        )
        self.client.cookies[settings.JWT_AUTH["ACCESS_COOKIE_NAME"]] = login_response.data[
            "tokens"
        ]["access"]

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["phone_number"], self.user.phone_number)

    def test_logout_blacklists_refresh_token_and_clears_cookies(self):
        login_response = self.client.post(
            self.login_url,
            {"phone_number": self.user.phone_number, "password": self.password},
            format="json",
        )
        refresh_token = login_response.data["tokens"]["refresh"]

        logout_response = self.client.post(
            self.logout_url,
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {refresh_token}",
        )

        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertIn(settings.JWT_AUTH["ACCESS_COOKIE_NAME"], logout_response.cookies)
        self.assertIn(settings.JWT_AUTH["REFRESH_COOKIE_NAME"], logout_response.cookies)

        refresh_response = self.client.post(
            self.refresh_url,
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {refresh_token}",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_403_FORBIDDEN)
