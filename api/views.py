from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, BasePermission
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.conf import settings
from collections import defaultdict
import os
import json
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

from .models import Item, Category, Permission, Role, UserRole, UserActivity, Subscription, Plan, Invoice, NewsCategory, News, FAQCategory, FAQ, PageCategory, Page, UserProfile, Story, StorySession, Playlist, UserStorySettings, StoryScene
from .serializers import (
    ItemSerializer, ItemListSerializer, CategorySerializer, 
    UserSerializer, UserListSerializer, UserUpdateSerializer,
    LoginSerializer, PasswordResetRequestSerializer, RegistrationSerializer,
    PermissionSerializer, PermissionListSerializer,
    RoleSerializer, RoleListSerializer,
    UserRoleSerializer,
    UserActivitySerializer, UserActivityListSerializer,
    PlanSerializer, PlanListSerializer,
    SubscriptionSerializer, SubscriptionListSerializer,
    InvoiceSerializer, InvoiceListSerializer,
    NewsCategorySerializer, NewsCategoryListSerializer,
    NewsSerializer, NewsListSerializer,
    FAQCategorySerializer, FAQCategoryListSerializer,
    FAQSerializer, FAQListSerializer,
    PageCategorySerializer, PageCategoryListSerializer,
    PageSerializer, PageListSerializer,
    UserProfileSerializer, UserProfileUpdateSerializer, ChangePasswordSerializer,
    StorySerializer, StoryListSerializer,
    StorySessionSerializer, StorySessionListSerializer,
    PlaylistSerializer, PlaylistListSerializer,
    StoryRevisionSerializer, UserStorySettingsSerializer
)


# ========== Custom Permissions ==========

# ========== Pagination Classes ==========

class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# ========== Custom Permissions ==========

class IsStaffOrReadOnly(BasePermission):
    """
    Custom permission to only allow staff users to create/edit/delete.
    Read-only access for authenticated users.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed for any authenticated user
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        
        # Write permissions are only allowed for staff users
        return request.user.is_authenticated and request.user.is_staff


class ItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Item instances.
    Provides CRUD operations: list, create, retrieve, update, destroy
    """
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list':
            return ItemListSerializer
        return ItemSerializer

    def get_queryset(self):
        """Optionally filter by is_active status."""
        queryset = Item.objects.all()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Custom action to toggle item active status."""
        item = self.get_object()
        item.is_active = not item.is_active
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Category instances.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'name'  # Use name instead of id for lookup


@api_view(['POST'])
def login(request):
    """
    Login endpoint.
    Accepts email and password, returns user data and token.
    """
    # DEBUG: Log that this endpoint was reached
    # Use sys.stdout.write to ensure it appears immediately
    import sys
    sys.stdout.write(f"\n✅ LOGIN ENDPOINT REACHED: {request.method} {request.path}\n")
    sys.stdout.write(f"   Request data: {request.data}\n")
    sys.stdout.flush()
    
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid input', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    # Django User model uses username, but we accept email
    # Try to find user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Authenticate using username (Django's default)
    user = authenticate(request, username=user.username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'User account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Get or create token for the user
    token, created = Token.objects.get_or_create(user=user)
    
    # Determine role
    if user.is_superuser:
        role = 'Admin'
    elif user.is_staff:
        role = 'Staff'
    else:
        role = 'User'
    
    # Return user data and token
    user_serializer = UserSerializer(user)
    return Response({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'role': role,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'token': token.key
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def logout(request):
    """
    Logout endpoint.
    Deletes the authentication token.
    """
    if request.method == 'POST':
        if request.user.is_authenticated:
            try:
                Token.objects.get(user=request.user).delete()
            except Token.DoesNotExist:
                pass
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    return Response({'message': 'Use POST method'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET'])
def current_user(request):
    """
    Get current authenticated user information.
    """
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user_serializer = UserSerializer(request.user)
    return Response({
        'id': request.user.id,
        'email': request.user.email,
        'username': request.user.username,
        'firstName': request.user.first_name,
        'lastName': request.user.last_name,
        'role': 'Admin' if request.user.is_staff else 'User',
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def password_reset_request(request):
    """
    Password reset request endpoint.
    Accepts email, generates reset token, and returns success message.
    In production, this would send an email with reset link.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid input', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    email = serializer.validated_data['email']
    
    # Try to find user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists or not (security best practice)
        return Response({
            'message': 'If an account with that email exists, we have sent password reset instructions.'
        }, status=status.HTTP_200_OK)
    
    if not user.is_active:
        return Response({
            'message': 'If an account with that email exists, we have sent password reset instructions.'
        }, status=status.HTTP_200_OK)
    
    # Generate a password reset token
    # In production, you would use Django's password reset tokens
    # For now, we'll use a simple token generation
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.encoding import force_bytes
    from django.utils.http import urlsafe_base64_encode
    
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # In production, send email here with reset link
    # For now, we'll just return success message
    # The reset link would be: /auth/reset-password-confirm/{uid}/{token}/
    
    return Response({
        'message': 'If an account with that email exists, we have sent password reset instructions.',
        'uid': uid,
        'token': token
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def register(request):
    """
    User registration endpoint.
    Accepts username, email, first_name, last_name, password, confirm_password, accept_terms, and user_type.
    Creates a new user account and returns user data with authentication token.
    user_type can be: 'admin' (superuser), 'staff' (staff user), or 'user' (regular user).
    """
    serializer = RegistrationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Validation failed', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create the user (serializer.save() already sets is_staff and is_superuser based on user_type)
    user = serializer.save()
    
    # Generate authentication token for the new user
    token, created = Token.objects.get_or_create(user=user)
    
    # Return user data and token
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'role': 'Admin' if user.is_superuser else ('Staff' if user.is_staff else 'User'),
        'is_staff': user.is_staff,
        'token': token.key,
        'message': 'Registration successful'
    }, status=status.HTTP_201_CREATED)


