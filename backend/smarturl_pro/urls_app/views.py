from django.shortcuts import render

# Create your views here.
# urls_app/views.py

import os
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum

from .models import Tag, ShortURL, ClickAnalytics
from .serializers import (
    TagSerializer, ShortURLSerializer,
    ShortURLCreateSerializer, ShortURLUpdateSerializer,
    ClickAnalyticsSerializer,
)


class IPAddressMixin:
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


# ── Tags ────────────────────────────────────────────────────────

class TagListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tags = Tag.objects.filter(user=request.user)
        return Response(TagSerializer(tags, many=True).data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TagDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Tag, pk=pk, user=user)

    def get(self, request, pk):
        return Response(TagSerializer(self.get_object(pk, request.user)).data)

    def put(self, request, pk):
        serializer = TagSerializer(self.get_object(pk, request.user), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.get_object(pk, request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Short URLs ──────────────────────────────────────────────────

class ShortURLListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        urls = ShortURL.objects.filter(user=request.user)
        if (v := request.query_params.get('is_favorite')) is not None:
            urls = urls.filter(is_favorite=v.lower() == 'true')
        if (v := request.query_params.get('is_active')) is not None:
            urls = urls.filter(is_active=v.lower() == 'true')
        if tag_id := request.query_params.get('tag'):
            urls = urls.filter(tags__id=tag_id)
        return Response(ShortURLSerializer(urls, many=True).data)

    def post(self, request):
        serializer = ShortURLCreateSerializer(data=request.data)
        if serializer.is_valid():
            short_url = serializer.save(user=request.user)
            return Response(ShortURLSerializer(short_url).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ShortURLDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(ShortURL, pk=pk, user=user)

    def get(self, request, pk):
        return Response(ShortURLSerializer(self.get_object(pk, request.user)).data)

    def put(self, request, pk):
        obj = self.get_object(pk, request.user)
        serializer = ShortURLUpdateSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            return Response(ShortURLSerializer(serializer.save()).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.get_object(pk, request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ToggleFavoriteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        url = get_object_or_404(ShortURL, pk=pk, user=request.user)
        url.is_favorite = not url.is_favorite
        url.save(update_fields=['is_favorite'])
        return Response({
            "is_favorite": url.is_favorite,
            "message": "Added to favorites." if url.is_favorite else "Removed from favorites."
        })


class ToggleActiveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        url = get_object_or_404(ShortURL, pk=pk, user=request.user)
        url.is_active = not url.is_active
        url.save(update_fields=['is_active'])
        return Response({
            "is_active": url.is_active,
            "message": "URL enabled." if url.is_active else "URL disabled."
        })


class GenerateQRView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        url = get_object_or_404(ShortURL, pk=pk, user=request.user)
        if url.qr_code:
            old_path = url.qr_code.path
            if os.path.exists(old_path):
                os.remove(old_path)
            url.qr_code = None
            url.save(update_fields=['qr_code'])
        from urls_app.signals import generate_qr_code
        generate_qr_code(sender=ShortURL, instance=url, created=True)
        url.refresh_from_db()
        return Response({
            "message": "QR code generated.",
            "qr_code": request.build_absolute_uri(url.qr_code.url)
        })


# ── Redirect ────────────────────────────────────────────────────

class RedirectView(IPAddressMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request, code):
        url = (ShortURL.objects.filter(custom_alias=code).first() or
               ShortURL.objects.filter(short_code=code).first())
        if not url:
            return Response({"error": "URL not found."}, status=status.HTTP_404_NOT_FOUND)
        if not url.is_active:
            return Response({"error": "This link has been disabled."}, status=status.HTTP_410_GONE)
        if url.is_expired:
            return Response({"error": "This link has expired."}, status=status.HTTP_410_GONE)
        if url.password_hash:
            submitted = request.query_params.get('password') or request.data.get('password')
            if not submitted:
                return Response(
                    {"error": "Password required.", "requires_password": True},
                    status=status.HTTP_403_FORBIDDEN
                )
            if not check_password(submitted, url.password_hash):
                return Response(
                    {"error": "Incorrect password.", "requires_password": True},
                    status=status.HTTP_403_FORBIDDEN
                )
        ClickAnalytics.objects.create(
            url=url,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        url.click_count += 1
        url.last_clicked_at = timezone.now()
        url.save(update_fields=['click_count', 'last_clicked_at'])
        return Response({"original_url": url.original_url})


# ── Password Verify ─────────────────────────────────────────────

class VerifyPasswordView(IPAddressMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request, code):
        url = (ShortURL.objects.filter(custom_alias=code).first() or
               ShortURL.objects.filter(short_code=code).first())
        if not url:
            return Response({"error": "URL not found."}, status=status.HTTP_404_NOT_FOUND)
        if not url.is_active:
            return Response({"error": "Link disabled."}, status=status.HTTP_410_GONE)
        if url.is_expired:
            return Response({"error": "Link expired."}, status=status.HTTP_410_GONE)
        if not url.password_hash:
            return Response({"original_url": url.original_url})
        submitted = request.data.get('password', '')
        if not submitted:
            return Response(
                {"error": "Password required.", "requires_password": True},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not check_password(submitted, url.password_hash):
            return Response(
                {"error": "Incorrect password.", "requires_password": True},
                status=status.HTTP_403_FORBIDDEN
            )
        ClickAnalytics.objects.create(
            url=url,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        url.click_count += 1
        url.last_clicked_at = timezone.now()
        url.save(update_fields=['click_count', 'last_clicked_at'])
        return Response({"original_url": url.original_url})


# ── URL Status ──────────────────────────────────────────────────

class URLStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, code):
        url = (ShortURL.objects.filter(custom_alias=code).first() or
               ShortURL.objects.filter(short_code=code).first())
        if not url:
            return Response({"status": "not_found", "error": "URL not found."}, status=404)
        if not url.is_active:
            return Response({"status": "disabled", "error": "Link disabled."}, status=410)
        if url.is_expired:
            return Response({"status": "expired", "error": "Link expired.", "expired_at": url.expires_at}, status=410)
        if url.password_hash:
            return Response({"status": "password_required", "title": url.title}, status=403)
        return Response({"status": "ok", "title": url.title})


# ── Analytics ───────────────────────────────────────────────────

class URLAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        url = get_object_or_404(ShortURL, pk=pk, user=request.user)
        clicks = url.analytics.all()[:100]
        return Response({
            "url":          ShortURLSerializer(url).data,
            "clicks":       ClickAnalyticsSerializer(clicks, many=True).data,
            "total_clicks": url.click_count,
        })


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_urls = ShortURL.objects.filter(user=request.user)
        stats = user_urls.aggregate(total_clicks=Sum('click_count'))
        return Response({
            "total_urls":    user_urls.count(),
            "total_clicks":  stats['total_clicks'] or 0,
            "active_urls":   user_urls.filter(is_active=True).count(),
            "favorite_urls": user_urls.filter(is_favorite=True).count(),
            "top_urls":      ShortURLSerializer(
                                 user_urls.order_by('-click_count')[:5], many=True
                             ).data,
        })