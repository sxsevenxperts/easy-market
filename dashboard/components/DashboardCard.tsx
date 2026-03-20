import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  positive?: boolean;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  positive = true,
}: DashboardCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-accent">{icon}</div>}
      </div>

      {trend && (
        <div className="flex items-center gap-2 text-sm">
          {positive ? (
            <TrendingUp className="text-success" size={16} />
          ) : (
            <TrendingDown className="text-danger" size={16} />
          )}
          <span className={positive ? 'text-success' : 'text-danger'}>{trend}</span>
        </div>
      )}
    </div>
  );
}
