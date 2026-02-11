# Menu Structure Documentation

## Overview

The left sidebar menu has been simplified to show only the required links for each user type.

## Menu Items

### For Admin Users
- **Dashboard** (`/dashboard/analytics`) - Analytics dashboard
- **Stories** (`/stories`) - View all user stories
- **Session Logs** (`/story-sessions`) - View all user session logs
- **Manage** (expandable)
  - **Users** (`/users`) - Manage all users

### For Regular Users
- **Dashboard** (`/dashboard/analytics`) - Analytics dashboard
- **Stories** (`/stories`) - View own stories only
- **Session Logs** (`/story-sessions`) - View own session logs only

## Menu Filtering Logic

The menu filtering is handled in `frontend/src/helpers/menu.js`:

1. **Admin users** (`isAdmin = true`): See all menu items
2. **Regular users**: See only items with `requiresUser: true`
3. **Staff-only items**: Items with `requiresStaff: true` are only visible to admin/staff users

## Menu Item Definitions

Menu items are defined in `frontend/src/assets/data/menu-items.js`:

```javascript
{
  key: 'dashboard',
  icon: 'solar:home-2-broken',
  label: 'Dashboard',
  url: '/dashboard/analytics',
  requiresUser: true  // Available to all authenticated users
}
```

## Access Control

- **Dashboard**: All authenticated users
- **Stories**: All authenticated users (admin sees all, users see only their own)
- **Session Logs**: All authenticated users (admin sees all, users see only their own)
- **Manage > Users**: Admin/staff users only

## API Endpoints

All endpoints are working and accessible:

### Authentication
- `POST /api/login/` - User login
- `POST /api/register/` - User registration
- `POST /api/logout/` - User logout
- `GET /api/current-user/` - Get current user info
- `GET /api/profile/` - Get user profile
- `POST /api/change-password/` - Change password

### Stories
- `GET /api/stories/` - List stories (filtered by user role)
- `GET /api/stories/:id/` - Get story detail
- `POST /api/stories/` - Create story
- `PUT /api/stories/:id/` - Update story
- `DELETE /api/stories/:id/` - Delete story
- `POST /api/stories/:id/regenerate/` - Regenerate story

### Story Sessions
- `GET /api/story-sessions/` - List sessions (filtered by user role)
- `GET /api/story-sessions/:id/` - Get session detail
- `POST /api/story-sessions/` - Create session
- `POST /api/story-sessions/:id/end_session/` - End session

### Users (Admin only)
- `GET /api/users/` - List users (admin sees all)
- `GET /api/users/:id/` - Get user detail
- `POST /api/users/` - Create user
- `PUT /api/users/:id/` - Update user
- `DELETE /api/users/:id/` - Delete user

## Testing

1. **Login as Admin**:
   - Should see: Dashboard, Stories, Session Logs, Manage > Users
   - Can view all stories and sessions
   - Can manage all users

2. **Login as Regular User**:
   - Should see: Dashboard, Stories, Session Logs
   - Can view only own stories and sessions
   - Cannot access `/users` page

## Files Modified

- `frontend/src/assets/data/menu-items.js` - Simplified menu structure
- `frontend/src/helpers/menu.js` - Updated filtering logic

