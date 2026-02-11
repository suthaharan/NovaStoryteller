import { MENU_ITEMS } from '@/assets/data/menu-items';
import { getCookie } from 'cookies-next';

// Helper to recursively filter menu items based on staff/caregiver requirement
const filterMenuItems = (items, isStaff, isCaregiver = false, isSenior = false, isAdmin = false, allowedKeysForStaff = [], allowedKeysForSenior = [], isChildOfAllowedParent = false) => {
  if (!items || !Array.isArray(items)) return items;
  
  return items
    .filter(item => {
      // Keep title items - they're needed for menu structure
      if (item.isTitle) {
        return true;
      }
      
      // Admins should see all items (Dashboard, Stories, Session Logs, Manage with Users)
      if (isAdmin) {
        return true;
      }
      
      // If we're filtering children of an allowed parent, be more permissive
      if (isChildOfAllowedParent && isStaff) {
        // Allow children with requiresStaff or requiresCaregiver if user is staff
        if (item.requiresStaff || item.requiresCaregiver) {
          return true;
        }
        // Allow children with requiresUser if user is staff (they're children of allowed parent)
        if (item.requiresUser) {
          return true;
        }
        // Allow children with no restrictions
        if (!item.requiresStaff && !item.requiresCaregiver && !item.requiresUser) {
          return true;
        }
      }
      
      // If item requires staff and user is not staff, filter it out
      if (item.requiresStaff && !isStaff) {
        return false;
      }
      // If item requires caregiver and user is not caregiver/admin, filter it out
      if (item.requiresCaregiver && !isCaregiver && !isAdmin) {
        return false;
      }
      // If item requires user, show it to all authenticated users (admin and regular)
      if (item.requiresUser) {
        return true;
      }
      
      // Items with no restrictions should be shown
      if (!item.requiresStaff && !item.requiresCaregiver && !item.requiresUser) {
        return true;
      }
      
      return false;
    })
    .map(item => {
      // Recursively filter children
      if (item.children) {
        // If parent is in allowed list for staff, don't apply strict filtering to children
        const parentInAllowedList = (isCaregiver || isAdmin) && isStaff && allowedKeysForStaff.length > 0 && allowedKeysForStaff.includes(item.key);
        const childrenAllowedKeys = parentInAllowedList ? [] : allowedKeysForStaff;
        const filteredChildren = filterMenuItems(item.children, isStaff, isCaregiver, isSenior, isAdmin, childrenAllowedKeys, allowedKeysForSenior, parentInAllowedList);
        return {
          ...item,
          children: filteredChildren
        };
      }
      return item;
    })
    .filter(item => {
      // Remove parent items that have no children left (unless it's a title or has a URL)
      // BUT: If item is in allowed list for staff, always show it even if children are filtered
      const isInAllowedList = (isCaregiver || isAdmin) && isStaff && allowedKeysForStaff.length > 0 && allowedKeysForStaff.includes(item.key);
      if (item.children && item.children.length === 0 && !item.url && !item.isTitle && !isInAllowedList) {
        return false;
      }
      return true;
    });
};

export const getMenuItems = () => {
  // Check if user is staff, senior, or caregiver from cookie
  let isStaff = false;
  let isSenior = false;
  let isCaregiver = false;
  let isAdmin = false;
  
  try {
    const authCookie = getCookie('_Ace_AUTH_KEY_');
    if (authCookie) {
      const userData = typeof authCookie === 'string' ? JSON.parse(authCookie) : authCookie;
      // Check if user is staff (role === 'Admin' or 'Caregiver' means staff in our system)
      isStaff = userData?.role === 'Admin' || userData?.role === 'Caregiver' || userData?.is_staff === true;
      // Check if user is senior
      isSenior = userData?.is_senior === true;
      // Check if user is caregiver (staff but not admin)
      isCaregiver = userData?.role === 'Caregiver' || (userData?.is_staff === true && userData?.role !== 'Admin');
      // Check if user is admin
      isAdmin = userData?.role === 'Admin' || userData?.is_superuser === true;
    }
  } catch (e) {
    // If cookie parsing fails, default to false
    console.warn('Failed to parse auth cookie for menu filtering:', e);
  }
  
  // Simplified menu filtering:
  // - Admin/Staff: See Dashboard, Stories, Session Logs, and Manage (with Users)
  // - Regular Users: See Dashboard, Stories, Session Logs only
  return filterMenuItems(MENU_ITEMS, isStaff, isCaregiver, isSenior, isAdmin, [], [], false);
};
export const findAllParent = (menuItems, menuItem) => {
  let parents = [];
  const parent = findMenuItem(menuItems, menuItem.parentKey);
  if (parent) {
    parents.push(parent.key);
    if (parent.parentKey) {
      parents = [...parents, ...findAllParent(menuItems, parent)];
    }
  }
  return parents;
};
export const getMenuItemFromURL = (items, url) => {
  if (items instanceof Array) {
    for (const item of items) {
      const foundItem = getMenuItemFromURL(item, url);
      if (foundItem) {
        return foundItem;
      }
    }
  } else {
    // Exact match
    if (items.url === url) return items;
    // Prefix match: if menu item is '/dashboard' and URL is '/dashboard/analytics', it should match
    if (items.url && url && url.startsWith(items.url) && items.url !== '/') {
      // Make sure it's a path segment match (not just a substring)
      const nextChar = url[items.url.length];
      if (!nextChar || nextChar === '/') {
        return items;
      }
    }
    if (items.children != null) {
      for (const item of items.children) {
        if (item.url === url) return item;
        // Prefix match for children too
        if (item.url && url && url.startsWith(item.url) && item.url !== '/') {
          const nextChar = url[item.url.length];
          if (!nextChar || nextChar === '/') {
            return item;
          }
        }
      }
    }
  }
};
export const findMenuItem = (menuItems, menuItemKey) => {
  if (menuItems && menuItemKey) {
    for (const item of menuItems) {
      if (item.key === menuItemKey) {
        return item;
      }
      const found = findMenuItem(item.children, menuItemKey);
      if (found) return found;
    }
  }
  return null;
};