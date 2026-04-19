'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Zap,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  X,
  Search,
  CreditCard,
  Smartphone,
  Landmark,
  Info,
  Download,
  Calendar,
  User,
  Store as StoreIcon,
} from 'lucide-react';
import { api, NexFlowXAPIError } from '@/lib/api/client';
import type { Transaction, TransactionStatus } from '@/lib/api/contracts';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useStoreSelectorStore } from '@/lib/store-selector-store';
import { countryMeta } from '@/lib/mock-system-state';
import { StoreSelector } from './store-selector';

/* ─── Config ─────────────────────────────────────────────────────────────── */

const PIPELINE_STAGES: TransactionStatus[] = [
  'pending',
  'gateway_confirmed',
  'settled',
];

const typeLabels: Record<string, { label: string; color: string }> = {
  payment:    { label: 'PAGAMENTO',    color: 'cyber-badge-green' },
  settlement: { label: 'LIQUIDAÇÃO',  color: 'cyber-badge-cyan' },
  conversion: { label: 'CONVERSÃO',   color: 'cyber-badge-amber' },
  refund:     { label: 'REEMBOLSO',   color: 'cyber-badge-red' },
};

const statusLabels: Record<string, { label: string; color: string; dot: string }> = {
  pending:              { label: 'Pendente',           color: 'cyber-badge-amber',   dot: 'bg-[#FFB800]' },
  gateway_confirmed:    { label: 'Em Trânsito',        color: 'cyber-badge-cyan',    dot: 'bg-[#00F0FF]' },
  settled:              { label: 'Liquidada',          color: 'cyber-badge-green',   dot: 'bg-[#00FF41]' },
  failed:               { label: 'Falhou',             color: 'cyber-badge-red',     dot: 'bg-[#FF0040]' },
};

const statusOptions = PIPELINE_STAGES.map((s) => ({
  value: s,
  label: statusLabels[s]?.label ?? s,
}));

const countries = Object.entries(countryMeta).map(([code, meta]) => ({ code, ...meta }));

const PERIOD_PRESETS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Este mês', days: 'this_month' as const },
  { label: 'Mês passado', days: 'last_month' as const },
];

/* ─── Payment Method Icons ───────────────────────────────────────────────── */

