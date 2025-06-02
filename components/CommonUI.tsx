
import React, { ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App'; // Assuming AuthContext is exported from App.tsx
import { THEME_COLORS, AR_TRANSLATIONS } from '../constants';
import { UserRole } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }) => {
  const baseStyle = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = `bg-${THEME_COLORS.primary} hover:bg-${THEME_COLORS.primaryHover} text-white focus:ring-${THEME_COLORS.primary}`;
      break;
    case 'secondary':
      variantStyle = `bg-${THEME_COLORS.secondary} hover:bg-${THEME_COLORS.secondaryHover} text-white focus:ring-${THEME_COLORS.secondary}`;
      break;
    case 'danger':
      variantStyle = `bg-${THEME_COLORS.error} hover:bg-red-600 text-white focus:ring-${THEME_COLORS.error}`;
      break;
    case 'ghost':
      variantStyle = `bg-transparent hover:bg-gray-700 text-${THEME_COLORS.textSecondary} focus:ring-gray-500 border border-gray-600`;
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm': sizeStyle = 'px-3 py-1.5 text-sm'; break;
    case 'md': sizeStyle = 'px-4 py-2 text-base'; break;
    case 'lg': sizeStyle = 'px-6 py-3 text-lg'; break;
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
      {label && <label htmlFor={id} className={`block text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{label}</label>}
      <input
        id={id}
        className={`block w-full px-3 py-2 bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} sm:text-sm text-white ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
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
      {label && <label htmlFor={id} className={`block text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{label}</label>}
      <textarea
        id={id}
        rows={4}
        className={`block w-full px-3 py-2 bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} sm:text-sm text-white ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  let sizeClass = 'max-w-md';
  if (size === 'sm') sizeClass = 'max-w-sm';
  if (size === 'lg') sizeClass = 'max-w-lg';
  if (size === 'xl') sizeClass = 'max-w-xl';


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className={`relative bg-${THEME_COLORS.surface} rounded-lg shadow-xl p-6 w-full ${sizeClass} transform transition-all`}>
        <div className="flex justify-between items-center pb-3 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white" id="modal-title">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4">
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
  const hoverEffect = onClick ? `hover:shadow-lg hover:border-${THEME_COLORS.primary} cursor-pointer` : '';
  return (
    <div 
      className={`bg-${THEME_COLORS.surface} rounded-xl shadow-md overflow-hidden border border-gray-700 transition-all duration-200 ${hoverEffect} ${className}`}
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
    case 'sm': sizeClasses = 'w-4 h-4'; break;
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
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 bg-opacity-75">
      <Spinner size="lg" />
      {message && <p className="mt-4 text-lg text-white">{message || AR_TRANSLATIONS.loading as string}</p>}
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

  if (auth.loading) {
    return <LoadingOverlay message={AR_TRANSLATIONS.loading as string} />;
  }

  if (!auth.currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.currentUser.role)) {
     // Could redirect to an "Access Denied" page or back to dashboard
    return <Navigate to="/dashboard" state={{ message: AR_TRANSLATIONS.adminAccessOnly }} replace />;
  }
  
  if (requireSubscription && auth.currentUser.role !== UserRole.ADMIN) {
    const isActiveSub = auth.currentUser.subscriptionStatus === 'active' && 
                        auth.currentUser.subscriptionExpiry && 
                        new Date(auth.currentUser.subscriptionExpiry) > new Date();
    if (!isActiveSub) {
      return <Navigate to="/user/subscriptions" state={{ message: AR_TRANSLATIONS.accessDenied }} replace />;
    }
  }

  return <>{children}</>;
};
