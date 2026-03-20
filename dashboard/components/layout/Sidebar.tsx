'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Package,
  AlertCircle,
  TrendingUp,
  Settings,
  Menu,
  X,
  ShoppingCart,
  Activity,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: BarChart3 },
  { label: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { label: 'Estoque', href: '/estoque', icon: Package },
  { label: 'Previsões', href: '/previsoes', icon: TrendingUp },
  { label: 'Alertas', href: '/alertas', icon: AlertCircle },
  { label: 'Relatórios', href: '/relatorios', icon: Activity },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-secondary rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 h-screen bg-secondary border-r border-gray-700 transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-bold text-white">
              EM
            </div>
            <div>
              <h1 className="font-bold text-lg">Easy Market</h1>
              <p className="text-xs text-gray-400">Dashboard Inteligente</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-2">
            <p>Versão: 1.0.0</p>
            <p>© 2026 Easy Market</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
