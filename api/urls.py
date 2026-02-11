"""
URL configuration for API app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'items', views.ItemViewSet, basename='item')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'permissions', views.PermissionViewSet, basename='permission')
router.register(r'roles', views.RoleViewSet, basename='role')
router.register(r'user-roles', views.UserRoleViewSet, basename='user-role')
router.register(r'user-activities', views.UserActivityViewSet, basename='user-activity')
router.register(r'subscriptions', views.SubscriptionViewSet, basename='subscription')
router.register(r'news-categories', views.NewsCategoryViewSet, basename='news-category')
router.register(r'news', views.NewsViewSet, basename='news')
router.register(r'faq-categories', views.FAQCategoryViewSet, basename='faq-category')
router.register(r'faqs', views.FAQViewSet, basename='faq')
router.register(r'page-categories', views.PageCategoryViewSet, basename='page-category')
router.register(r'pages', views.PageViewSet, basename='page')
router.register(r'plans', views.PlanViewSet, basename='plan')
router.register(r'invoices', views.InvoiceViewSet, basename='invoice')
router.register(r'stories', views.StoryViewSet, basename='story')
router.register(r'story-sessions', views.StorySessionViewSet, basename='story-session')
router.register(r'playlists', views.PlaylistViewSet, basename='playlist')

urlpatterns = [
    # Authentication endpoints
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout, name='logout'),
    path('current-user/', views.current_user, name='current-user'),
    path('password-reset/', views.password_reset_request, name='password-reset'),
    # User profile and password change endpoints
    path('profile/', views.user_profile, name='user-profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('story-settings/', views.user_story_settings, name='user-story-settings'),
    path('unlock-screen/', views.unlock_screen, name='unlock-screen'),
    path('subscribe/', views.subscribe_to_plan, name='subscribe-to-plan'),
    # Dashboard stats endpoint
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    # AWS credentials endpoint for Nova Sonic
    path('aws-credentials/', views.get_aws_credentials, name='aws-credentials'),
    # Reports endpoint
    path('reports/', views.reports, name='reports'),
    # Public slug-based endpoints
    path('news/by-slug/<slug:slug>/', views.news_by_slug, name='news-by-slug'),
    path('faqs/by-slug/<slug:slug>/', views.faq_by_slug, name='faq-by-slug'),
    path('pages/by-slug/<slug:slug>/', views.page_by_slug, name='page-by-slug'),
    # Health check
    path('health-check/', views.health_check, name='health-check'),
    # Router URLs (items, categories, users, roles, permissions, etc.)
    path('', include(router.urls)),
]
