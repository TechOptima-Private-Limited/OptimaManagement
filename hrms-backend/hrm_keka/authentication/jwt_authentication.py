from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

from authentication.models import User


class SecureJWTAuthentication(JWTAuthentication):
    """
    Secure JWT authentication with:
    - Signature + expiration validation (handled by SimpleJWT backend)
    - Required claim checks: user_id, jti, exp
    - DB-bound jti validation (token reuse protection)
    """

    REQUIRED_CLAIMS = ("user_id", "jti", "exp")

    def get_validated_token(self, raw_token):
        validated_token = super().get_validated_token(raw_token)

        missing_claims = [claim for claim in self.REQUIRED_CLAIMS if claim not in validated_token]
        if missing_claims:
            raise InvalidToken(f"Missing required token claims: {', '.join(missing_claims)}")

        return validated_token

    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        token_jti = validated_token.get("jti")
        if not user_id or not token_jti:
            raise exceptions.AuthenticationFailed("Invalid token claims.", code="invalid_token")

        try:
            user = User.objects.select_related("profile", "token_state").get(id=user_id)
        except User.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("User not found.", code="user_not_found") from exc

        if not user.is_active:
            raise exceptions.AuthenticationFailed("User is inactive.", code="user_inactive")

        token_state = getattr(user, "token_state", None)
        if not token_state or token_state.current_jti != token_jti:
            raise exceptions.AuthenticationFailed("Token is no longer valid.", code="token_revoked")

        return user
