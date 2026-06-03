from django.contrib import admin

# Register your models here.
# urls_app/admin.py

from django.contrib import admin
from .models import Tag, ShortURL, ClickAnalytics


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display  = ('name', 'user', 'color', 'created_at')
    search_fields = ('name', 'user__username')


@admin.register(ShortURL)
class ShortURLAdmin(admin.ModelAdmin):
    list_display  = ('short_code', 'custom_alias', 'user', 'click_count', 'is_active', 'created_at')
    search_fields = ('short_code', 'custom_alias', 'original_url', 'user__username')
    list_filter   = ('is_active', 'is_favorite')


@admin.register(ClickAnalytics)
class ClickAnalyticsAdmin(admin.ModelAdmin):
    list_display  = ('url', 'ip_address', 'clicked_at')
    search_fields = ('url__short_code', 'ip_address')