class UserPagination(PageNumberPagination):
    """Pagination for user list."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and managing User instances.
    Provides list, retrieve, and update operations with search and pagination.
    """
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAuthenticated]  # Only authenticated users can access
    pagination_class = UserPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined', 'is_active']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter users based on search query."""
        queryset = User.objects.all().order_by('-date_joined')
        
        # DRF's SearchFilter will handle the 'search' parameter automatically
        # using the search_fields defined above, so we don't need to manually filter here
        # This method is kept for any future custom filtering needs
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List users with proper error handling."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in UserViewSet.list: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve users', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """Create a new user (senior). Only admin/caregiver can create seniors."""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admin or caregiver can create users.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user (seniors are not staff)
        user = serializer.save()
        user.is_staff = False
        user.is_superuser = False
        user.save()
        
        # Create SeniorProfile - seniors are always created with senior profile
        senior_profile, created = SeniorProfile.objects.get_or_create(
            user=user,
            defaults={
                'is_senior': True,
                'caregiver': request.user,  # Set the creator as caregiver
                'preferred_font_size': request.data.get('preferred_font_size', 'medium'),
                'high_contrast_mode': request.data.get('high_contrast_mode', False),
                'voice_navigation_enabled': request.data.get('voice_navigation_enabled', True)
            }
        )
        
        # Update caregiver if profile already existed
        if not created:
            senior_profile.caregiver = request.user
            senior_profile.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Update user (specifically is_active status)."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Prevent deactivating superusers
        if instance.is_superuser and not request.data.get('is_active', True):
            return Response(
                {'error': 'Superusers cannot be deactivated.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update user (specifically is_active status)."""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        """Custom action to toggle user active status."""
        user = self.get_object()
        
        # Prevent deactivating superusers
        if user.is_superuser and user.is_active:
            return Response(
                {'error': 'Superusers cannot be deactivated.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = not user.is_active
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)


# ========== Roles & Permissions ViewSets ==========

class PermissionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Permissions."""
    queryset = Permission.objects.all().order_by('name')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'codename', 'endpoint', 'description']
    ordering_fields = ['name', 'codename', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PermissionListSerializer
        return PermissionSerializer
    
    def get_queryset(self):
        queryset = Permission.objects.all().order_by('name')
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        return queryset


class RoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Roles."""
    queryset = Role.objects.all().order_by('name')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RoleListSerializer
        return RoleSerializer


class UserRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing User-Role assignments."""
    queryset = UserRole.objects.all().order_by('-assigned_at')
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'role__name']
    ordering_fields = ['assigned_at']
    ordering = ['-assigned_at']
    
    def perform_create(self, serializer):
        """Set assigned_by to current user."""
        serializer.save(assigned_by=self.request.user)


# ========== User Activity ViewSet ==========

class UserActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing User Activities (read-only)."""
    queryset = UserActivity.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    pagination_class = UserPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'action', 'resource_type', 'description']
    ordering_fields = ['created_at', 'action']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserActivityListSerializer
        return UserActivitySerializer
    
    def get_queryset(self):
        """Filter activities by various parameters."""
        queryset = UserActivity.objects.all().order_by('-created_at')
        
        # Filter by user_id
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by username (search in user__username)
        username = self.request.query_params.get('username', None)
        if username:
            queryset = queryset.filter(user__username__icontains=username)
        
        # Filter by action
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by resource_type
        resource_type = self.request.query_params.get('resource_type', None)
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        # Filter by description (case-insensitive search)
        description = self.request.query_params.get('description', None)
        if description:
            queryset = queryset.filter(description__icontains=description)
        
        # Filter by IP address
        ip_address = self.request.query_params.get('ip_address', None)
        if ip_address:
            queryset = queryset.filter(ip_address__icontains=ip_address)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            try:
                from django.utils.dateparse import parse_datetime
                start_datetime = parse_datetime(start_date)
                if start_datetime:
                    queryset = queryset.filter(created_at__gte=start_datetime)
            except (ValueError, TypeError):
                pass
        if end_date:
            try:
                from django.utils.dateparse import parse_datetime
                end_datetime = parse_datetime(end_date)
                if end_datetime:
                    # Add one day to include the entire end date
                    from datetime import timedelta
                    queryset = queryset.filter(created_at__lte=end_datetime + timedelta(days=1))
            except (ValueError, TypeError):
                pass
        
        return queryset


# ========== Plan ViewSet ==========

class PlanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Plans (staff only for write operations)."""
    queryset = Plan.objects.all().order_by('display_order', 'name')
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'display_order', 'created_at']
    ordering = ['display_order', 'name']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PlanListSerializer
        return PlanSerializer
    
    def get_queryset(self):
        """Filter plans by active status."""
        queryset = Plan.objects.all().order_by('display_order', 'name')
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        return queryset


# ========== Subscription ViewSet ==========

class SubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Subscriptions."""
    queryset = Subscription.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    pagination_class = UserPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'plan__name', 'status', 'notes']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SubscriptionListSerializer
        return SubscriptionSerializer
    
    def get_queryset(self):
        """Filter subscriptions by user, plan, or status."""
        queryset = Subscription.objects.all().order_by('-created_at')
        
        # Non-staff users can only see their own subscriptions
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        plan_id = self.request.query_params.get('plan_id', None)
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


# ========== Invoice ViewSet ==========

