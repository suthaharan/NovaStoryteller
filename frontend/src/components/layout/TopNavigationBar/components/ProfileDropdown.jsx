import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useAuthContext } from '@/context/useAuthContext';
import httpClient from '@/helpers/httpClient';

const ProfileDropdown = () => {
  const {
    user,
    isAuthenticated,
    removeSession,
    lockScreen
  } = useAuthContext();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const fetchProfile = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!isAuthenticated || !user) {
      setLoading(false);
      // Still try to set name from auth context
      if (user?.firstName) {
        setUserName(`${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() || user.username || 'User');
      } else if (user?.username) {
        setUserName(user.username);
      }
      return;
    }

    try {
      const response = await httpClient.get('/profile/');
      const profile = response.data;
      
      // Set avatar from backend - prioritize backend data
      if (profile.avatar_url && profile.avatar_url.trim()) {
        setAvatarUrl(profile.avatar_url);
        setImageError(false); // Reset error state
      } else {
        setAvatarUrl(null); // Clear avatar if none exists
      }
      
      // Set user name from backend profile - prioritize first_name from backend
      // Priority: user_first_name > user_last_name > user_username > auth context
      if (profile.user_first_name && profile.user_first_name.trim()) {
        // Use first name, optionally with last name
        const fullName = profile.user_last_name && profile.user_last_name.trim()
          ? `${profile.user_first_name.trim()} ${profile.user_last_name.trim()}`.trim()
          : profile.user_first_name.trim();
        setUserName(fullName);
      } else if (profile.user_last_name && profile.user_last_name.trim()) {
        // If only last name exists, use it
        setUserName(profile.user_last_name.trim());
      } else if (profile.user_username) {
        // Fallback to username from profile
        setUserName(profile.user_username);
      } else if (user?.firstName) {
        // Fallback to auth context
        const fullName = user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName.trim();
        setUserName(fullName || user.username || 'User');
      } else if (user?.lastName) {
        setUserName(user.lastName.trim() || user.username || 'User');
      } else if (user?.username) {
        setUserName(user.username);
      }
    } catch (error) {
      // Ignore canceled errors (from request throttling)
      if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
        setLoading(false);
        return;
      }
      // Only log non-canceled errors
      if (error.response) {
        console.error('ProfileDropdown: Error fetching profile:', error.response.status, error.response.data);
      } else {
        console.error('ProfileDropdown: Error fetching profile:', error.message);
      }
      
      // Fallback to auth context user name if profile fetch fails
      if (user?.firstName) {
        const fallbackName = `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() || user.username || 'User';
        setUserName(fallbackName);
      } else if (user?.lastName) {
        setUserName(user.lastName || user.username || 'User');
      } else if (user?.username) {
        setUserName(user.username);
      } else {
        setUserName('User');
      }
      // Don't set avatar if profile fetch fails
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Update userName from auth context immediately (before profile loads)
  useEffect(() => {
    if (user?.firstName) {
      const nameFromAuth = `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() || user.username || 'User';
      setUserName(nameFromAuth);
    } else if (user?.username) {
      setUserName(user.username);
    }
  }, [user]);

  // Initial fetch on mount - always try to load from backend
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchProfile]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      // If profile data is provided in event, use it directly
      if (event.detail?.profile) {
        const profile = event.detail.profile;
        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        } else {
          setAvatarUrl(null);
        }
        // Update name from profile data
        if (profile.user_first_name) {
          const fullName = profile.user_last_name 
            ? `${profile.user_first_name} ${profile.user_last_name}`.trim()
            : profile.user_first_name.trim();
          setUserName(fullName);
        } else if (profile.user_last_name) {
          setUserName(profile.user_last_name.trim());
        } else if (profile.user_username) {
          setUserName(profile.user_username);
        }
      } else {
        // Otherwise, refetch the profile
        fetchProfile();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchProfile]);

  // Reset image error when avatar URL changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  // Display avatar or default icon
  // Show loading state briefly, then show avatar or default icon
  const displayAvatar = loading ? (
    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
      <IconifyIcon icon="solar:user-bold-duotone" width={20} height={20} className="text-muted" />
    </div>
  ) : (avatarUrl && !imageError) ? (
    <img 
      className="rounded-circle" 
      width={32} 
      height={32} 
      src={avatarUrl} 
      alt="User Avatar" 
      style={{ objectFit: 'cover' }}
      onError={() => {
        // If image fails to load, show default icon
        setImageError(true);
      }}
    />
  ) : (
    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
      <IconifyIcon icon="solar:user-bold-duotone" width={20} height={20} />
    </div>
  );

  return <Dropdown className="topbar-item" align={'end'}>
      <DropdownToggle as="button" type="button" className="topbar-button content-none" id="page-header-user-dropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <span className="d-flex align-items-center">
          {displayAvatar}
        </span>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownHeader as="h6">Welcome {userName}!</DropdownHeader>
        <DropdownItem as={Link} to="/settings/profile">
          <IconifyIcon icon="solar:user-bold-duotone" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Profile</span>
        </DropdownItem>
        <DropdownItem as={Link} to="/apps/chat">
          <IconifyIcon icon="bx:message-dots" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Messages</span>
        </DropdownItem>
        <DropdownItem as={Link} to="/pages/pricing">
          <IconifyIcon icon="bx:wallet" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Pricing</span>
        </DropdownItem>
        <DropdownItem as={Link} to="/pages/faqs">
          <IconifyIcon icon="bx:help-circle" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Help</span>
        </DropdownItem>
        <DropdownItem 
          as={Link} 
          to="/auth/lock-screen"
          onClick={() => {
            // Store current path for redirect after unlock
            sessionStorage.setItem('previousPath', window.location.pathname);
            // Lock the screen
            lockScreen();
          }}
        >
          <IconifyIcon icon="bx:lock" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Lock screen</span>
        </DropdownItem>
        <DropdownDivider className="dropdown-divider my-1" />
        <DropdownItem as={Link} onClick={removeSession} className="text-danger" to="/auth/sign-in">
          <IconifyIcon icon="bx:log-out" className="fs-18 align-middle me-1" />
          <span className="align-middle">Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>;
};
export default ProfileDropdown;