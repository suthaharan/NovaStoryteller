"""
Serializers for the API app.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Item, Category, Permission, Role, UserRole, UserActivity, Subscription, Plan, Invoice, NewsCategory, News, FAQCategory, FAQ, PageCategory, Page, UserProfile, Story, StorySession, StoryRevision, Playlist, UserStorySettings, StoryScene


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    full_name = serializers.SerializerMethodField()
    is_senior = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined', 'is_senior', 'password']
        read_only_fields = ['id', 'is_staff', 'is_superuser', 'date_joined']
    
    def get_full_name(self, obj):
        """Return full name or username if names are not set."""
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username
    
    def get_is_senior(self, obj):
        """Check if user has senior profile."""
        try:
            return obj.senior_profile.is_senior if hasattr(obj, 'senior_profile') else False
        except:
            return False
    
    def create(self, validated_data):
        """Create a new user."""
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required when creating a user.'})
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing users."""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined']
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_staff', 'is_superuser', 'date_joined']
    
    def get_full_name(self, obj):
        """Return full name or username if names are not set."""
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user (specifically is_active status)."""
    class Meta:
        model = User
        fields = ['is_active']
    
    def validate_is_active(self, value):
        """Prevent deactivating superusers."""
        if self.instance and self.instance.is_superuser and not value:
            raise serializers.ValidationError("Superusers cannot be deactivated.")
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer for login request."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField(required=True)


class RegistrationSerializer(serializers.Serializer):
    """Serializer for user registration."""
    username = serializers.CharField(
        required=True,
        min_length=4,
        max_length=150,
        help_text="Username must be at least 4 characters long."
    )
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        help_text="Password must be at least 8 characters long."
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        help_text="Must match password."
    )
    user_type = serializers.ChoiceField(
        choices=['admin', 'staff', 'user'],
        required=True,
        help_text="Account type: 'admin' (superuser), 'staff' (staff user), or 'user' (regular user)."
    )
    accept_terms = serializers.BooleanField(required=True)
    
    def validate_username(self, value):
        """Validate username is unique and meets requirements."""
        if len(value) < 4:
            raise serializers.ValidationError("Username must be at least 4 characters long.")
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        
        return value
    
    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        """Validate password confirmation, terms acceptance, and user type."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match."
            })
        
        if not attrs.get('accept_terms', False):
            raise serializers.ValidationError({
                'accept_terms': "You must accept the terms and conditions to register."
            })
        
        # Validate user_type
        user_type = attrs.get('user_type', 'user')
        if user_type not in ['admin', 'staff', 'user']:
            raise serializers.ValidationError({
                'user_type': "User type must be 'admin', 'staff', or 'user'."
            })
        
        return attrs
    
    def create(self, validated_data):
        """Create a new user."""
        user_type = validated_data.pop('user_type', 'user')
        validated_data.pop('confirm_password')  # Remove confirm_password
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            is_active=True,
            is_staff=(user_type == 'staff' or user_type == 'admin'),
            is_superuser=(user_type == 'admin')
        )
        return user


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class ItemSerializer(serializers.ModelSerializer):
    """Serializer for Item model."""
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        """Validate that name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()


class ItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing items."""
    class Meta:
        model = Item
        fields = ['id', 'name', 'is_active', 'created_at']


# ========== Roles & Permissions Serializers ==========

class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission model."""
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'description', 'endpoint', 'method', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PermissionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing permissions."""
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'endpoint', 'method', 'is_active']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model."""
    permissions = PermissionListSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        source='permissions',
        write_only=True,
        required=False
    )
    permission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'permission_ids', 'permission_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_permission_count(self, obj):
        return obj.permissions.count()


class RoleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing roles."""
    permission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permission_count', 'is_active', 'created_at']
    
    def get_permission_count(self, obj):
        return obj.permissions.count()


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for UserRole model."""
    user = UserListSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True)
    role = RoleListSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'user_id', 'role', 'role_id', 'assigned_at', 'assigned_by', 'assigned_by_username']
        read_only_fields = ['id', 'assigned_at']


# ========== User Activity Serializers ==========

class UserActivitySerializer(serializers.ModelSerializer):
    """Serializer for UserActivity model."""
    user = UserListSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True, required=False)
    
    class Meta:
        model = UserActivity
        fields = ['id', 'user', 'user_id', 'action', 'resource_type', 'resource_id', 'description', 'ip_address', 'user_agent', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserActivityListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing user activities."""
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActivity
        fields = ['id', 'username', 'full_name', 'action', 'resource_type', 'resource_id', 'description', 'ip_address', 'created_at']
    
    def get_full_name(self, obj):
        if obj.user.first_name or obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.username


