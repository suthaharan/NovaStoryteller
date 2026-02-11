import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import useQueryParams from '@/hooks/useQueryParams';
import { toggleDocumentAttribute } from '@/utils/layout';

const ThemeContext = createContext(undefined);

const useLayoutContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useLayoutContext can only be used within LayoutProvider');
  }
  return context;
};

const LayoutProvider = ({
  children
}) => {
  const params = useQueryParams();
  const override = !!(params.layout_theme || params.topbar_theme || params.menu_theme || params.menu_size);
  
  // Default settings:
  // - Color scheme: light
  // - Topbar color: light
  // - Menu color: dark
  // - Sidebar size: default
  const INIT_STATE = {
    theme: params.layout_theme ? params.layout_theme : 'light',
    topbarTheme: params.topbar_theme ? params.topbar_theme : 'light',
    menu: {
      theme: params.menu_theme ? params.menu_theme : 'dark',
      size: params.menu_size ? params.menu_size : 'default'
    }
  };
  
  // Get stored settings from localStorage
  const [storedSettings, setStoredSettings] = useLocalStorage('__RASKET_REACT_CONFIG__', INIT_STATE, override);
  
  // Always enforce defaults
  const getSettings = () => {
    return {
      theme: params.layout_theme ? params.layout_theme : 'light',
      topbarTheme: params.topbar_theme ? params.topbar_theme : 'light',
      menu: {
        theme: params.menu_theme ? params.menu_theme : 'dark',
        size: 'default' // Always 'default'
      }
    };
  };
  
  const [settings, setSettingsState] = useState(() => getSettings());
  
  // Apply theme immediately on mount and update localStorage
  useEffect(() => {
    const initialSettings = getSettings();
    
    // Apply theme immediately to HTML element
    toggleDocumentAttribute('data-bs-theme', initialSettings.theme);
    toggleDocumentAttribute('data-topbar-color', initialSettings.topbarTheme);
    toggleDocumentAttribute('data-menu-color', initialSettings.menu.theme);
    toggleDocumentAttribute('data-menu-size', initialSettings.menu.size);
    
    setSettingsState(initialSettings);
    
    // Update localStorage to ensure it matches our defaults
    if (!override) {
      setStoredSettings(initialSettings);
    }
  }, []); // Run only once on mount
  
  const [offcanvasStates, setOffcanvasStates] = useState({
    showThemeCustomizer: false,
    showBackdrop: false
  });

  // update settings - always enforce sidebar size to 'default'
  const updateSettings = (newSettings) => {
    const merged = {
      theme: newSettings.theme !== undefined ? newSettings.theme : settings.theme,
      topbarTheme: newSettings.topbarTheme !== undefined ? newSettings.topbarTheme : settings.topbarTheme,
      menu: {
        theme: newSettings.menu?.theme !== undefined ? newSettings.menu.theme : settings.menu.theme,
        size: 'default' // Always enforce 'default'
      }
    };
    setStoredSettings(merged);
    setSettingsState(merged);
  };

  // update theme mode - allows user to change between light/dark
  const changeTheme = (newTheme) => {
    updateSettings({
      theme: newTheme
    });
  };

  // change topbar theme
  const changeTopbarTheme = (newTheme) => {
    updateSettings({
      topbarTheme: newTheme
    });
  };

  // change menu theme
  const changeMenuTheme = (newTheme) => {
    updateSettings({
      menu: {
        ...settings.menu,
        theme: newTheme
      }
    });
  };

  // change menu size - but always enforce 'default'
  const changeMenuSize = () => {
    // Sidebar size is always 'default', do nothing
    // This function exists for API compatibility but doesn't change anything
  };

  // toggle theme customizer offcanvas
  const toggleThemeCustomizer = () => {
    setOffcanvasStates({
      ...offcanvasStates,
      showThemeCustomizer: !offcanvasStates.showThemeCustomizer
    });
  };

  const themeCustomizer = {
    open: offcanvasStates.showThemeCustomizer,
    toggle: toggleThemeCustomizer
  };

  // toggle backdrop
  const toggleBackdrop = useCallback(() => {
    const htmlTag = document.getElementsByTagName('html')[0];
    if (offcanvasStates.showBackdrop) htmlTag.classList.remove('sidebar-enable');
    else htmlTag.classList.add('sidebar-enable');
    setOffcanvasStates({
      ...offcanvasStates,
      showBackdrop: !offcanvasStates.showBackdrop
    });
  }, [offcanvasStates.showBackdrop]);

  // Apply theme attributes whenever settings change
  useEffect(() => {
    toggleDocumentAttribute('data-bs-theme', settings.theme);
    toggleDocumentAttribute('data-topbar-color', settings.topbarTheme);
    toggleDocumentAttribute('data-menu-color', settings.menu.theme);
    toggleDocumentAttribute('data-menu-size', settings.menu.size);
    return () => {
      toggleDocumentAttribute('data-bs-theme', settings.theme, true);
      toggleDocumentAttribute('data-topbar-color', settings.topbarTheme, true);
      toggleDocumentAttribute('data-menu-color', settings.menu.theme, true);
      toggleDocumentAttribute('data-menu-size', settings.menu.size, true);
    };
  }, [settings]);

  const resetSettings = () => updateSettings(INIT_STATE);

  return (
    <ThemeContext.Provider value={useMemo(() => ({
      ...settings,
      themeMode: settings.theme,
      changeTheme,
      changeTopbarTheme,
      changeMenu: {
        theme: changeMenuTheme,
        size: changeMenuSize
      },
      themeCustomizer,
      toggleBackdrop,
      resetSettings
    }), [settings, offcanvasStates])}>
      {children}
      {offcanvasStates.showBackdrop && <div className="offcanvas-backdrop fade show" onClick={toggleBackdrop} />}
    </ThemeContext.Provider>
  );
};

export { LayoutProvider, useLayoutContext };
