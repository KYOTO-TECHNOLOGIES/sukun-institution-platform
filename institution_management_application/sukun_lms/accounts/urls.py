from django.urls import path

from .views import CsrfView, LoginView, LogoutView, MeView, RefreshView, RegisterInstitutionView

app_name = "accounts"


urlpatterns = [
    path("csrf/", CsrfView.as_view(), name="csrf"),
    path("login/", LoginView.as_view(), name="login"),
    path("register-institution/", RegisterInstitutionView.as_view(), name="register_institution"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