# ========== Plan Serializers ==========

class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model."""
    
    class Meta:
        model = Plan
        fields = ['id', 'uuid', 'name', 'description', 'price', 'duration_months', 'features', 'is_popular', 'is_active', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']


class PlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing plans."""
    
    class Meta:
        model = Plan
        fields = ['id', 'uuid', 'name', 'price', 'duration_months', 'is_popular', 'is_active', 'display_order']
        read_only_fields = ['id', 'uuid']


# ========== Subscription Serializers ==========

class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription model."""
    user = UserListSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True, allow_null=True)
    plan = PlanListSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all(), source='plan', write_only=True, allow_null=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'uuid', 'user', 'user_id', 'plan', 'plan_id', 'status', 'start_date', 'end_date', 'price', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']


class SubscriptionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing subscriptions."""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'uuid', 'username', 'plan_name', 'status', 'start_date', 'end_date', 'price', 'created_at']
        read_only_fields = ['id', 'uuid']


# ========== Invoice Serializers ==========

class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    user = UserListSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True)
    plan = PlanListSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all(), source='plan', write_only=True, allow_null=True)
    subscription_id = serializers.PrimaryKeyRelatedField(queryset=Subscription.objects.all(), source='subscription', write_only=True, allow_null=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'uuid', 'invoice_number', 'user', 'user_id', 'subscription', 'subscription_id', 
            'plan', 'plan_id', 'subtotal', 'discount', 'total', 'status', 'payment_method', 
            'due_date', 'paid_date', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uuid', 'invoice_number', 'created_at', 'updated_at']


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing invoices."""
    username = serializers.CharField(source='user.username', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'uuid', 'invoice_number', 'username', 'plan_name', 'total', 
            'status', 'payment_method', 'due_date', 'created_at'
        ]
        read_only_fields = ['id', 'uuid']
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = ['id', 'username', 'full_name', 'plan', 'status', 'start_date', 'end_date', 'price', 'created_at']
    
    def get_full_name(self, obj):
        if obj.user.first_name or obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.username


# ========== News Serializers ==========

class NewsCategorySerializer(serializers.ModelSerializer):
    """Serializer for NewsCategory model."""
    news_count = serializers.SerializerMethodField()
    
    class Meta:
        model = NewsCategory
        fields = ['id', 'uuid', 'name', 'slug', 'description', 'is_active', 'news_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']
    
    def get_news_count(self, obj):
        """Return count of news items in this category."""
        return obj.news_items.count()


class NewsCategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing news categories."""
    class Meta:
        model = NewsCategory
        fields = ['id', 'uuid', 'name', 'slug', 'is_active']
        read_only_fields = ['id', 'uuid']


class NewsSerializer(serializers.ModelSerializer):
    """Serializer for News model."""
    category = NewsCategoryListSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(), 
        source='category', 
        write_only=True, 
        allow_null=True
    )
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = News
        fields = [
            'id', 'uuid', 'title', 'slug', 'category', 'category_id', 'author', 'author_username', 
            'author_full_name', 'content', 'excerpt', 'featured_image', 'featured_image_url', 'status', 
            'is_featured', 'views_count', 'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uuid', 'author', 'views_count', 'created_at', 'updated_at']
    
    def get_author_full_name(self, obj):
        """Return author's full name or username."""
        if obj.author:
            if obj.author.first_name or obj.author.last_name:
                return f"{obj.author.first_name} {obj.author.last_name}".strip()
            return obj.author.username
        return None
    
    def get_featured_image_url(self, obj):
        """Return full URL for featured image."""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None
    
    def validate_featured_image(self, value):
        """Validate image size (max 50KB)."""
        if value:
            if value.size > 50 * 1024:  # 50KB in bytes
                raise serializers.ValidationError("Image size cannot exceed 50KB.")
        return value
    
    def create(self, validated_data):
        """Set author to current user on create."""
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class NewsListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing news."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = News
        fields = [
            'id', 'uuid', 'title', 'slug', 'category_name', 'author_username', 
            'excerpt', 'status', 'is_featured', 'views_count', 
            'published_at', 'created_at', 'featured_image_url'
        ]
    
    def get_featured_image_url(self, obj):
        """Return full URL for featured image."""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None


# ========== FAQ Serializers ==========

