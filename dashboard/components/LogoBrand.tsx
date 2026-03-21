import React from 'react';
import Link from 'next/link';

interface LogoBrandProps {
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: {
    icon: 'w-10 h-10 text-lg',
    title: 'text-base',
    subtitle: 'text-xs',
    gap: 'gap-2',
    padding: 'p-2',
  },
  md: {
    icon: 'w-12 h-12 text-xl',
    title: 'text-lg',
    subtitle: 'text-sm',
    gap: 'gap-3',
    padding: 'p-3',
  },
  lg: {
    icon: 'w-16 h-16 text-2xl',
    title: 'text-2xl',
    subtitle: 'text-base',
    gap: 'gap-4',
    padding: 'p-4',
  },
};

/**
 * Logo Brand do Easy Market
 * Exibe o quadrado azul com "EM" + texto "Easy Market" e "Dashboard Inteligente"
 */
export const LogoBrand: React.FC<LogoBrandProps> = ({
  showSubtitle = true,
  size = 'md',
  href = '/',
  className = '',
}) => {
  const sizes = sizeMap[size];

  const content = (
    <div className={`flex items-center ${sizes.gap} cursor-pointer hover:opacity-90 transition-opacity ${className}`}>
      {/* EM Icon - Blue Square */}
      <div className={`${sizes.icon} ${sizes.padding} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg hover:shadow-xl transition-shadow`}>
        EM
      </div>

      {/* Text */}
      {size !== 'sm' && (
        <div className="flex flex-col">
          <h1 className={`${sizes.title} font-bold text-white tracking-tight`}>
            Easy Market
          </h1>
          {showSubtitle && (
            <p className={`${sizes.subtitle} text-gray-400`}>
              Dashboard Inteligente
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Return as link or just div
  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

/**
 * Logo Icon Only (EM square)
 * Para navbar compacta ou favicon
 */
export const LogoBrandIcon: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = sizeMap[size];

  return (
    <div
      className={`${sizes.icon} ${sizes.padding} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${className}`}
    >
      EM
    </div>
  );
};

export default LogoBrand;
