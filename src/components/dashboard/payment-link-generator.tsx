'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Link2,
  Copy,
  Check,
  X,
  ExternalLink,
  Euro,
  Loader2,
  CheckCircle2,
  Store,
  CreditCard,
  Zap,
} from 'lucide-react';
import { api, NexFlowXAPIError } from '@/lib/api/client';
import type { PaymentLink } from '@/lib/api/contracts';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── TYPES ────────────────────────────────────────────────────────────

interface PaymentLinkRequest {
  amount: number;
  currency: string;
  metadata: { product: string };
}

interface PaymentLinkResponse {
  data: { id: string; shareable_url: string };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dólar Americano' },
  { code: 'BRL', symbol: 'R$', label: 'Real Brasileiro' },
] as const;

const PROVIDERS = [
  { value: 'auto', label: 'Automático', icon: <Zap className="w-3.5 h-3.5" /> },
  { value: 'stripe', label: 'Stripe', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { value: 'sumup', label: 'SumUp', icon: <Store className="w-3.5 h-3.5" /> },
] as const;

const CHECKOUT_BASE_URL = 'https://pay.nexflowx.tech';

// ─── HELPERS ──────────────────────────────────────────────────────────────

/** Get the currency symbol for display in the input */
function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '€';
}

/** Copy text to clipboard with fallback */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────

