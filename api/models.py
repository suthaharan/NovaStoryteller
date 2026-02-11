from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
import uuid
from .utils import story_image_upload_path, story_audio_upload_path, story_scene_image_upload_path


class Item(models.Model):
    """Example model for API demonstration."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Item'
        verbose_name_plural = 'Items'

    def __str__(self):
        return self.name


class Category(models.Model):
    """Category model for organizing items."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Permission(models.Model):
    """Permission model for endpoint access control."""
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=100, unique=True, help_text="Unique code identifier (e.g., 'view_users', 'manage_roles')")
    description = models.TextField(blank=True)
    endpoint = models.CharField(max_length=200, blank=True, help_text="API endpoint path (e.g., '/api/users/')")
    method = models.CharField(max_length=10, blank=True, choices=[
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE'),
    ], help_text="HTTP method")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'

    def __str__(self):
        return self.name


class Role(models.Model):
    """Role model for grouping permissions."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True, related_name='roles')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name


class UserRole(models.Model):
    """Many-to-many relationship between User and Role."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_roles')

    class Meta:
        unique_together = ['user', 'role']
        ordering = ['-assigned_at']
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'

    def __str__(self):
        return f"{self.user.username} - {self.role.name}"


class UserActivity(models.Model):
    """User activity log model."""
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('download', 'Download'),
        ('upload', 'Upload'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=100, blank=True, help_text="Type of resource (e.g., 'User', 'Role', 'Subscription')")
    resource_id = models.IntegerField(null=True, blank=True, help_text="ID of the resource")
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.created_at}"


class Plan(models.Model):
    """Subscription plan model."""
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_months = models.IntegerField(default=1, help_text="Duration in months (1 for monthly, 12 for yearly)")
    features = models.JSONField(default=list, blank=True, help_text="List of features included in this plan")
    is_popular = models.BooleanField(default=False, help_text="Mark as popular plan")
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0, help_text="Order for display (lower numbers appear first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Plan'
        verbose_name_plural = 'Plans'

    def __str__(self):
        return self.name


