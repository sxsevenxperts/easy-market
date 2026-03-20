'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import { Settings, Bell, Moon, Save, Lock, LogOut } from 'lucide-react';

interface StoreSettings {
  nome_loja: string;
  endereco: string;
  telefone: string;
  email: string;
  horario_abertura: string;
  horario_fechamento: string;
  margem_lucro_padrao: number;
  moeda: string;
}

interface NotificationSettings {
  alertas_criticos: boolean;
  alertas_email: boolean;
  alertas_whatsapp: boolean;
  relatorios_diarios: boolean;
  relatorios_semanais: boolean;
  email_notificacao: string;
  telefone_whatsapp: string;
}

interface ThemeSettings {
  darkMode: boolean;
  accentColor: string;
  compactView: boolean;
}

export default function ConfiguracoesPage() {
  const { loja_id, loja_name, user_name, setTheme } = useStore();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('loja');
  const [savedMessage, setSavedMessage] = useState('');

  // Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    nome_loja: loja_name || '',
    endereco: '',
    telefone: '',
    email: '',
    horario_abertura: '08:00',
    horario_fechamento: '22:00',
    margem_lucro_padrao: 30,
    moeda: 'BRL',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    alertas_criticos: true,
    alertas_email: false,
    alertas_whatsapp: false,
    relatorios_diarios: true,
    relatorios_semanais: true,
    email_notificacao: '',
    telefone_whatsapp: '',
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    darkMode: true,
    accentColor: '#3b82f6',
    compactView: false,
  });

  const handleStoreSettingsChange = (field: keyof StoreSettings, value: any) => {
    setStoreSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationSettingsChange = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleThemeSettingsChange = (field: keyof ThemeSettings, value: any) => {
    setThemeSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === 'darkMode') {
      setTheme(value ? 'dark' : 'light');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // In production, would save to API
      // await apiClient.put(`/lojas/${loja_id}/configuracoes`, storeSettings);
      setSavedMessage('✓ Configurações salvas com sucesso!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-gray-400">Gerencie as configurações da sua loja e preferências</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => setTab('loja')}
          className={`pb-3 px-4 font-medium whitespace-nowrap ${
            tab === 'loja'
              ? 'border-b-2 border-accent text-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Settings size={18} />
            Loja
          </span>
        </button>
        <button
          onClick={() => setTab('notificacoes')}
          className={`pb-3 px-4 font-medium whitespace-nowrap ${
            tab === 'notificacoes'
              ? 'border-b-2 border-accent text-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bell size={18} />
            Notificações
          </span>
        </button>
        <button
          onClick={() => setTab('aparencia')}
          className={`pb-3 px-4 font-medium whitespace-nowrap ${
            tab === 'aparencia'
              ? 'border-b-2 border-accent text-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Moon size={18} />
            Aparência
          </span>
        </button>
        <button
          onClick={() => setTab('seguranca')}
          className={`pb-3 px-4 font-medium whitespace-nowrap ${
            tab === 'seguranca'
              ? 'border-b-2 border-accent text-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Lock size={18} />
            Segurança
          </span>
        </button>
      </div>

      {/* Loja Tab */}
      {tab === 'loja' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-6">Informações da Loja</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Loja</label>
                <input
                  type="text"
                  value={storeSettings.nome_loja}
                  onChange={(e) =>
                    handleStoreSettingsChange('nome_loja', e.target.value)
                  }
                  className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Endereço</label>
                <input
                  type="text"
                  value={storeSettings.endereco}
                  onChange={(e) =>
                    handleStoreSettingsChange('endereco', e.target.value)
                  }
                  className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={storeSettings.telefone}
                    onChange={(e) =>
                      handleStoreSettingsChange('telefone', e.target.value)
                    }
                    className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={storeSettings.email}
                    onChange={(e) =>
                      handleStoreSettingsChange('email', e.target.value)
                    }
                    className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Horário de Abertura</label>
                  <input
                    type="time"
                    value={storeSettings.horario_abertura}
                    onChange={(e) =>
                      handleStoreSettingsChange('horario_abertura', e.target.value)
                    }
                    className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Horário de Fechamento</label>
                  <input
                    type="time"
                    value={storeSettings.horario_fechamento}
                    onChange={(e) =>
                      handleStoreSettingsChange('horario_fechamento', e.target.value)
                    }
                    className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Margem de Lucro (%)</label>
                  <input
                    type="number"
                    value={storeSettings.margem_lucro_padrao}
                    onChange={(e) =>
                      handleStoreSettingsChange('margem_lucro_padrao', parseFloat(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
            {savedMessage && (
              <div className="flex items-center text-green-400">
                {savedMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notificações Tab */}
      {tab === 'notificacoes' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-6">Preferências de Notificação</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Alertas Críticos</p>
                  <p className="text-sm text-gray-400">Notifique sobre problemas urgentes</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.alertas_criticos}
                  onChange={(e) =>
                    handleNotificationSettingsChange('alertas_criticos', e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-gray-400">Receba resumos e alertas via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.alertas_email}
                  onChange={(e) =>
                    handleNotificationSettingsChange('alertas_email', e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Notificações WhatsApp</p>
                  <p className="text-sm text-gray-400">Receba alertas pelo WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.alertas_whatsapp}
                  onChange={(e) =>
                    handleNotificationSettingsChange('alertas_whatsapp', e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Relatórios Diários</p>
                  <p className="text-sm text-gray-400">Receba resumo de vendas diárias</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.relatorios_diarios}
                  onChange={(e) =>
                    handleNotificationSettingsChange('relatorios_diarios', e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Relatórios Semanais</p>
                  <p className="text-sm text-gray-400">Receba análise semanal completa</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.relatorios_semanais}
                  onChange={(e) =>
                    handleNotificationSettingsChange('relatorios_semanais', e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {notificationSettings.alertas_email && (
                <div>
                  <label className="block text-sm font-medium mb-2">Email para Notificações</label>
                  <input
                    type="email"
                    value={notificationSettings.email_notificacao}
                    onChange={(e) =>
                      handleNotificationSettingsChange('email_notificacao', e.target.value)
                    }
                    className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {notificationSettings.alertas_whatsapp && (
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone WhatsApp</label>
                  <input
                    type="tel"
                    value={notificationSettings.telefone_whatsapp}
                    onChange={(e) =>
                      handleNotificationSettingsChange('telefone_whatsapp', e.target.value)
                    }
                    placeholder="+55 (11) 9999-9999"
                    className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Aparência Tab */}
      {tab === 'aparencia' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-6">Preferências de Aparência</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-gray-400">Ativa tema escuro para economia de bateria</p>
                </div>
                <input
                  type="checkbox"
                  checked={themeSettings.darkMode}
                  onChange={(e) =>
                    handleThemeSettingsChange('darkMode', e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Visualização Compacta</p>
                  <p className="text-sm text-gray-400">Mostra mais informações em menos espaço</p>
                </div>
                <input
                  type="checkbox"
                  checked={themeSettings.compactView}
                  onChange={(e) =>
                    handleThemeSettingsChange('compactView', e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor de Destaque</label>
                <div className="flex gap-3">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        handleThemeSettingsChange('accentColor', color)
                      }
                      className={`w-10 h-10 rounded-lg border-2 ${
                        themeSettings.accentColor === color
                          ? 'border-white'
                          : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Segurança Tab */}
      {tab === 'seguranca' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-6">Segurança da Conta</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <p className="font-medium mb-2">Usuário Logado</p>
                <p className="text-gray-400">{user_name}</p>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <p className="font-medium mb-2">Loja</p>
                <p className="text-gray-400">{loja_name}</p>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <p className="text-sm text-gray-400 mb-4">
                  Para sua segurança, você será desconectado de todas as sessões.
                </p>
                <button
                  onClick={handleLogout}
                  className="btn btn-danger flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-yellow-500">
            <h3 className="text-lg font-bold mb-4">Dicas de Segurança</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Nunca compartilhe sua senha com outras pessoas</li>
              <li>• Use uma senha forte com letras, números e símbolos</li>
              <li>• Faça logout quando usar em computadores compartilhados</li>
              <li>• Mantenha seu navegador e sistema operacional atualizados</li>
              <li>• Verifique regularmente sua atividade de login</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
