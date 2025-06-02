
import React, { ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext, useLocalization, LocalizationContext } from '../App'; // Assuming AuthContext is exported from App.tsx
import { THEME_COLORS, AR_TRANSLATIONS } from '../constants';
import { UserRole } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }) => {
  const baseStyle = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 focus:scale-105 active:scale-95 flex items-center justify-center shadow-md hover:shadow-lg';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = `bg-${THEME_COLORS.primary} hover:bg-${THEME_COLORS.primaryHover} text-white focus:ring-${THEME_COLORS.primary}`;
      break;
    case 'secondary':
      variantStyle = `bg-${THEME_COLORS.secondary} hover:bg-${THEME_COLORS.secondaryHover} text-black focus:ring-${THEME_COLORS.secondary}`; // Text black for lime green
      break;
    case 'accent':
      variantStyle = `bg-${THEME_COLORS.accent} hover:bg-${THEME_COLORS.accentHover} text-white focus:ring-${THEME_COLORS.accent}`;
      break;
    case 'danger':
      variantStyle = `bg-${THEME_COLORS.error} hover:bg-red-600 text-white focus:ring-${THEME_COLORS.error}`;
      break;
    case 'ghost':
      variantStyle = `bg-transparent hover:bg-slate-700 text-${THEME_COLORS.textSecondary} focus:ring-slate-500 border border-slate-600 shadow-none hover:shadow-none`;
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm': sizeStyle = 'px-3 py-1.5 text-xs'; break;
    case 'md': sizeStyle = 'px-5 py-2.5 text-sm'; break;
    case 'lg': sizeStyle = 'px-6 py-3 text-base'; break;
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Spinner size="sm" className="me-2" />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className={`block text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1.5`}>{label}</label>}
      <input
        id={id}
        className={`block w-full px-4 py-2.5 bg-slate-700 border ${error ? `border-${THEME_COLORS.error}` : `border-slate-600`} rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} sm:text-sm text-slate-100 transition-colors duration-150 ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className={`block text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1.5`}>{label}</label>}
      <textarea
        id={id}
        rows={4}
        className={`block w-full px-4 py-2.5 bg-slate-700 border ${error ? `border-${THEME_COLORS.error}` : `border-slate-600`} rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} sm:text-sm text-slate-100 transition-colors duration-150 ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
};


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  let sizeClass = 'max-w-md'; // md
  if (size === 'sm') sizeClass = 'max-w-sm';
  if (size === 'lg') sizeClass = 'max-w-lg';
  if (size === 'xl') sizeClass = 'max-w-xl';
  if (size === '2xl') sizeClass = 'max-w-2xl';


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className={`relative bg-${THEME_COLORS.surface} rounded-xl shadow-2xl p-6 w-full ${sizeClass} transform transition-all duration-300 ease-out max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-700 mb-4">
          <h3 className={`text-xl font-bold text-${THEME_COLORS.primary}`} id="modal-title">{title}</h3>
          <button onClick={onClose} className={`text-slate-400 hover:text-${THEME_COLORS.accent} transition-colors p-1 rounded-full hover:bg-slate-700`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-grow pr-1"> {/* Added pr-1 for scrollbar space */}
          {children}
        </div>
      </div>
    </div>
  );
};

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const hoverEffect = onClick ? `hover:shadow-2xl hover:border-${THEME_COLORS.primary} cursor-pointer transform hover:-translate-y-1` : 'shadow-xl';
  return (
    <div 
      className={`bg-${THEME_COLORS.surface} rounded-xl overflow-hidden border border-slate-700 transition-all duration-300 ease-out ${hoverEffect} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string; // Tailwind color class e.g., border-sky-500
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', color }) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm': sizeClasses = 'w-5 h-5'; break;
    case 'md': sizeClasses = 'w-8 h-8'; break;
    case 'lg': sizeClasses = 'w-12 h-12'; break;
  }
  const borderColor = color || `border-${THEME_COLORS.primary}`;

  return (
    <div className={`animate-spin rounded-full ${sizeClasses} border-t-2 border-b-2 ${borderColor} ${className}`}></div>
  );
};

interface LoadingOverlayProps {
  message?: string;
}
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  // Attempt to use localization, but provide a fallback.
  let displayText = message;
  try {
    // useLocalization() hook itself is now more robust and provides a fallback if context is null
    const loc = useLocalization(); 
    displayText = message || loc.t('loading'); 
  } catch (e) {
    // This catch block might not be strictly necessary if useLocalization is already safe,
    // but kept for extreme robustness.
    displayText = message || (AR_TRANSLATIONS.loading as string || "Loading...");
    console.warn("Error accessing localization in LoadingOverlay, using fallback:", e);
  }
  
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-${THEME_COLORS.background} bg-opacity-90 backdrop-blur-sm`}>
      <Spinner size="lg" color={`border-${THEME_COLORS.primary}`} />
      <p className={`mt-4 text-lg text-${THEME_COLORS.textPrimary}`}>{displayText}</p>
    </div>
  );
};


interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[]; // If not provided, just checks for authentication
  requireSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requireSubscription = false }) => {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const { t } = useLocalization(); // This is safe here as ProtectedRoute is always within LocalizationContext.Provider via App.tsx

  if (auth.loading) {
    return <LoadingOverlay message={t('loading')} />;
  }

  if (!auth.currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.currentUser.role)) {
    // Use a static string or ensure t is available if navigating to a page that might also be outside context initially
    return <Navigate to="/user/dashboard" state={{ message: t('adminAccessOnly') }} replace />;
  }
  
  if (requireSubscription && auth.currentUser.role !== UserRole.ADMIN && auth.currentUser.role !== UserRole.SITE_MANAGER) {
    const isActiveSub = auth.currentUser.subscriptionStatus === 'active' && 
                        auth.currentUser.subscriptionExpiry && 
                        new Date(auth.currentUser.subscriptionExpiry) > new Date();
    if (!isActiveSub) {
      return <Navigate to="/user/subscriptions" state={{ message: t('accessDenied') }} replace />;
    }
  }

  return <>{children}</>;
};
