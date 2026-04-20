'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Settings,
  Shield,
  Activity,
  DollarSign,
  Zap,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Loader2,
  Save,
  Info,
  RefreshCw,
  CreditCard,
  TrendingUp,
  HeartPulse,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api/client';
import type { MasterProvider } from '@/lib/api/contracts';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */

function providerColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('stripe')) return '#635BFF';
  if (t.includes('viva')) return '#FF6600';
  if (t.includes('sumup')) return '#0070BA';
  if (t.includes('mistic')) return '#9B59B6';
  if (t.includes('paypal')) return '#003087';
  return '#00F0FF';
}

function healthStyle(status: string) {
  const s = status.toLowerCase();
  if (s === 'healthy' || s === 'ativo' || s === 'online') {
    return { color: '#00FF41', bg: 'rgba(0,255,65,0.1)', border: 'rgba(0,255,65,0.3)', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Saudável' };
  }
  if (s === 'degraded' || s === 'aviso') {
    return { color: '#FFB800', bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.3)', icon: <AlertTriangle className="w-3 h-3" />, label: 'Degradado' };
  }
  return { color: '#FF0040', bg: 'rgba(255,0,64,0.1)', border: 'rgba(255,0,64,0.3)', icon: <XCircle className="w-3 h-3" />, label: 'Crítico' };
}

function validateJSON(str: string): { valid: boolean; error?: string } {
  if (!str.trim()) return { valid: true };
  try {
    JSON.parse(str);
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

function formatJSON(obj: Record<string, any> | undefined): string {
  if (!obj) return '';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return '';
  }
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATION TOAST
   ═══════════════════════════════════════════════════════════════ */

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

function NotificationToast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 animate-in slide-in-from-right ${
        toast.type === 'success'
          ? 'bg-[rgba(0,255,65,0.08)] border-[rgba(0,255,65,0.3)] text-[#00FF41]'
          : 'bg-[rgba(255,0,64,0.08)] border-[rgba(255,0,64,0.3)] text-[#FF0040]'
      }`}
    >
      {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
      <span className="text-xs">{toast.message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function MasterProvidersAdmin() {
  const [providers, setProviders] = useState<MasterProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<MasterProvider | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    isActive: true,
    priorityScore: 0,
    costPercentage: 0,
    costFixed: 0,
    settlementDays: 0,
    monthlyVolumeLimit: '',
    credentials_test: '',
    credentials_live: '',
  });

  // JSON validation state
  const [testJsonValid, setTestJsonValid] = useState<boolean | null>(null);
  const [liveJsonValid, setLiveJsonValid] = useState<boolean | null>(null);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  // ── Fetch ──
  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.masterProviders.list();
      setProviders(res.data);
    } catch {
      setError('Erro ao carregar Master Providers. Verifique as permissões de Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // ── Open Edit ──
  const openEdit = (provider: MasterProvider) => {
    setEditProvider(provider);
    setEditForm({
      isActive: provider.isActive,
      priorityScore: provider.priorityScore,
      costPercentage: provider.costPercentage,
      costFixed: provider.costFixed,
      settlementDays: provider.settlementDays,
      monthlyVolumeLimit: provider.monthlyVolumeLimit?.toString() ?? '',
      credentials_test: formatJSON(provider.credentials_test),
      credentials_live: formatJSON(provider.credentials_live),
    });
    setTestJsonValid(null);
    setLiveJsonValid(null);
    setEditOpen(true);
  };

  // ── Save ──
  const handleSave = async () => {
    if (!editProvider) return;

    // Validate JSON fields
    const testValidation = validateJSON(editForm.credentials_test);
    const liveValidation = validateJSON(editForm.credentials_live);
    if (!testValidation.valid || !liveValidation.valid) {
      showToast('error', 'JSON inválido. Verifique os campos de credenciais.');
      return;
    }

    setSaving(true);
    try {
      await api.masterProviders.update(editProvider.id, {
        isActive: editForm.isActive,
        priorityScore: Number(editForm.priorityScore),
        costPercentage: Number(editForm.costPercentage),
        costFixed: Number(editForm.costFixed),
        settlementDays: Number(editForm.settlementDays),
        monthlyVolumeLimit: editForm.monthlyVolumeLimit ? Number(editForm.monthlyVolumeLimit) : undefined,
        credentials_test: editForm.credentials_test.trim() ? JSON.parse(editForm.credentials_test) : undefined,
        credentials_live: editForm.credentials_live.trim() ? JSON.parse(editForm.credentials_live) : undefined,
      });
      showToast('success', `Master Provider "${editProvider.companyName}" atualizado com sucesso!`);
      setEditOpen(false);
      fetchProviders();
    } catch {
      showToast('error', 'Erro ao guardar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ──
  const totalProviders = providers.length;
  const activeProviders = providers.filter((p) => p.isActive).length;
  const totalMethods = new Set(providers.flatMap((p) => p.supportedMethods)).size;
  const avgPriority = providers.length > 0
    ? (providers.reduce((sum, p) => sum + p.priorityScore, 0) / providers.length).toFixed(1)
    : '0';

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* ── Notification Toasts ── */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <NotificationToast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="cyber-panel p-5 border border-[rgba(255,0,64,0.2)]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-[rgba(255,0,64,0.08)] border border-[rgba(255,0,64,0.2)]">
            <Server className="w-5 h-5 text-[#FF0040]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-[#E0E0E8]">Torre de Controlo — Nós da Rede Bancária</h3>
              <Badge
                className="text-[8px] px-1.5 py-px"
                style={{ backgroundColor: 'rgba(255,0,64,0.15)', color: '#FF0040', border: '1px solid rgba(255,0,64,0.4)' }}
              >
                ADMIN ONLY
              </Badge>
            </div>
            <p className="text-xs text-[#888899] leading-relaxed">
              Gestão dos nós institucionais da rede PayFac (Master Providers).
              As credenciais reais são geridas aqui — os lojistas apenas ativam métodos.
            </p>
          </div>
          <button
            onClick={fetchProviders}
            className="shrink-0 p-2 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#00FF41] hover:border-[rgba(0,255,65,0.3)] transition-all"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="cyber-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-[9px] cyber-mono text-[#555566] tracking-wider">TOTAL NÓS</span>
          </div>
          <p className="text-2xl font-bold text-[#00F0FF]">{totalProviders}</p>
        </div>
        <div className="cyber-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-[#00FF41]" />
            <span className="text-[9px] cyber-mono text-[#555566] tracking-wider">ATIVOS</span>
          </div>
          <p className="text-2xl font-bold text-[#00FF41]">{activeProviders}</p>
        </div>
        <div className="cyber-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-3.5 h-3.5 text-[#FFB800]" />
            <span className="text-[9px] cyber-mono text-[#555566] tracking-wider">MÉTODOS</span>
          </div>
          <p className="text-2xl font-bold text-[#FFB800]">{totalMethods}</p>
        </div>
        <div className="cyber-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#BF40FF]" />
            <span className="text-[9px] cyber-mono text-[#555566] tracking-wider">PRIORIDADE MÉDIA</span>
          </div>
          <p className="text-2xl font-bold text-[#BF40FF]">{avgPriority}</p>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <Shield className="w-3.5 h-3.5 text-[#00F0FF] shrink-0 mt-0.5" />
        <div className="text-[10px] text-[#888899] leading-relaxed">
          <span className="text-[#E0E0E8] font-medium">Modelo PayFac V2:</span>{' '}
          Cada nó representa uma entidade institucional (ex: Stripe_FR001, VIVA_PT001) com credenciais reais.
          O orquestrador roteia transações automaticamente baseado em <code className="text-[#00FF41]">priorityScore</code>,{' '}
          <code className="text-[#FFB800]">costPercentage</code> e estado de saúde.
        </div>
      </div>

      {/* ── Table ── */}
      <div className="cyber-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#00FF41] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertTriangle className="w-8 h-8 text-[#FF0040]" />
            <p className="text-sm text-[#FF0040]">{error}</p>
            <button
              onClick={fetchProviders}
              className="cyber-btn-primary px-4 py-1.5 rounded-lg text-xs cyber-mono flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Server className="w-10 h-10 text-[#555566] mb-2" />
            <p className="text-sm text-[#888899]">Nenhum Master Provider registado</p>
            <p className="text-[10px] text-[#555566] mt-1">Contacte o backend para configurar os nós da rede</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto cyber-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0A0A0C] z-10">
                <tr className="border-b border-[rgba(51,51,51,0.6)]">
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">ID</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">PROVIDER</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">EMPRESA</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">MODO</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">ESTADO</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">CUSTO %</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">FIXO</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">PRIORIDADE</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">SAÚDE</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-right px-4 py-3">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((mp) => {
                  const hs = healthStyle(mp.healthStatus);
                  const pColor = providerColor(mp.providerType);
                  return (
                    <tr
                      key={mp.id}
                      className={`border-b border-[rgba(51,51,51,0.3)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                        !mp.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="text-[10px] cyber-mono text-[#555566] px-4 py-3 max-w-[80px] truncate" title={mp.id}>
                        {mp.id.length > 12 ? `${mp.id.slice(0, 12)}...` : mp.id}
                      </td>
                      <td className="text-xs px-4 py-3">
                        <Badge
                          className="text-[9px] px-2 py-0.5"
                          style={{
                            backgroundColor: `${pColor}15`,
                            color: pColor,
                            border: `1px solid ${pColor}40`,
                          }}
                        >
                          {mp.providerType}
                        </Badge>
                      </td>
                      <td className="text-xs text-[#E0E0E8] font-medium px-4 py-3 max-w-[150px] truncate" title={mp.companyName}>
                        {mp.companyName}
                      </td>
                      <td className="text-xs px-4 py-3">
                        <Badge
                          className={`text-[9px] px-2 py-0.5 ${
                            mp.mode === 'live'
                              ? 'bg-[rgba(255,0,64,0.1)] text-[#FF0040] border border-[rgba(255,0,64,0.3)]'
                              : 'bg-[rgba(255,184,0,0.1)] text-[#FFB800] border border-[rgba(255,184,0,0.3)]'
                          }`}
                        >
                          {mp.mode === 'live' ? 'LIVE' : 'TEST'}
                        </Badge>
                      </td>
                      <td className="text-xs px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${mp.isActive ? 'bg-[#00FF41]' : 'bg-[#555566]'}`} />
                          <span className="text-[10px] text-[#888899]">
                            {mp.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs cyber-mono text-[#FFB800] px-4 py-3">{mp.costPercentage}%</td>
                      <td className="text-xs cyber-mono text-[#888899] px-4 py-3">
                        €{mp.costFixed.toFixed(2)}
                      </td>
                      <td className="text-xs px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[rgba(51,51,51,0.3)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#BF40FF] to-[#00FF41]"
                              style={{ width: `${Math.min(100, (mp.priorityScore / 100) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] cyber-mono text-[#BF40FF]">{mp.priorityScore}</span>
                        </div>
                      </td>
                      <td className="text-xs px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: hs.color }}>{hs.icon}</span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: hs.bg, color: hs.color, border: `1px solid ${hs.border}` }}
                          >
                            {hs.label}
                          </span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3">
                        <button
                          onClick={() => openEdit(mp)}
                          className="p-1.5 rounded hover:bg-[rgba(0,240,255,0.1)] text-[#555566] hover:text-[#00F0FF] transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Supported Methods Summary ── */}
      {!loading && !error && providers.length > 0 && (
        <div className="cyber-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-[#FFB800]" />
            <h4 className="text-xs font-semibold text-[#E0E0E8]">Métodos Suportados pela Rede</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(providers.flatMap((p) => p.supportedMethods))).map((method) => (
              <Badge
                key={method}
                className="text-[9px] px-2 py-0.5 bg-[rgba(0,240,255,0.06)] text-[#00F0FF] border border-[rgba(0,240,255,0.2)]"
              >
                {method}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         EDIT DIALOG
         ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#0A0A0C] border-[rgba(51,51,51,0.5)] max-w-2xl max-h-[90vh] overflow-y-auto cyber-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E0E0E8]">
              <Settings className="w-4 h-4 text-[#00F0FF]" />
              Editar Master Provider
              {editProvider && (
                <Badge
                  className="text-[9px] px-2 py-0.5 ml-2"
                  style={{
                    backgroundColor: `${providerColor(editProvider.providerType)}15`,
                    color: providerColor(editProvider.providerType),
                    border: `1px solid ${providerColor(editProvider.providerType)}40`,
                  }}
                >
                  {editProvider.companyName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* ── Status Toggle ── */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
              <div>
                <p className="text-xs font-medium text-[#E0E0E8]">Estado Ativo</p>
                <p className="text-[10px] text-[#555566]">Desativar remove este nó do roteamento automático</p>
              </div>
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
            </div>

            {/* ── Routing Parameters ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-[#BF40FF]" />
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">PARÂMETROS DE ROTEAMENTO</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Prioridade (score)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.priorityScore}
                    onChange={(e) => setEditForm({ ...editForm, priorityScore: Number(e.target.value) })}
                    className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#BF40FF]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Custo %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.costPercentage}
                    onChange={(e) => setEditForm({ ...editForm, costPercentage: Number(e.target.value) })}
                    className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#FFB800]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Custo Fixo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.costFixed}
                    onChange={(e) => setEditForm({ ...editForm, costFixed: Number(e.target.value) })}
                    className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Dias Liquidação</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.settlementDays}
                    onChange={(e) => setEditForm({ ...editForm, settlementDays: Number(e.target.value) })}
                    className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Limite Mensal (volume) — opcional</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.monthlyVolumeLimit}
                    onChange={(e) => setEditForm({ ...editForm, monthlyVolumeLimit: e.target.value })}
                    placeholder="Deixe vazio para ilimitado"
                    className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                  />
                </div>
              </div>
            </div>

            {/* ── Credentials ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5 text-[#FF0040]" />
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">CREDENCIAIS INSTITUCIONAIS</span>
              </div>

              {/* Test Credentials */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] cyber-mono text-[#FFB800] tracking-wider">CREDENTIALS TEST (JSON)</label>
                  <button
                    onClick={() => {
                      const v = validateJSON(editForm.credentials_test);
                      setTestJsonValid(v.valid);
                    }}
                    className="text-[9px] cyber-mono text-[#555566] hover:text-[#00F0FF] transition-colors"
                  >
                    Validar JSON
                  </button>
                </div>
                <textarea
                  value={editForm.credentials_test}
                  onChange={(e) => {
                    setEditForm({ ...editForm, credentials_test: e.target.value });
                    setTestJsonValid(null);
                  }}
                  placeholder='{"api_key": "sk_test_...", "secret": "..."}'
                  rows={4}
                  className="cyber-input w-full px-3 py-2 rounded-lg text-xs cyber-mono text-[#E0E0E8] resize-y font-mono"
                />
                {testJsonValid === true && (
                  <p className="text-[9px] text-[#00FF41] mt-1">JSON válido</p>
                )}
                {testJsonValid === false && (
                  <p className="text-[9px] text-[#FF0040] mt-1">JSON inválido</p>
                )}
              </div>

              {/* Live Credentials */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] cyber-mono text-[#FF0040] tracking-wider">CREDENTIALS LIVE (JSON)</label>
                  <button
                    onClick={() => {
                      const v = validateJSON(editForm.credentials_live);
                      setLiveJsonValid(v.valid);
                    }}
                    className="text-[9px] cyber-mono text-[#555566] hover:text-[#00F0FF] transition-colors"
                  >
                    Validar JSON
                  </button>
                </div>
                <textarea
                  value={editForm.credentials_live}
                  onChange={(e) => {
                    setEditForm({ ...editForm, credentials_live: e.target.value });
                    setLiveJsonValid(null);
                  }}
                  placeholder='{"api_key": "sk_live_...", "secret": "..."}'
                  rows={4}
                  className="cyber-input w-full px-3 py-2 rounded-lg text-xs cyber-mono text-[#E0E0E8] resize-y font-mono"
                />
                {liveJsonValid === true && (
                  <p className="text-[9px] text-[#00FF41] mt-1">JSON válido</p>
                )}
                {liveJsonValid === false && (
                  <p className="text-[9px] text-[#FF0040] mt-1">JSON inválido</p>
                )}
              </div>

              <div className="flex items-start gap-2 px-3 py-2 mt-3 rounded-lg bg-[rgba(255,0,64,0.04)] border border-[rgba(255,0,64,0.15)]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF0040] shrink-0 mt-0.5" />
                <div className="text-[10px] text-[#888899] leading-relaxed">
                  <span className="text-[#FF0040] font-medium">Segurança:</span> As credenciais live são encriptadas no backend.
                  Nunca partilhe ou exponha estes valores fora deste painel.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-1.5 rounded-lg text-xs cyber-mono border border-[rgba(51,51,51,0.5)] text-[#888899] hover:text-[#E0E0E8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="cyber-btn-primary px-4 py-1.5 rounded-lg text-xs cyber-mono flex items-center gap-2 disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
