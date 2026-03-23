from __future__ import annotations

from django.conf import settings


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
