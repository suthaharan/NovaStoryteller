"""
Management command to seed initial data for all models and endpoints.

This command creates sample data for:
- Users (Admin, Staff, Regular) - all with password "password"
- Permissions, Roles, UserRoles
- Items, Categories
- Plans, Subscriptions, Invoices
- News, NewsCategories
- FAQs, FAQCategories
- Pages, PageCategories
- UserProfiles
- Stories (Nova Storyteller)

Run with: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.text import slugify
from datetime import timedelta
from api.models import (
    Item, Category, Permission, Role, UserRole, UserActivity, Subscription, Plan, Invoice,
    NewsCategory, News, FAQCategory, FAQ, PageCategory, Page, UserProfile,
    Story
)


class Command(BaseCommand):
    help = 'Seed initial data for all models and endpoints (Users, Stories, News, FAQs, etc.)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))
        
        # Create Users
        self.stdout.write('Creating Users...')
        users_data = [
            # Staff/Admin users
            {'username': 'admin', 'email': 'admin@test.com', 'first_name': 'Admin', 'last_name': 'User', 'is_staff': True, 'is_superuser': True},
            {'username': 'staff1', 'email': 'staff1@test.com', 'first_name': 'Staff', 'last_name': 'One', 'is_staff': True, 'is_superuser': False},
            {'username': 'staff2', 'email': 'staff2@test.com', 'first_name': 'Staff', 'last_name': 'Two', 'is_staff': True, 'is_superuser': False},
            # Regular users
            {'username': 'user1', 'email': 'user1@test.com', 'first_name': 'John', 'last_name': 'Doe', 'is_staff': False, 'is_superuser': False},
            {'username': 'user2', 'email': 'user2@test.com', 'first_name': 'Jane', 'last_name': 'Smith', 'is_staff': False, 'is_superuser': False},
            {'username': 'user3', 'email': 'user3@test.com', 'first_name': 'Bob', 'last_name': 'Johnson', 'is_staff': False, 'is_superuser': False},
            {'username': 'user4', 'email': 'user4@test.com', 'first_name': 'Alice', 'last_name': 'Williams', 'is_staff': False, 'is_superuser': False},
            {'username': 'user5', 'email': 'user5@test.com', 'first_name': 'Charlie', 'last_name': 'Brown', 'is_staff': False, 'is_superuser': False},
        ]
        
        created_users = []
        for user_data in users_data:
            password = 'password'  # Default password for all users
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_staff': user_data['is_staff'],
                    'is_superuser': user_data['is_superuser'],
                    'is_active': True
                }
            )
            if created:
                user.set_password(password)
                user.save()
                created_users.append(user)
                user_type = 'Admin' if user.is_superuser else ('Staff' if user.is_staff else 'User')
                self.stdout.write(f'  Created {user_type} user: {user.username} ({user.email})')
            else:
                # Update password if user already exists
                user.set_password(password)
                user.save()
                created_users.append(user)
                user_type = 'Admin' if user.is_superuser else ('Staff' if user.is_staff else 'User')
                self.stdout.write(f'  Updated password for existing {user_type} user: {user.username} ({user.email})')
        
        # Create Permissions
        self.stdout.write('Creating Permissions...')
        permissions_data = [
            {
                'name': 'View Users',
                'codename': 'view_users',
                'description': 'Can view user list and details',
                'endpoint': '/api/users/',
                'method': 'GET',
            },
            {
                'name': 'Manage Users',
                'codename': 'manage_users',
                'description': 'Can create, update, and delete users',
                'endpoint': '/api/users/',
                'method': 'POST',
            },
            {
                'name': 'View Roles',
                'codename': 'view_roles',
                'description': 'Can view roles list and details',
                'endpoint': '/api/roles/',
                'method': 'GET',
            },
            {
                'name': 'Manage Roles',
                'codename': 'manage_roles',
                'description': 'Can create, update, and delete roles',
                'endpoint': '/api/roles/',
                'method': 'POST',
            },
            {
                'name': 'View Permissions',
                'codename': 'view_permissions',
                'description': 'Can view permissions list and details',
                'endpoint': '/api/permissions/',
                'method': 'GET',
            },
            {
                'name': 'Manage Permissions',
                'codename': 'manage_permissions',
                'description': 'Can create, update, and delete permissions',
                'endpoint': '/api/permissions/',
                'method': 'POST',
            },
            {
                'name': 'View Subscriptions',
                'codename': 'view_subscriptions',
                'description': 'Can view subscriptions list and details',
                'endpoint': '/api/subscriptions/',
                'method': 'GET',
            },
            {
                'name': 'Manage Subscriptions',
                'codename': 'manage_subscriptions',
                'description': 'Can create, update, and delete subscriptions',
                'endpoint': '/api/subscriptions/',
                'method': 'POST',
            },
            {
                'name': 'View User Activities',
                'codename': 'view_user_activities',
                'description': 'Can view user activity logs',
                'endpoint': '/api/user-activities/',
                'method': 'GET',
            },
            {
                'name': 'View Reports',
                'codename': 'view_reports',
                'description': 'Can view system reports',
                'endpoint': '/api/reports/',
                'method': 'GET',
            },
        ]
        
        created_permissions = []
        for perm_data in permissions_data:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                defaults=perm_data
            )
            created_permissions.append(permission)
            if created:
                self.stdout.write(f'  Created permission: {permission.name}')
        
        # Create Roles
        self.stdout.write('Creating Roles...')
        roles_data = [
            {
                'name': 'Superuser',
                'description': 'Full system access - can manage all users, roles, permissions, and view all reports',
                'permissions': created_permissions,  # All permissions
            },
            {
                'name': 'Staff',
                'description': 'Can manage users and subscriptions, view reports',
                'permissions': [
                    p for p in created_permissions 
                    if p.codename in ['view_users', 'manage_users', 'view_subscriptions', 
                                     'manage_subscriptions', 'view_user_activities', 'view_reports']
                ],
            },
            {
                'name': 'User Manager',
                'description': 'Can view and manage users',
                'permissions': [
                    p for p in created_permissions 
                    if p.codename in ['view_users', 'manage_users', 'view_user_activities']
                ],
            },
            {
                'name': 'Subscription Manager',
                'description': 'Can view and manage subscriptions',
                'permissions': [
                    p for p in created_permissions 
                    if p.codename in ['view_subscriptions', 'manage_subscriptions']
                ],
            },
        ]
        
        created_roles = []
        for role_data in roles_data:
            permissions = role_data.pop('permissions')
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            # Add permissions to role
            role.permissions.set(permissions)
            created_roles.append(role)
            if created:
                self.stdout.write(f'  Created role: {role.name} with {len(permissions)} permissions')
        
        # Assign roles to existing users
        self.stdout.write('Assigning roles to users...')
        superuser_role = next((r for r in created_roles if r.name == 'Superuser'), None)
        staff_role = next((r for r in created_roles if r.name == 'Staff'), None)
        
        if superuser_role:
            superusers = User.objects.filter(is_superuser=True)
            for user in superusers:
                UserRole.objects.get_or_create(
                    user=user,
                    role=superuser_role,
                    defaults={'assigned_by': user}
                )
                self.stdout.write(f'  Assigned Superuser role to: {user.username}')
        
        if staff_role:
            staff_users = User.objects.filter(is_staff=True, is_superuser=False)
            for user in staff_users:
                UserRole.objects.get_or_create(
                    user=user,
                    role=staff_role,
                    defaults={'assigned_by': user}
                )
                self.stdout.write(f'  Assigned Staff role to: {user.username}')
        
        # Create sample User Activities
        self.stdout.write('Creating sample User Activities...')
        users = list(User.objects.all()[:5])  # Get first 5 users
        actions = ['login', 'logout', 'view', 'create', 'update', 'delete']
        resource_types = ['User', 'Role', 'Permission', 'Subscription']
        
        if not users:
            self.stdout.write(self.style.WARNING('  No users found. Skipping user activities creation.'))
        else:
            activity_count = 0
            for i in range(50):  # Create 50 sample activities
                user = users[i % len(users)]
                
                UserActivity.objects.create(
                    user=user,
                    action=actions[i % len(actions)],
                    resource_type=resource_types[i % len(resource_types)],
                    resource_id=i % 10 + 1,
                    description=f'Sample activity {i+1}: {actions[i % len(actions)]} {resource_types[i % len(resource_types)]}',
                    ip_address=f'192.168.1.{i % 255}',
                    user_agent=f'Mozilla/5.0 (Sample Browser {i})',
                    created_at=timezone.now() - timedelta(days=i % 30, hours=i % 24)
                )
                activity_count += 1
            
            self.stdout.write(f'  Created {activity_count} sample user activities')
        
        # Create sample Subscriptions
        self.stdout.write('Creating sample Subscriptions...')
        users_list = list(User.objects.all()[:10])  # Create subscriptions for first 10 users
        plan_names = ['Basic', 'Premium', 'Enterprise']
        statuses = ['active', 'inactive', 'cancelled', 'expired']
        
        if not users_list:
            self.stdout.write(self.style.WARNING('  No users found. Skipping subscriptions creation.'))
        else:
            # Get or create Plan objects
            plan_objects = []
            for plan_name in plan_names:
                plan, created = Plan.objects.get_or_create(
                    name=plan_name,
                    defaults={
                        'description': f'{plan_name} plan',
                        'price': 9.99 if plan_name == 'Basic' else (29.99 if plan_name == 'Premium' else 99.99),
                        'duration_months': 1,
                        'is_active': True
                    }
                )
                plan_objects.append(plan)
                if created:
                    self.stdout.write(f'  Created plan: {plan.name}')
            
            for i, user in enumerate(users_list):
                plan = plan_objects[i % len(plan_objects)]
                subscription_status = statuses[i % len(statuses)]
                start_date = timezone.now() - timedelta(days=30 * (i % 6))
                end_date = start_date + timedelta(days=30 * plan.duration_months) if subscription_status == 'active' else None
                
                Subscription.objects.get_or_create(
                    user=user,
                    defaults={
                        'plan': plan,
                        'status': subscription_status,
                        'start_date': start_date,
                        'end_date': end_date,
                        'price': plan.price,
                        'notes': f'Sample subscription for {user.username}'
                    }
                )
                self.stdout.write(f'  Created subscription for: {user.username} ({plan.name})')
        
        # Create News Categories
        self.stdout.write('Creating News Categories...')
        news_categories_data = [
            {'name': 'Technology', 'description': 'Latest technology news and updates'},
            {'name': 'Business', 'description': 'Business news and market updates'},
            {'name': 'Health', 'description': 'Health and wellness news'},
            {'name': 'Education', 'description': 'Educational news and updates'},
            {'name': 'Sports', 'description': 'Sports news and updates'},
        ]
        
        created_news_categories = []
        for cat_data in news_categories_data:
            category, created = NewsCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'slug': slugify(cat_data['name']),
                    'description': cat_data['description'],
                    'is_active': True
                }
            )
            created_news_categories.append(category)
            if created:
                self.stdout.write(f'  Created news category: {category.name}')
        
        # Create sample News articles
        self.stdout.write('Creating sample News articles...')
        staff_users = list(User.objects.filter(is_staff=True)[:3])
        if not staff_users:
            self.stdout.write(self.style.WARNING('  No staff users found. Skipping news creation.'))
        else:
            news_titles = [
                'New AI Technology Revolutionizes Healthcare',
                'Global Markets See Significant Growth',
                'Breakthrough in Renewable Energy Solutions',
                'Education System Adopts Digital Learning',
                'Major Sports Event Breaks Viewership Records',
                'Tech Company Announces New Product Line',
                'Healthcare Initiative Improves Patient Outcomes',
                'Business Leaders Discuss Future Trends',
            ]
            
            news_content_samples = [
                'In a groundbreaking development, artificial intelligence technology is transforming healthcare delivery. The new system enables faster diagnosis and personalized treatment plans.',
                'Global financial markets experienced unprecedented growth this quarter, with major indices reaching new highs. Analysts attribute this to strong economic fundamentals.',
                'Scientists have made significant progress in renewable energy technology, developing more efficient solar panels and wind turbines that could revolutionize the energy sector.',
                'Educational institutions worldwide are embracing digital learning platforms, providing students with flexible and accessible learning opportunities.',
                'The recent international sports championship broke all previous viewership records, demonstrating the global appeal of competitive sports.',
                'A leading technology company has unveiled its latest product line, featuring cutting-edge innovations in mobile devices and computing.',
                'A comprehensive healthcare initiative has shown remarkable results in improving patient outcomes and reducing healthcare costs.',
                'Prominent business leaders gathered to discuss emerging trends and strategies for navigating the evolving business landscape.',
            ]
            
            for i, title in enumerate(news_titles):
                category = created_news_categories[i % len(created_news_categories)]
                author = staff_users[i % len(staff_users)]
                status_choices = ['draft', 'published', 'published', 'published']  # More published than draft
                status = status_choices[i % len(status_choices)]
                published_at = timezone.now() - timedelta(days=i % 30) if status == 'published' else None
                
                news, created = News.objects.get_or_create(
                    title=title,
                    defaults={
                        'slug': slugify(title),
                        'category': category,
                        'author': author,
                        'content': news_content_samples[i % len(news_content_samples)] * 2,  # Make content longer
                        'excerpt': news_content_samples[i % len(news_content_samples)][:200],
                        'status': status,
                        'is_featured': i < 2,  # First 2 are featured
                        'published_at': published_at,
                        'views_count': (i % 100) * 10
                    }
                )
                if created:
                    self.stdout.write(f'  Created news: {news.title}')
        
        # Create FAQ Categories
        self.stdout.write('Creating FAQ Categories...')
        faq_categories_data = [
            {'name': 'General', 'description': 'General questions and answers', 'display_order': 1},
            {'name': 'Account', 'description': 'Account-related questions', 'display_order': 2},
            {'name': 'Billing', 'description': 'Billing and payment questions', 'display_order': 3},
            {'name': 'Technical', 'description': 'Technical support questions', 'display_order': 4},
            {'name': 'Features', 'description': 'Questions about features and functionality', 'display_order': 5},
        ]
        
        created_faq_categories = []
        for cat_data in faq_categories_data:
            category, created = FAQCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'slug': slugify(cat_data['name']),
                    'description': cat_data['description'],
                    'display_order': cat_data['display_order'],
                    'is_active': True
                }
            )
            created_faq_categories.append(category)
            if created:
                self.stdout.write(f'  Created FAQ category: {category.name}')
        
        # Create sample FAQs
        self.stdout.write('Creating sample FAQs...')
        if not staff_users:
            self.stdout.write(self.style.WARNING('  No staff users found. Skipping FAQ creation.'))
        else:
            faq_questions = [
                'How do I create an account?',
                'What payment methods do you accept?',
                'How can I reset my password?',
                'What are the system requirements?',
                'How do I cancel my subscription?',
                'Can I change my plan?',
                'How do I contact support?',
                'What features are included in the free plan?',
                'How secure is my data?',
                'Can I export my data?',
            ]
            
            faq_answers = [
                'To create an account, click on the "Sign Up" button on the homepage, fill in your details, and verify your email address.',
                'We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our payment gateway.',
                'To reset your password, click on "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your email.',
                'Our system works on all modern web browsers including Chrome, Firefox, Safari, and Edge. No additional software installation is required.',
                'You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.',
                'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
                'You can contact our support team through the support portal, email, or live chat. We typically respond within 24 hours.',
                'The free plan includes basic features such as account creation, limited storage, and community support.',
                'We use industry-standard encryption and security measures to protect your data. All data is stored securely and backed up regularly.',
                'Yes, you can export your data at any time from your account settings. Data is exported in a standard format for easy import elsewhere.',
            ]
            
            for i, question in enumerate(faq_questions):
                category = created_faq_categories[i % len(created_faq_categories)]
                author = staff_users[i % len(staff_users)]
                status_choices = ['draft', 'published', 'published', 'published']
                status = status_choices[i % len(status_choices)]
                published_at = timezone.now() - timedelta(days=i % 30) if status == 'published' else None
                
                faq, created = FAQ.objects.get_or_create(
                    question=question,
                    defaults={
                        'answer': faq_answers[i],
                        'category': category,
                        'author': author,
                        'status': status,
                        'display_order': i + 1,
                        'published_at': published_at,
                        'views_count': (i % 50) * 5,
                        'helpful_count': (i % 20) * 2,
                        'not_helpful_count': i % 5
                    }
                )
                if created:
                    self.stdout.write(f'  Created FAQ: {faq.question}')
        
        # Create Page Categories
        self.stdout.write('Creating Page Categories...')
        page_categories_data = [
            {'name': 'About', 'description': 'About us and company information', 'display_order': 1},
            {'name': 'Services', 'description': 'Service-related pages', 'display_order': 2},
            {'name': 'Support', 'description': 'Support and help pages', 'display_order': 3},
            {'name': 'Legal', 'description': 'Legal and policy pages', 'display_order': 4},
            {'name': 'Resources', 'description': 'Resource and documentation pages', 'display_order': 5},
        ]
        
        created_page_categories = []
        for cat_data in page_categories_data:
            category, created = PageCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'slug': slugify(cat_data['name']),
                    'description': cat_data['description'],
                    'display_order': cat_data['display_order'],
                    'is_active': True
                }
            )
            created_page_categories.append(category)
            if created:
                self.stdout.write(f'  Created page category: {category.name}')
        
        # Create sample Pages
        self.stdout.write('Creating sample Pages...')
        if not staff_users:
            self.stdout.write(self.style.WARNING('  No staff users found. Skipping page creation.'))
        else:
            page_titles = [
                'About Us',
                'Our Services',
                'Contact Us',
                'Privacy Policy',
                'Terms of Service',
                'Help Center',
                'Documentation',
                'Getting Started Guide',
            ]
            
            page_content_samples = [
                '<h2>About Our Company</h2><p>We are a leading technology company dedicated to providing innovative solutions for businesses worldwide. Our mission is to empower organizations with cutting-edge tools and services that drive growth and success.</p><p>Founded in 2010, we have grown from a small startup to a global enterprise serving thousands of clients across multiple industries.</p>',
                '<h2>Our Services</h2><p>We offer a comprehensive range of services designed to meet your business needs:</p><ul><li>Cloud Solutions</li><li>Data Analytics</li><li>Consulting Services</li><li>Technical Support</li></ul><p>Our team of experts is committed to delivering exceptional results.</p>',
                '<h2>Get in Touch</h2><p>We would love to hear from you. Contact us through any of the following channels:</p><p><strong>Email:</strong> support@example.com</p><p><strong>Phone:</strong> +1 (555) 123-4567</p><p><strong>Address:</strong> 123 Business Street, City, State 12345</p>',
                '<h2>Privacy Policy</h2><p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.</p><p>We are committed to protecting your privacy and ensuring the security of your data. We comply with all applicable data protection regulations.</p>',
                '<h2>Terms of Service</h2><p>By using our services, you agree to the following terms and conditions:</p><ol><li>You must be at least 18 years old to use our services</li><li>You are responsible for maintaining the confidentiality of your account</li><li>You agree not to misuse our services</li></ol>',
                '<h2>Help Center</h2><p>Welcome to our help center. Here you can find answers to common questions and get assistance with using our platform.</p><p>Browse our knowledge base, watch tutorial videos, or contact our support team for personalized help.</p>',
                '<h2>Documentation</h2><p>Comprehensive documentation for developers and users. Find detailed guides, API references, and code examples.</p><p>Our documentation is regularly updated to reflect the latest features and improvements.</p>',
                '<h2>Getting Started</h2><p>Welcome! This guide will help you get started with our platform:</p><ol><li>Create your account</li><li>Complete your profile</li><li>Explore the features</li><li>Start using our services</li></ol>',
            ]
            
            for i, title in enumerate(page_titles):
                category = created_page_categories[i % len(created_page_categories)]
                author = staff_users[i % len(staff_users)]
                status_choices = ['draft', 'published', 'published', 'published']
                status = status_choices[i % len(status_choices)]
                published_at = timezone.now() - timedelta(days=i % 30) if status == 'published' else None
                
                page, created = Page.objects.get_or_create(
                    title=title,
                    defaults={
                        'slug': slugify(title),
                        'category': category,
                        'author': author,
                        'description': page_content_samples[i % len(page_content_samples)],
                        'status': status,
                        'is_featured': i < 2,
                        'published_at': published_at,
                        'views_count': (i % 100) * 10
                    }
                )
                if created:
                    self.stdout.write(f'  Created page: {page.title}')
        
        # Create User Profiles for all users
        self.stdout.write('Creating User Profiles...')
        all_users = User.objects.all()
        profile_count = 0
        titles = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
        business_names = ['Tech Corp', 'Business Solutions', 'Global Enterprises', 'Innovation Labs', 'Digital Services']
        
        for i, user in enumerate(all_users):
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'title': titles[i % len(titles)],
                    'contact_phone': f'+1-555-{1000 + i:04d}',
                    'business_name': business_names[i % len(business_names)] if not user.is_staff else 'Internal Staff'
                }
            )
            if created:
                profile_count += 1
                self.stdout.write(f'  Created profile for: {user.username}')
        
        self.stdout.write(f'  Created/updated {profile_count} user profiles')
        
        # Create Items and Categories
        self.stdout.write('Creating Categories and Items...')
        categories_data = [
            {'name': 'Electronics', 'description': 'Electronic devices and gadgets'},
            {'name': 'Books', 'description': 'Books and reading materials'},
            {'name': 'Clothing', 'description': 'Apparel and fashion items'},
            {'name': 'Food', 'description': 'Food and beverages'},
            {'name': 'Toys', 'description': 'Toys and games'},
        ]
        
        created_categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            created_categories.append(category)
            if created:
                self.stdout.write(f'  Created category: {category.name}')
        
        items_data = [
            {'name': 'Laptop Computer', 'description': 'High-performance laptop', 'category': 'Electronics'},
            {'name': 'Novel Collection', 'description': 'Set of popular novels', 'category': 'Books'},
            {'name': 'Winter Jacket', 'description': 'Warm winter jacket', 'category': 'Clothing'},
            {'name': 'Organic Coffee', 'description': 'Premium organic coffee beans', 'category': 'Food'},
            {'name': 'Board Game Set', 'description': 'Classic board games collection', 'category': 'Toys'},
            {'name': 'Smartphone', 'description': 'Latest smartphone model', 'category': 'Electronics'},
            {'name': 'Cookbook', 'description': 'Recipe cookbook', 'category': 'Books'},
            {'name': 'Running Shoes', 'description': 'Comfortable running shoes', 'category': 'Clothing'},
        ]
        
        for item_data in items_data:
            category = next((c for c in created_categories if c.name == item_data['category']), None)
            item, created = Item.objects.get_or_create(
                name=item_data['name'],
                defaults={
                    'description': item_data['description'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'  Created item: {item.name}')
        
        # Create Invoices
        self.stdout.write('Creating Invoices...')
        subscriptions = Subscription.objects.all()[:10]
        if subscriptions:
            invoice_count = 0
            for i, subscription in enumerate(subscriptions):
                # Generate unique invoice number
                invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{i+1:04d}"
                
                invoice, created = Invoice.objects.get_or_create(
                    invoice_number=invoice_number,
                    defaults={
                        'user': subscription.user,
                        'subscription': subscription,
                        'plan': subscription.plan,
                        'subtotal': subscription.price,
                        'total': subscription.price,
                        'status': 'paid' if i % 3 == 0 else ('pending' if i % 3 == 1 else 'overdue'),
                        'payment_method': 'credit_card' if i % 2 == 0 else 'paypal',
                        'due_date': timezone.now() + timedelta(days=30),
                        'paid_date': timezone.now() - timedelta(days=i % 30) if i % 3 == 0 else None,
                        'notes': f'Invoice for {subscription.plan.name} subscription'
                    }
                )
                if created:
                    invoice_count += 1
                    self.stdout.write(f'  Created invoice: {invoice.invoice_number} for {invoice.user.username}')
            self.stdout.write(f'  Created {invoice_count} invoices')
        else:
            self.stdout.write(self.style.WARNING('  No subscriptions found. Skipping invoice creation.'))
        
        # Create Stories
        self.stdout.write('Creating Stories...')
        regular_users = list(User.objects.filter(is_staff=False, is_superuser=False)[:10])
        if regular_users:
            story_templates = ['adventure', 'fantasy', 'sci-fi', 'mystery', 'educational']
            story_titles = [
                'The Brave Astronaut',
                'The Magic Forest',
                'Space Explorer Adventure',
                'The Mystery of the Lost Key',
                'Learning About Planets',
                'The Dragon\'s Quest',
                'Journey to Mars',
                'The Secret Garden',
                'Ocean Discovery',
                'The Time Machine',
                'Fairy Tale Adventure',
                'Robot Friends',
                'The Hidden Treasure',
                'Nature Explorer',
                'The Wizard\'s Spell',
            ]
            
            story_prompts = [
                'Tell me a story about a brave astronaut exploring a new planet',
                'Create a magical story about a forest full of wonders',
                'Write a science fiction story about space travel',
                'Tell me a mystery story about finding a lost key',
                'Create an educational story about planets and stars',
                'Write about a dragon on an epic quest',
                'Tell me about a journey to Mars',
                'Create a story about discovering a secret garden',
                'Write about exploring the ocean depths',
                'Tell me a story about a time machine',
                'Create a fairy tale adventure',
                'Write about friendly robots',
                'Tell me about finding hidden treasure',
                'Create a story about exploring nature',
                'Write about a wizard learning new spells',
            ]
            
            story_texts = [
                'Once upon a time, a brave astronaut named Alex set out on an incredible journey to explore a new planet. The planet was full of strange and wonderful creatures...',
                'In a magical forest, there lived a young explorer who discovered trees that glowed in the dark and animals that could talk...',
                'In the year 2150, space explorer Captain Nova embarked on a mission to find a new home for humanity among the stars...',
                'Detective Sam found a mysterious key that led to an amazing adventure through hidden passages and secret rooms...',
                'Join young astronomer Luna as she learns about the planets in our solar system and discovers the wonders of space...',
                'A brave dragon named Ember went on a quest to find the legendary Crystal of Wisdom...',
                'Astronaut Maya traveled to Mars and discovered amazing things about the red planet...',
                'Young Emma discovered a secret garden behind her house, full of magical flowers and friendly animals...',
                'Marine biologist Jake explored the deep ocean and met incredible sea creatures...',
                'A curious inventor created a time machine and traveled through different eras...',
                'Princess Lily went on a fairy tale adventure to save her kingdom...',
                'In a futuristic world, robots and humans became best friends...',
                'Treasure hunter Max found a map leading to hidden treasure...',
                'Nature explorer Sarah discovered the beauty of forests, rivers, and mountains...',
                'Young wizard apprentice learned powerful spells from a wise teacher...',
            ]
            
            story_count = 0
            for i, title in enumerate(story_titles):
                user = regular_users[i % len(regular_users)]
                template = story_templates[i % len(story_templates)]
                
                story, created = Story.objects.get_or_create(
                    title=title,
                    user=user,
                    defaults={
                        'prompt': story_prompts[i % len(story_prompts)],
                        'story_text': story_texts[i % len(story_texts)],
                        'template': template,
                        'is_published': i % 3 != 0,  # Most stories are published
                    }
                )
                if created:
                    story_count += 1
                    self.stdout.write(f'  Created story: {story.title} by {user.username}')
            self.stdout.write(f'  Created {story_count} stories')
        else:
            self.stdout.write(self.style.WARNING('  No regular users found. Skipping story creation.'))
        
        
        self.stdout.write(self.style.SUCCESS('\nData seeding completed successfully!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  - Users: {User.objects.count()} (Admin: {User.objects.filter(is_superuser=True).count()}, Staff: {User.objects.filter(is_staff=True, is_superuser=False).count()}, Regular: {User.objects.filter(is_staff=False, is_superuser=False).count()})')
        self.stdout.write(f'  - Permissions: {Permission.objects.count()}')
        self.stdout.write(f'  - Roles: {Role.objects.count()}')
        self.stdout.write(f'  - User Roles: {UserRole.objects.count()}')
        self.stdout.write(f'  - User Activities: {UserActivity.objects.count()}')
        self.stdout.write(f'  - Subscriptions: {Subscription.objects.count()}')
        self.stdout.write(f'  - News Categories: {NewsCategory.objects.count()}')
        self.stdout.write(f'  - News Articles: {News.objects.count()}')
        self.stdout.write(f'  - FAQ Categories: {FAQCategory.objects.count()}')
        self.stdout.write(f'  - FAQs: {FAQ.objects.count()}')
        self.stdout.write(f'  - Page Categories: {PageCategory.objects.count()}')
        self.stdout.write(f'  - Pages: {Page.objects.count()}')
        self.stdout.write(f'  - User Profiles: {UserProfile.objects.count()}')
        self.stdout.write(f'  - Categories: {Category.objects.count()}')
        self.stdout.write(f'  - Items: {Item.objects.count()}')
        self.stdout.write(f'  - Invoices: {Invoice.objects.count()}')
        self.stdout.write(f'  - Stories: {Story.objects.count()}')
        
        self.stdout.write(self.style.SUCCESS('\n\nTest User Credentials:'))
        self.stdout.write(self.style.WARNING('  All users have password: password'))
        self.stdout.write('\n  Admin Users:')
        for user in User.objects.filter(is_superuser=True):
            self.stdout.write(f'    - {user.username} ({user.email})')
        self.stdout.write('\n  Staff Users:')
        for user in User.objects.filter(is_staff=True, is_superuser=False):
            self.stdout.write(f'    - {user.username} ({user.email})')
        self.stdout.write('\n  Regular Users:')
        for user in User.objects.filter(is_staff=False, is_superuser=False)[:5]:
            self.stdout.write(f'    - {user.username} ({user.email})')

