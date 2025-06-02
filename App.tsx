
import React, { useState, useEffect, createContext, ReactNode, useCallback, useContext } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, UserRole, Translations } from './types';
import * as DataService from './services/dataService';
import { APP_NAME, AR_TRANSLATIONS, THEME_COLORS, ADMIN_EMAIL } from './constants';
import AuthPage from './pages/AuthPage';
import UserPages from './pages/UserPages';
import ContentPages from './pages/ContentPages';
import AdminPage from './pages/AdminPage';
import { Spinner, LoadingOverlay } from './components/CommonUI';

// Contexts
interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
  isAdmin: boolean; // True if ADMIN or SITE_MANAGER
  isSiteManager: boolean; // True only if SITE_MANAGER
  isSubscribed: boolean;
  refreshUser: () => void;
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
export const useLocalization = () => useContext(LocalizationContext);

const App: React.FC = () => {
  const [currentUser, setCurrentUserInternal] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState('ar'); // Default to Arabic
  const [translations, setTranslations] = useState<Translations>(AR_TRANSLATIONS);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserInternal(user);
    if (user) {
      localStorage.setItem('fitzone_currentUserEmail', user.email);
    } else {
      localStorage.removeItem('fitzone_currentUserEmail');
    }
  };
  
  const refreshUser = useCallback(() => {
    if (currentUser) {
      const updatedUser = DataService.checkUserSubscriptionStatus(currentUser.id);
      if (updatedUser) {
         setCurrentUserInternal(updatedUser); // Use internal setter to avoid loop if setCurrentUser has other side effects
      }
    }
  }, [currentUser]);


  useEffect(() => {
    const storedUserEmail = localStorage.getItem('fitzone_currentUserEmail');
    if (storedUserEmail) {
      const user = DataService.getUserByEmail(storedUserEmail);
      if (user) {
        const checkedUser = DataService.checkUserSubscriptionStatus(user.id);
        setCurrentUserInternal(checkedUser || user);
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setCurrentUser(null);
    // navigate to home or login page, handled by ProtectedRoute
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    // In a real app, load translations for 'lang'
    if (lang === 'ar') {
      setTranslations(AR_TRANSLATIONS);
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    } else {
      // Fallback or load English translations
      // For now, only Arabic is supported
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  };

  const t = (key: string, subkey?: string): string => {
    if (subkey) {
      const mainKey = translations[key];
      if (typeof mainKey === 'object' && mainKey !== null) {
        return (mainKey as Translations)[subkey] as string || `${key}.${subkey}`;
      }
      return `${key}.${subkey}`;
    }
    return translations[key] as string || key;
  };
  
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SITE_MANAGER;
  const isSiteManager = currentUser?.role === UserRole.SITE_MANAGER;
  const isSubscribed = currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.SITE_MANAGER && currentUser?.subscriptionStatus === 'active' && !!currentUser.subscriptionExpiry && new Date(currentUser.subscriptionExpiry) > new Date();


  if (loading) {
    return <LoadingOverlay message={t('loading')} />;
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, logout, loading, isAdmin, isSiteManager, isSubscribed, refreshUser }}>
      <LocalizationContext.Provider value={{ language, setLanguage, translations, t }}>
        <HashRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/user/*" element={<UserPages />} />
                <Route path="/content/*" element={<ContentPages />} />
                <Route path="/admin/*" element={isAdmin ? <AdminPage /> : <NavigateToDashboard message={t('adminAccessOnly')} />} />
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
  // If there's a message, pass it along to be displayed on the dashboard
  return <Navigate to="/user/dashboard" state={{ from: location, message }} replace />;
}

// Define Navbar, Footer, HomePage, NotFoundPage here to keep file count low
const Navbar: React.FC = () => {
  const { currentUser, logout, isAdmin, isSubscribed } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? `bg-${THEME_COLORS.primary} text-white` : `text-gray-300 hover:bg-gray-700 hover:text-white`
    }`;

  return (
    <nav className={`bg-${THEME_COLORS.surface} shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className={`text-2xl font-bold text-${THEME_COLORS.primary}`}>
            {t('appName')}
          </Link>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {currentUser ? (
              <>
                <NavLink to="/user/dashboard" className={navLinkClasses}>{t('dashboard')}</NavLink>
                {(isSubscribed || isAdmin) && <NavLink to="/content/workouts" className={navLinkClasses}>{t('workouts')}</NavLink>}
                {(isSubscribed || isAdmin) && <NavLink to="/content/nutrition" className={navLinkClasses}>{t('nutrition')}</NavLink>}
                {(!isAdmin || currentUser.role === UserRole.USER) && <NavLink to="/user/subscriptions" className={navLinkClasses}>{t('subscriptions')}</NavLink>}
                {isAdmin && <NavLink to="/admin" className={navLinkClasses}>{t('adminPanel')}</NavLink>}
                <NavLink to="/user/profile" className={navLinkClasses}>{t('profile')}</NavLink>
                <button onClick={handleLogout} className={navLinkClasses({isActive:false})}>
                  {t('logout')}
                </button>
              </>
            ) : (
              <NavLink to="/auth" className={navLinkClasses}>{t('login')}</NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => {
  const { t } = useLocalization();
  return (
    <footer className={`bg-${THEME_COLORS.surface} text-center py-6 mt-auto border-t border-gray-700`}>
      <p className={`text-${THEME_COLORS.textSecondary} text-sm`}>
        &copy; {new Date().getFullYear()} {t('appName')}. {t('tagline')}.
      </p>
    </footer>
  );
};

const HomePage: React.FC = () => {
  const { t } = useLocalization();
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
      navigate('/auth'); // Redirect to auth page if not logged in
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]);
  
  // This content will briefly show if redirection takes a moment, or if kept as a landing page.
  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-xl">{t('loading')}</p>
    </div>
  );
};


const NotFoundPage: React.FC = () => {
  const { t } = useLocalization();
  return (
    <div className="text-center py-10">
      <h1 className="text-4xl font-bold text-red-500 mb-4">404 - {t('pageNotFound', 'الصفحة غير موجودة')}</h1>
      <p className="text-xl text-gray-300 mb-6">{t('pageNotFoundText', 'عذرًا، الصفحة التي تبحث عنها غير موجودة.')}</p>
      <Link to="/" className={`text-${THEME_COLORS.primary} hover:text-${THEME_COLORS.primaryHover} font-semibold`}>
        {t('goHome', 'العودة إلى الصفحة الرئيسية')}
      </Link>
    </div>
  );
};

export default App;
