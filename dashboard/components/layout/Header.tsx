'use client';

import { useStore } from '@/store/dashboard';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const { loja_id, loja_name } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-secondary border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{loja_name || 'Loja'}</h2>
          <p className="text-xs text-gray-400">ID: {loja_id}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                U
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-secondary border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                <Link
                  href="/perfil"
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700"
                >
                  <User size={18} />
                  <span>Meu Perfil</span>
                </Link>

                <Link
                  href="/configuracoes"
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 border-t border-gray-700"
                >
                  <Settings size={18} />
                  <span>Configurações</span>
                </Link>

                <button className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-gray-700 border-t border-gray-700">
                  <LogOut size={18} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
