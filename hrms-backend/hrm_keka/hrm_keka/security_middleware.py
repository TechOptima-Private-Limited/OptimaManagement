from __future__ import annotations

from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import TokenError

from authentication.models import UserTokenState


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        csp = getattr(settings, "CONTENT_SECURITY_POLICY", None)
        if csp:
            response.setdefault("Content-Security-Policy", csp)

        permissions_policy = getattr(settings, "PERMISSIONS_POLICY", None)
        if permissions_policy:
            response.setdefault("Permissions-Policy", permissions_policy)

        referrer_policy = getattr(settings, "REFERRER_POLICY", None)
        if referrer_policy:
            response.setdefault("Referrer-Policy", referrer_policy)

        return response


class JWTRequestValidationMiddleware:
    """
    Validates bearer/cookie JWTs at middleware layer for API requests.
    Returns 401 for malformed, tampered, expired, or DB-mismatched jti tokens.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.token_backend = TokenBackend(
            algorithm=settings.SIMPLE_JWT["ALGORITHM"],
            signing_key=settings.SIMPLE_JWT["SIGNING_KEY"],
            verifying_key=settings.SIMPLE_JWT.get("VERIFYING_KEY"),
            audience=settings.SIMPLE_JWT.get("AUDIENCE"),
            issuer=settings.SIMPLE_JWT.get("ISSUER"),
            leeway=settings.SIMPLE_JWT.get("LEEWAY", 0),
        )

    def __call__(self, request):
        if not request.path.startswith("/api/"):
            return self.get_response(request)

        token = self._extract_token(request)
        if token:
            is_valid, message = self._validate_token(token)
            if not is_valid:
                return JsonResponse({"detail": message}, status=401)

        return self.get_response(request)

    def _extract_token(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            return auth_header.split(" ", 1)[1].strip()
        return request.COOKIES.get("access_token")

    def _validate_token(self, raw_token):
        try:
            payload = self.token_backend.decode(raw_token, verify=True)
        except TokenError:
            return False, "Invalid token."
        except Exception:
            return False, "Invalid token."

        for claim in ("user_id", "jti", "exp"):
            if claim not in payload:
                return False, f"Missing required claim: {claim}."

        user_id = payload.get("user_id")
        token_jti = payload.get("jti")
        state = UserTokenState.objects.filter(user_id=user_id).only("current_jti").first()
        if not state or state.current_jti != token_jti:
            return False, "Token is no longer valid."

        return True, ""
