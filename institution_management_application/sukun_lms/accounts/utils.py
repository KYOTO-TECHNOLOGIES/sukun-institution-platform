from django.conf import settings
from django.core.exceptions import ValidationError

import phonenumbers
from phonenumbers import NumberParseException, PhoneNumberFormat


def normalize_phone_number(phone_number: str) -> str:
    candidate = str(phone_number or "").strip()
    if not candidate:
        raise ValidationError("Phone number is required.")

    try:
        parsed_number = phonenumbers.parse(
            candidate,
            region=getattr(settings, "PHONE_DEFAULT_REGION", None),
        )
    except NumberParseException as exc:
        raise ValidationError("Enter a valid phone number.") from exc

    if not phonenumbers.is_possible_number(parsed_number):
        raise ValidationError("Enter a possible phone number.")

    if not phonenumbers.is_valid_number(parsed_number):
        raise ValidationError("Enter a valid phone number.")

    return phonenumbers.format_number(parsed_number, PhoneNumberFormat.E164)


def get_bearer_token(request) -> str | None:
    authorization_header = request.headers.get("Authorization", "").strip()
    if not authorization_header:
        return None

    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]
