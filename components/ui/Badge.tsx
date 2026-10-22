import React from 'react';

export type BadgeVariant = 'yellow' | 'mint' | 'coral' | 'blue' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'neutral',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variantClass = {
    yellow: 'brutal-badge-yellow',
    mint: 'brutal-badge-mint',
    coral: 'brutal-badge-coral',
    blue: 'brutal-badge-blue',
    neutral: 'brutal-badge-neutral',
  }[variant];

  return (
    <span className={`brutal-badge ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