class FAQCategorySerializer(serializers.ModelSerializer):
    """Serializer for FAQCategory model."""
    faq_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FAQCategory
        fields = ['id', 'uuid', 'name', 'slug', 'description', 'display_order', 'is_active', 'faq_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']
    
    def get_faq_count(self, obj):
        """Return count of FAQs in this category."""
        return obj.faq_items.count()


class FAQCategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing FAQ categories."""
    class Meta:
        model = FAQCategory
        fields = ['id', 'uuid', 'name', 'slug', 'display_order', 'is_active']
        read_only_fields = ['id', 'uuid']


class FAQSerializer(serializers.ModelSerializer):
    """Serializer for FAQ model."""
    category = FAQCategoryListSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=FAQCategory.objects.all(), 
        source='category', 
        write_only=True, 
        allow_null=True
    )
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FAQ
        fields = [
            'id', 'uuid', 'question', 'slug', 'answer', 'category', 'category_id', 'author', 
            'author_username', 'author_full_name', 'status', 'display_order', 
            'views_count', 'helpful_count', 'not_helpful_count', 
            'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uuid', 'author', 'views_count', 'helpful_count', 'not_helpful_count', 'created_at', 'updated_at']
    
    def get_author_full_name(self, obj):
        """Return author's full name or username."""
        if obj.author:
            if obj.author.first_name or obj.author.last_name:
                return f"{obj.author.first_name} {obj.author.last_name}".strip()
            return obj.author.username
        return None
    
    def create(self, validated_data):
        """Set author to current user on create."""
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class FAQListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing FAQs."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = FAQ
        fields = [
            'id', 'uuid', 'question', 'slug', 'category_name', 'author_username', 
            'status', 'display_order', 'views_count', 
            'helpful_count', 'not_helpful_count', 'published_at', 'created_at'
        ]


# ========== Page Serializers ==========

class PageCategorySerializer(serializers.ModelSerializer):
    """Serializer for PageCategory model."""
    page_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PageCategory
        fields = ['id', 'uuid', 'name', 'slug', 'description', 'display_order', 'is_active', 'page_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']
    
    def get_page_count(self, obj):
        """Return count of pages in this category."""
        return obj.pages.count()


class PageCategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing page categories."""
    class Meta:
        model = PageCategory
        fields = ['id', 'uuid', 'name', 'slug', 'display_order', 'is_active']
        read_only_fields = ['id', 'uuid']


class PageSerializer(serializers.ModelSerializer):
    """Serializer for Page model."""
    category = PageCategoryListSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=PageCategory.objects.all(), 
        source='category', 
        write_only=True, 
        allow_null=True
    )
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Page
        fields = [
            'id', 'uuid', 'title', 'slug', 'category', 'category_id', 'author', 'author_username', 
            'author_full_name', 'description', 'featured_image', 'featured_image_url', 'status', 
            'is_featured', 'views_count', 'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uuid', 'author', 'views_count', 'created_at', 'updated_at']
    
    def get_author_full_name(self, obj):
        """Return author's full name or username."""
        if obj.author:
            if obj.author.first_name or obj.author.last_name:
                return f"{obj.author.first_name} {obj.author.last_name}".strip()
            return obj.author.username
        return None
    
    def get_featured_image_url(self, obj):
        """Return full URL for featured image."""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None
    
    def validate_featured_image(self, value):
        """Validate image size (max 50KB)."""
        if value:
            if value.size > 50 * 1024:  # 50KB in bytes
                raise serializers.ValidationError("Image size cannot exceed 50KB.")
        return value
    
    def create(self, validated_data):
        """Set author to current user on create."""
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PageListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing pages."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Page
        fields = [
            'id', 'uuid', 'title', 'slug', 'category_name', 'author_username', 
            'status', 'is_featured', 'views_count', 
            'published_at', 'created_at', 'featured_image_url'
        ]
    
    def get_featured_image_url(self, obj):
        """Return full URL for featured image."""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None


