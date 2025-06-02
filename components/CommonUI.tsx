
import React, { ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext, useLocalization, LocalizationContext } from '../App'; 
import { THEME_COLORS, AR_TRANSLATIONS } from '../constants';
import { UserRole } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
      variantStyle = `bg-${THEME_COLORS.secondary} hover:bg-${THEME_COLORS.secondaryHover} text-black focus:ring-${THEME_COLORS.secondary}`; 
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
    case 'xs': sizeStyle = 'px-2 py-1 text-xs'; break; // New extra small size
    case 'sm': sizeStyle = 'px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-xs'; break;
    case 'md': sizeStyle = 'px-4 py-2 text-sm sm:px-5 sm:py-2.5'; break;
    case 'lg': sizeStyle = 'px-6 py-3 text-base'; break;
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Spinner size="sm" className="me-1 sm:me-2" />}
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
      {label && <label htmlFor={id} className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1 sm:mb-1.5`}>{label}</label>}
      <input
        id={id}
        className={`block w-full px-3 py-2 text-sm sm:text-base sm:px-4 sm:py-2 bg-slate-700 border ${error ? `border-${THEME_COLORS.error}` : `border-slate-600`} rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} text-slate-100 transition-colors duration-150 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 sm:mt-1.5 text-xs text-red-400">{error}</p>}
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
      {label && <label htmlFor={id} className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1 sm:mb-1.5`}>{label}</label>}
      <textarea
        id={id}
        rows={props.rows || 3} // Default to 3 rows if not specified
        className={`block w-full px-3 py-2 text-sm sm:text-base sm:px-4 sm:py-2 bg-slate-700 border ${error ? `border-${THEME_COLORS.error}` : `border-slate-600`} rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} text-slate-100 transition-colors duration-150 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 sm:mt-1.5 text-xs text-red-400">{error}</p>}
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

  let sizeClass = 'max-w-md'; 
  if (size === 'sm') sizeClass = 'max-w-sm';
  if (size === 'lg') sizeClass = 'max-w-lg';
  if (size === 'xl') sizeClass = 'max-w-xl';
  if (size === '2xl') sizeClass = 'max-w-2xl';


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity p-2 xs:p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className={`relative bg-${THEME_COLORS.surface} rounded-xl shadow-2xl p-3 xs:p-4 sm:p-6 w-full ${sizeClass} transform transition-all duration-300 ease-out max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center pb-2 sm:pb-4 border-b border-slate-700 mb-2 sm:mb-4">
          <h3 className={`text-md sm:text-lg font-bold text-${THEME_COLORS.primary}`} id="modal-title">{title}</h3>
          <button onClick={onClose} className={`text-slate-400 hover:text-${THEME_COLORS.accent} transition-colors p-1 rounded-full hover:bg-slate-700`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-grow pr-1"> 
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
  // Default padding can be added here if most cards need it, e.g. p-3 sm:p-4 md:p-6
  // Or let the parent component control padding via className for more flexibility.
  // For now, keeping it as provided, padding is usually applied where Card is used.
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
  color?: string; 
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', color }) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm': sizeClasses = 'w-4 h-4 sm:w-5 sm:h-5'; break;
    case 'md': sizeClasses = 'w-6 h-6 sm:w-8 sm:h-8'; break;
    case 'lg': sizeClasses = 'w-10 h-10 sm:w-12 sm:h-12'; break;
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
  let displayText = message;
  try {
    const loc = useLocalization(); 
    displayText = message || loc.t('loading'); 
  } catch (e) {
    displayText = message || (AR_TRANSLATIONS.loading as string || "Loading...");
    console.warn("Error accessing localization in LoadingOverlay, using fallback:", e);
  }
  
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-${THEME_COLORS.background} bg-opacity-90 backdrop-blur-sm`}>
      <Spinner size="lg" color={`border-${THEME_COLORS.primary}`} />
      <p className={`mt-3 sm:mt-4 text-md sm:text-lg text-${THEME_COLORS.textPrimary}`}>{displayText}</p>
    </div>
  );
};


interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[]; 
  requireSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requireSubscription = false }) => {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const { t } = useLocalization(); 

  if (auth.loading) {
    return <LoadingOverlay message={t('loading')} />;
  }

  if (!auth.currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.currentUser.role)) {
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