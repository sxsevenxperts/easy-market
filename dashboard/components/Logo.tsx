import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

/**
 * Componente Logo do Easy Market
 * 
 * Uso:
 * <Logo /> - Tamanho padrão (md)
 * <Logo size="sm" /> - Pequeno (navbar)
 * <Logo size="lg" showText /> - Grande com texto (login)
 * <Logo size="xl" showText className="my-4" /> - Com classes customizadas
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Logo Icon */}
      <svg
        className={`${sizeMap[size]} flex-shrink-0`}
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Shopping Cart Body (Left side) */}
        <g transform="translate(350, 250)">
          {/* Cart outline - Blue */}
          <path
            fill="#0066CC"
            d="M 80 30 L 20 150 Q 10 160 20 170 L 280 170 Q 290 160 280 150 L 230 30 Z"
          />
          {/* Cart wheels - Blue */}
          <circle fill="#0066CC" cx="60" cy="185" r="22" />
          <circle fill="#0066CC" cx="260" cy="185" r="22" />
          {/* Cart handle - Blue */}
          <path
            fill="#0066CC"
            d="M 150 30 Q 150 -40 150 -60"
            stroke="#0066CC"
            strokeWidth="28"
            strokeLinecap="round"
          />
        </g>

        {/* Right side - Growth Arrow & Sparkles */}
        <g transform="translate(480, 200)">
          {/* Outer circle - Orange arc */}
          <circle
            cx="200"
            cy="150"
            r="180"
            fill="none"
            stroke="#FF9500"
            strokeWidth="35"
            strokeDasharray="283,565"
            strokeLinecap="round"
          />

          {/* Arrow going up-right - Orange */}
          <g>
            <path
              fill="none"
              stroke="#FF9500"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M 100 200 L 280 80 M 280 80 L 250 100 M 280 80 L 260 50"
            />
          </g>

          {/* Sparkles */}
          {/* Large center sparkle - Orange */}
          <g transform="translate(150, 140)">
            <path
              fill="#FF9500"
              d="M 0 -30 L 8 -8 L 30 0 L 8 8 L 0 30 L -8 8 L -30 0 L -8 -8 Z"
            />
          </g>

          {/* Small sparkle top-left - Teal */}
          <g transform="translate(80, 80)">
            <path
              fill="#009999"
              d="M 0 -20 L 5 -6 L 20 0 L 5 6 L 0 20 L -5 6 L -20 0 L -5 -6 Z"
            />
          </g>

          {/* Small sparkle top-right - Orange */}
          <g transform="translate(200, 60)">
            <path
              fill="#FF9500"
              d="M 0 -15 L 4 -5 L 15 0 L 4 5 L 0 15 L -4 5 L -15 0 L -4 -5 Z"
            />
          </g>

          {/* Dots - Green */}
          <circle fill="#00A651" cx="240" cy="90" r="8" />
          <circle fill="#00A651" cx="260" cy="130" r="6" />
          <circle fill="#00A651" cx="270" cy="170" r="5" />
        </g>

        {/* Bottom arc - Green */}
        <g transform="translate(250, 300)">
          <circle
            cx="250"
            cy="150"
            r="180"
            fill="none"
            stroke="#00A651"
            strokeWidth="35"
            strokeDasharray="283,565"
            strokeDashoffset="-283"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* Optional Text */}
      {showText && (
        <div className="mt-4 text-center">
          <div className={`font-bold text-gray-900 tracking-wider ${textSizeMap[size]}`}>
            EASY MARKET
          </div>
          <div className="text-gray-500 text-sm tracking-wide">By Seven Xperts</div>
        </div>
      )}
    </div>
  );
};

/**
 * Logo Icon Only (sem texto, mais compacto)
 * Útil para navbar e favicon
 */
export const LogoIcon: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  return <Logo size={size} showText={false} />;
};

/**
 * Logo Completo (com texto)
 * Útil para login, hero sections, etc
 */
export const LogoFull: React.FC<{ size?: 'lg' | 'xl'; className?: string }> = ({
  size = 'lg',
  className = '',
}) => {
  return <Logo size={size} showText={true} className={className} />;
};

export default Logo;
