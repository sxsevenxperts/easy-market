'use client';

import { useStore } from '@/store/dashboard';
import { Bell, User, LogOut, Settings, Home, Menu } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { LogoBrand } from '@/components/LogoBrand';

export default function Header() {
  const { loja_id, loja_name } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo & Store Info */}
          <div className="flex items-center gap-4">
            {/* Logo Brand */}
            <LogoBrand size="sm" href="/" showSubtitle={false} className="hidden sm:flex" />

            {/* Divider */}
            <div className="hidden sm:block w-px h-10 bg-gray-700" />

            {/* Store Info */}
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-white">{loja_name || 'Loja'}</p>
                  <p className="text-xs text-gray-400">{loja_id || 'ID da loja'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Home Button */}
            <Link
              href="/"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Início"
            >
              <Home size={20} />
            </Link>

            {/* Notifications */}
            <button
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200 group"
              title="Notificações"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Notificações
              </span>
            </button>

            {/* Divider - Mobile hidden */}
            <div className="hidden sm:block w-px h-6 bg-gray-700" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Menu do usuário"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                  U
                </div>
                <Menu size={20} className="block sm:hidden" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Menu Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 border-b border-gray-700">
                    <p className="text-sm font-semibold text-white">Usuário</p>
                    <p className="text-xs text-gray-200 mt-0.5">Gerenciar conta</p>
                  </div>

                  {/* Menu Items */}
                  <Link
                    href="/configuracoes"
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings size={18} className="text-blue-400" />
                    <span className="font-medium">Configurações</span>
                  </Link>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 border-t border-gray-700 transition-colors group"
                    onClick={() => setShowMenu(false)}
                  >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500" />
    </header>
  );
}