class Subscription(models.Model):
    """Subscription model for user subscriptions."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'

    def __str__(self):
        plan_name = self.plan.name if self.plan else 'No Plan'
        return f"{self.user.username} - {plan_name} - {self.status}"


class Invoice(models.Model):
    """Invoice model for subscription invoices."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('other', 'Other'),
    ]
    
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name='invoices')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    due_date = models.DateTimeField(null=True, blank=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Invoice notes or terms")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.user.username}"


# ========== Image Upload Path Functions ==========

def news_image_upload_path(instance, filename):
    """Generate upload path for news images: yy/mm/news-uuid.extension"""
    import uuid
    from datetime import datetime
    ext = filename.split('.')[-1]
    year_month = datetime.now().strftime('%y/%m')
    unique_id = str(uuid.uuid4())
    return f'news/{year_month}/news-{unique_id}.{ext}'


def page_image_upload_path(instance, filename):
    """Generate upload path for page images: yy/mm/page-uuid.extension"""
    import uuid
    from datetime import datetime
    ext = filename.split('.')[-1]
    year_month = datetime.now().strftime('%y/%m')
    unique_id = str(uuid.uuid4())
    return f'pages/{year_month}/page-{unique_id}.{ext}'


def user_avatar_upload_path(instance, filename):
    """Generate upload path for user avatars: yy/mm/media-uuid.extension"""
    import uuid
    from datetime import datetime
    ext = filename.split('.')[-1]
    year_month = datetime.now().strftime('%y/%m')
    unique_id = str(uuid.uuid4())
    return f'media/{year_month}/media-{unique_id}.{ext}'


# ========== News Management Models ==========

class NewsCategory(models.Model):
    """Category model for organizing news articles."""
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-friendly identifier")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'News Category'
        verbose_name_plural = 'News Categories'

    def __str__(self):
        return self.name


class News(models.Model):
    """News article model."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, help_text="URL-friendly identifier")
    category = models.ForeignKey(NewsCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='news_items')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='authored_news')
    content = models.TextField(help_text="Full article content")
    excerpt = models.TextField(blank=True, max_length=500, help_text="Short summary (max 500 characters)")
    featured_image = models.ImageField(upload_to=news_image_upload_path, blank=True, null=True, help_text="Featured image (max 50KB)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False, help_text="Feature this news on homepage")
    views_count = models.IntegerField(default=0, help_text="Number of times this news has been viewed")
    published_at = models.DateTimeField(null=True, blank=True, help_text="Publication date and time")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'News'
        verbose_name_plural = 'News'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-published_at']),
            models.Index(fields=['category', '-created_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Auto-set published_at when status changes to published."""
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


# ========== FAQ Management Models ==========

class FAQCategory(models.Model):
    """Category model for organizing FAQs."""
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-friendly identifier")
    description = models.TextField(blank=True)
    display_order = models.IntegerField(default=0, help_text="Order for display (lower numbers appear first)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'FAQ Category'
        verbose_name_plural = 'FAQ Categories'

    def __str__(self):
        return self.name


class FAQ(models.Model):
    """FAQ (Frequently Asked Question) model."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    question = models.CharField(max_length=500)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True, help_text="URL-friendly identifier")
    answer = models.TextField(help_text="Detailed answer to the question")
    category = models.ForeignKey(FAQCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='faq_items')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='authored_faqs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    display_order = models.IntegerField(default=0, help_text="Order for display within category (lower numbers appear first)")
    views_count = models.IntegerField(default=0, help_text="Number of times this FAQ has been viewed")
    helpful_count = models.IntegerField(default=0, help_text="Number of users who found this helpful")
    not_helpful_count = models.IntegerField(default=0, help_text="Number of users who did not find this helpful")
    published_at = models.DateTimeField(null=True, blank=True, help_text="Publication date and time")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-published_at']),
            models.Index(fields=['category', 'display_order']),
        ]

    def __str__(self):
        return self.question

    def save(self, *args, **kwargs):
        """Auto-set published_at when status changes to published and generate slug from question if not set."""
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        if not self.slug:
            from django.utils.text import slugify
            # Generate slug from question, limiting to 255 chars for MySQL compatibility
            base_slug = slugify(self.question[:200])  # Limit to 200 chars to leave room for counter suffix
            if len(base_slug) > 240:  # Ensure we have room for counter
                base_slug = base_slug[:240]
            slug = base_slug
            counter = 1
            while FAQ.objects.filter(slug=slug).exclude(pk=self.pk if self.pk else None).exists():
                slug = f"{base_slug}-{counter}"
                if len(slug) > 255:  # Truncate if still too long
                    slug = slug[:255]
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


# ========== Page Management Models ==========

class PageCategory(models.Model):
    """Category model for organizing pages."""
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-friendly identifier")
    description = models.TextField(blank=True)
    display_order = models.IntegerField(default=0, help_text="Order for display (lower numbers appear first)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Page Category'
        verbose_name_plural = 'Page Categories'

    def __str__(self):
        return self.name


class Page(models.Model):
    """Page model for static content pages."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, help_text="URL-friendly identifier")
    category = models.ForeignKey(PageCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='pages')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='authored_pages')
    description = models.TextField(help_text="Page content (rich text)")
    featured_image = models.ImageField(upload_to=page_image_upload_path, blank=True, null=True, help_text="Featured image (max 50KB)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False, help_text="Feature this page on homepage")
    views_count = models.IntegerField(default=0, help_text="Number of times this page has been viewed")
    published_at = models.DateTimeField(null=True, blank=True, help_text="Publication date and time")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Page'
        verbose_name_plural = 'Pages'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-published_at']),
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Auto-set published_at when status changes to published."""
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


# ========== User Profile Model ==========

class UserProfile(models.Model):
    """Extended user profile information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    title = models.CharField(max_length=100, blank=True, help_text="User's title (e.g., Mr., Mrs., Dr.)")
    contact_phone = models.CharField(max_length=20, blank=True, help_text="Contact phone number")
    business_name = models.CharField(max_length=200, blank=True, help_text="Business or company name")
    avatar = models.ImageField(upload_to=user_avatar_upload_path, blank=True, null=True, help_text="User avatar image")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Story(models.Model):
    """Story model for storing user-generated stories with Nova AI integration."""
    STORY_TEMPLATES = [
        ('adventure', 'Adventure'),
        ('fantasy', 'Fantasy'),
        ('sci-fi', 'Science Fiction'),
        ('mystery', 'Mystery'),
        ('educational', 'Educational'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='stories',
        help_text="User who created this story"
    )
    title = models.CharField(
        max_length=200,
        help_text="Story title"
    )
    prompt = models.TextField(
        help_text="User's initial story prompt"
    )
    system_prompt_used = models.TextField(
        blank=True,
        help_text="Full system prompt used for story generation (includes template and user settings)"
    )
    story_text = models.TextField(
        blank=True,
        help_text="Generated story text from Nova AI"
    )
    template = models.CharField(
        max_length=20,
        choices=STORY_TEMPLATES,
        default='adventure',
        help_text="Story template type"
    )
    image = models.ImageField(
        upload_to=story_image_upload_path,
        null=True,
        blank=True,
        help_text="Optional uploaded image for story (stored in YYYY/MM/<story-id>/)"
    )
    image_description = models.TextField(
        blank=True,
        help_text="AI-generated image description from Titan Embeddings"
    )
    audio_file = models.FileField(
        upload_to=story_audio_upload_path,
        null=True,
        blank=True,
        help_text="Generated audio file from Nova 2 Sonic (stored in YYYY/MM/<story-id>/)"
    )
    voice_id = models.CharField(
        max_length=50,
        default='Joanna',
        help_text="Amazon Polly voice ID for narration (e.g., Joanna, Matthew, Ivy)"
    )
    is_published = models.BooleanField(
        default=False,
        help_text="Whether the story is published/public"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Story'
        verbose_name_plural = 'Stories'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['template', '-created_at']),
            models.Index(fields=['is_published', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} by {self.user.username}"


class StoryRevision(models.Model):
    """Model to store revision history of story edits."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE,
        related_name='revisions',
        help_text="Story this revision belongs to"
    )
    story_text = models.TextField(
        help_text="Story text at this revision"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='story_revisions',
        help_text="User who created this revision"
    )
    
    class Meta:
        verbose_name = "Story Revision"
        verbose_name_plural = "Story Revisions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['story', '-created_at'], name='story_rev_story_created_idx'),
        ]
    
    def __str__(self):
        return f"Revision of {self.story.title} at {self.created_at}"


class StoryScene(models.Model):
    """Model to store generated scene images for stories."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE,
        related_name='scenes',
        help_text="Story this scene belongs to"
    )
    scene_number = models.IntegerField(
        help_text="Scene number/order (1, 2, 3, etc.)"
    )
    scene_text = models.TextField(
        help_text="Text content for this scene (extracted from story transcript)"
    )
    image = models.ImageField(
        upload_to=story_scene_image_upload_path,
        null=True,
        blank=True,
        help_text="Generated portrait image for this scene (stored in YYYY/MM/<story-id>/scenes/)"
    )
    prompt_used = models.TextField(
        blank=True,
        help_text="Image generation prompt used to create this scene"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Story Scene"
        verbose_name_plural = "Story Scenes"
        ordering = ['story', 'scene_number']
        unique_together = [['story', 'scene_number']]
        indexes = [
            models.Index(fields=['story', 'scene_number']),
        ]
    
    def __str__(self):
        return f"Scene {self.scene_number} of {self.story.title}"


class Playlist(models.Model):
    """Playlist model for organizing user's stories."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='playlists',
        help_text="User who created this playlist"
    )
    name = models.CharField(
        max_length=200,
        help_text="Playlist name"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional playlist description"
    )
    stories = models.ManyToManyField(
        Story,
        related_name='playlists',
        blank=True,
        help_text="Stories in this playlist"
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Whether the playlist is public (visible to all users)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Playlist'
        verbose_name_plural = 'Playlists'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_public', '-created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class UserStorySettings(models.Model):
    """User settings for story generation that apply to all stories created by the user."""
    
    AGE_RANGES = [
        ('3-5', '3-5 years (Simple tales, 200-300 words)'),
        ('6-8', '6-8 years (Adventures with lessons, 400-500 words)'),
        ('9-12', '9-12 years (Complex plots, 600-700 words)'),
    ]
    
    GENRE_PREFERENCES = [
        ('fantasy', 'Fantasy'),
        ('adventure', 'Adventure'),
        ('sci-fi', 'Science Fiction'),
        ('mystery', 'Mystery'),
        ('educational', 'Educational'),
        ('mixed', 'Mixed (Fantasy, Adventure, Real-world)'),
    ]
    
    LANGUAGE_LEVELS = [
        ('simple', 'Simple (Basic words, short sentences)'),
        ('moderate', 'Moderate (Some complexity, explain new words)'),
        ('advanced', 'Advanced (Rich vocabulary, complex sentences)'),
    ]
    
    MORAL_THEMES = [
        ('friendship', 'Friendship'),
        ('kindness', 'Kindness'),
        ('bravery', 'Bravery'),
        ('curiosity', 'Curiosity'),
        ('teamwork', 'Teamwork'),
        ('growth', 'Growth & Learning'),
        ('empathy', 'Empathy'),
        ('mixed', 'Mixed (Various positive themes)'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='story_settings',
        help_text="User these settings belong to"
    )
    
    # Age and content settings
    age_range = models.CharField(
        max_length=10,
        choices=AGE_RANGES,
        default='6-8',
        help_text="Target age range for stories (affects length and complexity)"
    )
    
    genre_preference = models.CharField(
        max_length=20,
        choices=GENRE_PREFERENCES,
        default='mixed',
        help_text="Preferred genre mix for stories"
    )
    
    language_level = models.CharField(
        max_length=20,
        choices=LANGUAGE_LEVELS,
        default='moderate',
        help_text="Language complexity level"
    )
    
    # Content preferences
    moral_theme = models.CharField(
        max_length=20,
        choices=MORAL_THEMES,
        default='mixed',
        help_text="Preferred moral themes in stories"
    )
    
    include_diversity = models.BooleanField(
        default=True,
        help_text="Include diverse characters from different backgrounds and abilities"
    )
    
    include_sensory_details = models.BooleanField(
        default=True,
        help_text="Add sensory details (sights, sounds) to make stories more engaging"
    )
    
    include_interactive_questions = models.BooleanField(
        default=True,
        help_text="Add questions mid-story to pause for user input"
    )
    
    max_word_count = models.IntegerField(
        default=800,
        help_text="Maximum word count for stories (default: 800)"
    )
    
    # Story structure
    story_parts = models.IntegerField(
        default=5,
        help_text="Number of story parts/sections (default: 5, range: 3-8)"
    )
    
    # Additional preferences
    include_sound_effects = models.BooleanField(
        default=True,
        help_text="Include sound effects in stories (e.g., 'Whoosh!', 'Bang!')"
    )
    
    explain_complex_words = models.BooleanField(
        default=True,
        help_text="Explain complex words in simple terms for younger readers"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Story Settings'
        verbose_name_plural = 'User Story Settings'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Story Settings for {self.user.username}"
    
    def get_system_prompt_presets(self):
        """Generate preset string for system prompt based on user settings."""
        presets = []
        
        # Age range and length
        age_info = {
            '3-5': '200-300 words, basic words, short sentences',
            '6-8': '400-500 words, introduce morals, engaging challenges',
            '9-12': '600-700 words, encourage critical thinking, deeper themes'
        }
        presets.append(f"- Length: {age_info.get(self.age_range, '400-500 words')}")
        
        # Genre
        genre_info = {
            'fantasy': 'Fantasy elements (magic, wizards, dragons)',
            'adventure': 'Adventure elements (quests, treasure, exploration)',
            'sci-fi': 'Science fiction elements (space, robots, technology)',
            'mystery': 'Mystery elements (clues, puzzles, detective work)',
            'educational': 'Educational elements (facts, learning moments)',
            'mixed': 'Mix fantasy, adventure, and real-world elements'
        }
        presets.append(f"- Genre: {genre_info.get(self.genre_preference, 'Mixed')}")
        
        # Moral theme
        if self.moral_theme != 'mixed':
            presets.append(f"- Moral: Always end with a positive lesson on {self.moral_theme}")
        else:
            presets.append("- Moral: Always end with a positive lesson on empathy, teamwork, or growth")
        
        # Diversity
        if self.include_diversity:
            presets.append("- Diversity: Include diverse characters from different backgrounds and abilities")
        
        # Engagement
        if self.include_sensory_details:
            presets.append("- Engagement: Add sensory details (sights, sounds) to make stories vivid")
        
        if self.include_interactive_questions:
            presets.append("- Engagement: Add questions mid-story to pause for user input")
        
        # Language level
        language_info = {
            'simple': 'Use simple words; explain any complex ones',
            'moderate': 'Use moderate vocabulary; explain complex terms',
            'advanced': 'Use rich vocabulary; provide context for complex terms'
        }
        presets.append(f"- Language Level: {language_info.get(self.language_level, 'Moderate')}")
        
        # Sound effects
        if self.include_sound_effects:
            presets.append("- Style: Include sound effects (e.g., 'Whoosh!', 'Bang!') for excitement")
        
        return "\n".join(presets)


class StorySession(models.Model):
    """Model for tracking story listening sessions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE,
        related_name='sessions',
        help_text="Story that was listened to"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='story_sessions',
        help_text="User who listened to the story"
    )
    started_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the listening session started"
    )
    ended_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the listening session ended"
    )
    duration_seconds = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration of the session in seconds"
    )
    completed = models.BooleanField(
        default=False,
        help_text="Whether the story was listened to completion"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Story Session'
        verbose_name_plural = 'Story Sessions'
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['story', '-started_at']),
            models.Index(fields=['-started_at']),
        ]

    def __str__(self):
        return f"Session for {self.story.title} by {self.user.username} at {self.started_at}"
    
    def calculate_duration(self):
        """Calculate duration in seconds if ended_at is set."""
        if self.ended_at and self.started_at:
            delta = self.ended_at - self.started_at
            return int(delta.total_seconds())
        return None
    
    def save(self, *args, **kwargs):
        """Auto-calculate duration before saving."""
        if self.ended_at and self.started_at:
            self.duration_seconds = self.calculate_duration()
        super().save(*args, **kwargs)
