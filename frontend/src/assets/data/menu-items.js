export const MENU_ITEMS = [{
  key: 'menu',
  label: 'MENU',
  isTitle: true
}, {
  key: 'dashboard',
  icon: 'solar:home-2-broken',
  label: 'Dashboard',
  url: '/dashboard',
  requiresUser: true  // Available to all authenticated users
}, {
  key: 'stories',
  icon: 'solar:book-2-broken',
  label: 'Stories',
  url: '/stories',
  requiresUser: true  // Available to all authenticated users (admin and regular users)
  }, {
    key: 'story-sessions',
    icon: 'solar:history-broken',
    label: 'Session Logs',
    url: '/story-sessions',
    requiresUser: true  // Available to all authenticated users (admin and regular users)
  }, {
    key: 'playlists',
    icon: 'solar:playlist-bold-duotone',
    label: 'Playlists',
    url: '/playlists',
    requiresUser: true  // Available to all authenticated users
  }, {
  key: 'story-settings',
  icon: 'solar:settings-bold-duotone',
  label: 'Story Settings',
  url: '/story-settings',
  requiresUser: true  // Available to all authenticated users
}, {
  key: 'manage',
  icon: 'solar:settings-broken',
  label: 'Manage',
  requiresStaff: true,  // Only for admin/staff users
  children: [{
    key: 'manage-users',
    label: 'Users',
    url: '/users',
    parentKey: 'manage',
    requiresStaff: true
  }]
}];
