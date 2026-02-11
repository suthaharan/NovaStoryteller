# Seeder Information

## Overview

The `seed_data` management command creates sample data for all models and endpoints in the application. All users are created with the password **"password"**.

## Usage

```bash
python manage.py seed_data
```

## What Gets Seeded

### 1. Users
- **1 Superadmin**: `admin` (admin@test.com)
- **2 Staff Users**: `staff1`, `staff2`
- **5 Regular Users**: `user1` through `user5`
- **All passwords**: `password`

### 2. Permissions & Roles
- **10 Permissions**: View/Manage permissions for Users, Roles, Permissions, Subscriptions, Activities, Reports
- **4 Roles**: Superuser, Staff, User Manager, Subscription Manager
- **User-Role Assignments**: Roles assigned to appropriate users

### 3. Items & Categories
- **5 Categories**: Electronics, Books, Clothing, Food, Toys
- **8 Items**: Various items across categories

### 4. Plans & Subscriptions
- **3 Plans**: Basic ($9.99), Premium ($29.99), Enterprise ($99.99)
- **10 Subscriptions**: Assigned to first 10 users with various statuses

### 5. Invoices
- **10 Invoices**: Created for subscriptions with various statuses (paid, pending, overdue)

### 6. News
- **5 News Categories**: Technology, Business, Health, Education, Sports
- **8 News Articles**: Published articles across categories

### 7. FAQs
- **5 FAQ Categories**: General, Account, Billing, Technical, Features
- **10 FAQs**: Common questions and answers

### 8. Pages
- **5 Page Categories**: About, Services, Support, Legal, Resources
- **8 Pages**: Various content pages

### 9. User Profiles
- **All Users**: User profiles created for all users with contact information

### 10. Stories (Nova Storyteller)
- **15 Stories**: Various story titles across all templates
  - Templates: Adventure, Fantasy, Sci-Fi, Mystery, Educational
  - Assigned to regular users
  - Most are published

### 11. Senior Profiles & Caregiver Relationships
- **3 Senior Profiles**: First 3 regular users become seniors
- **6 Caregiver Relationships**: Each senior has 2 caregivers (staff users)

### 12. Pillbox Schedules
- **40 Schedules**: Created for senior users (Monday-Friday, Morning & Evening)

### 13. Alerts
- **6 Alerts**: Various alert types for seniors (some read, some unread)

### 14. Image Analyses
- **Skipped**: Requires actual image files. Create via API with image uploads.

### 15. User Activities
- **50 Activities**: Sample activity logs for various users

## Test Credentials

All users use the password: **password**

### Admin Users
- `admin` / `admin@test.com`

### Staff Users
- `staff1` / `staff1@test.com`
- `staff2` / `staff2@test.com`

### Regular Users
- `user1` / `user1@test.com`
- `user2` / `user2@test.com`
- `user3` / `user3@test.com`
- `user4` / `user4@test.com`
- `user5` / `user5@test.com`

## API Endpoints with Data

After running the seeder, you can test these endpoints:

### Authentication
- `POST /api/login/` - Login with any user credentials
- `POST /api/register/` - Register new users
- `GET /api/current-user/` - Get current user info

### Stories
- `GET /api/stories/` - List all stories (user's own or all for admin)
- `POST /api/stories/` - Create new story
- `GET /api/stories/{id}/` - Get story details
- `POST /api/stories/{id}/regenerate/` - Regenerate story

### Users
- `GET /api/users/` - List users
- `GET /api/users/{id}/` - Get user details

### Items & Categories
- `GET /api/items/` - List items
- `GET /api/categories/` - List categories

### News
- `GET /api/news/` - List news articles
- `GET /api/news-categories/` - List news categories

### FAQs
- `GET /api/faqs/` - List FAQs
- `GET /api/faq-categories/` - List FAQ categories

### Pages
- `GET /api/pages/` - List pages
- `GET /api/page-categories/` - List page categories

### Subscriptions
- `GET /api/subscriptions/` - List subscriptions
- `GET /api/plans/` - List plans

### Invoices
- `GET /api/invoices/` - List invoices


## Notes

1. **Idempotent**: Running the seeder multiple times won't create duplicates (uses `get_or_create`)
2. **Password Reset**: Existing users' passwords are updated to "password" if they already exist
3. **Image Analyses**: Not seeded (requires actual image files - use API to create)
4. **Stories**: Created without Nova AI generation (will have placeholder text)
5. **Relationships**: Senior profiles and caregiver relationships are created for testing

## Resetting Data

To reset all data and reseed:

```bash
# Option 1: Reset database (WARNING: Deletes all data)
python manage.py flush
python manage.py migrate
python manage.py seed_data

# Option 2: Delete specific models and reseed
python manage.py shell
>>> from api.models import *
>>> Story.objects.all().delete()
>>> # etc.
```

## Customization

You can modify `api/management/commands/seed_data.py` to:
- Add more users
- Change story content
- Adjust quantities
- Add more test data

---

**Last Updated**: Seeder includes all models and endpoints

