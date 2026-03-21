'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import { Plus, Edit2, Trash2, Send, Phone, MessageSquare, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface Contato {
  id: string;
  nome: string;
  cargo?: string;
  setores?: string[];
  telefone_whatsapp?: string;
  telefone_sms?: string;
  email?: string;
  ativo: boolean;
  receber_alertas_criticos: boolean;
  receber_alertas_whatsapp: boolean;
  receber_alertas_sms: boolean;
  receber_alertas_email: boolean;
  receber_relatorios: boolean;
}

export default function ContatosPage() {
  const { loja_id } = useStore();
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const SETORES = ['Bebidas', 'Alimentos', 'Higiene', 'Limpeza', 'Perecíveis'];

  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    setores: SETORES, // Todos por padrão
    telefone_whatsapp: '',
    telefone_sms: '',
    email: '',
    receber_alertas_criticos: true,
    receber_alertas_whatsapp: false,
    receber_alertas_sms: false,
    receber_alertas_email: false,
    receber_relatorios: false,
  });

  // Carregar contatos
  const fetchContatos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/notificacao-contatos/${loja_id}`);
      setContatos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar contatos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loja_id) {
      fetchContatos();
    }
  }, [loja_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que pelo menos um contato foi preenchido
    if (!formData.telefone_whatsapp && !formData.telefone_sms && !formData.email) {
      toast.error('Adicione pelo menos um contato (WhatsApp, SMS ou Email)');
      return;
    }

    try {
      if (editingId) {
        // Atualizar
        const response = await apiClient.put(`/notificacao-contatos/${editingId}`, formData);
        setContatos((prev) =>
          prev.map((c) => (c.id === editingId ? response.data : c))
        );
        toast.success('Contato atualizado!');
      } else {
        // Criar novo
        const response = await apiClient.post('/notificacao-contatos', {
          loja_id,
          ...formData,
        });
        setContatos((prev) => [...prev, response.data]);
        toast.success('Contato criado!');
      }

      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar contato');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cargo: '',
      setores: SETORES,
      telefone_whatsapp: '',
      telefone_sms: '',
      email: '',
      receber_alertas_criticos: true,
      receber_alertas_whatsapp: false,
      receber_alertas_sms: false,
      receber_alertas_email: false,
      receber_relatorios: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (contato: Contato) => {
    setFormData({ ...formData, ...contato, setores: SETORES });
    setEditingId(contato.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este contato?')) return;

    try {
      await apiClient.delete(`/notificacao-contatos/${id}`);
      setContatos((prev) => prev.filter((c) => c.id !== id));
      toast.success('Contato deletado!');
    } catch (error) {
      toast.error('Erro ao deletar contato');
      console.error(error);
    }
  };

  const handleTest = async (id: string) => {
    try {
      await apiClient.post(`/notificacao-contatos/${id}/teste`);
      toast.success('Mensagem de teste enviada!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar teste');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-96"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contatos de Notificação</h1>
          <p className="text-gray-400">Gerenciar gerentes, encarregados e outros contatos</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar Contato
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border border-accent">
          <h3 className="text-lg font-bold mb-4">
            {editingId ? 'Editar Contato' : 'Novo Contato'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cargo</label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  placeholder="Ex: Gerente, Encarregado"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Setores Responsáveis</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SETORES.map((setor) => (
                  <label key={setor} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.setores.includes(setor)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            setores: [...formData.setores, setor],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            setores: formData.setores.filter((s) => s !== setor),
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{setor}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selecione os setores para os quais este contato receberá alertas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <MessageSquare size={16} className="inline mr-2" />
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.telefone_whatsapp}
                  onChange={(e) => setFormData({ ...formData, telefone_whatsapp: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  placeholder="+55 (11) 9xxxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Phone size={16} className="inline mr-2" />
                  SMS
                </label>
                <input
                  type="tel"
                  value={formData.telefone_sms}
                  onChange={(e) => setFormData({ ...formData, telefone_sms: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  placeholder="+55 (11) 9xxxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  placeholder="contato@loja.com"
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Preferências de Notificação</h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.receber_alertas_criticos}
                    onChange={(e) =>
                      setFormData({ ...formData, receber_alertas_criticos: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Alertas Críticos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.receber_alertas_whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, receber_alertas_whatsapp: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">WhatsApp</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.receber_alertas_sms}
                    onChange={(e) =>
                      setFormData({ ...formData, receber_alertas_sms: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">SMS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.receber_alertas_email}
                    onChange={(e) =>
                      setFormData({ ...formData, receber_alertas_email: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Email</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.receber_relatorios}
                    onChange={(e) =>
                      setFormData({ ...formData, receber_relatorios: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Receber Relatórios</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Atualizar' : 'Criar'} Contato
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contatos List */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Contatos Cadastrados ({contatos.length})</h3>

        {contatos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhum contato cadastrado</p>
            <p className="text-sm mt-2">Adicione contatos para ativar notificações</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contatos.map((contato) => (
              <div
                key={contato.id}
                className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{contato.nome}</h4>
                      {contato.cargo && (
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">{contato.cargo}</span>
                      )}
                    </div>

                    {/* Setores */}
                    {contato.setores && contato.setores.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {contato.setores.map((setor) => (
                          <span
                            key={setor}
                            className="text-xs bg-indigo-900 text-indigo-100 px-2 py-1 rounded"
                          >
                            {setor}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {contato.telefone_whatsapp && (
                        <span className="badge bg-green-900 text-green-100 flex items-center gap-1">
                          <MessageSquare size={14} />
                          {contato.telefone_whatsapp}
                        </span>
                      )}
                      {contato.telefone_sms && (
                        <span className="badge bg-blue-900 text-blue-100 flex items-center gap-1">
                          <Phone size={14} />
                          {contato.telefone_sms}
                        </span>
                      )}
                      {contato.email && (
                        <span className="badge bg-purple-900 text-purple-100 flex items-center gap-1">
                          <Mail size={14} />
                          {contato.email}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      <p>
                        ✓ Alertas Críticos:{' '}
                        {contato.receber_alertas_criticos ? 'Sim' : 'Não'}
                      </p>
                      {contato.receber_relatorios && (
                        <p>✓ Recebe relatórios automáticos</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleTest(contato.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-yellow-400 transition"
                      title="Enviar teste"
                    >
                      <Send size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(contato)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-blue-400 transition"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(contato.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-red-400 transition"
                      title="Deletar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