# ========== User Profile Serializers ==========

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    avatar_url = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'title', 'contact_phone', 'business_name', 
            'avatar', 'avatar_url', 'user_email', 'user_first_name', 
            'user_last_name', 'user_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_avatar_url(self, obj):
        """Return full URL for avatar image."""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
    
    def validate_avatar(self, value):
        """Validate avatar file size (max 50KB)."""
        if value:
            # Check file size (50KB = 50 * 1024 bytes)
            max_size = 50 * 1024
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"Avatar file size must be less than 50KB. Current size: {value.size / 1024:.2f}KB"
                )
        return value


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating UserProfile."""
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['title', 'contact_phone', 'business_name', 'avatar', 'first_name', 'last_name']
    
    def validate_avatar(self, value):
        """Validate avatar file size (max 50KB)."""
        if value:
            max_size = 50 * 1024
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"Avatar file size must be less than 50KB. Current size: {value.size / 1024:.2f}KB"
                )
        return value
    
    def validate_title(self, value):
        """Convert empty string to None."""
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value if value else None
        return value
    
    def validate_contact_phone(self, value):
        """Convert empty string to None."""
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value if value else None
        return value
    
    def validate_business_name(self, value):
        """Convert empty string to None."""
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value if value else None
        return value
    
    def validate_first_name(self, value):
        """Convert empty string to None."""
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value if value else None
        return value
    
    def validate_last_name(self, value):
        """Convert empty string to None."""
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value if value else None
        return value
    
    def update(self, instance, validated_data):
        """Update profile and user fields."""
        # Extract user fields first
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        
        # Update user fields if provided (not None and not empty string)
        if first_name is not None or last_name is not None:
            user = instance.user
            if first_name is not None:
                user.first_name = first_name
            if last_name is not None:
                user.last_name = last_name
            user.save()
        
        # Handle avatar separately - it's a file field
        if 'avatar' in validated_data:
            avatar = validated_data.pop('avatar')
            # Delete old avatar if exists and new one is being uploaded
            if avatar and instance.avatar:
                try:
                    instance.avatar.delete(save=False)
                except Exception:
                    pass  # Ignore errors deleting old file
            instance.avatar = avatar
        
        # Update other profile fields - only set if value is not None
        # Empty strings have been converted to None by validation methods
        for attr, value in validated_data.items():
            if value is not None:
                setattr(instance, attr, value)
        
        # Save the instance
        instance.save()
        
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        help_text="New password must be at least 8 characters long."
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        help_text="Must match new password."
    )
    
    def validate_new_password(self, value):
        """Validate password using Django's password validators."""
        validate_password(value)
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match."
            })
        return attrs


