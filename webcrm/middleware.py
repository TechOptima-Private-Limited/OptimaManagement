# webcrm/middleware.py
import logging

logger = logging.getLogger(__name__)

class TemplateDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if hasattr(response, 'template_name'):
            logger.info(f"Rendered template: {response.template_name}")
        return response