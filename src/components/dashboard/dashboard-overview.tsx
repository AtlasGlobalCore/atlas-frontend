'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  ArrowUpRight,
  Zap,
  Loader2,
  Wallet,
  Shield,
  AlertTriangle,
  Clock,
  CircleDollarSign,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { PipelineResponse, Transaction } from '@/lib/api/contracts';
import {
  systemStateMock,
  statusColorMap,
  isHighlighted,
  countryMeta,
} from '@/lib/mock-system-state';
import { useDashboardStore, type DashboardSection } from '@/lib/dashboard-store';
import { useStoreSelectorStore } from '@/lib/store-selector-store';
import { StoreSelector } from './store-selector';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--:--';
  }
}

const statusColors: Record<string, string> = {
  pending: '#FFB800',
  gateway_confirmed: '#00F0FF',
  settled: '#00FF41',
  failed: '#FF0040',
};

const statusLabelsMap: Record<string, string> = {
  pending: 'Pendente',
  gateway_confirmed: 'Fundos em Trânsito',
  settled: 'Fundos Distribuídos',
  failed: 'Falhou',
};

const typeLabels: Record<string, { label: string; color: string }> = {
  payment: { label: 'Pagamento', color: 'text-[#00FF41]' },
  settlement: { label: 'Liquidação', color: 'text-[#00F0FF]' },
  conversion: { label: 'Conversão', color: 'text-[#FFB800]' },
  refund: { label: 'Reembolso', color: 'text-[#FF0040]' },
};

// ─── Stat Card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  iconBg: string;
}

