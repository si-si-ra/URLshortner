# urls_app/urls.py

from django.urls import path
from .views import (
    TagListCreateView, TagDetailView,
    ShortURLListCreateView, ShortURLDetailView,
    ToggleFavoriteView, ToggleActiveView, GenerateQRView,
    RedirectView, VerifyPasswordView, URLStatusView,
    URLAnalyticsView, DashboardStatsView,
)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),

    path('tags/',          TagListCreateView.as_view(), name='tag-list-create'),
    path('tags/<int:pk>/', TagDetailView.as_view(),     name='tag-detail'),

    path('urls/',                         ShortURLListCreateView.as_view(), name='url-list-create'),
    path('urls/<int:pk>/',                ShortURLDetailView.as_view(),     name='url-detail'),
    path('urls/<int:pk>/favorite/',       ToggleFavoriteView.as_view(),     name='url-favorite'),
    path('urls/<int:pk>/toggle/',         ToggleActiveView.as_view(),       name='url-toggle'),
    path('urls/<int:pk>/qr/',             GenerateQRView.as_view(),         name='url-qr'),
    path('urls/<int:pk>/analytics/',      URLAnalyticsView.as_view(),       name='url-analytics'),

    path('urls/verify/<str:code>/',  VerifyPasswordView.as_view(), name='url-verify'),
    path('urls/status/<str:code>/',  URLStatusView.as_view(),      name='url-status'),
]