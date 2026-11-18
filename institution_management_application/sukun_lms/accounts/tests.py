from django.conf import settings
from django.test import override_settings

from rest_framework import status
from rest_framework.test import APITestCase, APIClient

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

    def test_named_cookies_on_https_custom_port_preserve_other_app_cookies(self):
        jwt = {**settings.JWT_AUTH, 'ACCESS_COOKIE_NAME': 'sukun_access',
               'REFRESH_COOKIE_NAME': 'sukun_refresh', 'COOKIE_SECURE': True}
        with override_settings(JWT_AUTH=jwt, CSRF_COOKIE_NAME='sukun_csrf',
                               CSRF_COOKIE_SECURE=True,
                               ALLOWED_HOSTS=['203.0.113.10'],
                               CSRF_TRUSTED_ORIGINS=['https://203.0.113.10:8443']):
            client = APIClient(enforce_csrf_checks=True)
            for name in ('access_token', 'refresh_token', 'csrftoken', 'sessionid'):
                client.cookies[name] = 'another-application'
            request = {'secure': True, 'HTTP_HOST': '203.0.113.10:8443',
                       'HTTP_ORIGIN': 'https://203.0.113.10:8443'}
            csrf = client.get('/api/auth/csrf/', **request)
            self.assertIn('sukun_csrf', csrf.cookies)
            self.assertTrue(csrf.cookies['sukun_csrf']['secure'])
            request['HTTP_X_CSRFTOKEN'] = csrf.data['csrfToken']
            credentials = {'phone_number': self.user.phone_number, 'password': self.password}
            rejected = client.post(self.login_url, credentials, format='json',
                                   **{**request, 'HTTP_ORIGIN': 'https://203.0.113.10:9443'})
            self.assertEqual(rejected.status_code, 403)
            login = client.post(self.login_url, credentials, format='json', **request)
            self.assertEqual(login.status_code, 200, login.data)
            self.assertTrue(login.cookies['sukun_access']['httponly'])
            self.assertTrue(login.cookies['sukun_access']['secure'])
            self.assertEqual(client.get(self.me_url, **request).status_code, 200)
            self.assertEqual(client.post(self.refresh_url, {}, format='json', **request).status_code, 200)
            logout = client.post(self.logout_url, {}, format='json', **request)
            self.assertEqual(logout.status_code, 200)
            self.assertEqual(int(logout.cookies['sukun_access']['max-age']), 0)
            self.assertEqual(int(logout.cookies['sukun_refresh']['max-age']), 0)
            for name in ('access_token', 'refresh_token', 'csrftoken', 'sessionid'):
                self.assertNotIn(name, logout.cookies)
                self.assertEqual(client.cookies[name].value, 'another-application')

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