function StatCard({ label, value, icon, color, borderColor, iconBg }: StatCardProps) {
  return (
    <div className={`cyber-panel p-4 border ${borderColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`} style={{ color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#E0E0E8] cyber-mono">{value}</p>
      <p className="text-xs text-[#555566] mt-1">{label}</p>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const { setActiveSection } = useDashboardStore();
  const { selectedStoreId } = useStoreSelectorStore();

  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = selectedStoreId ? { store_id: selectedStoreId } : {};
      const [pipelineRes, txnsRes] = await Promise.all([
        api.pipeline.get(),
        api.transactions.list({ limit: '10', ...params }),
      ]);
      setPipeline(pipelineRes);
      setRecentTxns(txnsRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API indisponível');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived stats from pipeline (Core Bank V2 — Settlement Focus) ──
  const stats = useMemo(() => {
    if (!pipeline?.data) return null;

    const stages = pipeline.data;
    const inTransit = (stages.gateway_confirmed?.total ?? 0);
    const distributed = stages.settled?.total ?? 0;
    const pendingCount = stages.pending?.count ?? 0;
    const totalTxns = Object.values(stages).reduce((sum, v) => sum + v.count, 0);

    return { inTransit, distributed, pendingCount, totalTxns };
  }, [pipeline]);

  // ── Highlight Rails (mock data — kept per spec) ──
  const highlightEntries = useMemo(
    () => systemStateMock.filter((e) => isHighlighted(e).active),
    []
  );

  return (
    <div className="space-y-6">
      {/* ── Header with Store Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E0E0E8]">Dashboard Overview</h2>
          <p className="text-sm text-[#888899] mt-1">
            Visão geral do seu negócio
          </p>
        </div>
        <StoreSelector />
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="cyber-panel p-4 border border-[rgba(51,51,51,0.3)] animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(51,51,51,0.4)]" />
              </div>
              <div className="w-24 h-7 rounded bg-[rgba(51,51,51,0.4)] mb-2" />
              <div className="w-32 h-3 rounded bg-[rgba(51,51,51,0.3)]" />
            </div>
          ))
        ) : error ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 cyber-panel p-4 border border-[rgba(255,0,64,0.2)] flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF0040]" />
            <span className="text-sm text-[#FF0040]">{error}</span>
            <button
              onClick={fetchData}
              className="ml-2 text-xs px-3 py-1 rounded border border-[rgba(0,255,65,0.3)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.1)] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <StatCard
              label="Fundos em Trânsito"
              value={stats ? formatCurrency(stats.inTransit) : '—'}
              icon={<Clock className="w-4 h-4" />}
              color="#00F0FF"
              borderColor="border-[rgba(0,240,255,0.2)]"
              iconBg="bg-[rgba(0,240,255,0.1)]"
            />
            <StatCard
              label="Fundos Distribuídos"
              value={stats ? formatCurrency(stats.distributed) : '—'}
              icon={<CircleDollarSign className="w-4 h-4" />}
              color="#00FF41"
              borderColor="border-[rgba(0,255,65,0.2)]"
              iconBg="bg-[rgba(0,255,65,0.1)]"
            />
            <StatCard
              label="Pendentes"
              value={stats ? String(stats.pendingCount) : '—'}
              icon={<Shield className="w-4 h-4" />}
              color="#FFB800"
              borderColor="border-[rgba(255,184,0,0.2)]"
              iconBg="bg-[rgba(255,184,0,0.1)]"
            />
            <StatCard
              label="Total Transações"
              value={stats ? String(stats.totalTxns) : '—'}
              icon={<Activity className="w-4 h-4" />}
              color="#00F0FF"
              borderColor="border-[rgba(0,240,255,0.2)]"
              iconBg="bg-[rgba(0,240,255,0.1)]"
            />
          </>
        )}
      </div>

      {/* ── Highlighted Rails ────────────────────────────────────── */}
      {highlightEntries.length > 0 && (
        <div className="cyber-panel p-4 border border-[rgba(191,64,255,0.2)]">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#BF40FF]" />
            <h3 className="text-sm font-semibold text-[#E0E0E8]">Highlight Automático</h3>
            <span className="text-[10px] cyber-mono text-[#555566]">rails prioritários</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {highlightEntries.map((entry) => {
              const meta = countryMeta[entry.country_code] ?? { name: entry.country_code, flag: '🏳️' };
              const cfg = statusColorMap[entry.availability_status];
              const hl = isHighlighted(entry);
              return (
                <div
                  key={`${entry.country_code}-${entry.payment_method}`}
                  className="flex items-start gap-3 px-3 py-3 rounded-lg border border-dashed"
                  style={{ borderColor: `${cfg.color}44`, backgroundColor: `${cfg.color}06` }}
                >
                  <span className="text-lg mt-0.5">{meta.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#E0E0E8]">{entry.payment_method}</span>
                      <span className={`cyber-badge ${cfg.badgeClass} text-[8px]`}>{cfg.label}</span>
                    </div>
                    <p className="text-[10px] text-[#555566] mt-0.5">{entry.country_code} — {meta.name}</p>
                    <p className="text-[10px] mt-1 italic" style={{ color: cfg.color }}>
                      {hl.reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Activity Feed + Quick Actions ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2 cyber-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00FF41]" />
              <h3 className="text-sm font-semibold text-[#E0E0E8]">Atividade Recente</h3>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded cyber-badge-green cyber-badge">
              <span className="status-dot active" style={{ width: '6px', height: '6px' }} />
              <span>LIVE</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-[#00FF41] animate-spin" />
              <span className="ml-2 text-xs text-[#555566] cyber-mono">Carregando atividade...</span>
            </div>
          ) : recentTxns.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-xs text-[#555566] cyber-mono">Nenhuma atividade recente</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto cyber-scrollbar pr-2">
              {recentTxns.map((txn) => {
                const color = statusColors[txn.status] ?? '#555566';
                const type = typeLabels[txn.type] ?? { label: txn.type, color: 'text-[#888899]' };
                const flag = countryMeta[txn.country_code]?.flag ?? '🌍';
                const statusLabel = statusLabelsMap[txn.status] ?? txn.status;
                return (
                  <div
                    key={txn.id}
                    className="flex items-start gap-3 px-3 py-2 rounded-lg
                      bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]
                      hover:border-[rgba(51,51,51,0.6)] transition-colors"
                  >
                    <span className="text-[10px] cyber-mono text-[#555566] whitespace-nowrap pt-0.5">
                      {formatTimestamp(txn.created_at)}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs flex-1 text-[#888899]">
                      <span className={type.color}>{type.label}</span>{' '}
                      {formatCurrency(txn.amount, txn.currency)} via {txn.payment_method}
                      {' '}{flag} {txn.country_code}
                      {txn.payer_name ? ` — ${txn.payer_name}` : ''}
                      <span className="ml-1.5 text-[10px] cyber-mono" style={{ color }}>
                        [{statusLabel}]
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="cyber-panel p-4">
          <h3 className="text-sm font-semibold text-[#E0E0E8] mb-4">Ações Rápidas</h3>
          <div className="space-y-2">
            {[
              { label: 'Tesouraria / Saques', section: 'treasury' as DashboardSection },
              { label: 'Novo Link de Pagamento', section: 'payment-links' as DashboardSection },
              { label: 'Gerenciar API Keys', section: 'api-integration' as DashboardSection },
              { label: 'Ver Transações', section: 'transactions' as DashboardSection },
            ].map((action) => (
              <button
                key={action.section}
                onClick={() => setActiveSection(action.section)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                  bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]
                  hover:border-[rgba(0,255,65,0.2)] transition-all duration-200 group
                  text-xs text-[#888899] hover:text-[#E0E0E8]`}
              >
                <span>{action.label}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#00FF41]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
