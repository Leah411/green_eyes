from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def root_view(request):
    """Root endpoint that provides API information"""
    return JsonResponse({
        'name': 'Green Eyes API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'api': '/api/',
            'health': '/api/health/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('core.api.urls')),
]
