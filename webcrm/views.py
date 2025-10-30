from django.shortcuts import render

def custom_404_view(request, exception=None):
    context = {}
    response = render(request, "404.html", context)
    response.status_code = 404
    return response