'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href: string;
}

const breadcrumbLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'alertas': 'Alertas',
  'estoque': 'Estoque',
  'previsoes': 'Previsões',
  'relatorios': 'Relatórios',
  'vendas': 'Vendas',
  'dashboard-gondolas': 'Gôndolas',
  'configuracoes': 'Configurações',
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/' },
  ];

  let currentPath = '';
  segments.forEach(segment => {
    currentPath += `/${segment}`;
    const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ label, href: currentPath });
  });

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2">
          {index === 0 && <Home size={16} />}
          {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-gray-900 dark:text-white">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
