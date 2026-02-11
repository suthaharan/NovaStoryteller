from django.contrib import admin
from .models import Item, Category, Permission, Role, UserRole, UserActivity, Subscription, Plan, Invoice, NewsCategory, News, FAQCategory, FAQ, PageCategory, Page, UserProfile, Story, StorySession, StoryRevision, Playlist, StoryScene


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'codename', 'endpoint', 'method', 'is_active', 'created_at']
    list_filter = ['is_active', 'method', 'created_at']
    search_fields = ['name', 'codename', 'endpoint', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['permissions']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'assigned_at', 'assigned_by']
    list_filter = ['role', 'assigned_at']
    search_fields = ['user__username', 'role__name']
    readonly_fields = ['assigned_at']


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'created_at', 'ip_address']
    list_filter = ['action', 'resource_type', 'created_at']
    search_fields = ['user__username', 'description', 'resource_type']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_months', 'is_popular', 'is_active', 'display_order', 'created_at']
    list_filter = ['is_active', 'is_popular', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date', 'price', 'created_at']
    list_filter = ['plan', 'status', 'created_at']
    search_fields = ['user__username', 'plan__name', 'notes']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'user', 'plan', 'total', 'status', 'due_date', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['invoice_number', 'user__username', 'plan__name']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'status', 'is_featured', 'views_count', 'published_at', 'created_at']
    list_filter = ['status', 'is_featured', 'category', 'created_at', 'published_at']
    search_fields = ['title', 'slug', 'content', 'excerpt']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    filter_horizontal = []
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'category', 'author')
        }),
        ('Content', {
            'fields': ('content', 'excerpt', 'featured_image')
        }),
        ('Status & Settings', {
            'fields': ('status', 'is_featured', 'published_at')
        }),
        ('Statistics', {
            'fields': ('views_count',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(FAQCategory)
class FAQCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'display_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'slug', 'category', 'author', 'status', 'display_order', 'views_count', 'published_at', 'created_at']
    list_filter = ['status', 'category', 'created_at', 'published_at']
    search_fields = ['question', 'answer', 'slug']
    prepopulated_fields = {'slug': ('question',)}
    readonly_fields = ['views_count', 'helpful_count', 'not_helpful_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Basic Information', {
            'fields': ('question', 'slug', 'category', 'author')
        }),
        ('Content', {
            'fields': ('answer',)
        }),
        ('Status & Settings', {
            'fields': ('status', 'display_order', 'published_at')
        }),
        ('Statistics', {
            'fields': ('views_count', 'helpful_count', 'not_helpful_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PageCategory)
class PageCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'display_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'category', 'author', 'status', 'is_featured', 'views_count', 'published_at', 'created_at']
    list_filter = ['status', 'is_featured', 'category', 'created_at', 'published_at']
    search_fields = ['title', 'slug', 'description']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'category', 'author')
        }),
        ('Content', {
            'fields': ('description', 'featured_image')
        }),
        ('Status & Settings', {
            'fields': ('status', 'is_featured', 'published_at')
        }),
        ('Statistics', {
            'fields': ('views_count',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'business_name', 'contact_phone', 'updated_at']
    list_filter = ['updated_at', 'created_at']
    search_fields = ['user__username', 'user__email', 'title', 'business_name', 'contact_phone']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Profile Details', {
            'fields': ('title', 'contact_phone', 'business_name', 'avatar')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'template', 'is_published', 'created_at', 'updated_at']
    list_filter = ['template', 'is_published', 'created_at']
    search_fields = ['title', 'prompt', 'story_text', 'user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'story_text', 'image_description']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'template', 'prompt')
        }),
        ('Story Content', {
            'fields': ('story_text', 'image', 'image_description', 'audio_file')
        }),
        ('Status', {
            'fields': ('is_published',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(StoryRevision)
class StoryRevisionAdmin(admin.ModelAdmin):
    list_display = ['story', 'created_by', 'created_at', 'text_preview']
    list_filter = ['created_at', 'created_by']
    search_fields = ['story__title', 'story_text', 'created_by__username']
    readonly_fields = ['id', 'story', 'created_at', 'created_by']
    date_hierarchy = 'created_at'
    
    def text_preview(self, obj):
        """Show first 100 characters of story text."""
        if obj.story_text:
            return obj.story_text[:100] + '...' if len(obj.story_text) > 100 else obj.story_text
        return '-'
    text_preview.short_description = 'Story Text Preview'


@admin.register(StorySession)
class StorySessionAdmin(admin.ModelAdmin):
    list_display = ['story', 'user', 'started_at', 'ended_at', 'duration_seconds', 'completed', 'created_at']
    list_filter = ['completed', 'started_at', 'created_at']
    search_fields = ['story__title', 'user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'duration_seconds']
    date_hierarchy = 'started_at'
    fieldsets = (
        ('Session Information', {
            'fields': ('story', 'user')
        }),
        ('Timing', {
            'fields': ('started_at', 'ended_at', 'duration_seconds', 'completed')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(StoryScene)
class StorySceneAdmin(admin.ModelAdmin):
    list_display = ['story', 'scene_number', 'created_at']
    list_filter = ['created_at']
    search_fields = ['story__title', 'scene_text', 'prompt_used']
    readonly_fields = ['id', 'story', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Scene Information', {
            'fields': ('story', 'scene_number', 'scene_text')
        }),
        ('Generated Image', {
            'fields': ('image', 'prompt_used')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
