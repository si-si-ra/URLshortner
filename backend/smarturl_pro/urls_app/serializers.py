# urls_app/serializers.py

import re
from rest_framework import serializers
from django.conf import settings
from django.utils import timezone
from .models import Tag, ShortURL, ClickAnalytics


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ('id', 'name', 'color', 'created_at')
        read_only_fields = ('id', 'created_at')


class ShortURLSerializer(serializers.ModelSerializer):
    tags        = TagSerializer(many=True, read_only=True)
    is_expired  = serializers.BooleanField(read_only=True)
    active_code = serializers.SerializerMethodField()
    short_url   = serializers.SerializerMethodField()

    def get_active_code(self, obj):
        return obj.get_active_code()

    def get_short_url(self, obj):
        return f"{settings.FRONTEND_BASE_URL}/s/{obj.get_active_code()}"

    class Meta:
        model  = ShortURL
        fields = (
            'id', 'original_url', 'short_code', 'custom_alias',
            'title', 'notes', 'is_active', 'is_favorite',
            'expires_at', 'click_count', 'last_clicked_at',
            'qr_code', 'tags', 'is_expired', 'active_code',
            'short_url', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'short_code', 'click_count', 'last_clicked_at',
            'qr_code', 'created_at', 'updated_at'
        )


class ShortURLCreateSerializer(serializers.ModelSerializer):
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False, source='tags'
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = ShortURL
        fields = ('original_url', 'custom_alias', 'title', 'notes',
                  'password', 'expires_at', 'is_favorite', 'tag_ids')

    def validate_custom_alias(self, value):
        if not value:
            return value
        if not re.match(r'^[a-zA-Z0-9\-]+$', value):
            raise serializers.ValidationError(
                "Alias can only contain letters, numbers, and hyphens."
            )
        if ShortURL.objects.filter(custom_alias=value).exists():
            raise serializers.ValidationError("This alias is already taken.")
        return value

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future.")
        return value

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        plain_password = validated_data.pop('password', None)
        tags = validated_data.pop('tags', [])
        validated_data['short_code'] = generate_short_code()
        if plain_password:
            validated_data['password_hash'] = make_password(plain_password)
        short_url = ShortURL.objects.create(**validated_data)
        if tags:
            short_url.tags.set(tags)
        return short_url


def generate_short_code():
    import string, random
    characters = string.ascii_letters + string.digits
    while True:
        code = ''.join(random.choices(characters, k=7))
        if not ShortURL.objects.filter(short_code=code).exists():
            return code


class ShortURLUpdateSerializer(serializers.ModelSerializer):
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False, source='tags'
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = ShortURL
        fields = ('original_url', 'custom_alias', 'title', 'notes',
                  'password', 'expires_at', 'is_active', 'is_favorite', 'tag_ids')

    def validate_custom_alias(self, value):
        if not value:
            return value
        if not re.match(r'^[a-zA-Z0-9\-]+$', value):
            raise serializers.ValidationError(
                "Alias can only contain letters, numbers, and hyphens."
            )
        qs = ShortURL.objects.filter(custom_alias=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This alias is already taken.")
        return value

    def update(self, instance, validated_data):
        from django.contrib.auth.hashers import make_password
        plain_password = validated_data.pop('password', None)
        tags = validated_data.pop('tags', None)
        if plain_password:
            validated_data['password_hash'] = make_password(plain_password)
        elif plain_password == '':
            validated_data['password_hash'] = None
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


class ClickAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ClickAnalytics
        fields = ('id', 'ip_address', 'clicked_at')