function getPaymentMethodIcon(method: string) {
  const m = method.toLowerCase().replace(/[-_\s]/g, '');
  if (m === 'card' || m === 'creditcard' || m === 'debitcard') return <CreditCard className="w-3.5 h-3.5" />;
  if (m === 'mbway' || m === 'mb_way') return <Smartphone className="w-3.5 h-3.5" />;
  if (m === 'bancontact') return <Landmark className="w-3.5 h-3.5" />;
  if (m === 'sepa' || m === 'banktransfer') return <Landmark className="w-3.5 h-3.5" />;
  if (m === 'pix') return <Smartphone className="w-3.5 h-3.5" />;
  if (m === 'ideal') return <Landmark className="w-3.5 h-3.5" />;
  return <CreditCard className="w-3.5 h-3.5" />;
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    card: 'Cartão',
    credit_card: 'Cartão Crédito',
    debit_card: 'Cartão Débito',
    mb_way: 'MB WAY',
    mbway: 'MB WAY',
    bancontact: 'Bancontact',
    sepa: 'SEPA',
    bank_transfer: 'Transferência',
    pix: 'PIX',
    ideal: 'iDEAL',
  };
  const m = method.toLowerCase().replace(/[-_\s]/g, '');
  for (const [key, label] of Object.entries(labels)) {
    if (key.replace(/[-_\s]/g, '') === m) return label;
  }
  return method.charAt(0).toUpperCase() + method.slice(1);
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function safeNum(val: unknown): number {
  if (val == null) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

function getFlag(code: string): string {
  if (!code) return '🌍';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  const flag = String.fromCodePoint(...codePoints);
  if (flag.includes('�')) return countryMeta[code]?.flag ?? '🌍';
  return flag;
}

function isSuccessStatus(status: string): boolean {
  return ['gateway_confirmed', 'settled'].includes(status);
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDateRange(preset: typeof PERIOD_PRESETS[number]): { from: string; to: string } {
  const today = new Date();
  const to = toDateStr(today);

  if (preset.days === 'this_month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateStr(from), to };
  }
  if (preset.days === 'last_month') {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const toLast = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: toDateStr(from), to: toDateStr(toLast) };
  }
  const from = new Date(today);
  from.setDate(from.getDate() - preset.days);
  return { from: toDateStr(from), to };
}

/* ─── Tooltip ─────────────────────────────────────────────────────────────── */

function FeeTooltip({ amount, fee, currency }: { amount: number; fee: number; currency: string }) {
  return (
    <div className="group/fee relative inline-block">
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-52 p-3 rounded-lg bg-[#1A1A22] border border-[rgba(51,51,51,0.6)] shadow-xl opacity-0 group-hover/fee:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#888899]">Valor bruto</span>
            <span className="text-[10px] cyber-mono text-[#E0E0E8]">{formatCurrency(amount, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#888899]">Taxa</span>
            <span className="text-[10px] cyber-mono text-[#FF0040]">-{formatCurrency(fee, currency)}</span>
          </div>
          <div className="h-px bg-[rgba(51,51,51,0.5)]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#888899]">Valor líquido</span>
            <span className="text-[10px] cyber-mono text-[#00FF41] font-medium">+{formatCurrency(amount - fee, currency)}</span>
          </div>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-[#1A1A22] border-r border-b border-[rgba(51,51,51,0.6)]" />
      </div>
      <Info className="w-3 h-3 text-[#555566] cursor-help" />
    </div>
  );
}

/* ─── CSV Export ──────────────────────────────────────────────────────────── */

function exportCSV(transactions: Transaction[]) {
  const headers = [
    'ID', 'Status', 'Tipo', 'País', 'Método', 'Pagador',
    'Valor Bruto', 'Taxa', 'Valor Líquido', 'Moeda',
    'Data Criação', 'Data Liquidação',
  ];

  const rows = transactions.map((t) => {
    const amt = safeNum(t.amount);
    const net = safeNum(t.net_amount);
    const fee = safeNum(t.fee_amount);
    const payer = t.customer_email || t.payer_email || t.payer_name || 'Anónimo';
    return [
      t.id,
      t.status,
      t.type,
      t.country_code?.toUpperCase() || '',
      t.payment_method,
      payer,
      amt.toFixed(2),
      fee.toFixed(2),
      (net || amt).toFixed(2),
      t.currency || 'EUR',
      t.created_at,
      t.settled_at || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexflowx-transacoes-${toDateStr(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function TransactionsTable() {
  const { pipelineFilter, setPipelineFilter } = useDashboardStore();
  const { selectedStoreId } = useStoreSelectorStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(pipelineFilter ?? '');
  const [countryFilter, setCountryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('');
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalNetVolume, setTotalNetVolume] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 25;

  // Sync pipeline filter → status filter
  useEffect(() => {
    if (pipelineFilter) {
      setStatusFilter(pipelineFilter);
    }
  }, [pipelineFilter]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: Record<string, string> = {
        page: String(currentPage),
        limit: String(limit),
      };
      if (searchTerm) query.search = searchTerm;
      if (statusFilter) query.status = statusFilter;
      if (countryFilter) query.country_code = countryFilter;
      if (dateFrom) query.date_from = dateFrom;
      if (dateTo) query.date_to = dateTo;
      if (selectedStoreId) query.store_id = selectedStoreId;

      const res = await api.transactions.list(query);
      const data = res.data ?? [];
      setTransactions(data);
      if (res.pagination) {
        setTotalPages(res.pagination.total_pages || 1);
        setTotalItems(res.pagination.total || 0);
      }
      // Derive totals with safe number coercion
      const vol = data.reduce((sum, t) => sum + safeNum(t.amount), 0);
      const netVol = data.reduce((sum, t) => sum + safeNum(t.net_amount || t.amount), 0);
      setTotalVolume(vol);
      setTotalNetVolume(netVol);
    } catch {
      setError('Erro ao carregar transações.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, countryFilter, dateFrom, dateTo, selectedStoreId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, countryFilter, dateFrom, dateTo, selectedStoreId]);

  const handleUpdateStatus = async (txnId: string, newStatus: string) => {
    setUpdatingId(txnId);
    setShowStatusDropdown(null);
    try {
      await api.transactions.updateStatus(txnId, { status: newStatus as TransactionStatus });
      await fetchTransactions();
    } catch {
      // Next fetch shows current state
    } finally {
      setUpdatingId(null);
    }
  };

  const clearPipelineFilter = () => {
    setPipelineFilter(null);
    setStatusFilter('');
  };

  const handlePreset = (preset: typeof PERIOD_PRESETS[number]) => {
    const label = preset.label;
    if (activePreset === label) {
      // Toggle off
      setActivePreset('');
      setDateFrom('');
      setDateTo('');
      setShowCustomDates(false);
      return;
    }
    const range = getDateRange(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
    setActivePreset(label);
    setShowCustomDates(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all pages for export
      const allTxns: Transaction[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const query: Record<string, string> = { page: String(page), limit: '100' };
        if (searchTerm) query.search = searchTerm;
        if (statusFilter) query.status = statusFilter;
        if (countryFilter) query.country_code = countryFilter;
        if (dateFrom) query.date_from = dateFrom;
        if (dateTo) query.date_to = dateTo;
        if (selectedStoreId) query.store_id = selectedStoreId;
        const res = await api.transactions.list(query);
        const data = res.data ?? [];
        allTxns.push(...data);
        hasMore = page < (res.pagination?.total_pages || 1);
        page++;
      }
      exportCSV(allTxns);
    } catch {
      // Fallback: export current page
      exportCSV(transactions);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Pipeline Filter Banner ── */}
      {pipelineFilter && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.25)]">
          <Zap className="w-4 h-4 text-[#00F0FF] shrink-0" />
          <span className="text-xs text-[#00F0FF] cyber-mono">
            Filtrado por estágio: <span className="font-bold">{statusLabels[pipelineFilter]?.label ?? pipelineFilter}</span>
          </span>
          <button
            onClick={clearPipelineFilter}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] cyber-mono text-[#555566] hover:text-[#E0E0E8] border border-[rgba(51,51,51,0.3)] hover:border-[rgba(51,51,51,0.6)] transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="cyber-panel p-3 border border-[rgba(0,255,65,0.2)]">
          <span className="text-[10px] cyber-mono text-[#555566]">VALOR BRUTO</span>
          {isLoading ? (
            <div className="h-6 w-32 bg-[rgba(51,51,51,0.3)] rounded animate-pulse mt-1" />
          ) : (
            <p className="text-lg font-bold text-[#E0E0E8] cyber-mono">{formatCurrency(totalVolume, 'EUR')}</p>
          )}
        </div>
        <div className="cyber-panel p-3 border border-[rgba(0,255,65,0.2)]">
          <span className="text-[10px] cyber-mono text-[#555566]">VALOR LÍQUIDO</span>
          {isLoading ? (
            <div className="h-6 w-32 bg-[rgba(51,51,51,0.3)] rounded animate-pulse mt-1" />
          ) : (
            <p className="text-lg font-bold text-[#00FF41] cyber-mono">+{formatCurrency(totalNetVolume, 'EUR')}</p>
          )}
        </div>
        <div className="cyber-panel p-3 border border-[rgba(0,240,255,0.2)]">
          <span className="text-[10px] cyber-mono text-[#555566]">TRANSAÇÕES</span>
          {isLoading ? (
            <div className="h-6 w-16 bg-[rgba(51,51,51,0.3)] rounded animate-pulse mt-1" />
          ) : (
            <p className="text-lg font-bold text-[#00F0FF] cyber-mono">{totalItems}</p>
          )}
        </div>
        <div className="cyber-panel p-3 border border-[rgba(255,184,0,0.2)]">
          <span className="text-[10px] cyber-mono text-[#555566]">PÁGINA</span>
          {isLoading ? (
            <div className="h-6 w-16 bg-[rgba(51,51,51,0.3)] rounded animate-pulse mt-1" />
          ) : (
            <p className="text-lg font-bold text-[#FFB800] cyber-mono">{currentPage} / {totalPages}</p>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="cyber-panel p-4">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[#00FF41]" />
              <h3 className="text-sm font-semibold text-[#E0E0E8]">Histórico de Transações</h3>
              <span className="text-[9px] cyber-mono text-[#444455]">via API</span>
            </div>
            <div className="flex items-center gap-3">
              <StoreSelector />
              <button
                onClick={handleExport}
                disabled={isExporting || transactions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] cyber-mono border border-[rgba(0,240,255,0.3)] text-[#00F0FF] hover:bg-[rgba(0,240,255,0.06)] hover:border-[rgba(0,240,255,0.5)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                <span>{isExporting ? 'Exportando...' : 'Exportar CSV'}</span>
              </button>
            </div>
          </div>

          {/* Period presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5 text-[#555566] shrink-0" />
            <div className="flex items-center gap-1 flex-wrap">
              {PERIOD_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] cyber-mono border transition-all duration-200 ${
                    activePreset === preset.label
                      ? 'bg-[rgba(0,240,255,0.1)] border-[rgba(0,240,255,0.4)] text-[#00F0FF]'
                      : 'border-[rgba(51,51,51,0.3)] text-[#555566] hover:text-[#888899] hover:border-[rgba(51,51,51,0.6)]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCustomDates(!showCustomDates);
                  if (showCustomDates && !activePreset) {
                    setDateFrom('');
                    setDateTo('');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] cyber-mono border transition-all duration-200 ${
                  showCustomDates && !activePreset
                    ? 'bg-[rgba(0,240,255,0.1)] border-[rgba(0,240,255,0.4)] text-[#00F0FF]'
                    : 'border-[rgba(51,51,51,0.3)] text-[#555566] hover:text-[#888899] hover:border-[rgba(51,51,51,0.6)]'
                }`}
              >
                Personalizado
              </button>
              {(activePreset || (dateFrom && dateTo)) && (
                <button
                  onClick={() => {
                    setActivePreset('');
                    setDateFrom('');
                    setDateTo('');
                    setShowCustomDates(false);
                  }}
                  className="px-2 py-1 rounded text-[9px] cyber-mono text-[#FF0040] hover:bg-[rgba(255,0,64,0.06)] border border-[rgba(255,0,64,0.2)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Custom date inputs */}
          {showCustomDates && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setActivePreset(''); }}
                className="cyber-input px-2.5 py-1.5 rounded-lg text-[11px] text-[#E0E0E8] bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.5)]"
              />
              <span className="text-[10px] text-[#555566]">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setActivePreset(''); }}
                className="cyber-input px-2.5 py-1.5 rounded-lg text-[11px] text-[#E0E0E8] bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.5)]"
              />
            </div>
          )}

          {/* Search + Filters row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555566]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, email..."
                className="cyber-input w-full pl-9 pr-3 py-1.5 rounded-lg text-xs text-[#E0E0E8]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cyber-input px-3 py-1.5 rounded-lg text-xs text-[#E0E0E8] bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.5)]"
            >
              <option value="">Todos Status</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="cyber-input px-3 py-1.5 rounded-lg text-xs text-[#E0E0E8] bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.5)]"
            >
              <option value="">Todos Países</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <button
              onClick={fetchTransactions}
              className="p-1.5 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] hover:border-[rgba(51,51,51,0.8)] transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-[rgba(255,0,64,0.08)] border border-[rgba(255,0,64,0.3)]">
            <AlertTriangle className="w-4 h-4 text-[#FF0040] shrink-0" />
            <span className="text-xs text-[#FF0040]">{error}</span>
            <button onClick={fetchTransactions} className="ml-auto text-[10px] underline hover:no-underline">
              Tentar
            </button>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-[rgba(51,51,51,0.15)] rounded animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-[#555566]">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(51,51,51,0.5)]">
                  <th className="text-left text-[10px] cyber-mono text-[#555566] pb-2 font-medium">STATUS</th>
                  <th className="text-left text-[10px] cyber-mono text-[#555566] pb-2 font-medium hidden sm:table-cell">PAÍS</th>
                  <th className="text-left text-[10px] cyber-mono text-[#555566] pb-2 font-medium">LOJA</th>
                  <th className="text-left text-[10px] cyber-mono text-[#555566] pb-2 font-medium">ID</th>
                  <th className="text-left text-[10px] cyber-mono text-[#555566] pb-2 font-medium hidden md:table-cell">MÉTODO</th>
                  <th className="text-left text-[10px] cyber-mono text-[#555566] pb-2 font-medium hidden lg:table-cell">PAGADOR</th>
                  <th className="text-right text-[10px] cyber-mono text-[#555566] pb-2 font-medium">VALOR</th>
                  <th className="text-right text-[10px] cyber-mono text-[#555566] pb-2 font-medium hidden xl:table-cell">HORA</th>
                  <th className="text-right text-[10px] cyber-mono text-[#555566] pb-2 font-medium hidden xl:table-cell">AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const type = typeLabels[txn.type] || typeLabels.payment;
                  const status = statusLabels[txn.status] || statusLabels.failed;
                  const currentStageIdx = PIPELINE_STAGES.indexOf(txn.status as TransactionStatus);
                  const nextStage =
                    currentStageIdx >= 0 && currentStageIdx < PIPELINE_STAGES.length - 1
                      ? PIPELINE_STAGES[currentStageIdx + 1]
                      : null;

                  const amt = safeNum(txn.amount);
                  const net = safeNum(txn.net_amount);
                  const fee = safeNum(txn.fee_amount);
                  const hasNetData = txn.net_amount != null && txn.fee_amount != null && isSuccessStatus(txn.status);
                  const displayAmount = hasNetData ? net : amt;
                  const payerEmail = txn.customer_email || txn.payer_email || txn.payer_name || null;

                  return (
                    <tr
                      key={txn.id}
                      className="border-b border-[rgba(51,51,51,0.15)] last:border-0 hover:bg-[rgba(255,255,255,0.01)] transition-colors relative"
                    >
                      {/* Status */}
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          <span className={`cyber-badge text-[8px] ${status.color}`}>{status.label}</span>
                        </div>
                      </td>

                      {/* País */}
                      <td className="py-2.5 pr-2 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{getFlag(txn.country_code)}</span>
                          <span className="text-[10px] cyber-mono text-[#888899]">{txn.country_code?.toUpperCase()}</span>
                        </div>
                      </td>

                      {/* Loja */}
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <StoreIcon className="w-3 h-3 text-[#555566] shrink-0" />
                          {txn.store ? (
                            <span className="text-[10px] text-[#E0E0E8] truncate max-w-[100px]">
                              {txn.store.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#555566] italic">—</span>
                          )}
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-2.5 pr-2">
                        <code className="text-xs cyber-mono text-[#E0E0E8]">
                          {txn.id.length > 12 ? txn.id.slice(0, 12) : txn.id}
                        </code>
                      </td>

                      {/* Método */}
                      <td className="py-2.5 pr-2 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#888899]">{getPaymentMethodIcon(txn.payment_method)}</span>
                          <span className="text-[10px] text-[#E0E0E8]">{getPaymentMethodLabel(txn.payment_method)}</span>
                        </div>
                      </td>

                      {/* Pagador — reads customer_email */}
                      <td className="py-2.5 pr-2 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {txn.type === 'refund' ? (
                            <ArrowUpRight className="w-3 h-3 text-[#FF0040] shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-[#00FF41] shrink-0" />
                          )}
                          {payerEmail ? (
                            <span className="text-[#888899] truncate max-w-[140px]">{payerEmail}</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#444455]">
                              <User className="w-3 h-3" />
                              <span className="italic">Anónimo</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-2.5 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-medium cyber-mono ${
                                txn.type === 'refund'
                                  ? 'text-[#FF0040]'
                                  : hasNetData
                                    ? 'text-[#00FF41]'
                                    : 'text-[#E0E0E8]'
                              }`}
                            >
                              {txn.type === 'refund' ? '-' : hasNetData ? '+' : ''}
                              {formatCurrency(displayAmount, txn.currency)}
                            </span>
                            {hasNetData && (
                              <FeeTooltip amount={amt} fee={fee} currency={txn.currency} />
                            )}
                          </div>
                          {hasNetData && (
                            <span className="text-[9px] cyber-mono text-[#444455]">
                              bruto {formatCurrency(amt, txn.currency)} · fee -{formatCurrency(fee, txn.currency)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hora */}
                      <td className="py-2.5 text-right hidden xl:table-cell">
                        <span className="text-[10px] cyber-mono text-[#555566]">
                          {new Date(txn.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 text-right hidden xl:table-cell">
                        <div className="relative">
                          {nextStage && txn.status !== 'settled' && txn.status !== 'failed' ? (
                            <button
                              onClick={() =>
                                setShowStatusDropdown(showStatusDropdown === txn.id ? null : txn.id)
                              }
                              disabled={updatingId === txn.id}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] cyber-mono border border-[rgba(0,255,65,0.2)] text-[#555566] hover:text-[#00FF41] hover:border-[rgba(0,255,65,0.4)] transition-colors"
                            >
                              {updatingId === txn.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <span className="text-[9px] cyber-mono text-[#333]">—</span>
                          )}
                          {showStatusDropdown === txn.id && nextStage && (
                            <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 rounded-lg bg-[#141418] border border-[rgba(51,51,51,0.6)] shadow-xl">
                              <p className="text-[9px] cyber-mono text-[#555566] px-3 py-1.5">Mover para:</p>
                              <button
                                onClick={() => handleUpdateStatus(txn.id, nextStage)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[10px] text-[#E0E0E8] hover:bg-[rgba(0,255,65,0.06)] transition-colors"
                              >
                                <Play className="w-3 h-3 text-[#00FF41]" />
                                <span>{statusLabels[nextStage]?.label || nextStage}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(51,51,51,0.3)]">
          <span className="text-[10px] cyber-mono text-[#555566]">
            Mostrando {transactions.length} de {totalItems} transações
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-2.5 py-1 rounded border border-[rgba(0,255,65,0.3)] bg-[rgba(0,255,65,0.06)] text-[10px] cyber-mono text-[#00FF41]">
              {currentPage} / {totalPages}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
