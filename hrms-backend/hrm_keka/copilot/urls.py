from django.urls import path

from . import views


urlpatterns = [
    path("chat/", views.copilot_chat, name="copilot_chat"),
]

