from django.db import models

# Create your models here.
# urls_app/models.py

import string
import random
from django.db import models
from django.contrib.auth.models import User


def generate_short_code(length=7):
    characters = string.ascii_letters + string.digits
    while True:
        code = ''.join(random.choices(characters, k=length))
        if not ShortURL.objects.filter(short_code=code).exists():
            return code


class Tag(models.Model):
    user  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')
    name  = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6c757d')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.user.username} — {self.name}"


class ShortURL(models.Model):
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='short_urls')
    original_url = models.TextField()
    short_code   = models.CharField(max_length=15, unique=True)
    custom_alias = models.CharField(max_length=50, unique=True, null=True, blank=True)
    title        = models.CharField(max_length=200, null=True, blank=True)
    notes        = models.TextField(null=True, blank=True)
    password_hash = models.CharField(max_length=255, null=True, blank=True)
    is_active    = models.BooleanField(default=True)
    is_favorite  = models.BooleanField(default=False)
    expires_at   = models.DateTimeField(null=True, blank=True)
    tags         = models.ManyToManyField(Tag, blank=True, related_name='short_urls')
    click_count  = models.PositiveIntegerField(default=0)
    last_clicked_at = models.DateTimeField(null=True, blank=True)
    qr_code      = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.short_code} → {self.original_url[:50]}"

    def get_active_code(self):
        return self.custom_alias if self.custom_alias else self.short_code

    @property
    def is_expired(self):
        from django.utils import timezone
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at


class ClickAnalytics(models.Model):
    url        = models.ForeignKey(ShortURL, on_delete=models.CASCADE, related_name='analytics')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    clicked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-clicked_at']
        indexes  = [models.Index(fields=['url', 'clicked_at'])]

    def __str__(self):
        return f"Click on {self.url.short_code} at {self.clicked_at}"