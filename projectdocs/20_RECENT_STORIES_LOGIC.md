# Recent Stories Section - Logic Explanation

## Overview
The "Recent Stories" section on the dashboard displays the last 10 stories created in the system, with different behavior for admin users vs regular users.

## URL Structure
- **Dashboard URL**: `http://localhost:8000/dashboard`
- The dashboard route directly renders the Analytics component (no redirect)

## Backend Logic (`api/views.py` - `dashboard_stats` endpoint)

### For Admin Users (`is_admin = True`)
```python
# Recent stories (last 10)
recent_stories_list = Story.objects.order_by('-created_at')[:10].values(
    'id', 'title', 'created_at', 'is_published', 'user__username'
)
```

**Logic:**
- Fetches the **last 10 stories** from **all users** in the system
- Ordered by `created_at` in descending order (newest first)
- Includes `user__username` to show who created each story
- Returns: `id`, `title`, `created_at`, `is_published`, `user__username`

### For Regular Users (`is_admin = False`)
```python
# Recent stories (last 10)
recent_stories_list = Story.objects.filter(user=user).order_by('-created_at')[:10].values(
    'id', 'title', 'created_at', 'is_published'
)
```

**Logic:**
- Fetches the **last 10 stories** created by **the current user only**
- Filtered by `user=user` (only stories belonging to the logged-in user)
- Ordered by `created_at` in descending order (newest first)
- Does NOT include `user__username` (since all stories belong to the same user)
- Returns: `id`, `title`, `created_at`, `is_published`

## Frontend Logic (`RecentStories.jsx`)

### Data Fetching
1. Uses `useApiData` hook to fetch from `/api/dashboard-stats/`
2. Transforms the response to extract `recent_stories` array:
   ```javascript
   const transformRecentStories = useCallback((responseData) => {
     return responseData?.recent_stories || [];
   }, []);
   ```

### Display Logic
1. **Loading State**: Shows a spinner while data is being fetched
2. **Error State**: Shows an error alert if the API call fails
3. **Empty State**: Shows "No stories yet" with a "Create Your First Story" button if no stories exist
4. **Data Display**: Shows a table with:
   - **Title**: Story title (clickable link to story detail page)
   - **Status**: Published/Draft badge
   - **Created By**: Only shown for admin users (when `user__username` exists in data)
   - **Created At**: Formatted creation date
   - **Action**: Eye icon link to story detail page

### Conditional Rendering
- **"Created By" column**: Only displayed if:
  - `recentStories.length > 0` AND
  - `recentStories[0].user__username` exists (admin view)
- **Empty state colspan**: Adjusts based on whether "Created By" column is shown (5 columns for admin, 4 for regular users)

## Data Flow

```
User visits /dashboard
    ↓
Analytics component renders
    ↓
RecentStories component mounts
    ↓
useApiData hook calls GET /api/dashboard-stats/
    ↓
Backend checks user role (admin vs regular)
    ↓
Backend queries Story model:
  - Admin: All stories, ordered by -created_at, limit 10
  - Regular: User's stories only, ordered by -created_at, limit 10
    ↓
Backend returns JSON with 'recent_stories' array
    ↓
Frontend transforms response (extracts recent_stories)
    ↓
Component renders table with story data
```

## Key Features

1. **Role-Based Filtering**: Admin sees all stories, regular users see only their own
2. **Limit**: Always shows the 10 most recent stories (by creation date)
3. **Real-time**: Fetches fresh data on each dashboard load
4. **Navigation**: Each story title and action icon links to the story detail page
5. **Quick Access**: "View All" button links to the full stories list page

## API Response Structure

```json
{
  "stats": { ... },
  "charts": { ... },
  "recent_stories": [
    {
      "id": "uuid",
      "title": "Story Title",
      "created_at": "2026-02-10T12:00:00Z",
      "is_published": true,
      "user__username": "admin"  // Only for admin view
    },
    ...
  ],
  "is_admin": true,
  "timestamp": "2026-02-10T12:00:00Z"
}
```

## Recent Changes

- **Changed from 5 to 10 stories**: Updated both admin and regular user queries to return 10 stories instead of 5
- **Dashboard URL**: Changed from `/dashboard/analytics` to `/dashboard` (direct route, no redirect)
- **All auth redirects**: Updated to point to `/dashboard` instead of `/dashboard/analytics`

