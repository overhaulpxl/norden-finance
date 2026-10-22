import React from 'react';

export type ButtonVariant = 'primary' | 'light' | 'accent' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'brutal-btn',
    light: 'brutal-btn-light',
    accent: 'brutal-btn-accent',
    danger: 'brutal-btn-danger',
  }[variant];

  return (
    <button
      className={`${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}
