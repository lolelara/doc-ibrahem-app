import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'link';
  size?: 'sm' | 'default';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseClasses = "font-semibold rounded focus:outline-none focus:ring-2 focus:ring-opacity-60 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  
  const sizeClasses = {
    default: 'py-2 px-4 text-base', 
    sm: 'py-1 px-2 text-xs',  
  };

  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black focus:ring-yellow-400', // Text black for better contrast on yellow
    link: 'bg-transparent hover:bg-gray-700 text-blue-400 hover:text-blue-300 focus:ring-blue-400'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg 
          className={`animate-spin -ms-1 me-3 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-white`} // Ensure spinner is visible
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};

export default Button;