from dal import autocomplete
from django.contrib.auth.models import User
from django.db.models import Q

class UserAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        # logger.debug(f"ResourceManagement UserAutocomplete accessed by user: {self.request.user}")
        if not self.request.user.is_authenticated:
            # logger.warning("Unauthenticated access to ResourceManagement UserAutocomplete")
            return User.objects.none()
        qs = User.objects.all()
        if self.q:
            qs = qs.filter(email__icontains=self.q)
        # logger.debug(f"ResourceManagement UserAutocomplete query: {self.q}, results: {qs.count()}")
        return qs

    def get_result_label(self, item):
        full_name = item.get_full_name() or item.username
        return f"{full_name} (Employee ID: {item.username})"