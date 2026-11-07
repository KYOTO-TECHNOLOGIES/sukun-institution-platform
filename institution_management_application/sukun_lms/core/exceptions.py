from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from rest_framework.views import exception_handler
from rest_framework.response import Response


def api_exception_handler(exc, context):
    if isinstance(exc,DjangoValidationError):
        return Response(getattr(exc,'message_dict',{'detail':exc.messages}),status=400)
    if isinstance(exc,ProtectedError):
        return Response({'detail':'This record is used by other records and cannot be deleted.'},status=409)
    if isinstance(exc,IntegrityError):
        return Response({'detail':'This change conflicts with an existing record. Refresh and try again.'},status=409)
    return exception_handler(exc,context)
