'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownLeft,
  Clock,
  Wallet,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Shield,
  TrendingUp,
  CircleDollarSign,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Wallet as WalletType } from '@/lib/api/contracts';
import PayoutWidget from './payout-widget';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function safeNum(val: number | string | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value: number, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('pt-BR')}`;
  }
}

/* ─── Wallet Card Component ──────────────────────────────────────────────── */

interface WalletCardProps {
  title: string;
  subtitle: string;
  value: number;
  currency: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  iconBg: string;
  glowShadow: string;
  isHighlighted?: boolean;
  action?: React.ReactNode;
}

function WalletCard({
  title,
  subtitle,
  value,
  currency,
  icon,
  color,
  borderColor,
  iconBg,
  glowShadow,
  isHighlighted = false,
  action,
}: WalletCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-6 border transition-all duration-300 ${
        isHighlighted ? 'col-span-1 sm:col-span-2 lg:col-span-2' : ''
      }`}
      style={{
        borderColor,
        background: isHighlighted
          ? `linear-gradient(135deg, rgba(10,10,14,0.9) 0%, ${color}08 100%)`
          : 'rgba(10,10,14,0.7)',
        boxShadow: isHighlighted ? `0 0 40px ${color}15, inset 0 1px 0 ${color}20` : `0 0 20px ${color}08`,
      }}
    >
      {/* Scan line effect for highlighted card */}
      {isHighlighted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color} 2px, ${color} 4px)`,
            }}
          />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-3 rounded-xl border"
            style={{
              backgroundColor: `${color}12`,
              borderColor: `${color}30`,
              color,
            }}
          >
            {icon}
          </div>
          {action && <div>{action}</div>}
        </div>

        {/* Title */}
        <p className="text-xs text-[#888899] mb-1">{title}</p>
        <p className="text-[10px] cyber-mono text-[#555566] mb-3">{subtitle}</p>

        {/* Value */}
        <p
          className={`text-3xl font-bold cyber-mono ${isHighlighted ? 'text-4xl' : ''}`}
          style={{ color }}
        >
          {formatCurrency(value, currency)}
        </p>

        {/* Neon underline */}
        <div
          className="mt-3 h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}60, ${color}15, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Main Tesouraria Component ──────────────────────────────────────────── */

export default function WalletCards() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayout, setShowPayout] = useState(false);

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.wallet.get();
      setWallet(res.data);
    } catch {
      setError('Não foi possível carregar os dados da tesouraria.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const balanceIncoming = wallet ? safeNum(wallet.balance_incoming) : 0;
  const balancePending = wallet ? safeNum(wallet.balance_pending) : 0;
  const balanceAvailable = wallet ? safeNum(wallet.balance_available) : 0;
  const totalBalance = balanceIncoming + balancePending + balanceAvailable;
  const currency = wallet?.currency ?? 'EUR';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">TESOURARIA // COFRE</span>
            <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
          </div>
          <h2 className="text-xl font-bold text-[#E0E0E8]">Tesouraria</h2>
          <p className="text-sm text-[#888899] mt-1">
            Gestão de saldos e saques
          </p>
        </div>
        <div className="flex items-center gap-3">
          {wallet?.updated_at && (
            <span className="text-[10px] cyber-mono text-[#555566]">
              Atualizado: {new Date(wallet.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchWallet}
            className="p-2 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] hover:border-[rgba(51,51,51,0.8)] transition-colors"
            title="Atualizar saldos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[rgba(255,0,64,0.08)] border border-[rgba(255,0,64,0.3)]">
          <AlertTriangle className="w-4 h-4 text-[#FF0040] shrink-0" />
          <span className="text-xs text-[#FF0040]">{error}</span>
          <button
            onClick={fetchWallet}
            className="ml-auto text-[10px] cyber-mono text-[#FF0040] underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── Loading Skeletons ── */}
      {isLoading && !wallet && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-[rgba(51,51,51,0.15)] animate-pulse border border-[rgba(51,51,51,0.2)]"
            />
          ))}
        </div>
      )}

      {/* ── Wallet Cards ── */}
      {!isLoading && wallet && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Fluxo de Entrada */}
          <WalletCard
            title="Fluxo de Entrada"
            subtitle="Receitas de hoje — aguardando processamento"
            value={balanceIncoming}
            currency={currency}
            icon={<ArrowDownLeft className="w-6 h-6" />}
            color="#FFB800"
            borderColor="rgba(255,184,0,0.3)"
            iconBg="bg-[rgba(255,184,0,0.1)]"
            glowShadow="rgba(255,184,0,0.1)"
          />

          {/* Card 2: Em Liquidação */}
          <WalletCard
            title="Em Liquidação"
            subtitle="Fundos confirmados — em retenção/liquidação"
            value={balancePending}
            currency={currency}
            icon={<Clock className="w-6 h-6" />}
            color="#00F0FF"
            borderColor="rgba(0,240,255,0.3)"
            iconBg="bg-[rgba(0,240,255,0.1)]"
            glowShadow="rgba(0,240,255,0.1)"
          />

          {/* Card 3: Disponível (Highlighted with Payout Button) */}
          <WalletCard
            title="Disponível"
            subtitle="Pronto para saque imediato"
            value={balanceAvailable}
            currency={currency}
            icon={<Wallet className="w-6 h-6" />}
            color="#00FF41"
            borderColor="rgba(0,255,65,0.4)"
            iconBg="bg-[rgba(0,255,65,0.1)]"
            glowShadow="rgba(0,255,65,0.15)"
            isHighlighted={false}
            action={
              <button
                onClick={() => setShowPayout(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                  bg-gradient-to-r from-[rgba(0,255,65,0.15)] to-[rgba(0,255,65,0.08)]
                  border border-[rgba(0,255,65,0.4)] text-[#00FF41]
                  text-xs font-semibold cyber-mono
                  hover:from-[rgba(0,255,65,0.25)] hover:to-[rgba(0,255,65,0.15)]
                  hover:shadow-[0_0_16px_rgba(0,255,65,0.2)]
                  transition-all duration-300"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Sacar Fundos</span>
              </button>
            }
          />
        </div>
      )}

      {/* ── Summary Bar ── */}
      {!isLoading && wallet && (
        <div className="cyber-panel p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00FF41]" />
                <span className="text-xs text-[#E0E0E8] font-medium">Total Consolidado</span>
              </div>
              <span className="text-xl font-bold cyber-mono text-[#00FF41]">
                {formatCurrency(totalBalance, currency)}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFB800]" />
                <span className="text-[10px] cyber-mono text-[#555566]">
                  Entrada {((balanceIncoming / totalBalance) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                <span className="text-[10px] cyber-mono text-[#555566]">
                  Liquidação {((balancePending / totalBalance) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF41]" />
                <span className="text-[10px] cyber-mono text-[#555566]">
                  Disponível {((balanceAvailable / totalBalance) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          {/* Distribution Bar */}
          <div className="mt-3 h-2 rounded-full overflow-hidden bg-[rgba(51,51,51,0.4)] flex">
            {totalBalance > 0 && (
              <>
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${(balanceIncoming / totalBalance) * 100}%`,
                    background: 'linear-gradient(90deg, #FFB80066, #FFB800)',
                  }}
                />
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${(balancePending / totalBalance) * 100}%`,
                    background: 'linear-gradient(90deg, #00F0FF66, #00F0FF)',
                  }}
                />
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${(balanceAvailable / totalBalance) * 100}%`,
                    background: 'linear-gradient(90deg, #00FF4166, #00FF41)',
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Info Panel ── */}
      <div className="cyber-panel p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[#E0E0E8] mb-1">Non-Custodial Orchestration</h4>
            <p className="text-xs text-[#888899] leading-relaxed">
              Os fundos são orquestrados via <span className="text-[#00F0FF]">Core Bank V2</span> sem custódia direta.
              O saldo disponível reflete valores já liquidados e prontos para saque através dos métodos PIX, SEPA ou CRYPTO.
              Todos os saques são processados com criptografia de ponta-a-ponta.
            </p>
          </div>
        </div>
      </div>

      {/* ── Payout Widget Modal ── */}
      {showPayout && (
        <PayoutWidget
          availableBalance={balanceAvailable}
          currency={currency}
          onClose={() => setShowPayout(false)}
          onSuccess={fetchWallet}
        />
      )}
    </div>
  );
}
