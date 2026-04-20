'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Key,
  Globe,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Webhook,
  Zap,
  Shield,
  BookOpen,
  Terminal,
  ChevronRight,
  Braces,
  FileJson,
  ArrowRight,
  ExternalLink,
  LayoutTemplate,
  Code2,
  Info,
  Route,
  Link2,
  Loader2,
  Save,
  Lock,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import type { AuthUser } from '@/lib/api/contracts';

/* ═══════════════════════════════════════════════════════════════
   API TAB — Types loaded from live API
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   UTILITY — copy to clipboard
   ═══════════════════════════════════════════════════════════════ */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

/* ═══════════════════════════════════════════════════════════════
   CODE BLOCK COMPONENT
   ═══════════════════════════════════════════════════════════════ */

function CodeBlock({
  code,
  language,
  filename,
}: {
  code: string;
  language: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await copyText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="rounded-lg border border-[rgba(51,51,51,0.5)] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0F0F14] border-b border-[rgba(51,51,51,0.4)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[11px] cyber-mono text-[#555566]">{filename ?? language}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] cyber-mono transition-all duration-200 ${
            copied
              ? 'text-[#00FF41] bg-[rgba(0,255,65,0.1)]'
              : 'text-[#555566] hover:text-[#888899] hover:bg-[rgba(255,255,255,0.03)]'
          }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>
      {/* Code area */}
      <div className="bg-[#0A0C10] p-4 overflow-x-auto cyber-scrollbar">
        <pre className="text-[12px] leading-[1.7] cyber-mono text-[#ABB2BF] whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1: GERIR CHAVES & WEBHOOKS (LIVE API)
   ═══════════════════════════════════════════════════════════════ */

function KeysWebhooksTab() {
  // ── API Keys State ──
  const [apiKeys, setApiKeys] = useState<Array<{
    id: string; key_hash: string; environment: string;
    status: string; last_used_at: string | null; created_at: string;
  }>>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // ── Webhook State (via PATCH /users/me) ──
  const [webhookURL, setWebhookURL] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // ── Fetch API Keys ──
  const fetchKeys = async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const res = await api.apiKeys.list();
      setApiKeys(res.data.map((k: Record<string, string>) => ({
        id: k.id ?? '',
        key_hash: (k as Record<string, string>).key_hash ?? (k as Record<string, string>).key_prefix ?? '',
        environment: k.environment ?? 'sandbox',
        status: k.status ?? 'active',
        last_used_at: k.last_used_at ?? null,
        created_at: k.created_at ?? '',
      })));
    } catch {
      setKeysError('Erro ao carregar chaves.');
    } finally {
      setKeysLoading(false);
    }
  };

  // ── Fetch current webhook URL from user profile ──
  const fetchWebhook = async () => {
    setWebhookLoading(true);
    setWebhookError(null);
    try {
      const res = await api.users.getMe();
      setWebhookURL(res.user?.webhook_url ?? '');
      setWebhookSecret(res.user?.webhook_secret ?? '');
    } catch {
      setWebhookError('Erro ao carregar perfil.');
    } finally {
      setWebhookLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchWebhook();
  }, []);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyKey = async (hash: string, id: string) => {
    await copyText(hash);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── No create/revoke — keys are managed server-side ──

  const saveWebhookURL = async () => {
    setSavingWebhook(true);
    setWebhookSaved(false);
    try {
      await api.users.updateMe({ webhook_url: webhookURL });
      setWebhookSaved(true);
    } catch {
      // Silently fail
    } finally {
      setSavingWebhook(false);
    }
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtLastUsed = (d: string | null) => {
    if (!d) return 'Nunca';
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return fmtDate(d);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ═══ API Keys ═══ */}
      <div className="cyber-panel p-4">
        <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#00FF41]" />
            <h3 className="text-sm font-semibold text-[#E0E0E8]">API Keys</h3>
            <span className="text-[9px] cyber-mono text-[#444455]">GET /api-keys</span>
          </div>

        {/* Keys List */}
        {keysLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[rgba(51,51,51,0.15)] rounded-lg animate-pulse" />)}
          </div>
        ) : keysError ? (
          <div className="text-center py-6">
            <p className="text-xs text-[#FF0040]">{keysError}</p>
            <button onClick={fetchKeys} className="text-[10px] text-[#555566] underline mt-2 hover:no-underline">Tentar novamente</button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto cyber-scrollbar pr-1">
            {apiKeys.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[#555566]">Nenhuma chave API criada</p>
              </div>
            ) : apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  apiKey.status === 'active'
                    ? 'bg-[rgba(10,10,14,0.4)] border-[rgba(51,51,51,0.3)]'
                    : 'bg-[rgba(10,10,14,0.2)] border-[rgba(51,51,51,0.15)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                    {apiKey.status === 'active'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF41]" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-[#FF0040]" />}
                    <span className="text-xs font-medium text-[#E0E0E8]">{apiKey.id === '' ? 'Chave Ativa' : apiKey.id}</span>
                  </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.3)]">
                  <button
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    className="shrink-0 p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#555566] hover:text-[#E0E0E8] transition-colors"
                  >
                    {visibleKeys.has(apiKey.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <code className="flex-1 text-[11px] cyber-mono text-[#888899] truncate">
                    {visibleKeys.has(apiKey.id) ? apiKey.key_hash : 'nx_live_••••••••••••'}
                  </code>
                  <button
                    onClick={() => copyKey(apiKey.key_hash, apiKey.id)}
                    className={`shrink-0 p-1 rounded transition-colors ${
                      copiedKey === apiKey.id
                        ? 'text-[#00FF41]'
                        : 'hover:bg-[rgba(255,255,255,0.05)] text-[#555566] hover:text-[#E0E0E8]'
                    }`}
                  >
                    {copiedKey === apiKey.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[9px] cyber-mono text-[#555566]">Criada: {fmtDate(apiKey.created_at)}</span>
                  <span className="text-[9px] cyber-mono text-[#555566]">Último uso: {fmtLastUsed(apiKey.last_used_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Webhook URL Configuration ═══ */}
      <div className="space-y-4">
        <div className="cyber-panel p-4 border border-[rgba(0,240,255,0.15)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[#00F0FF]" />
              <h3 className="text-sm font-semibold text-[#E0E0E8]">Webhook URL</h3>
              <span className="text-[9px] cyber-mono text-[#444455]">PATCH /users/me</span>
            </div>
            {webhookURL ? (
              <div className="flex items-center gap-1.5">
                <span className="status-dot active" style={{ width: '6px', height: '6px' }} />
                <span className="text-[10px] cyber-mono text-[#00FF41]">CONFIGURADO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                <span className="text-[10px] cyber-mono text-[#FFB800]">CONFIGURAR</span>
              </div>
            )}
          </div>

          {webhookLoading ? (
            <div className="space-y-3">
              <div className="h-8 bg-[rgba(51,51,51,0.15)] rounded animate-pulse" />
            </div>
          ) : webhookError ? (
            <div className="text-center py-4">
              <p className="text-xs text-[#FF0040]">{webhookError}</p>
              <button onClick={fetchWebhook} className="text-[10px] text-[#555566] underline mt-1 hover:no-underline">
                Tentar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                  WEBHOOK URL (NOTIFICAÇÕES)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555566]" />
                    <input
                      type="url"
                      value={webhookURL}
                      onChange={(e) => { setWebhookURL(e.target.value); setWebhookSaved(false); }}
                      placeholder="https://seu-site.com/api/callback"
                      className="cyber-input w-full pl-10 pr-3 py-2.5 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                    />
                  </div>
                  <button
                    onClick={saveWebhookURL}
                    disabled={savingWebhook}
                    className="cyber-btn-primary px-3 py-2.5 rounded-lg text-xs cyber-mono disabled:opacity-40"
                  >
                    {savingWebhook ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span><Save className="w-3 h-3" /> Salvar</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Success feedback */}
              {webhookSaved && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(0,255,65,0.06)] border border-[rgba(0,255,65,0.25)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF41] shrink-0" />
                  <span className="text-[11px] text-[#00FF41]">Webhook URL guardado com sucesso!</span>
                </div>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
                <Info className="w-3.5 h-3.5 text-[#00F0FF] shrink-0 mt-0.5" />
                <div className="text-[10px] text-[#888899] leading-relaxed">
                  <span className="text-[#E0E0E8] font-medium">Webhooks automáticos:</span>{' '}
                  Quando o NeXFlowX receber uma confirmação da Stripe, uma notificação
                  será enviada para este URL com assinatura HMAC-SHA256.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ HMAC Webhook Secret ═══ */}
        <div className="cyber-panel p-4 border border-[rgba(255,184,0,0.15)]">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-[#FFB800]" />
            <h3 className="text-sm font-semibold text-[#E0E0E8]">HMAC Webhook Secret</h3>
          </div>
          {webhookSecret ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.3)]">
                <code className="flex-1 text-[11px] cyber-mono text-[#FFB800] truncate">{webhookSecret}</code>
                <button
                  onClick={async () => { await copyText(webhookSecret); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }}
                  className={`shrink-0 p-1 rounded transition-colors ${
                    copiedSecret
                      ? 'text-[#00FF41]'
                      : 'hover:bg-[rgba(255,255,255,0.05)] text-[#555566] hover:text-[#E0E0E8]'
                  }`}
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-[#888899] leading-relaxed">
                Use este secret para validar a assinatura HMAC-SHA256 no header x-nexflowx-signature.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#555566]">Nenhum secret configurado</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION NAV ITEM
   ═══════════════════════════════════════════════════════════════ */

interface DocSection {
  id: string;
  number: string;
  label: string;
  icon: React.ReactNode;
}

function SectionNavItem({
  section,
  active,
  onClick,
}: {
  section: DocSection;
  active: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(section.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
        active
          ? 'bg-[rgba(0,255,65,0.06)] border border-[rgba(0,255,65,0.2)]'
          : 'border border-transparent hover:bg-[rgba(255,255,255,0.02)] hover:border-[rgba(51,51,51,0.3)]'
      }`}
    >
      <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold cyber-mono ${
        active ? 'bg-[rgba(0,255,65,0.15)] text-[#00FF41]' : 'bg-[rgba(51,51,51,0.3)] text-[#555566] group-hover:text-[#888899]'
      }`}>
        {section.number}
      </span>
      <span className={`text-[11px] truncate ${
        active ? 'text-[#E0E0E8] font-medium' : 'text-[#888899] group-hover:text-[#BBBBCC]'
      }`}>
        {section.label}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2: DOCUMENTAÇÃO DA API (OFFICIAL v1)
   ═══════════════════════════════════════════════════════════════ */

function ApiDocsTab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('auth');

  // Fetch user's active API key for dynamic code snippet injection
  const [activeApiKey, setActiveApiKey] = useState<string>('');
  const BASE_URL = 'https://api.nexflowx.tech/api/v1';

  useEffect(() => {
    async function loadFirstActiveKey() {
      try {
        const res = await api.apiKeys.list();
        const activeKey = res.data.find(k => k.status === 'active');
        if (activeKey) {
          setActiveApiKey(activeKey.key_hash);
        }
      } catch {
        // Fallback: show placeholder
      }
    }
    loadFirstActiveKey();
  }, []);

  const activeApiKeyValue = activeApiKey || 'nx_live_••••••••••••';

  const sections: DocSection[] = [
    { id: 'auth', number: '1', label: 'Autenticação', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'endpoint', number: '2', label: 'Criar Link de Pagamento', icon: <FileJson className="w-3.5 h-3.5" /> },
    { id: 'sdk', number: '3', label: 'Embutir no Site (Iframe)', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
    { id: 'webhooks', number: '4', label: 'Webhooks', icon: <Webhook className="w-3.5 h-3.5" /> },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`docs-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('docs-', ''));
          }
        }
      },
      { root: container, rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(`docs-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* ── Code Examples (dynamic API key injection) ── */

  const curlPaymentLinks = `curl -X POST ${BASE_URL}/payment-links \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeApiKeyValue}" \\
  -d '{
    "amount": 250.00,
    "currency": "EUR",
    "store_name": "Securfix",
    "metadata": {
      "product": "Câmara de Segurança 4K",
      "order_id": "LX-998822"
    }
  }'`;

  const jsPaymentLinks = `const response = await fetch("${BASE_URL}/payment-links", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${activeApiKeyValue}"
  },
  body: JSON.stringify({
    amount: 250.00,
    currency: "EUR",
    store_name: "Securfix",
    metadata: {
      product: "Câmara de Segurança 4K",
      order_id": "LX-998822"
    }
  })
});

const data = await response.json();
console.log("Checkout URL:", data.data.shareable_url);`;

  const responsePaymentLinks = `{
  "data": {
    "id": "cmnfrz...tx123",
    "shareable_url": "https://pay.nexflowx.tech/cmnfrz...tx123"
  }
}`;

  const embeddedCheckoutCode = `<div style="width: 100%; max-width: 450px; margin: 0 auto;">
<iframe
src="SHAREABLE_URL_AQUI"
style="width: 100%; height: 600px; border: none; border-radius: 12px;"
allow="payment">
</iframe>
</div>

<script>
// Escutar o sucesso do pagamento
window.addEventListener('message', function(event) {
if (event.origin !== 'https://www.google.com/search?q=https://checkout.nexflowx.tech') return;
if (event.data.status === 'success') {
console.log('Pagamento efetuado. ID da Transação:', event.data.txId);
window.location.href = '/sucesso';
}
});
</script>`;

  const webhookPayloadCode = `{
  "event": "payment.gateway_confirmed",
  "transaction_id": "cmnfrzh...tx123",
  "store_id": "cmnabc...store99",
  "amount": "250.00",
  "net_amount": "246.50",
  "method": "card",
  "currency": "EUR",
  "country": "PT",
  "customer_email": "cliente@email.com",
  "logistics_status": "processing",
  "customer_details": {
    "product": "Câmara de Segurança 4K",
    "order_id": "LX-998822"
  }
}`;

  /* ── Required Badge ── */
  const reqBadge = (
    <Badge className="text-[8px] px-1 py-px shrink-0" style={{ backgroundColor: 'rgba(0,255,65,0.12)', color: '#00FF41', border: '1px solid rgba(0,255,65,0.3)' }}>
      obrigatório
    </Badge>
  );
  const optBadge = (
    <Badge className="text-[8px] px-1 py-px shrink-0" style={{ backgroundColor: 'rgba(255,184,0,0.12)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)' }}>
      opcional
    </Badge>
  );

  return (
    <div className="space-y-4">
      {/* ── Overview banner ── */}
      <div className="cyber-panel p-5 border border-[rgba(0,240,255,0.15)]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)]">
            <BookOpen className="w-5 h-5 text-[#00F0FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#E0E0E8] mb-1">NeXFlowX API v1 — Documentação de Integração</h3>
            <p className="text-xs text-[#888899] leading-relaxed">
              A API do NeXFlowX permite a integração de um motor logístico de pagamentos globais na sua plataforma.
              Através de uma única integração, o nosso orquestrador roteia, protege e processa transações de forma invisível.
            </p>
          </div>
          <Badge className="cyber-badge-green text-[9px] shrink-0 hidden sm:inline-flex">v1.0</Badge>
        </div>
      </div>

      {/* ── Main layout: sidebar nav + content ── */}
      <div className="flex gap-4">
        {/* ── Left mini-nav (desktop) ── */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="sticky top-4 space-y-1">
            {sections.map((s) => (
              <SectionNavItem key={s.id} section={s} active={activeSection === s.id} onClick={scrollToSection} />
            ))}
          </nav>
        </aside>

        {/* ── Mobile horizontal nav ── */}
        <div className="lg:hidden w-full">
          <div className="flex gap-2 overflow-x-auto cyber-scrollbar pb-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all duration-200 border ${
                  activeSection === s.id
                    ? 'bg-[rgba(0,255,65,0.08)] border-[rgba(0,255,65,0.25)] text-[#00FF41]'
                    : 'bg-[rgba(10,10,14,0.4)] border-[rgba(51,51,51,0.3)] text-[#888899]'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold cyber-mono bg-[rgba(51,51,51,0.3)]">
                  {s.number}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content area ── */}
        <main ref={containerRef} className="flex-1 min-w-0 space-y-6 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-2 cyber-scrollbar scroll-smooth">

          {/* ════════════════════════════════════════
             SECTION 1: AUTENTICAÇÃO E AMBIENTES
             ════════════════════════════════════════ */}
          <section id="docs-auth" className="cyber-panel p-5">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[rgba(51,51,51,0.3)]">
              <div className="p-1.5 rounded-lg bg-[rgba(0,255,65,0.08)]">
                <Shield className="w-4 h-4 text-[#00FF41]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#E0E0E8]">1. Autenticação e Ambientes</h4>
                <p className="text-[10px] text-[#555566]">Configuração de acesso à API</p>
              </div>
              <Badge className="ml-auto cyber-badge-green text-[9px]">REQUERIDO</Badge>
            </div>

            <div className="space-y-4 text-xs text-[#888899] leading-relaxed">
              <p>
                Todos os pedidos à API devem ser autenticados através de uma chave de API{' '}
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-[rgba(0,255,65,0.08)] text-[#00FF41] border border-[rgba(0,255,65,0.2)]">
                  x-api-key
                </code>, enviada no cabeçalho (header) de cada requisição.
              </p>

              {/* Environment info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                  <p className="text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">BASE URL</p>
                  <code className="text-[11px] text-[#00F0FF] break-all">{BASE_URL}</code>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                  <p className="text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">HEADER AUTH</p>
                  <code className="text-[11px] text-[#00FF41]">x-api-key</code>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                  <p className="text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">FORMATO DADOS</p>
                  <code className="text-[11px] text-[#E0E0E8]">application/json</code>
                </div>
              </div>

              {/* Header example */}
              <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] cyber-mono text-[#555566] tracking-wider">EXEMPLO DE HEADER</p>
                  {activeApiKey && (
                    <span className="text-[8px] cyber-mono px-1.5 py-px rounded bg-[rgba(0,240,255,0.08)] text-[#00F0FF] border border-[rgba(0,240,255,0.15)]">
                      DINÂMICO — sua chave ativa
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] cyber-mono text-[#555566] w-24 shrink-0">x-api-key:</span>
                    <code className="text-[11px] text-[#E0E0E8] font-medium break-all">{activeApiKeyValue}</code>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 rounded-lg border border-[rgba(255,184,0,0.15)] bg-[rgba(255,184,0,0.04)]">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FFB800] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-[#FFB800]">Segurança</p>
                    <p className="text-[10px] text-[#888899] mt-0.5">
                      Nunca exponha a sua API Key em código client-side (browser). Sempre faça chamadas a partir do seu backend.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════
             SECTION 2: CRIAR LINK DE PAGAMENTO
             ════════════════════════════════════════ */}
          <section id="docs-endpoint" className="cyber-panel p-5">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[rgba(51,51,51,0.3)]">
              <div className="p-1.5 rounded-lg bg-[rgba(0,240,255,0.08)]">
                <FileJson className="w-4 h-4 text-[#00F0FF]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#E0E0E8]">3. Criar Intenção de Pagamento</h4>
                <p className="text-[10px] text-[#555566]">Gera uma nova transação e devolve as credenciais de checkout</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#888899] leading-relaxed">
              {/* Method + URL */}
              <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                <p className="text-[10px] cyber-mono text-[#555566] mb-2 tracking-wider">METHOD & URL</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#00FF41] cyber-mono px-2 py-0.5 rounded bg-[rgba(0,255,65,0.08)]">POST</span>
                  <code className="text-[11px] text-[#E0E0E8] break-all">/payment-links</code>
                </div>
              </div>

              {/* Content-Type + Host */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                  <p className="text-[10px] cyber-mono text-[#555566] mb-1 tracking-wider">HOST</p>
                  <code className="text-[11px] text-[#00F0FF]">api.nexflowx.tech</code>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                  <p className="text-[10px] cyber-mono text-[#555566] mb-1 tracking-wider">CONTENT-TYPE</p>
                  <code className="text-[11px] text-[#E0E0E8]">application/json</code>
                </div>
              </div>

              {/* Parameters */}
              <div>
                <p className="text-[10px] cyber-mono text-[#555566] mb-3 tracking-wider">BODY PARAMETERS</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(10,10,14,0.3)] border border-[rgba(51,51,51,0.2)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[11px] text-[#E0E0E8] font-medium">amount</code>
                        {reqBadge}
                      </div>
                      <p className="text-[10px] text-[#555566]">
                        <span className="text-[#888899]">Number</span> — Valor total da transação. Deve ser um número decimal (ex: <code className="text-[#00F0FF]">250.00</code>).
                      </p>
                    </div>
                    <code className="text-[11px] text-[#00FF41] shrink-0 cyber-mono w-20 text-right">Float</code>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(10,10,14,0.3)] border border-[rgba(51,51,51,0.2)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[11px] text-[#E0E0E8] font-medium">currency</code>
                        {reqBadge}
                      </div>
                      <p className="text-[10px] text-[#555566]">
                        <span className="text-[#888899]">String</span> — Código ISO 4217 da moeda com 3 letras (ex: <code className="text-[#00F0FF]">&quot;EUR&quot;</code>, <code className="text-[#00F0FF]">&quot;USD&quot;</code>).
                      </p>
                    </div>
                    <code className="text-[11px] text-[#00FF41] shrink-0 cyber-mono w-20 text-right">String</code>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(10,10,14,0.3)] border border-[rgba(51,51,51,0.2)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[11px] text-[#E0E0E8] font-medium">store_name</code>
                        {optBadge}
                      </div>
                      <p className="text-[10px] text-[#555566]">
                        <span className="text-[#888899]">String</span> — Nome da loja para aplicar branding dinâmico (ex: <code className="text-[#00F0FF]">&quot;Securfix&quot;</code>).
                      </p>
                    </div>
                    <code className="text-[11px] text-[#FFB800] shrink-0 cyber-mono w-20 text-right">String?</code>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(10,10,14,0.3)] border border-[rgba(51,51,51,0.2)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[11px] text-[#E0E0E8] font-medium">metadata</code>
                        {optBadge}
                      </div>
                      <p className="text-[10px] text-[#555566]">
                        <span className="text-[#888899]">Object</span> — Dados extra do cliente/encomenda (ex: product, order_id).
                      </p>
                    </div>
                    <code className="text-[11px] text-[#FFB800] shrink-0 cyber-mono w-20 text-right">Object?</code>
                  </div>
                </div>
              </div>

              {/* Response fields */}
              <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                <p className="text-[10px] cyber-mono text-[#555566] mb-2 tracking-wider">RESPOSTA — 201 CREATED</p>
                <div className="flex flex-wrap gap-2">
                  <code className="text-[10px] text-[#00F0FF] bg-[rgba(0,240,255,0.06)] px-2 py-1 rounded border border-[rgba(0,240,255,0.15)]">.data.id</code>
                  <code className="text-[10px] text-[#00FF41] bg-[rgba(0,255,65,0.06)] px-2 py-1 rounded border border-[rgba(0,255,65,0.15)]">.data.shareable_url</code>
                </div>
              </div>

              {/* Code blocks — cURL + JS + Response */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-3.5 h-3.5 text-[#FF8C00]" />
                    <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">cURL</span>
                  </div>
                  <CodeBlock language="bash" filename="terminal" code={curlPaymentLinks} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Braces className="w-3.5 h-3.5 text-[#BF40FF]" />
                    <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">JAVASCRIPT</span>
                  </div>
                  <CodeBlock language="javascript" filename="create-payment.js" code={jsPaymentLinks} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">RESPOSTA 201</span>
                  </div>
                  <CodeBlock language="json" filename="response.json" code={responsePaymentLinks} />
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════
             SECTION 3: EMBEBIR NO SITE (IFRAME)
             ════════════════════════════════════════ */}
          <section id="docs-sdk" className="cyber-panel p-5">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[rgba(51,51,51,0.3)]">
              <div className="p-1.5 rounded-lg bg-[rgba(191,64,255,0.08)]">
                <LayoutTemplate className="w-4 h-4 text-[#BF40FF]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#E0E0E8]">4. Embutir no Site (Iframe)</h4>
                <p className="text-[10px] text-[#555566]">Integre o checkout diretamente na sua página com Iframe</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#888899] leading-relaxed">
              <p>
                Para uma experiência nativa onde o utilizador nunca sai do seu website, pode embutir o checkout
                usando um <code className="text-[#BF40FF]">&lt;iframe&gt;</code>. O checkout enviará mensagens via
                <code className="text-[#BF40FF]">postMessage</code> para notificar quando o pagamento for concluído.
              </p>

              <div className="p-3 rounded-lg border border-[rgba(191,64,255,0.15)] bg-[rgba(191,64,255,0.04)]">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#BF40FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-[#BF40FF]">Instruções</p>
                    <p className="text-[10px] text-[#888899] mt-0.5">
                      Substitua <code className="text-[#BF40FF]">SHAREABLE_URL_AQUI</code> pela URL devolvida no POST /payment-links
                      (campo <code className="text-[#BF40FF]">shareable_url</code> da resposta).
                    </p>
                  </div>
                </div>
              </div>

              {/* Code block */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="w-3.5 h-3.5 text-[#00FF41]" />
                  <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">CÓDIGO DE INTEGRAÇÃO</span>
                </div>
                <CodeBlock language="html" filename="checkout-iframe.html" code={embeddedCheckoutCode} />
              </div>

              {/* Event explanation */}
              <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
                <p className="text-[10px] cyber-mono text-[#555566] mb-2 tracking-wider">EVENTO DE SUCESSO</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#00FF41] w-32 shrink-0">event.data.status</code>
                    <span className="text-[10px] text-[#555566]">— Será <code className="text-[#00FF41]">&quot;success&quot;</code> quando o pagamento for confirmado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#00F0FF] w-32 shrink-0">event.data.txId</code>
                    <span className="text-[10px] text-[#555566]">— ID da transação confirmada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#FFB800] w-32 shrink-0">event.origin</code>
                    <span className="text-[10px] text-[#555566]">— Valide sempre o origin antes de processar a mensagem</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════
             SECTION 4: WEBHOOKS (NOTIFICAÇÕES SERVER-TO-SERVER)
             ════════════════════════════════════════ */}
          <section id="docs-webhooks" className="cyber-panel p-5">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[rgba(51,51,51,0.3)]">
              <div className="p-1.5 rounded-lg bg-[rgba(255,184,0,0.08)]">
                <Webhook className="w-4 h-4 text-[#FFB800]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#E0E0E8]">5. Webhooks (Notificações Server-to-Server)</h4>
                <p className="text-[10px] text-[#555566]">Receba confirmações de pagamento no seu backend</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#888899] leading-relaxed">
              <p>
                Após o pagamento ser processado com sucesso, o NeXFlowX envia automaticamente uma notificação
                para o seu endpoint via Webhook. Esta notificação é assinada com HMAC-SHA256 para garantir a
                autenticidade da mensagem.
              </p>

              {/* Event info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                  <p className="text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">EVENTO ENVIADO</p>
                  <code className="text-[11px] text-[#00FF41] px-1.5 py-0.5 rounded bg-[rgba(0,255,65,0.08)] border border-[rgba(0,255,65,0.2)]">
                    payment.gateway_confirmed
                  </code>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)]">
                  <p className="text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">MÉTODO</p>
                  <code className="text-[11px] text-[#00F0FF]">POST (application/json)</code>
                </div>
              </div>

              {/* Security info */}
              <div className="p-3 rounded-lg border border-[rgba(255,184,0,0.15)] bg-[rgba(255,184,0,0.04)]">
                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#FFB800] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-[#FFB800]">Validação de Segurança (Obrigatória)</p>
                    <p className="text-[10px] text-[#888899] mt-0.5">
                      Valide sempre a assinatura HMAC-SHA256 usando o header{' '}
                      <code className="text-[10px] px-1 py-0.5 rounded bg-[rgba(255,184,0,0.1)] text-[#FFB800] border border-[rgba(255,184,0,0.2)]">x-nexflowx-signature</code>{' '}
                      e o seu <code className="text-[#FFB800]">Webhook Secret</code> disponível na aba &quot;Gerir Chaves &amp; Webhooks&quot;.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payload example */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileJson className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">WEBHOOK PAYLOAD</span>
                </div>
                <CodeBlock language="json" filename="webhook-payload.json" code={webhookPayloadCode} />
              </div>

              {/* Fields explanation */}
              <div className="p-3 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
                <p className="text-[10px] cyber-mono text-[#555566] mb-2 tracking-wider">CAMPOS DO PAYLOAD</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#00FF41] w-36 shrink-0">event</code>
                    <span className="text-[10px] text-[#555566]">— Tipo de evento disparado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#00F0FF] w-36 shrink-0">transaction_id</code>
                    <span className="text-[10px] text-[#555566]">— ID único da transação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#00F0FF] w-36 shrink-0">store_id</code>
                    <span className="text-[10px] text-[#555566]">— ID da loja (se aplicável)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#FFB800] w-36 shrink-0">amount / net_amount</code>
                    <span className="text-[10px] text-[#555566]">— Valor bruto e líquido da transação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#FFB800] w-36 shrink-0">method</code>
                    <span className="text-[10px] text-[#555566]">— Método de pagamento (ex: card)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-[#E0E0E8] w-36 shrink-0">customer_details</code>
                    <span className="text-[10px] text-[#555566]">— Dados adicionais enviados no metadata</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3: GATEWAYS POR LOJA
   ═══════════════════════════════════════════════════════════════ */

function GatewaysTab() {
  const [gateways, setGateways] = useState<Array<{
    id: string;
    name: string;
    provider: string;
    store_id?: string;
    store_name?: string;
    status: string;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state — PayFac V2: No API Key/Secret fields (managed by Admin)
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'stripe',
    store_id: '',
    environment: 'production',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch stores for select
  const { data: storesResponse } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.stores.list(),
    staleTime: 5 * 60 * 1000,
  });
  const stores = storesResponse?.data || [];

  // Fetch gateways
  const fetchGateways = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.gateways.list();
      const gatewaysWithStoreNames = await Promise.all(
        res.data.map(async (gw) => {
          let storeName = 'Global';
          if (gw.store_id) {
            try {
              const storeRes = await api.stores.get(gw.store_id);
              storeName = storeRes.data.name;
            } catch {
              storeName = 'Loja Desconhecida';
            }
          }
          return {
            ...gw,
            store_name: storeName,
          };
        })
      );
      setGateways(gatewaysWithStoreNames);
    } catch {
      setError('Erro ao carregar gateways.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.gateways.create({
        name: formData.name,
        provider: formData.provider as any,
        provider_api_key: '',  // PayFac V2: empty — credentials managed by Admin via MasterProvider
        store_id: formData.store_id || undefined,
        environment: formData.environment as any,
      });
      setShowForm(false);
      setFormData({
        name: '',
        provider: 'stripe',
        store_id: '',
        environment: 'production',
      });
      fetchGateways();
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja eliminar este gateway?')) return;
    try {
      await api.gateways.delete(id);
      fetchGateways();
    } catch {
      // Handle error
    }
  };

  const fmtDate = (d: string) => {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FFB800]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Gateways por Loja</h3>
          <span className="text-[9px] cyber-mono text-[#444455]">POST /settings/gateways</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="cyber-btn-primary px-3 py-1.5 rounded-lg text-xs cyber-mono flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Cancelar' : 'Novo Gateway'}
        </button>
      </div>

      {/* Form — PayFac V2: Simplified (no API Key/Secret) */}
      {showForm && (
        <div className="cyber-panel p-4 border border-[rgba(0,255,65,0.2)]">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.15)]">
              <Info className="w-3.5 h-3.5 text-[#00F0FF] shrink-0 mt-0.5" />
              <div className="text-[10px] text-[#888899] leading-relaxed">
                <span className="text-[#E0E0E8] font-medium">Modelo PayFac V2:</span>{' '}
                As credenciais institucionais são geridas pela equipa Admin. Apenas precisa de ativar o método de pagamento na sua loja.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Stripe PT"
                  className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                >
                  <option value="stripe">Stripe</option>
                  <option value="sumup">SumUp</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Vincular a Loja (opcional)</label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                >
                  <option value="">Global (todas as lojas)</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] cyber-mono text-[#555566] mb-1">Ambiente</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="cyber-input w-full px-3 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
                >
                  <option value="production">Produção</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs cyber-mono border border-[rgba(51,51,51,0.5)] text-[#888899] hover:text-[#E0E0E8] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="cyber-btn-primary px-4 py-1.5 rounded-lg text-xs cyber-mono flex items-center gap-2 disabled:opacity-40"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {submitting ? 'A guardar...' : 'Ativar Gateway'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="cyber-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#00FF41] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[#FF0040]">{error}</p>
          </div>
        ) : gateways.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Zap className="w-10 h-10 text-[#555566] mb-2" />
            <p className="text-sm text-[#888899]">Nenhum gateway configurado</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto cyber-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0A0A0C] z-10">
                <tr className="border-b border-[rgba(51,51,51,0.6)]">
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">NOME</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">PROVIDER</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">LOJA</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">AMBIENTE</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">STATUS</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-left px-4 py-3">CRIADO EM</th>
                  <th className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-right px-4 py-3">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {gateways.map((gw) => (
                  <tr key={gw.id} className="border-b border-[rgba(51,51,51,0.3)] hover:bg-[rgba(0,255,65,0.02)] transition-colors">
                    <td className="text-xs text-[#E0E0E8] font-medium px-4 py-3">{gw.name}</td>
                    <td className="text-xs px-4 py-3">
                      <span className="cyber-mono text-[#00F0FF]">{gw.provider}</span>
                    </td>
                    <td className="text-xs px-4 py-3">
                      <Badge
                        className={`text-[9px] px-2 py-0.5 ${
                          gw.store_id
                            ? 'bg-[rgba(0,255,65,0.1)] text-[#00FF41] border-[rgba(0,255,65,0.3)]'
                            : 'bg-[rgba(0,240,255,0.1)] text-[#00F0FF] border-[rgba(0,240,255,0.3)]'
                        }`}
                      >
                        {gw.store_name || 'Global'}
                      </Badge>
                    </td>
                    <td className="text-xs px-4 py-3">
                      <Badge
                        className={`text-[9px] px-2 py-0.5 ${
                          gw.environment === 'production'
                            ? 'bg-[rgba(255,0,64,0.1)] text-[#FF0040] border-[rgba(255,0,64,0.3)]'
                            : 'bg-[rgba(255,184,0,0.1)] text-[#FFB800] border-[rgba(255,184,0,0.3)]'
                        }`}
                      >
                        {gw.environment}
                      </Badge>
                    </td>
                    <td className="text-xs px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            gw.status === 'active' ? 'bg-[#00FF41]' : 'bg-[#FF0040]'
                          }`}
                        />
                        <span className="text-[10px] text-[#888899]">
                          {gw.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs cyber-mono text-[#888899] px-4 py-3">
                      {fmtDate(gw.created_at)}
                    </td>
                    <td className="text-right px-4 py-3">
                      <button
                        onClick={() => handleDelete(gw.id)}
                        className="p-1.5 rounded hover:bg-[rgba(255,0,64,0.1)] text-[#555566] hover:text-[#FF0040] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — DEVELOPER HUB WITH TABS
   ═══════════════════════════════════════════════════════════════ */

export default function APIManagement() {
  const [activeTab, setActiveTab] = useState('keys');

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <ChevronRight className="w-4 h-4 text-[#00FF41]" />
        <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">API & INTEGRAÇÃO</span>
      </div>
      <h3 className="text-lg font-bold text-[#E0E0E8]">Developer Hub</h3>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[rgba(15,15,20,0.5)] border border-[rgba(51,51,51,0.5)] h-11 p-1 rounded-xl w-full justify-start">
          <TabsTrigger
            value="keys"
            className="data-[state=active]:bg-[rgba(0,255,65,0.08)] data-[state=active]:text-[#00FF41] data-[state=active]:shadow-[0_0_12px_rgba(0,255,65,0.1)] text-[#888899] hover:text-[#BBBBCC] hover:bg-[rgba(255,255,255,0.03)] data-[state=active]:border-[rgba(0,255,65,0.25)] rounded-lg px-4 gap-2 transition-all duration-200"
          >
            <Key className="w-4 h-4" />
            <span className="text-xs font-medium">Gerir Chaves & Webhooks</span>
          </TabsTrigger>
          <TabsTrigger
            value="gateways"
            className="data-[state=active]:bg-[rgba(0,255,65,0.08)] data-[state=active]:text-[#00FF41] data-[state=active]:shadow-[0_0_12px_rgba(0,255,65,0.1)] text-[#888899] hover:text-[#BBBBCC] hover:bg-[rgba(255,255,255,0.03)] data-[state=active]:border-[rgba(0,255,65,0.25)] rounded-lg px-4 gap-2 transition-all duration-200"
          >
            <Zap className="w-4 h-4" />
            <span className="text-xs font-medium">Gateways por Loja</span>
          </TabsTrigger>
          <TabsTrigger
            value="docs"
            className="data-[state=active]:bg-[rgba(0,255,65,0.08)] data-[state=active]:text-[#00FF41] data-[state=active]:shadow-[0_0_12px_rgba(0,255,65,0.1)] text-[#888899] hover:text-[#BBBBCC] hover:bg-[rgba(255,255,255,0.03)] data-[state=active]:border-[rgba(0,255,65,0.25)] rounded-lg px-4 gap-2 transition-all duration-200"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">Documentação da API</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-2">
          <KeysWebhooksTab />
        </TabsContent>

        <TabsContent value="gateways" className="mt-2">
          <GatewaysTab />
        </TabsContent>

        <TabsContent value="docs" className="mt-2">
          <ApiDocsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
