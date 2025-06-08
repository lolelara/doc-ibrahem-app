
import React, { useState, useEffect, createContext, ReactNode, useCallback, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, UserRole, Translations, Notification } from './types';
import * as DataService from './services/dataService';
import { APP_NAME, AR_TRANSLATIONS, THEME_COLORS, ADMIN_EMAIL } from './constants';
import AuthPage from './pages/AuthPage';
import UserPages from './pages/UserPages';
import ContentPages from './pages/ContentPages';
import AdminPage from './pages/AdminPage'; // Changed from { AdminPage }
import { TransformationsPage } from './pages/TransformationsPage';
import { Spinner, LoadingOverlay, Button, ProtectedRoute } from './components/CommonUI';


// Contexts
interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
  isAdmin: boolean;
  isSiteManager: boolean;
  isSubscribed: boolean;
  refreshUser: () => Promise<void>;
  unreadNotifications: Notification[];
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType>(null!);

interface LocalizationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translations: Translations;
  t: (key: string, subkey?: string) => string;
}
export const LocalizationContext = createContext<LocalizationContextType>(null!);

// Helper Hooks
export const useAuth = () => useContext(AuthContext);
export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === null) {
    console.warn("LocalizationContext not found, using default fallback. Ensure component is wrapped in LocalizationContext.Provider.");
    return {
      language: 'ar',
      setLanguage: () => {},
      translations: AR_TRANSLATIONS,
      t: (key: string, subkey?: string): string => {
        if (subkey) {
          const mainKey = AR_TRANSLATIONS[key];
          if (typeof mainKey === 'object' && mainKey !== null) {
            return (mainKey as Translations)[subkey] as string || `${key}.${subkey}`;
          }
          return `${key}.${subkey}`;
        }
        return AR_TRANSLATIONS[key] as string || key;
      }
    };
  }
  return context;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUserInternal] = useState<User | null>(null);
  const [appLoading, setAppLoading] = useState(true); // Renamed from 'loading' to avoid conflict with context's loading
  const [language, setLanguageState] = useState('ar');
  const [translations, setTranslations] = useState<Translations>(AR_TRANSLATIONS);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserInternal(user);
    if (user) {
      // No longer storing email in localStorage for session, backend session/token would handle this
      // localStorage.setItem('fitzone_currentUserEmail', user.email); 
      fetchUnreadNotifications(user.id);
    } else {
      // localStorage.removeItem('fitzone_currentUserEmail');
      setUnreadNotifications([]);
    }
  };
  
  const refreshUser = useCallback(async () => {
    if (currentUser) {
      try {
        const updatedUser = await DataService.checkUserSubscriptionStatus(currentUser.id);
        if (updatedUser) {
           setCurrentUserInternal(updatedUser); 
        }
      } catch (error) {
        console.error("Error refreshing user status:", error);
      }
    }
  }, [currentUser]);

  const fetchUnreadNotifications = useCallback(async (userId: string) => {
    try {
      const notifications = await DataService.getGlobalNotificationsForUser(userId);
      setUnreadNotifications(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setUnreadNotifications([]);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (currentUser) {
      await fetchUnreadNotifications(currentUser.id);
    }
  }, [currentUser, fetchUnreadNotifications]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (currentUser) {
      try {
        await DataService.markGlobalNotificationAsReadForUser(notificationId, currentUser.id);
        await refreshNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  }, [currentUser, refreshNotifications]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (currentUser) {
      try {
        await DataService.markAllGlobalNotificationsAsReadForUser(currentUser.id);
        await refreshNotifications();
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
      }
    }
  }, [currentUser, refreshNotifications]);


  useEffect(() => {
    const loadInitialUser = async () => {
      // In a real app with backend auth, you'd check for a session token here
      // const storedUserEmail = localStorage.getItem('fitzone_currentUserEmail'); // Example: session recovery
      // For now, we assume no session recovery via localStorage. User must log in.
      // If you had a token, you'd validate it with the backend.
      // Example:
      // const token = localStorage.getItem('authToken');
      // if (token) {
      //   try {
      //     const userFromToken = await DataService.validateTokenAndGetUser(token); // Hypothetical function
      //     if (userFromToken) {
      //       const checkedUser = await DataService.checkUserSubscriptionStatus(userFromToken.id);
      //       setCurrentUserInternal(checkedUser || userFromToken);
      //       await fetchUnreadNotifications(userFromToken.id);
      //     }
      //   } catch (error) {
      //     console.error("Session validation failed", error);
      //     localStorage.removeItem('authToken'); // Clear invalid token
      //   }
      // }
      setAppLoading(false);
    };
    loadInitialUser();
  }, []); // Removed fetchUnreadNotifications from dependency array as it's called after user is set

  const logout = () => {
    // In a real app, also invalidate backend session/token
    // localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (lang === 'ar') {
      setTranslations(AR_TRANSLATIONS);
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  };

  const tAppScope = useCallback((key: string, subkey?: string): string => {
    const sourceTranslations = language === 'ar' ? AR_TRANSLATIONS : AR_TRANSLATIONS; 
    if (subkey) {
      const mainKey = sourceTranslations[key];
      if (typeof mainKey === 'object' && mainKey !== null) {
        return (mainKey as Translations)[subkey] as string || `${key}.${subkey}`;
      }
      return `${key}.${subkey}`;
    }
    return sourceTranslations[key] as string || key;
  }, [language]);
  
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SITE_MANAGER;
  const isSiteManager = currentUser?.role === UserRole.SITE_MANAGER;
  const isSubscribed = currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.SITE_MANAGER && currentUser?.subscriptionStatus === 'active' && !!currentUser.subscriptionExpiry && new Date(currentUser.subscriptionExpiry) > new Date();


  if (appLoading) {
    return <LoadingOverlay message={AR_TRANSLATIONS.loading as string || "جاري التحميل..."} />;
  }

  return (
    <AuthContext.Provider value={{ 
        currentUser, setCurrentUser, logout, loading: appLoading, isAdmin, isSiteManager, isSubscribed, refreshUser,
        unreadNotifications, refreshNotifications, markNotificationAsRead, markAllNotificationsAsRead 
    }}>
      <LocalizationContext.Provider value={{ language, setLanguage, translations: language === 'ar' ? AR_TRANSLATIONS : AR_TRANSLATIONS, t: tAppScope }}>
        <HashRouter>
          <div className={`min-h-screen flex flex-col bg-${THEME_COLORS.background}`}>
            <Navbar />
            <main className="flex-grow container mx-auto px-2 xs:px-4 py-6 sm:py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/user/*" element={<UserPages />} />
                <Route path="/content/*" element={<ContentPages />} />
                <Route path="/transformations" element={<ProtectedRoute><TransformationsPage /></ProtectedRoute>} />
                <Route path="/admin/*" element={isAdmin ? <AdminPage /> : <NavigateToDashboard message={(AR_TRANSLATIONS.adminAccessOnly as string || 'Admin access only')} />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </LocalizationContext.Provider>
    </AuthContext.Provider>
  );
};


const NavigateToDashboard: React.FC<{message?: string}> = ({message}) => {
  const location = useLocation();
  return <Navigate to="/user/dashboard" state={{ from: location, message }} replace />;
}

const NavIcons = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6.75A.75.75 0 002.5 7.5h.25a.75.75 0 000-1.5h-.25A.25.25 0 012.5 5.75V5.5A.25.25 0 012.75 5.25h14.5a.25.25 0 01.25.25v.25a.25.25 0 01-.25.25h-.25a.75.75 0 000 1.5h.25A1.5 1.5 0 0019 6.75V5.5A1.5 1.5 0 0017.5 4h-15zM1.07 9.03A.75.75 0 002 9.75h16a.75.75 0 00.93-.72l-.657-4.123A.75.75 0 0017.351 4H2.65a.75.75 0 00-.922.877L1.07 9.03zM2.5 11A1.5 1.5 0 001 12.5v2A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 0017.5 11h-15z" clipRule="evenodd" /></svg>,
  workouts: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.03 4.03a.75.75 0 00-1.06 1.06l2.22 2.22H1.75a.75.75 0 000 1.5h5.44l-2.22 2.22a.75.75 0 101.06 1.06l2.75-2.75a.75.75 0 000-1.06l-2.75-2.75z" /><path d="M13.03 4.03a.75.75 0 00-1.06 1.06l2.22 2.22H8.75a.75.75 0 000 1.5h5.44l-2.22 2.22a.75.75 0 101.06 1.06l2.75-2.75a.75.75 0 000-1.06l-2.75-2.75z" /><path d="M11.97 15.97a.75.75 0 101.06-1.06l-2.22-2.22h5.44a.75.75 0 000-1.5h-5.44l2.22-2.22a.75.75 0 10-1.06-1.06l-2.75 2.75a.75.75 0 000 1.06l2.75 2.75z" /></svg>,
  nutrition: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 1a2.5 2.5 0 00-2.5 2.5V8a.5.5 0 00.5.5h4a.5.5 0 00.5-.5V3.5A2.5 2.5 0 0010 1zM8.5 3.5a1 1 0 011-1h1a1 1 0 011 1V4h-3V3.5z" /><path d="M10.22 8.906a1.502 1.502 0 00-.44 0C9.346 8.906 9 9.252 9 9.69V14.5a.5.5 0 00.5.5h1a.5.5 0 00.5-.5V9.69c0-.438-.346-.784-.78-.784z" /><path fillRule="evenodd" d="M15.5 10.25a.75.75 0 00-.75-.75H5.25a.75.75 0 000 1.5h3.12V14.5A1.5 1.5 0 009.87 16h.26a1.5 1.5 0 001.495-1.5V11h3.125a.75.75 0 00.75-.75zM10 11.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
  profile: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" /></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h11.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 9.75zm0 5A.75.75 0 012.75 14h11.5a.75.75 0 010 1.5H2.75A.75.75 0 012 14.75zM15.28 6.22a.75.75 0 00-1.06-1.06l-3.25 3.25a.75.75 0 000 1.06l3.25 3.25a.75.75 0 101.06-1.06L12.56 10l2.72-2.72z" clipRule="evenodd" /></svg>,
  admin: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.074 2.5a2.5 2.5 0 00-4.15 1.899V5.259l-.504-.42a2.5 2.5 0 00-3.214.55L1.004 8.987a.75.75 0 00.942 1.162l2.201-.825 1.226 1.839a2.504 2.504 0 001.849 1.049.75.75 0 00.25-.038l.058-.017.06-.019.06-.019a2.5 2.5 0 001.897-1.017l.001-.003 1.227-1.838 2.2.824a.75.75 0 00.943-1.162l-2.202-3.598a2.5 2.5 0 00-3.213-.55l-.504.42V4.399A2.5 2.5 0 0011.074 2.5zM6.25 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /><path d="M5.5 15a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM14.5 15a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg>,
  transformations: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 3A1.5 1.5 0 013 1.5h14A1.5 1.5 0 0118.5 3V17a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 17V3zm10.25 1.75a.75.75 0 00-1.5 0V8.5H6a.75.75 0 000 1.5h4.25V13.5a.75.75 0 001.5 0V10h3.75a.75.75 0 000-1.5H11.75V4.75z" clipRule="evenodd" /></svg>, 
};

const Navbar: React.FC = () => {
  const { currentUser, logout, isAdmin, isSubscribed, unreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setMobileMenuOpen(false);
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 focus:scale-105 active:scale-95 ${
      isActive ? `bg-${THEME_COLORS.primary} text-white shadow-md` : `text-slate-300 hover:bg-slate-700 hover:text-slate-100` // Updated hover text
    }`;
  
  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block w-full text-right rtl:text-left px-3 py-3 rounded-md text-base font-medium ${
      isActive ? `bg-${THEME_COLORS.primary} text-white` : `text-slate-300 hover:bg-slate-700 hover:text-slate-100` // Updated hover text
    }`;


  const toggleNotifications = () => setShowNotifications(!showNotifications);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <nav className={`bg-${THEME_COLORS.surface} shadow-xl sticky top-0 z-40`}>
      <div className="container mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className={`text-2xl sm:text-3xl font-bold text-${THEME_COLORS.primary} hover:opacity-80 transition-opacity`}>
            {t('appName')}
          </Link>
          
          <div className="hidden md:flex items-center space-x-1 xs:space-x-2 sm:space-x-3 rtl:space-x-reverse">
            {currentUser ? (
              <>
                <NavLink to="/user/dashboard" className={navLinkClasses}>{NavIcons.dashboard} <span className="hidden sm:inline">{t('dashboard')}</span></NavLink>
                {(isSubscribed || isAdmin) && <NavLink to="/content/workouts" className={navLinkClasses}>{NavIcons.workouts} <span className="hidden sm:inline">{t('workouts')}</span></NavLink>}
                {(isSubscribed || isAdmin) && <NavLink to="/content/nutrition" className={navLinkClasses}>{NavIcons.nutrition} <span className="hidden sm:inline">{t('nutrition')}</span></NavLink>}
                <NavLink to="/transformations" className={navLinkClasses}>{NavIcons.transformations} <span className="hidden sm:inline">{t('transformations')}</span></NavLink>
                {(!isAdmin || currentUser.role === UserRole.USER) && <NavLink to="/user/subscriptions" className={navLinkClasses}>{t('subscriptions')}</NavLink>}
                {isAdmin && <NavLink to="/admin" className={navLinkClasses}>{NavIcons.admin} <span className="hidden sm:inline">{t('adminPanel')}</span></NavLink>}
                <NavLink to="/user/profile" className={navLinkClasses}>{NavIcons.profile} <span className="hidden sm:inline">{t('profile')}</span></NavLink>
              </>
            ) : (
              <NavLink to="/auth" className={navLinkClasses}>{t('login')}</NavLink>
            )}
          </div>

          <div className="flex items-center">
            {currentUser && (
                <div className="relative" ref={notificationRef}>
                    <button onClick={toggleNotifications} className={`p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${THEME_COLORS.surface} focus:ring-${THEME_COLORS.primary} transition-colors`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadNotifications.length > 0 && (
                        <span className={`absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-${THEME_COLORS.accent} text-xs font-bold text-white`}>
                        {unreadNotifications.length}
                        </span>
                    )}
                    </button>
                    {showNotifications && (
                    <div className={`absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-64 xs:w-72 sm:w-80 md:w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50`}> {/* Changed bg to slate-800 for pop */}
                        <div className={`p-2 sm:p-3 flex justify-between items-center border-b border-slate-700 bg-slate-700`}>
                        <h3 className="font-semibold text-slate-100 text-sm sm:text-base">{t('notifications')}</h3>
                        {unreadNotifications.length > 0 && 
                            <Button onClick={markAllNotificationsAsRead} variant="ghost" size="sm" className={`text-xs !px-1.5 sm:!px-2 !py-0.5 sm:!py-1 border-${THEME_COLORS.primary} text-${THEME_COLORS.primary}`}>{t('markAllAsRead')}</Button>
                        }
                        </div>
                        {unreadNotifications.length === 0 ? (
                        <p className="p-3 sm:p-4 text-xs sm:text-sm text-slate-400 text-center">{t('noNewNotifications')}</p>
                        ) : (
                        <ul className="max-h-60 sm:max-h-80 overflow-y-auto divide-y divide-slate-700">
                            {unreadNotifications.map(notification => (
                            <li key={notification.id} className="p-2 sm:p-3 hover:bg-slate-700 transition-colors">
                                <p className="text-xs sm:text-sm text-slate-100 mb-1">{notification.message}</p> {/* Brighter text for notification message */}
                                <div className="flex justify-between items-center">
                                <p className="text-xs text-slate-500">{new Date(notification.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                <button onClick={() => markNotificationAsRead(notification.id)} className={`text-xs text-${THEME_COLORS.primary} hover:text-${THEME_COLORS.primaryHover}`}> {/* Changed to primary color */}
                                    {t('markAsRead')}
                                </button>
                                </div>
                            </li>
                            ))}
                        </ul>
                        )}
                    </div>
                    )}
                </div>
            )}

            <div className="md:hidden flex items-center">
                {currentUser && (
                    <button
                        onClick={handleLogout}
                        className={`p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${THEME_COLORS.surface} focus:ring-${THEME_COLORS.primary} transition-colors mx-1 xs:mx-2`}
                        aria-label={t('logout')}
                    >
                        {NavIcons.logout}
                    </button>
                )}
                 <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    type="button"
                    className={`inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-slate-300 hover:text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-${THEME_COLORS.primary}`}
                    aria-controls="mobile-menu"
                    aria-expanded={mobileMenuOpen}
                >
                    <span className="sr-only">Open main menu</span>
                    {mobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    )}
                </button>
            </div>
             {currentUser && (
              <div className="hidden md:flex items-center">
                <button onClick={handleLogout} className={navLinkClasses({isActive:false})}>
                  {NavIcons.logout} <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </div>
            )}
             {!currentUser && (
                <div className="hidden md:flex items-center">
                    <NavLink to="/auth" className={navLinkClasses({isActive: false})}>{t('login')}</NavLink>
                </div>
             )}
          </div>
        </div>

        {mobileMenuOpen && (
            <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {currentUser ? (
                <>
                    <NavLink to="/user/dashboard" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('dashboard')}</NavLink>
                    {(isSubscribed || isAdmin) && <NavLink to="/content/workouts" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('workouts')}</NavLink>}
                    {(isSubscribed || isAdmin) && <NavLink to="/content/nutrition" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('nutrition')}</NavLink>}
                    <NavLink to="/transformations" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('transformations')}</NavLink>
                    {(!isAdmin || currentUser.role === UserRole.USER) && <NavLink to="/user/subscriptions" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('subscriptions')}</NavLink>}
                    {isAdmin && <NavLink to="/admin" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('adminPanel')}</NavLink>}
                    <NavLink to="/user/profile" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('profile')}</NavLink>
                </>
                ) : (
                <NavLink to="/auth" className={mobileNavLinkClasses} onClick={()=>setMobileMenuOpen(false)}>{t('login')}</NavLink>
                )}
            </div>
            </div>
        )}
    </nav>
  );
};

