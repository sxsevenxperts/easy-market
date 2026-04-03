'use client';

import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md';
  isLoading?: boolean;
}

export default function QuickAction({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  size = 'sm',
  isLoading = false,
}: QuickActionProps) {
  const variantClasses = {
    primary: 'hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400',
    danger: 'hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400',
    success: 'hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400',
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
  };

  const iconSize = {
    sm: 16,
    md: 20,
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      title={label}
      className={`rounded-lg transition-colors ${sizeClasses[size]} ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-label={label}
    >
      <Icon size={iconSize[size]} />
    </button>
  );
}