def generate_invoice_number():
    """Generate a unique invoice number in format RB####."""
    import random
    import string
    
    while True:
        # Generate random 4-digit number
        number = ''.join(random.choices(string.digits, k=4))
        invoice_number = f"RB{number}"
        
        # Check if it already exists
        if not Invoice.objects.filter(invoice_number=invoice_number).exists():
            return invoice_number


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Invoices."""
    queryset = Invoice.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'user__username', 'plan__name', 'status']
    ordering_fields = ['created_at', 'due_date', 'total', 'status']
    ordering = ['-created_at']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        """Filter invoices by user, status, or subscription."""
        queryset = Invoice.objects.all().order_by('-created_at')
        
        # Non-staff users can only see their own invoices
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        subscription_id = self.request.query_params.get('subscription_id', None)
        if subscription_id:
            queryset = queryset.filter(subscription_id=subscription_id)
        return queryset
    
    def perform_create(self, serializer):
        """Generate invoice number on create."""
        invoice_number = generate_invoice_number()
        serializer.save(invoice_number=invoice_number)


# ========== Subscribe to Plan API ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_to_plan(request):
    """Subscribe user to a plan and create invoice."""
    from django.utils import timezone
    from datetime import timedelta
    
    plan_id = request.data.get('plan_id')
    plan_uuid = request.data.get('plan_uuid')
    
    if not plan_id and not plan_uuid:
        return Response(
            {'error': 'plan_id or plan_uuid is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        if plan_uuid:
            plan = Plan.objects.get(uuid=plan_uuid, is_active=True)
        else:
            plan = Plan.objects.get(id=plan_id, is_active=True)
    except Plan.DoesNotExist:
        return Response(
            {'error': 'Plan not found or inactive'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user = request.user
    
    # Deactivate existing active subscriptions
    Subscription.objects.filter(user=user, status='active').update(status='inactive')
    
    # Calculate dates
    start_date = timezone.now()
    end_date = start_date + timedelta(days=30 * plan.duration_months)
    
    # Create subscription
    subscription = Subscription.objects.create(
        user=user,
        plan=plan,
        status='active',
        start_date=start_date,
        end_date=end_date,
        price=plan.price
    )
    
    # Create invoice
    invoice_number = generate_invoice_number()
    invoice = Invoice.objects.create(
        invoice_number=invoice_number,
        user=user,
        subscription=subscription,
        plan=plan,
        subtotal=plan.price,
        discount=0.00,
        total=plan.price,
        status='pending',
        due_date=start_date + timedelta(days=7)  # 7 days from subscription
    )
    
    return Response({
        'message': 'Successfully subscribed to plan',
        'subscription': SubscriptionSerializer(subscription).data,
        'invoice': InvoiceSerializer(invoice).data
    }, status=status.HTTP_201_CREATED)


# ========== Reports ViewSet ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Dashboard statistics endpoint - provides user-specific or admin statistics."""
    from django.db.models import Count, Sum, Avg, Q
    from datetime import datetime, timedelta
    
    user = request.user
    
    # Check if user is admin/superuser
    is_admin = user.is_superuser or user.is_staff
    
    if is_admin:
        # Admin dashboard stats
        total_stories = Story.objects.count()
        total_sessions = StorySession.objects.count()
        total_playlists = Playlist.objects.count()
        total_users = User.objects.filter(is_active=True).count()
        
        # Stories created in last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_stories = Story.objects.filter(created_at__gte=thirty_days_ago).count()
        
        # Total listening time (in seconds)
        total_listening_time = StorySession.objects.aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0
        
        # Average session duration
        avg_session_duration = StorySession.objects.aggregate(
            avg=Avg('duration_seconds')
        )['avg'] or 0
        
        # Stories by status
        published_stories = Story.objects.filter(is_published=True).count()
        draft_stories = Story.objects.filter(is_published=False).count()
        
        # Stories created over last 7 days (for chart)
        story_chart_data = []
        for i in range(6, -1, -1):
            date = timezone.now() - timedelta(days=i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = Story.objects.filter(created_at__gte=date_start, created_at__lte=date_end).count()
            story_chart_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'label': date.strftime('%b %d'),
                'count': count
            })
        
        # Sessions over last 7 days
        session_chart_data = []
        for i in range(6, -1, -1):
            date = timezone.now() - timedelta(days=i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = StorySession.objects.filter(started_at__gte=date_start, started_at__lte=date_end).count()
            session_chart_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'label': date.strftime('%b %d'),
                'count': count
            })
        
        # Stories by template/category (for pie chart)
        from django.db.models import Count
        stories_by_template = Story.objects.values('template').annotate(
            count=Count('id')
        ).order_by('-count')
        template_chart_data = [
            {
                'label': dict(Story.STORY_TEMPLATES).get(item['template'], item['template'].title()),
                'value': item['count']
            }
            for item in stories_by_template
        ]
        
        # Stories by month (last 6 months) for bar chart
        monthly_story_data = []
        for i in range(5, -1, -1):
            # Get first day of month
            month_date = timezone.now() - timedelta(days=30*i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Get last day of month
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
            month_end = month_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            count = Story.objects.filter(created_at__gte=month_start, created_at__lte=month_end).count()
            monthly_story_data.append({
                'label': month_start.strftime('%b %Y'),
                'count': count
            })
        
        # Recent stories (last 10)
        # Convert to list and ensure all fields are properly serialized
        recent_stories_queryset = Story.objects.order_by('-created_at')[:10]
        recent_stories_list = []
        for story in recent_stories_queryset:
            recent_stories_list.append({
                'id': str(story.id),  # Ensure UUID is string
                'title': story.title,
                'created_at': story.created_at.isoformat() if story.created_at else None,
                'is_published': story.is_published,
                'user__username': story.user.username if story.user else None
            })
        
    else:
        # Regular user dashboard stats
        total_stories = Story.objects.filter(user=user).count()
        total_sessions = StorySession.objects.filter(user=user).count()
        total_playlists = Playlist.objects.filter(user=user).count()
        total_users = 1  # User only sees themselves
        
        # Stories created in last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_stories = Story.objects.filter(user=user, created_at__gte=thirty_days_ago).count()
        
        # Total listening time (in seconds)
        total_listening_time = StorySession.objects.filter(user=user).aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0
        
        # Average session duration
        avg_session_duration = StorySession.objects.filter(user=user).aggregate(
            avg=Avg('duration_seconds')
        )['avg'] or 0
        
        # Stories by status
        published_stories = Story.objects.filter(user=user, is_published=True).count()
        draft_stories = Story.objects.filter(user=user, is_published=False).count()
        
        # Stories created over last 7 days (for chart)
        story_chart_data = []
        for i in range(6, -1, -1):
            date = timezone.now() - timedelta(days=i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = Story.objects.filter(user=user, created_at__gte=date_start, created_at__lte=date_end).count()
            story_chart_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'label': date.strftime('%b %d'),
                'count': count
            })
        
        # Sessions over last 7 days
        session_chart_data = []
        for i in range(6, -1, -1):
            date = timezone.now() - timedelta(days=i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = StorySession.objects.filter(user=user, started_at__gte=date_start, started_at__lte=date_end).count()
            session_chart_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'label': date.strftime('%b %d'),
                'count': count
            })
        
        # Stories by template/category (for pie chart)
        from django.db.models import Count
        stories_by_template = Story.objects.filter(user=user).values('template').annotate(
            count=Count('id')
        ).order_by('-count')
        template_chart_data = [
            {
                'label': dict(Story.STORY_TEMPLATES).get(item['template'], item['template'].title()),
                'value': item['count']
            }
            for item in stories_by_template
        ]
        
        # Stories by month (last 6 months) for bar chart
        monthly_story_data = []
        for i in range(5, -1, -1):
            # Get first day of month
            month_date = timezone.now() - timedelta(days=30*i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Get last day of month
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
            month_end = month_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            count = Story.objects.filter(user=user, created_at__gte=month_start, created_at__lte=month_end).count()
            monthly_story_data.append({
                'label': month_start.strftime('%b %Y'),
                'count': count
            })
        
        # Recent stories (last 10)
        # Convert to list and ensure all fields are properly serialized
        recent_stories_queryset = Story.objects.filter(user=user).order_by('-created_at')[:10]
        recent_stories_list = []
        for story in recent_stories_queryset:
            recent_stories_list.append({
                'id': str(story.id),  # Ensure UUID is string
                'title': story.title,
                'created_at': story.created_at.isoformat() if story.created_at else None,
                'is_published': story.is_published
            })
    
    # Format listening time
    hours = int(total_listening_time // 3600)
    minutes = int((total_listening_time % 3600) // 60)
    formatted_listening_time = f"{hours}h {minutes}m"
    
    # Format average session duration
    avg_minutes = int(avg_session_duration // 60)
    avg_seconds = int(avg_session_duration % 60)
    formatted_avg_duration = f"{avg_minutes}m {avg_seconds}s"
    
    return Response({
        'stats': {
            'total_stories': total_stories,
            'total_sessions': total_sessions,
            'total_playlists': total_playlists,
            'total_users': total_users,
            'recent_stories': recent_stories,
            'total_listening_time_seconds': total_listening_time,
            'total_listening_time_formatted': formatted_listening_time,
            'avg_session_duration_seconds': avg_session_duration,
            'avg_session_duration_formatted': formatted_avg_duration,
            'published_stories': published_stories,
            'draft_stories': draft_stories,
        },
        'charts': {
            'story_creation': story_chart_data,
            'session_activity': session_chart_data,
            'stories_by_template': template_chart_data,
            'stories_by_month': monthly_story_data,
        },
        'recent_stories': list(recent_stories_list),
        'is_admin': is_admin,
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def reports(request):
    """Reports endpoint - provides aggregated data."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Allow all authenticated users to view reports
    # No additional permission check needed - all authenticated users can view reports
    
    report_type = request.query_params.get('type', 'summary')
    
    if report_type == 'summary':
        # Summary report
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_roles = Role.objects.count()
        total_permissions = Permission.objects.count()
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='active').count()
        total_activities = UserActivity.objects.count()
        
        return Response({
            'summary': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': total_users - active_users,
                'total_roles': total_roles,
                'total_permissions': total_permissions,
                'total_subscriptions': total_subscriptions,
                'active_subscriptions': active_subscriptions,
                'total_activities': total_activities,
            },
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
    
    elif report_type == 'user_activity':
        # User activity report
        from django.db.models import Count
        from datetime import datetime, timedelta
        
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        activities = UserActivity.objects.filter(created_at__gte=start_date)
        activity_by_action = activities.values('action').annotate(count=Count('id')).order_by('-count')
        activity_by_user = activities.values('user__username').annotate(count=Count('id')).order_by('-count')[:10]
        
        return Response({
            'period_days': days,
            'start_date': start_date.isoformat(),
            'total_activities': activities.count(),
            'by_action': list(activity_by_action),
            'top_users': list(activity_by_user),
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
    
    elif report_type == 'subscriptions':
        # Subscription report
        from django.db.models import Count, Sum
        
        subscriptions_by_plan = Subscription.objects.values('plan').annotate(
            count=Count('id'),
            total_revenue=Sum('price')
        ).order_by('-count')
        
        subscriptions_by_status = Subscription.objects.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'by_plan': list(subscriptions_by_plan),
            'by_status': list(subscriptions_by_status),
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
    
    else:
        return Response(
            {'error': f'Unknown report type: {report_type}'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ========== News Management ViewSets ==========

class NewsCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing News Categories (staff only for write operations)."""
    queryset = NewsCategory.objects.all().order_by('name')
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NewsCategoryListSerializer
        return NewsCategorySerializer
    
    def get_queryset(self):
        queryset = NewsCategory.objects.all().order_by('name')
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        return queryset


class NewsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing News articles (staff only for write operations)."""
    queryset = News.objects.all().order_by('-created_at')
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'slug', 'content', 'excerpt']
    ordering_fields = ['created_at', 'published_at', 'views_count', 'title']
    ordering = ['-created_at']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NewsListSerializer
        return NewsSerializer
    
    def get_queryset(self):
        queryset = News.objects.all().order_by('-created_at')
        
        # Filter by category
        category_id = self.request.query_params.get('category_id', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by featured
        is_featured = self.request.query_params.get('is_featured', None)
        if is_featured is not None:
            is_featured_bool = is_featured.lower() == 'true'
            queryset = queryset.filter(is_featured=is_featured_bool)
        
        # Filter by author
        author_id = self.request.query_params.get('author_id', None)
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        
        return queryset


# ========== FAQ Management ViewSets ==========

class FAQCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing FAQ Categories (staff only for write operations)."""
    queryset = FAQCategory.objects.all().order_by('display_order', 'name')
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'description']
    ordering_fields = ['name', 'display_order', 'created_at']
    ordering = ['display_order', 'name']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FAQCategoryListSerializer
        return FAQCategorySerializer
    
    def get_queryset(self):
        queryset = FAQCategory.objects.all().order_by('display_order', 'name')
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        return queryset


class FAQViewSet(viewsets.ModelViewSet):
    """ViewSet for managing FAQs (staff only for write operations)."""
    queryset = FAQ.objects.all().order_by('display_order', '-created_at')
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['question', 'answer']
    ordering_fields = ['created_at', 'display_order', 'views_count', 'question']
    ordering = ['display_order', '-created_at']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FAQListSerializer
        return FAQSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        queryset = FAQ.objects.all().order_by('display_order', '-created_at')
        
        # Filter by category
        category_id = self.request.query_params.get('category_id', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by author
        author_id = self.request.query_params.get('author_id', None)
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        
        return queryset


# ========== Page Management ViewSets ==========

class PageCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Page Categories (staff only for write operations)."""
    queryset = PageCategory.objects.all().order_by('display_order', 'name')
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'description']
    ordering_fields = ['name', 'display_order', 'created_at']
    ordering = ['display_order', 'name']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PageCategoryListSerializer
        return PageCategorySerializer
    
    def get_queryset(self):
        queryset = PageCategory.objects.all().order_by('display_order', 'name')
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        return queryset


class PageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Pages (staff only for write operations)."""
    queryset = Page.objects.all().order_by('-created_at')
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'slug', 'description']
    ordering_fields = ['created_at', 'published_at', 'views_count', 'title']
    ordering = ['-created_at']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PageListSerializer
        return PageSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context for image URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        queryset = Page.objects.all().order_by('-created_at')
        
        # Filter by category
        category_id = self.request.query_params.get('category_id', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by featured
        is_featured = self.request.query_params.get('is_featured', None)
        if is_featured is not None:
            is_featured_bool = is_featured.lower() == 'true'
            queryset = queryset.filter(is_featured=is_featured_bool)
        
        # Filter by author
        author_id = self.request.query_params.get('author_id', None)
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        
        return queryset


# ========== Public Slug-Based Endpoints ==========

@api_view(['GET'])
def news_by_slug(request, slug):
    """Get published news article by slug."""
    try:
        news = News.objects.get(slug=slug, status='published')
        # Increment view count
        news.views_count += 1
        news.save(update_fields=['views_count'])
        
        serializer = NewsSerializer(news, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except News.DoesNotExist:
        return Response(
            {'error': 'News article not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
def faq_by_slug(request, slug):
    """Get published FAQ by slug."""
    try:
        faq = FAQ.objects.get(slug=slug, status='published')
        # Increment view count
        faq.views_count += 1
        faq.save(update_fields=['views_count'])
        
        serializer = FAQSerializer(faq, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except FAQ.DoesNotExist:
        return Response(
            {'error': 'FAQ not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
def page_by_slug(request, slug):
    """Get published page by slug."""
    try:
        page = Page.objects.get(slug=slug, status='published')
        # Increment view count
        page.views_count += 1
        page.save(update_fields=['views_count'])
        
        serializer = PageSerializer(page, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Page.DoesNotExist:
        return Response(
            {'error': 'Page not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET', 'PATCH'])
def user_profile(request):
    """Get or update current user's profile."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Import models and serializers at the top of the function
    from .models import UserProfile
    from .serializers import UserProfileSerializer, UserProfileUpdateSerializer
    
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        try:
            serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True, context={'request': request})
            
            if serializer.is_valid():
                serializer.save()
                # Refresh from database to get updated instance
                profile.refresh_from_db()
                # Return updated profile with full data
                profile_serializer = UserProfileSerializer(profile, context={'request': request})
                return Response(profile_serializer.data, status=status.HTTP_200_OK)
            
            return Response(
                {'error': 'Invalid input', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error updating user profile: {str(e)}\n{error_trace}")
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
def change_password(request):
    """Change current user's password."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    from .serializers import ChangePasswordSerializer
    serializer = ChangePasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid input', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user = request.user
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    
    return Response(
        {'message': 'Password changed successfully'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
def unlock_screen(request):
    """Unlock screen by verifying user password."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    password = request.data.get('password')
    if not password:
        return Response(
            {'error': 'Password is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify password
    user = request.user
    if user.check_password(password):
        return Response(
            {'message': 'Screen unlocked successfully'},
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {'error': 'Invalid password'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_aws_credentials(request):
    """
    Get temporary AWS credentials for frontend Nova Sonic client.
    
    Returns temporary credentials with limited permissions for Bedrock access.
    Uses AWS STS to generate session tokens (15 minutes validity).
    
    Note: get_session_token() doesn't support Policy parameter.
    The IAM user/role used by the backend should already have Bedrock permissions.
    For more restrictive access, use assume_role() with an IAM role instead.
    """
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        # Get AWS region
        region = os.getenv('AWS_BEDROCK_REGION', os.getenv('AWS_REGION', 'us-east-1'))
        
        # Initialize STS client
        sts = boto3.client(
            'sts',
            region_name=region,
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        # Get temporary credentials (15 minutes)
        # Note: get_session_token() doesn't support Policy parameter
        # The credentials will inherit the permissions of the IAM user/role
        # used by the backend. Ensure that user/role has Bedrock permissions.
        response = sts.get_session_token(
            DurationSeconds=900  # 15 minutes
        )
        
        credentials = response['Credentials']
        
        return Response({
            'accessKeyId': credentials['AccessKeyId'],
            'secretAccessKey': credentials['SecretAccessKey'],
            'sessionToken': credentials['SessionToken'],
            'expiration': credentials['Expiration'].isoformat(),
            'region': region,
        }, status=status.HTTP_200_OK)
        
    except ClientError as e:
        logger.error(f"AWS STS error: {e}", exc_info=True)
        return Response(
            {'error': f'Failed to get AWS credentials: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error getting AWS credentials: {e}", exc_info=True)
        return Response(
            {'error': f'Unexpected error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def health_check(request):
    """Health check endpoint."""
    return Response({
        'status': 'ok',
        'message': 'API is running',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_story_settings(request):
    """
    Get or update user's story generation settings.
    
    GET: Retrieve current user's story settings (creates default if doesn't exist)
    PUT/PATCH: Update user's story settings
    """
    try:
        settings_obj, created = UserStorySettings.objects.get_or_create(
            user=request.user,
            defaults={
                'age_range': '6-8',
                'genre_preference': 'mixed',
                'language_level': 'moderate',
                'moral_theme': 'mixed',
                'include_diversity': True,
                'include_sensory_details': True,
                'include_interactive_questions': True,
                'max_word_count': 800,
                'story_parts': 5,
                'include_sound_effects': True,
                'explain_complex_words': True,
            }
        )
    except Exception as e:
        return Response(
            {'error': f'Error accessing story settings: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    if request.method == 'GET':
        serializer = UserStorySettingsSerializer(settings_obj)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserStorySettingsSerializer(settings_obj, data=request.data, partial=request.method == 'PATCH')
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing stories."""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'prompt', 'story_text']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return StoryListSerializer
        return StorySerializer
    
    def get_queryset(self):
        """Return stories for the authenticated user, or all stories for superadmin."""
        queryset = Story.objects.all()
        
        # Superadmin can see all stories
        if not self.request.user.is_superuser:
            # Regular users only see their own stories
            queryset = queryset.filter(user=self.request.user)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a single story with access control."""
        instance = self.get_object()
        
        # Check if user has permission to view this story
        # Admin can view all stories, regular users can only view their own
        if not request.user.is_superuser and instance.user != request.user:
            return Response(
                {'error': 'You do not have permission to view this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def _generate_story_content(self, story, image_description=None, generate_only_audio=False):
        """Helper method to generate story content using Nova AI."""
        try:
            from .nova_service import NovaService
            nova = NovaService()
            
            # Analyze image if provided and not already analyzed
            if story.image and not image_description:
                try:
                    with open(story.image.path, 'rb') as f:
                        image_bytes = f.read()
                    image_description = nova.analyze_image(image_bytes)
                    story.image_description = image_description
                    story.save(update_fields=['image_description'])
                except Exception as e:
                    print(f"Warning: Error analyzing image: {e}")
                    # Continue without image description
            
            # Generate story text (skip if only generating audio)
            if not generate_only_audio:
                # Get user's story settings if available
                user_settings = None
                try:
                    user_settings = UserStorySettings.objects.get(user=story.user)
                except UserStorySettings.DoesNotExist:
                    pass  # Use defaults if settings don't exist
                
                story_text, system_prompt = nova.generate_story(
                    prompt=story.prompt,
                    image_description=image_description or story.image_description,
                    template=story.template,
                    user_settings=user_settings,
                    return_system_prompt=True
                )
                story.story_text = story_text
                story.system_prompt_used = system_prompt
                # Save story text immediately so it's available even if audio generation fails
                story.save(update_fields=['story_text', 'system_prompt_used'])
            else:
                # Use existing story text
                story_text = story.story_text
            
            # Generate audio using Amazon Polly (simplified approach)
            try:
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Starting audio generation for story {story.id}")
                print(f"Starting audio generation for story {story.id}")
                
                # Check if story text exists
                if not story_text or len(story_text.strip()) == 0:
                    raise Exception("Story text is empty. Cannot generate audio.")
                
                logger.info(f"Story text length: {len(story_text)} characters")
                print(f"Story text length: {len(story_text)} characters")
                
                # Synthesize speech using Polly (returns PCM audio)
                # Use story's voice_id if set, otherwise use default
                voice_id = getattr(story, 'voice_id', None)
                if not voice_id or voice_id == '':
                    voice_id = None  # Let Polly use default
                logger.info(f"Calling nova.synthesize_speech() with voice_id={voice_id}...")
                print(f"Calling nova.synthesize_speech() with voice_id={voice_id}...")
                pcm_audio = nova.synthesize_speech(story_text, voice_id=voice_id)
                
                if not pcm_audio or len(pcm_audio) == 0:
                    raise Exception("No audio data returned from synthesize_speech")
                
                logger.info(f"Received PCM audio: {len(pcm_audio)} bytes")
                print(f"Received PCM audio: {len(pcm_audio)} bytes")
                
                # Convert PCM to MP3 for storage and playback
                # Polly outputs 16kHz PCM, so use that sample rate
                logger.info("Converting PCM to MP3...")
                print("Converting PCM to MP3...")
                from .utils import pcm_to_mp3
                audio_data = pcm_to_mp3(pcm_audio, sample_rate=16000)
                
                if not audio_data or len(audio_data) == 0:
                    raise Exception("MP3 conversion failed - no audio data")
                
                logger.info(f"MP3 audio data: {len(audio_data)} bytes")
                print(f"MP3 audio data: {len(audio_data)} bytes")
                
                # Get old audio file path BEFORE generating new one
                # Refresh from DB to ensure we have the latest path
                story.refresh_from_db()
                old_audio_path = story.audio_file.name if story.audio_file else None
                logger.info(f"Current audio file path in DB: {old_audio_path}")
                print(f"Current audio file path in DB: {old_audio_path}")
                
                # Save audio file using the utility
                logger.info("Saving audio file...")
                print("Saving audio file...")
                from .utils import save_image_file
                # Use 'stories' as category - it will create: 2026/02/<story-id>/audio_<timestamp>.mp3
                # All story assets (images, audio) are grouped under year/month/storyid/
                # Explicitly set filename to ensure correct extension
                audio_path = save_image_file(
                    audio_data,
                    category='stories',
                    instance=story,
                    filename='audio.mp3'  # Explicitly set filename
                )
                
                if not audio_path:
                    raise Exception("Failed to save audio file - no path returned")
                
                logger.info(f"Audio file saved to: {audio_path}")
                print(f"Audio file saved to: {audio_path}")
                
                # Update story with audio file path
                story.audio_file.name = audio_path
                story.save(update_fields=['audio_file'])
                
                # Delete old audio files AFTER saving the new one
                # Delete the specific old file AND clean up any other old audio files in the story directory
                try:
                    import os
                    import glob
                    from django.conf import settings
                    
                    # 1. Delete the specific old audio file if it exists and is different
                    if old_audio_path and old_audio_path != audio_path:
                        old_full_path = os.path.join(settings.MEDIA_ROOT, old_audio_path)
                        is_audio_file = (
                            'audio' in old_audio_path.lower() or 
                            old_audio_path.endswith(('.mp3', '.wav', '.pcm', '.m4a', '.ogg'))
                        )
                        
                        if is_audio_file and os.path.exists(old_full_path):
                            os.remove(old_full_path)
                            logger.info(f"Successfully deleted old audio file: {old_full_path}")
                            print(f"✅ Successfully deleted old audio file: {old_full_path}")
                    
                    # 2. Clean up any other old audio files in the story's directory
                    # Get the story directory path
                    story_dir = os.path.dirname(os.path.join(settings.MEDIA_ROOT, audio_path))
                    if os.path.exists(story_dir):
                        # Find all audio files in the story directory
                        audio_pattern = os.path.join(story_dir, 'audio_*.mp3')
                        all_audio_files = glob.glob(audio_pattern)
                        
                        # Delete all except the current one
                        current_full_path = os.path.join(settings.MEDIA_ROOT, audio_path)
                        deleted_count = 0
                        for old_file in all_audio_files:
                            if old_file != current_full_path:
                                try:
                                    os.remove(old_file)
                                    deleted_count += 1
                                    logger.info(f"Cleaned up old audio file: {old_file}")
                                    print(f"🧹 Cleaned up old audio file: {os.path.basename(old_file)}")
                                except Exception as e:
                                    logger.warning(f"Could not delete {old_file}: {e}")
                        
                        if deleted_count > 0:
                            logger.info(f"Cleaned up {deleted_count} old audio file(s)")
                            print(f"✅ Cleaned up {deleted_count} old audio file(s)")
                            
                except Exception as e:
                    logger.warning(f"Error during audio file cleanup: {e}")
                    print(f"⚠️ Error during audio file cleanup: {e}")
                    import traceback
                    print(traceback.format_exc())
                
                logger.info(f"Audio generation completed successfully for story {story.id}")
                logger.info(f"Audio file path: {audio_path}")
                print(f"✅ Audio generation completed successfully for story {story.id}")
                print(f"✅ Audio file path: {audio_path}")
                
            except Exception as e:
                import logging
                import traceback
                logger = logging.getLogger(__name__)
                error_trace = traceback.format_exc()
                logger.error(f"Error generating audio for story {story.id}: {e}\n{error_trace}", exc_info=True)
                print(f"ERROR: Error generating audio: {e}")
                print(f"Traceback: {error_trace}")
                # Continue without audio - story text is already saved above
                # Store error in story for debugging (optional)
                # story.audio_generation_error = str(e)
            
            # Story text is already saved above, only refresh to ensure we have latest state
            story.refresh_from_db()
            return True
            
        except ImportError:
            # Nova service not available
            print("Warning: Nova service not available. Story saved without AI generation.")
            story.story_text = "Nova AI service not configured. Please configure AWS credentials."
            story.save()
            return False
        except Exception as e:
            # If Nova fails, save story with error message
            print(f"Error generating story with Nova: {e}")
            story.story_text = f"Error generating story: {str(e)}. Please try again or contact support."
            story.save()
            return False
    
    def perform_create(self, serializer):
        """Create story and generate content using Nova AI."""
        # Save story with user
        story = serializer.save(user=self.request.user)
        
        # Generate story content
        self._generate_story_content(story)
    
    def perform_update(self, serializer):
        """Update story - if image is updated, regenerate story. If story_text is updated, create revision."""
        # Get old story_text before saving
        story = self.get_object()
        old_story_text = story.story_text
        
        # Save the updated story
        story = serializer.save()
        
        # Check if story_text was updated - create revision
        if 'story_text' in serializer.validated_data:
            new_story_text = serializer.validated_data['story_text']
            if old_story_text != new_story_text and old_story_text:
                # Create revision of old version
                from .models import StoryRevision
                StoryRevision.objects.create(
                    story=story,
                    story_text=old_story_text,
                    created_by=self.request.user
                )
        
        # Check if image was updated
        if 'image' in serializer.validated_data and serializer.validated_data['image']:
            # Image was updated - regenerate story with new image
            # This is a long-running operation, so we do it synchronously
            # In production, you might want to use Celery for async processing
            try:
                self._generate_story_content(story, image_description=None)
            except Exception as e:
                # Log error but don't fail the update
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error regenerating story after image update: {e}")
                # Story is still saved with the new image, just without regeneration
    
    @action(detail=True, methods=['post'])
    def generate_audio(self, request, pk=None):
        """Generate audio for an existing story."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to generate audio for this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if story has text
        if not story.story_text or len(story.story_text.strip()) == 0:
            return Response(
                {'error': 'Story has no content. Please regenerate the story first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get voice_id from request if provided
        voice_id = request.data.get('voice_id', None)
        if voice_id:
            # Update story's voice_id
            story.voice_id = voice_id
            story.save(update_fields=['voice_id'])
        
        try:
            # Generate audio only (will use story's voice_id)
            self._generate_story_content(story, image_description=story.image_description, generate_only_audio=True)
            
            # Refresh story to get updated audio_url
            story.refresh_from_db()
            serializer = self.get_serializer(story)
            
            return Response({
                'message': 'Audio generated successfully',
                'story': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error generating audio: {e}", exc_info=True)
            return Response(
                {'error': f'Failed to generate audio: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def available_voices(self, request):
        """
        Get list of available Amazon Polly voices.
        
        Query params:
            language_code (str, optional): Filter voices by language (default: 'en-US')
        
        Returns:
            List of available voices with id, name, gender, and neural flag
        """
        from .polly_voices import get_available_voices, get_all_voices
        
        language_code = request.query_params.get('language_code', 'en-US')
        
        if language_code:
            voices = get_available_voices(language_code)
        else:
            # Return all voices grouped by language
            all_voices = get_all_voices()
            return Response({
                'voices_by_language': all_voices,
                'default_language': 'en-US'
            })
        
        return Response({
            'language_code': language_code,
            'voices': voices
        })
    
    @action(detail=True, methods=['get'])
    def revisions(self, request, pk=None):
        """Get revision history for a story."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to view revisions for this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from .models import StoryRevision
        from .serializers import StoryRevisionSerializer
        
        revisions = StoryRevision.objects.filter(story=story).order_by('-created_at')
        
        # Paginate revisions
        page = self.paginate_queryset(revisions)
        if page is not None:
            serializer = StoryRevisionSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = StoryRevisionSerializer(revisions, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate story with modifications or new prompt."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to regenerate this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get prompt from request (new prompt) or use modifications
        new_prompt = request.data.get('prompt', None)
        modifications = request.data.get('modifications', '')
        template = request.data.get('template', story.template)
        
        # Save old story as revision before regenerating
        old_story_text = story.story_text
        if old_story_text and len(old_story_text.strip()) > 0:
            from .models import StoryRevision
            StoryRevision.objects.create(
                story=story,
                story_text=old_story_text,
                created_by=request.user
            )
        
        try:
            from .nova_service import NovaService
            nova = NovaService()
            
            # Analyze image if story has an image (use existing description or analyze fresh)
            image_description = None
            if story.image:
                # If image_description exists, use it; otherwise analyze the image
                if story.image_description:
                    image_description = story.image_description
                else:
                    # Analyze the image using Titan Multimodal Embeddings
                    try:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.info(f"Analyzing image for story {story.id} during regeneration")
                        
                        with open(story.image.path, 'rb') as f:
                            image_bytes = f.read()
                        
                        # Determine image format from file extension
                        image_format = "jpeg"
                        if story.image.name.lower().endswith('.png'):
                            image_format = "png"
                        
                        image_description = nova.analyze_image(image_bytes, image_format=image_format)
                        story.image_description = image_description
                        story.save(update_fields=['image_description'])
                        logger.info(f"Image analyzed successfully for story {story.id}")
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Warning: Error analyzing image for story {story.id} during regeneration: {e}")
                        # Continue without image description - use existing one if available
                        image_description = story.image_description
            
            # Use new prompt if provided, otherwise append modifications to existing prompt
            if new_prompt:
                prompt_to_use = new_prompt
                # Update the story's prompt
                story.prompt = new_prompt
            else:
                prompt_to_use = f"{story.prompt}\n\nUser requested changes: {modifications}"
            
            # Get user's story settings if available
            user_settings = None
            try:
                user_settings = UserStorySettings.objects.get(user=story.user)
            except UserStorySettings.DoesNotExist:
                pass  # Use defaults if settings don't exist
            
            story_text, system_prompt = nova.generate_story(
                prompt=prompt_to_use,
                image_description=image_description,
                template=template,
                user_settings=user_settings,
                return_system_prompt=True
            )
            
            story.story_text = story_text
            story.system_prompt_used = system_prompt
            story.template = template
            
            # Regenerate audio using Amazon Polly
            try:
                # Use story's voice_id or default to 'Joanna'
                voice_id = story.voice_id or 'Joanna'
                
                # Polly returns PCM audio (16kHz)
                pcm_audio = nova.synthesize_speech(story_text, voice_id=voice_id)
                
                # Convert PCM to MP3 for storage and playback
                from .utils import pcm_to_mp3
                audio_data = pcm_to_mp3(pcm_audio, sample_rate=16000)  # Use 16kHz for Polly
                
                # Delete old audio file if it exists
                old_audio_path = None
                if story.audio_file:
                    old_audio_path = story.audio_file.path if hasattr(story.audio_file, 'path') else None
                
                # Save audio file using the utility
                from .utils import save_image_file
                audio_path = save_image_file(
                    audio_data,
                    category='stories',
                    instance=story,
                    filename='audio.mp3'  # Explicitly set filename
                )
                
                if not audio_path:
                    raise Exception("Failed to save audio file - no path returned")
                
                # Update story with audio file path
                story.audio_file.name = audio_path
                
                # Delete old audio file after successful save
                if old_audio_path and old_audio_path != audio_path:
                    try:
                        import os
                        if os.path.exists(old_audio_path):
                            # Only delete if it's an audio file (check extension or path)
                            if 'audio' in old_audio_path.lower() or old_audio_path.endswith(('.mp3', '.wav', '.m4a')):
                                os.remove(old_audio_path)
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Could not delete old audio file {old_audio_path}: {e}")
                
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error regenerating audio: {e}", exc_info=True)
            
            story.save()
            
            serializer = self.get_serializer(story)
            return Response({
                'message': 'Story regenerated successfully',
                'story': serializer.data
            })
        except ImportError:
            return Response(
                {'error': 'Nova AI service not configured. Please configure AWS credentials.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {'error': f"Failed to regenerate story: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_scenes(self, request, pk=None):
        """Generate scene images based on story transcript."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to generate scenes for this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if story has content
        if not story.story_text or len(story.story_text.strip()) == 0:
            return Response(
                {'error': 'Story has no content. Please generate a story first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .nova_service import NovaService
            from .models import StoryScene
            import logging
            logger = logging.getLogger(__name__)
            
            nova = NovaService()
            
            # Parse story text to extract parts/chapters
            parts = nova.parse_story_parts(story.story_text)
            
            if not parts:
                return Response(
                    {'error': 'Could not parse story into parts/chapters.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Generating {len(parts)} scenes for story {story.id}")
            
            # Delete existing scenes for this story
            StoryScene.objects.filter(story=story).delete()
            
            generated_scenes = []
            
            # Generate image for each part
            for part in parts:
                try:
                    # Create a prompt for image generation based on the scene text
                    # Limit scene text to first 500 characters for prompt
                    scene_text = part['text'][:500]
                    
                    # Create image generation prompt
                    image_prompt = f"A beautiful, colorful, child-friendly portrait illustration for a children's story scene. {scene_text}. Style: whimsical, vibrant, safe for children, portrait orientation, detailed characters and setting."
                    
                    logger.info(f"Generating image for scene {part['number']} of story {story.id}")
                    
                    # Generate image (portrait orientation: 1024x1024 or 768x1024)
                    image_bytes = nova.generate_image(
                        prompt=image_prompt,
                        width=768,
                        height=1024,  # Portrait orientation
                        style_preset="photographic"
                    )
                    
                    # Create StoryScene object first (without image)
                    scene = StoryScene.objects.create(
                        story=story,
                        scene_number=part['number'],
                        scene_text=part['text'],
                        prompt_used=image_prompt
                    )
                    
                    # Save image using Django's file handling
                    from django.core.files.base import ContentFile
                    from django.core.files.uploadedfile import InMemoryUploadedFile
                    import io
                    from datetime import datetime
                    
                    # Create a ContentFile from the image bytes
                    image_file = ContentFile(image_bytes, name=f'scene_{part["number"]}.png')
                    
                    # Assign to the scene's image field (will use upload_to function)
                    scene.image.save(f'scene_{part["number"]}.png', image_file, save=True)
                    
                    generated_scenes.append(scene)
                    logger.info(f"Successfully generated scene {part['number']} for story {story.id}")
                    
                except Exception as e:
                    logger.error(f"Error generating scene {part['number']} for story {story.id}: {e}", exc_info=True)
                    # Continue with other scenes even if one fails
                    continue
            
            if not generated_scenes:
                return Response(
                    {'error': 'Failed to generate any scenes. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Serialize scenes for response
            from .serializers import StorySceneSerializer
            serializer = StorySceneSerializer(generated_scenes, many=True, context={'request': request})
            
            return Response({
                'message': f'Successfully generated {len(generated_scenes)} scene(s)',
                'scenes': serializer.data
            }, status=status.HTTP_200_OK)
            
        except ImportError:
            return Response(
                {'error': 'Nova AI service not configured. Please configure AWS credentials.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error generating scenes: {e}", exc_info=True)
            return Response(
                {'error': f"Failed to generate scenes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='upload_scene_image')
    def upload_scene_image(self, request, pk=None):
        """Upload an image for a specific scene number."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to upload scene images for this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        scene_number = request.data.get('scene_number')
        image = request.FILES.get('image')
        
        if not scene_number:
            return Response(
                {'error': 'scene_number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not image:
            return Response(
                {'error': 'image file is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            scene_number = int(scene_number)
        except (ValueError, TypeError):
            return Response(
                {'error': 'scene_number must be a valid integer.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create scene
        scene, created = StoryScene.objects.get_or_create(
            story=story,
            scene_number=scene_number,
            defaults={
                'scene_text': '',  # Will be updated if story text is available
                'prompt_used': 'Manual upload'
            }
        )
        
        # If scene was just created and story has text, try to extract scene text
        if created and story.story_text:
            try:
                from .nova_service import NovaService
                nova = NovaService()
                parts = nova.parse_story_parts(story.story_text)
                for part in parts:
                    if part['number'] == scene_number:
                        scene.scene_text = part['text']
                        break
            except Exception:
                pass  # If parsing fails, just leave scene_text empty
        
        # Delete old image if exists
        if scene.image:
            try:
                scene.image.delete(save=False)
            except Exception:
                pass
        
        # Save new image
        scene.image = image
        scene.save()
        
        # Serialize and return
        from .serializers import StorySceneSerializer
        serializer = StorySceneSerializer(scene, context={'request': request})
        
        return Response({
            'message': 'Scene image uploaded successfully.',
            'scene': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='initialize_scenes')
    def initialize_scenes(self, request, pk=None):
        """Initialize scene objects based on story text parts/chapters."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to initialize scenes for this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not story.story_text or len(story.story_text.strip()) == 0:
            return Response(
                {'error': 'Story has no content. Please generate a story first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .nova_service import NovaService
            nova = NovaService()
            
            # Parse story text to extract parts/chapters
            parts = nova.parse_story_parts(story.story_text)
            
            if not parts:
                return Response(
                    {'error': 'Could not parse story into parts/chapters.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or update scene objects (don't delete existing ones with images)
            created_scenes = []
            for part in parts:
                scene, created = StoryScene.objects.get_or_create(
                    story=story,
                    scene_number=part['number'],
                    defaults={
                        'scene_text': part['text'],
                        'prompt_used': 'Manual upload'
                    }
                )
                
                # Update scene_text if it changed
                if not created and scene.scene_text != part['text']:
                    scene.scene_text = part['text']
                    scene.save()
                
                created_scenes.append(scene)
            
            # Serialize and return
            from .serializers import StorySceneSerializer
            serializer = StorySceneSerializer(created_scenes, many=True, context={'request': request})
            
            return Response({
                'message': f'Initialized {len(created_scenes)} scene(s)',
                'scenes': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error initializing scenes for story {story.id}: {e}", exc_info=True)
            return Response(
                {'error': f'Failed to initialize scenes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='add_scene')
    def add_scene(self, request, pk=None):
        """Manually add a new scene to the story."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to add scenes to this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        scene_number = request.data.get('scene_number')
        scene_text = request.data.get('scene_text', '')
        
        if not scene_number:
            return Response(
                {'error': 'scene_number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            scene_number = int(scene_number)
        except (ValueError, TypeError):
            return Response(
                {'error': 'scene_number must be a valid integer.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if scene number already exists
        if StoryScene.objects.filter(story=story, scene_number=scene_number).exists():
            return Response(
                {'error': f'Scene {scene_number} already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new scene
        scene = StoryScene.objects.create(
            story=story,
            scene_number=scene_number,
            scene_text=scene_text,
            prompt_used='Manual creation'
        )
        
        # Serialize and return
        from .serializers import StorySceneSerializer
        serializer = StorySceneSerializer(scene, context={'request': request})
        
        return Response({
            'message': f'Scene {scene_number} added successfully.',
            'scene': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='delete_scene')
    def delete_scene(self, request, pk=None):
        """Delete a scene from the story."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete scenes from this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        scene_id = request.data.get('scene_id')
        if not scene_id:
            return Response(
                {'error': 'scene_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            scene = StoryScene.objects.get(id=scene_id, story=story)
            scene.delete()
            return Response({
                'message': 'Scene deleted successfully.'
            }, status=status.HTTP_200_OK)
        except StoryScene.DoesNotExist:
            return Response(
                {'error': 'Scene not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='start_voice_session')
    def start_voice_session(self, request, pk=None):
        """Start a voice interaction session for a story."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to start a voice session for this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not story.story_text or len(story.story_text.strip()) == 0:
            return Response(
                {'error': 'Story has no content. Please generate a story first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return WebSocket URL for connection
        # The WebSocket URL will be: ws://host/ws/stories/{story_id}/voice/
        ws_protocol = 'wss' if request.is_secure() else 'ws'
        ws_host = request.get_host()
        ws_url = f"{ws_protocol}://{ws_host}/ws/stories/{story.id}/voice/"
        
        return Response({
            'message': 'Voice session ready',
            'websocket_url': ws_url,
            'story_id': str(story.id),
            'story_title': story.title
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='end_voice_session')
    def end_voice_session(self, request, pk=None):
        """End a voice interaction session (informational endpoint)."""
        story = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and story.user != request.user:
            return Response(
                {'error': 'You do not have permission to end a voice session for this story.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'message': 'Voice session ended',
            'story_id': str(story.id)
        }, status=status.HTTP_200_OK)


class StorySessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing story listening sessions."""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['story__title', 'user__username']
    ordering_fields = ['started_at', 'ended_at', 'duration_seconds']
    ordering = ['-started_at']
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return StorySessionListSerializer
        return StorySessionSerializer
    
    def get_queryset(self):
        """Return sessions for the authenticated user, or all sessions for superadmin."""
        queryset = StorySession.objects.all()
        
        # Superadmin can see all sessions
        if not self.request.user.is_superuser:
            # Regular users only see their own sessions
            queryset = queryset.filter(user=self.request.user)
        
        # Optional filter by story
        story_id = self.request.query_params.get('story', None)
        if story_id:
            queryset = queryset.filter(story_id=story_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create session with current user."""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End a listening session and calculate duration."""
        session = self.get_object()
        
        # Check permissions
        if not request.user.is_superuser and session.user != request.user:
            return Response(
                {'error': 'You do not have permission to end this session.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if session.ended_at:
            return Response(
                {'error': 'Session already ended.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        session.ended_at = timezone.now()
        session.completed = request.data.get('completed', False)
        session.save()
        
        serializer = self.get_serializer(session)
        return Response({
            'message': 'Session ended successfully',
            'session': serializer.data
        })


class PlaylistViewSet(viewsets.ModelViewSet):
    """ViewSet for managing playlists."""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return PlaylistListSerializer
        return PlaylistSerializer
    
    def get_queryset(self):
        """Return playlists for the authenticated user, or all playlists for superadmin."""
        queryset = Playlist.objects.all()
        
        # Superadmin can see all playlists
        if not self.request.user.is_superuser:
            # Regular users can only see their own playlists and public playlists
            queryset = queryset.filter(
                Q(user=self.request.user) | Q(is_public=True)
            )
        
        return queryset.prefetch_related('stories', 'user')
    
    def perform_create(self, serializer):
        """Create playlist and set user."""
        serializer.save(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a playlist, with object-level permission check."""
        instance = self.get_object()
        if not request.user.is_superuser and instance.user != request.user and not instance.is_public:
            return Response(
                {'detail': 'You do not have permission to view this playlist.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
