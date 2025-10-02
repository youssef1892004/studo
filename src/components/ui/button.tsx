
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
}

const Button = ({ children, className, variant = 'default', ...props }: ButtonProps) => {
  const baseStyle = "font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  const variantStyles = {
    default: "bg-blue-500 hover:bg-blue-600 text-white",
    outline: "bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-100"
  };

  const combinedClassName = `${baseStyle} ${variantStyles[variant]} ${className || 'py-2 px-4'}`;

  return (
    <button
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
