'use client';

import { useState } from 'react';
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { api, NexFlowXAPIError } from '@/lib/api/client';
import type { PayoutMethod } from '@/lib/api/contracts';

interface PayoutWidgetProps {
  availableBalance: number;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYOUT_METHODS: { value: PayoutMethod; label: string; description: string; icon: string }[] = [
  { value: 'PIX', label: 'PIX', description: 'Transferência instantânea (BR)', icon: '🇧🇷' },
  { value: 'SEPA', label: 'SEPA', description: 'Transferência europeia (1-2 dias)', icon: '🇪🇺' },
  { value: 'CRYPTO', label: 'CRYPTO', description: 'Transferência em criptomoeda', icon: '₿' },
];

const DESTINATION_PLACEHOLDERS: Record<PayoutMethod, string> = {
  PIX: 'Chave PIX (CPF, email, telefone ou chave aleatória)',
  SEPA: 'IBAN (ex: PT50002700001234567890123)',
  CRYPTO: 'Endereço da carteira (ex: 0x...)',
};

export default function PayoutWidget({ availableBalance, currency = 'EUR', onClose, onSuccess }: PayoutWidgetProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayoutMethod>('SEPA');
  const [destination, setDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const parsedAmount = parseFloat(amount) || 0;
  const isFormValid = parsedAmount > 0 && parsedAmount <= availableBalance && destination.trim().length > 0;

  const formatBalance = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);
  };

  const handleSetMax = () => {
    setAmount(String(availableBalance));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.payouts.create({
        amount: parsedAmount,
        currency,
        method,
        destination: destination.trim(),
      });

      setSuccessMessage(res.message ?? `Saque de ${formatBalance(parsedAmount)} via ${method} solicitado com sucesso.`);
      setSuccess(true);

      // Reset form after brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      if (err instanceof NexFlowXAPIError) {
        setError(err.message);
      } else {
        setError('Erro ao processar saque. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0E0E12] border border-[rgba(0,255,65,0.3)] rounded-xl shadow-[0_0_40px_rgba(0,255,65,0.1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(51,51,51,0.5)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.3)]">
              <Wallet className="w-5 h-5 text-[#00FF41]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E0E0E8]">Sacar Fundos</h3>
              <p className="text-[10px] cyber-mono text-[#555566]">
                Disponível: <span className="text-[#00FF41]">{formatBalance(availableBalance)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] hover:border-[rgba(51,51,51,0.8)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Success State */}
          {success && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="p-3 rounded-full bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-[#00FF41]" />
              </div>
              <p className="text-sm text-[#00FF41] text-center">{successMessage}</p>
              <p className="text-[10px] cyber-mono text-[#555566]">A redirecionar...</p>
            </div>
          )}

          {!success && (
            <>
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[rgba(255,0,64,0.08)] border border-[rgba(255,0,64,0.3)]">
                  <AlertTriangle className="w-4 h-4 text-[#FF0040] shrink-0" />
                  <span className="text-xs text-[#FF0040]">{error}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs text-[#888899] mb-2">Valor do Saque</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="cyber-input w-full pl-4 pr-20 py-3 rounded-lg text-lg cyber-mono text-[#E0E0E8]"
                    disabled={isSubmitting}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSetMax}
                      className="px-2 py-1 rounded text-[9px] cyber-mono border border-[rgba(0,255,65,0.3)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.1)] transition-colors"
                    >
                      MAX
                    </button>
                    <span className="text-xs text-[#555566] pr-2">{currency}</span>
                  </div>
                </div>
                {parsedAmount > availableBalance && (
                  <p className="text-[10px] text-[#FF0040] mt-1">Valor excede o saldo disponível</p>
                )}
              </div>

              {/* Payout Method */}
              <div>
                <label className="block text-xs text-[#888899] mb-2">Método de Saque</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYOUT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border transition-all duration-200 ${
                        method === m.value
                          ? 'bg-[rgba(0,255,65,0.06)] border-[rgba(0,255,65,0.4)] text-[#00FF41]'
                          : 'bg-[rgba(10,10,14,0.4)] border-[rgba(51,51,51,0.5)] text-[#888899] hover:border-[rgba(51,51,51,0.8)] hover:text-[#E0E0E8]'
                      }`}
                      disabled={isSubmitting}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-xs font-medium">{m.label}</span>
                      <span className="text-[8px] text-[#555566] text-center leading-tight">{m.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs text-[#888899] mb-2">Destino</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={DESTINATION_PLACEHOLDERS[method]}
                  className="cyber-input w-full px-4 py-3 rounded-lg text-xs text-[#E0E0E8]"
                  disabled={isSubmitting}
                />
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.15)]">
                <Shield className="w-3.5 h-3.5 text-[#00F0FF] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#888899] leading-relaxed">
                  Saques são processados via <span className="text-[#00F0FF]">Core Bank V2</span> com criptografia de ponta.
                  O processamento pode levar até 24h dependendo do método escolhido.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  bg-gradient-to-r from-[rgba(0,255,65,0.15)] to-[rgba(0,255,65,0.08)]
                  border border-[rgba(0,255,65,0.4)] text-[#00FF41]
                  font-semibold text-sm cyber-mono
                  hover:from-[rgba(0,255,65,0.25)] hover:to-[rgba(0,255,65,0.15)]
                  hover:shadow-[0_0_20px_rgba(0,255,65,0.15)]
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Saque</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