const Footer: React.FC = () => {
  const { t } = useLocalization();
  return (
    <footer className={`bg-${THEME_COLORS.surface} text-center py-6 sm:py-8 mt-auto border-t border-slate-700`}>
      <p className={`text-${THEME_COLORS.textSecondary} text-xs sm:text-sm`}>
        &copy; {new Date().getFullYear()} {t('appName')}. {t('tagline')}.
      </p>
    </footer>
  );
};

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SITE_MANAGER) {
        navigate('/admin');
      } else {
        navigate('/user/dashboard');
      }
    } else {
      navigate('/auth'); 
    }
  }, [currentUser, navigate]);
  
  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <Spinner size="lg" color={`border-${THEME_COLORS.primary}`} />
        <p className={`mt-4 text-lg sm:text-xl text-${THEME_COLORS.textPrimary}`}>{AR_TRANSLATIONS.loading as string || "جاري التحميل..."}</p>
    </div>
  );
};


const NotFoundPage: React.FC = () => {
  const { t } = useLocalization();
  const navigate = useNavigate(); 
  return (
    <div className="text-center py-10 sm:py-16">
      <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-${THEME_COLORS.error} mb-4 sm:mb-6 animate-pulse`}>404</h1>
      <h2 className={`text-2xl sm:text-3xl font-semibold text-${THEME_COLORS.textPrimary} mb-3 sm:mb-4`}>{t('pageNotFound', 'الصفحة غير موجودة')}</h2>
      <p className={`text-md sm:text-lg text-${THEME_COLORS.textSecondary} mb-6 sm:mb-8`}>{t('pageNotFoundText', 'عذرًا، الصفحة التي تبحث عنها غير موجودة.')}</p>
      <Button onClick={() => navigate('/')} variant="primary" size="lg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 me-2">
          <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.707V17.5a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 0111 17.5V15a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v2.5A1.5 1.5 0 017.5 19h-3A1.5 1.5 0 013 17.5V10.707a1 1 0 01.293-.707l7-7z" clipRule="evenodd" />
        </svg>
        {t('goHome', 'العودة إلى الصفحة الرئيسية')}
      </Button>
    </div>
  );
};

export default App;