class StorySerializer(serializers.ModelSerializer):
    """Serializer for Story model."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    image_url = serializers.SerializerMethodField()
    voice_id = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    scenes = serializers.SerializerMethodField()
    
    def get_voice_id(self, obj):
        """Get voice_id, defaulting to 'Joanna' if field doesn't exist (migration not run yet)."""
        try:
            # Try to get voice_id from the model instance
            # If the column doesn't exist in DB, this will use the model default
            return getattr(obj, 'voice_id', 'Joanna')
        except (AttributeError, Exception):
            return 'Joanna'
    
    class Meta:
        model = Story
        fields = [
            'id', 'user', 'user_name', 'user_email', 'title', 'prompt', 'system_prompt_used',
            'story_text', 'template', 'image', 'image_url', 'image_description', 
            'audio_file', 'audio_url', 'voice_id', 'is_published', 'scenes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'image_description', 'scenes']
    
    def get_image_url(self, obj):
        """Return full URL for image if it exists."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_audio_url(self, obj):
        """Return full URL for audio file if it exists and file is accessible."""
        if obj.audio_file:
            # Verify file actually exists on disk
            import os
            from django.conf import settings
            
            file_path = os.path.join(settings.MEDIA_ROOT, obj.audio_file.name)
            
            # Check if file exists
            if os.path.exists(file_path):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.audio_file.url)
                return obj.audio_file.url
            else:
                # File path in database but file doesn't exist
                # This could be an old path structure - return None to trigger regeneration
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Audio file not found at path: {file_path} for story {obj.id}")
                return None
        return None
    
    def get_scenes(self, obj):
        """Return serialized scenes for this story."""
        scenes = obj.scenes.all().order_by('scene_number')
        # Use StorySceneSerializer defined later in the file
        # Import here to avoid circular dependency
        return [
            {
                'id': str(scene.id),
                'story': str(scene.story.id),
                'scene_number': scene.scene_number,
                'scene_text': scene.scene_text,
                'image_url': self._get_scene_image_url(scene),
                'prompt_used': scene.prompt_used,
                'created_at': scene.created_at.isoformat() if scene.created_at else None,
                'updated_at': scene.updated_at.isoformat() if scene.updated_at else None,
            }
            for scene in scenes
        ]
    
    def _get_scene_image_url(self, scene):
        """Helper to get scene image URL."""
        if scene.image and hasattr(scene.image, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(scene.image.url)
            return scene.image.url
        return None


class StoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing stories."""
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    image_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Story
        fields = [
            'id', 'user', 'user_name', 'title', 'template', 'is_published', 
            'created_at', 'updated_at', 'image_url', 'audio_url'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_audio_url(self, obj):
        """Return full URL for audio file if it exists and file is accessible."""
        if obj.audio_file:
            # Verify file actually exists on disk
            import os
            from django.conf import settings
            
            file_path = os.path.join(settings.MEDIA_ROOT, obj.audio_file.name)
            
            # Check if file exists
            if os.path.exists(file_path):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.audio_file.url)
                return obj.audio_file.url
            else:
                # File path in database but file doesn't exist - return None
                return None
        return None


class StoryRevisionSerializer(serializers.ModelSerializer):
    """Serializer for StoryRevision model."""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StoryRevision
        fields = [
            'id', 'story', 'story_text', 'created_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'story', 'created_at', 'created_by']


class StorySessionSerializer(serializers.ModelSerializer):
    """Serializer for StorySession model."""
    story_title = serializers.CharField(source='story.title', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = StorySession
        fields = [
            'id', 'story', 'story_title', 'user', 'user_name',
            'started_at', 'ended_at', 'duration_seconds', 'duration_formatted',
            'completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_duration_formatted(self, obj):
        """Format duration as MM:SS or HH:MM:SS."""
        if not obj.duration_seconds:
            return None
        
        hours = obj.duration_seconds // 3600
        minutes = (obj.duration_seconds % 3600) // 60
        seconds = obj.duration_seconds % 60
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"


class PlaylistSerializer(serializers.ModelSerializer):
    """Serializer for Playlist model."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    story_count = serializers.SerializerMethodField()
    stories = StoryListSerializer(many=True, read_only=True)
    story_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Story.objects.all(),
        write_only=True,
        required=False,
        source='stories'
    )
    
    class Meta:
        model = Playlist
        fields = [
            'id', 'user', 'user_name', 'name', 'description', 'stories', 'story_ids',
            'story_count', 'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_story_count(self, obj):
        """Return the number of stories in the playlist."""
        return obj.stories.count()
    
    def create(self, validated_data):
        """Create playlist and set user."""
        stories = validated_data.pop('stories', [])
        playlist = Playlist.objects.create(**validated_data)
        if stories:
            playlist.stories.set(stories)
        return playlist
    
    def update(self, instance, validated_data):
        """Update playlist."""
        stories = validated_data.pop('stories', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if stories is not None:
            instance.stories.set(stories)
        return instance


class PlaylistListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing playlists."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    story_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = [
            'id', 'user_name', 'name', 'description', 'story_count',
            'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = fields
    
    def get_story_count(self, obj):
        """Return the number of stories in the playlist."""
        return obj.stories.count()


class StorySessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing story sessions."""
    story_title = serializers.CharField(source='story.title', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = StorySession
        fields = [
            'id', 'story', 'story_title', 'user_name',
            'started_at', 'ended_at', 'duration_seconds', 'duration_formatted',
            'completed'
        ]
        read_only_fields = fields
    
    def get_duration_formatted(self, obj):
        """Format duration as MM:SS or HH:MM:SS."""
        if not obj.duration_seconds:
            return None
        
        hours = obj.duration_seconds // 3600
        minutes = (obj.duration_seconds % 3600) // 60
        seconds = obj.duration_seconds % 60
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"


class UserStorySettingsSerializer(serializers.ModelSerializer):
    """Serializer for UserStorySettings model."""
    
    class Meta:
        model = UserStorySettings
        fields = [
            'id', 'user', 'age_range', 'genre_preference', 'language_level',
            'moral_theme', 'include_diversity', 'include_sensory_details',
            'include_interactive_questions', 'max_word_count', 'story_parts',
            'include_sound_effects', 'explain_complex_words', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate_story_parts(self, value):
        """Ensure story_parts is between 3 and 8."""
        if value < 3 or value > 8:
            raise serializers.ValidationError("Story parts must be between 3 and 8.")
        return value
    
    def validate_max_word_count(self, value):
        """Ensure max_word_count is reasonable."""
        if value < 100 or value > 2000:
            raise serializers.ValidationError("Max word count must be between 100 and 2000.")
        return value


class StorySceneSerializer(serializers.ModelSerializer):
    """Serializer for StoryScene model."""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = StoryScene
        fields = ['id', 'story', 'scene_number', 'scene_text', 'image', 'image_url', 'prompt_used', 'created_at', 'updated_at']
        read_only_fields = ['id', 'story', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        """Return the full URL for the scene image."""
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