export default function PaymentLinkGenerator() {
  const { toast } = useToast();

  // Fetch stores
  const { data: storesResponse } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.stores.list(),
    staleTime: 5 * 60 * 1000,
  });

  const stores = storesResponse?.data || [];

  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [productName, setProductName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('auto');

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [createdLink, setCreatedLink] = useState<PaymentLink | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // ─── Derived ──────────────────────────────────────────────────────────

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const currencySymbol = getCurrencySymbol(currency);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCreateLink = async () => {
    if (!parsedAmount || parsedAmount <= 0) return;

    setIsCreating(true);
    setCreationError(null);

    try {
      const response = await api.paymentLinks.create({
        amount: parsedAmount,
        currency: currency,
        metadata: {
          product: productName.trim() || 'Sem nome',
        },
        store_id: selectedStoreId || undefined,
        provider_name: selectedProvider,
      });

      const newLink = response.data;
      setCreatedLink(newLink);
      setShowModal(true);

      // Clear form
      setAmount('');
      setProductName('');
      setSelectedStoreId(null);
      setSelectedProvider('auto');
    } catch (err) {
      if (err instanceof NexFlowXAPIError) {
        setCreationError(err.message);
      } else {
        setCreationError('Erro ao criar link. Tenta novamente.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdLink) return;
    const url = createdLink.shareable_url;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      toast({
        title: 'Link copiado com sucesso!',
        description: 'O link de pagamento está pronto para ser partilhado.',
        className: 'border-[#00FF41] bg-[rgba(0,255,65,0.1)] text-[#00FF41]',
      });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCopiedLink(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ═══ Generator Panel ═══ */}
        <div className="cyber-panel p-6 border border-[rgba(0,255,65,0.15)]">
          <div className="flex items-center gap-2 mb-5">
            <Link2 className="w-4 h-4 text-[#00FF41]" />
            <h3 className="text-sm font-semibold text-[#E0E0E8]">
              Gerar Link de Pagamento
            </h3>
          </div>

          <div className="space-y-4">
            {/* ── Amount Input ── */}
            <div>
              <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                VALOR DO PAGAMENTO
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555566]" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="cyber-input w-full pl-10 pr-16 py-2.5 rounded-lg text-lg cyber-mono text-[#E0E0E8]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm cyber-mono text-[#555566]">
                  {currencySymbol}
                </span>
              </div>
            </div>

            {/* ── Currency Select ── */}
            <div>
              <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                MOEDA
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="cyber-input w-full px-4 py-2.5 rounded-lg text-sm cyber-mono text-[#E0E0E8] appearance-none cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Store Select ── */}
            <div>
              <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                LOJA
              </label>
              <Select value={selectedStoreId || 'none'} onValueChange={(value) => setSelectedStoreId(value === 'none' ? null : value)}>
                <SelectTrigger className="cyber-input w-full px-4 py-2.5 rounded-lg text-sm cyber-mono text-[#E0E0E8] appearance-none cursor-pointer">
                  <SelectValue placeholder="Selecione uma loja (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-[#12121A] border-[rgba(51,51,51,0.5)]">
                  {stores.length === 0 ? (
                    <SelectItem value="none" disabled className="text-[#555566]">
                      Nenhuma loja disponível
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none" className="text-[#888899]">
                        Sem loja específica
                      </SelectItem>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id} className="text-[#E0E0E8]">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded border border-[rgba(255,255,255,0.2)]"
                              style={{ backgroundColor: store.primary_color }}
                            />
                            <span>{store.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* ── Provider Select ── */}
            <div>
              <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                PROVIDER PADRÃO
              </label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="cyber-input w-full px-4 py-2.5 rounded-lg text-sm cyber-mono text-[#E0E0E8] appearance-none cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121A] border-[rgba(51,51,51,0.5)]">
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value} className="text-[#E0E0E8]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#555566]">{provider.icon}</span>
                        <span>{provider.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Product Name Input ── */}
            <div>
              <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                NOME DO PRODUTO
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Plano Mensal Premium"
                className="cyber-input w-full px-4 py-2.5 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
              />
            </div>

            {/* ── Error Feedback ── */}
            {creationError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[rgba(255,0,64,0.06)] border border-[rgba(255,0,64,0.25)]">
                <X className="w-3.5 h-3.5 text-[#FF0040] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#FF0040]">{creationError}</p>
              </div>
            )}

            {/* ── Generate Button ── */}
            <button
              onClick={handleCreateLink}
              disabled={!parsedAmount || parsedAmount <= 0 || isCreating}
              className={`cyber-btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                text-sm font-medium cyber-mono transition-all duration-200
                ${!parsedAmount || parsedAmount <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A gerar link...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Gerar Link de Pagamento</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Success Modal ═══ */}
      {showModal && createdLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative w-full max-w-md rounded-xl border border-[rgba(0,255,65,0.25)] bg-[#12121A] p-6 shadow-[0_0_40px_rgba(0,255,65,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-1 rounded-md text-[#555566] hover:text-[#E0E0E8] hover:bg-[rgba(255,255,255,0.05)] transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Success icon + title */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.3)] flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7 text-[#00FF41]" />
              </div>
              <h2 className="text-lg font-semibold text-[#E0E0E8]">
                Link Criado com Sucesso!
              </h2>
              <p className="text-xs text-[#888899] mt-1">
                Partilha este link para receber pagamentos
              </p>
            </div>

            {/* Shareable URL display */}
            <div className="mb-5">
              <label className="block text-[9px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                LINK DE CHECKOUT
              </label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.4)]">
                <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                <code className="flex-1 text-xs cyber-mono text-[#00F0FF] truncate">
                  {createdLink.shareable_url}
                </code>
              </div>
            </div>

            {/* Amount + Currency + Product info */}
            <div className="flex flex-col items-center gap-2 mb-5 text-[11px] cyber-mono text-[#888899]">
              <span>
                Produto:{' '}
                <span className="text-[#E0E0E8]">
                  {productName.trim() || 'Sem nome'}
                </span>
              </span>
              <span>
                Valor:{' '}
                <span className="text-[#E0E0E8]">
                  {parsedAmount.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {currency}
                </span>
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium cyber-mono transition-all duration-200 border border-[rgba(0,255,65,0.3)] bg-[rgba(0,255,65,0.06)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.12)]"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              {/* Close */}
              <button
                onClick={handleCloseModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm cyber-mono transition-all duration-200 border border-[rgba(51,51,51,0.5)] bg-[rgba(10,10,14,0.4)] text-[#888899] hover:text-[#E0E0E8] hover:border-[rgba(51,51,51,0.8)]"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
