# urls_app/apps.py

from django.apps import AppConfig


class UrlsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'urls_app'

    def ready(self):
        import urls_app.signals  # noqa: F401