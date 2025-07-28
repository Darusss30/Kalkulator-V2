import React from 'react';
import { clsx } from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = '',
  fullScreen = false 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };
  
  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };
  
  const spinnerClasses = clsx(
    'animate-spin rounded-full border-2 border-transparent',
    sizeClasses[size],
    colorClasses[color],
    'border-t-current',
    className
  );
  
  const content = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={spinnerClasses} />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  
  return content;
};

export default LoadingSpinner;
