from dal import autocomplete
from django.contrib.auth.models import User
from django.db.models import Q

class UserAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return User.objects.none()

        qs = User.objects.all()

        if self.q:
            qs = qs.filter(
                Q(username__icontains=self.q) |
                Q(first_name__icontains=self.q) |
                Q(last_name__icontains=self.q) |
                Q(email__icontains=self.q)
            )

        return qs.order_by('username')

    def get_result_label(self, item):
        full_name = item.get_full_name() or item.username
        return f"{full_name} (Employee ID: {item.username})"