/**
 * MOCK DATA — Normalized to match the future API endpoint:
 * GET /api/v1/system-state
 *
 * "A estrutura já está normalizada para suportar múltiplos providers
 *  e routing dinâmico no backend. Não assumir Stripe como único."
 */

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'CRITICAL'
  | 'INTEGRATION_IN_PROGRESS';

export type CapacityStatus = 'UNLIMITED' | 'LIMITED' | 'DEPLETED';

export interface SystemStateEntry {
  country_code: string;
  payment_method: string;
  availability_status: AvailabilityStatus;
  provider_name?: string;
  priority?: number;
  fee_percent?: number;
  fee_fixed?: number;
  sla_hours?: number;
  max_volume_daily?: number | null;
  used_volume_daily?: number | null;
  remaining_volume?: number | null;
  capacity_status: CapacityStatus;
  notes?: string;
  is_local?: boolean; // flag for market-specific rails
}

export const systemStateMock: SystemStateEntry[] = [
  // ═══════════════════════════════════════════════════════════
  // 🇵🇹 PORTUGAL — Muito forte em localização
  // ═══════════════════════════════════════════════════════════
  { country_code: 'PT', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PT', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PT', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PT', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PT', payment_method: 'Revolut Pay',        availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PT', payment_method: 'MBWay',              availability_status: 'LIMITED',   provider_name: 'Stripe', priority: 1, capacity_status: 'UNLIMITED', notes: 'Via Stripe (não direto)', is_local: true },
  { country_code: 'PT', payment_method: 'Multibanco',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'PT', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },
  { country_code: 'PT', payment_method: 'Bank Transfer',      availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 48, capacity_status: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  // 🇪🇸 ESPANHA — Falta Bizum (crítico → outro provider depois)
  // ═══════════════════════════════════════════════════════════
  { country_code: 'ES', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'ES', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'ES', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'ES', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'ES', payment_method: 'Revolut Pay',        availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'ES', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },
  { country_code: 'ES', payment_method: 'Bank Transfer',      availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 48, capacity_status: 'UNLIMITED' },
  { country_code: 'ES', payment_method: 'Bizum',              availability_status: 'CRITICAL',  capacity_status: 'UNLIMITED', notes: 'Método essencial — requer outro provider', is_local: true },

  // ═══════════════════════════════════════════════════════════
  // 🇫🇷 FRANÇA — Cartes Bancaires (local)
  // ═══════════════════════════════════════════════════════════
  { country_code: 'FR', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'FR', payment_method: 'Cartes Bancaires',   availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'FR', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'FR', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'FR', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'FR', payment_method: 'Revolut Pay',        availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'FR', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },
  { country_code: 'FR', payment_method: 'Klarna',             availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'FR', payment_method: 'Bank Transfer',      availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 48, capacity_status: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  // 🇳🇱 PAÍSES BAIXOS — iDEAL = essencial para conversão NL
  // ═══════════════════════════════════════════════════════════
  { country_code: 'NL', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'NL', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'NL', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'NL', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'NL', payment_method: 'iDEAL',              availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'NL', payment_method: 'Revolut Pay',        availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'NL', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },
  { country_code: 'NL', payment_method: 'Klarna',             availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  // 🇧🇪 BÉLGICA — Bancontact
  // ═══════════════════════════════════════════════════════════
  { country_code: 'BE', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'BE', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'BE', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'BE', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'BE', payment_method: 'Bancontact',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'BE', payment_method: 'Revolut Pay',        availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'BE', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  // 🇦🇹 ÁUSTRIA — EPS
  // ═══════════════════════════════════════════════════════════
  { country_code: 'AT', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'AT', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'AT', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'AT', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'AT', payment_method: 'EPS',                availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'AT', payment_method: 'Klarna',             availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'AT', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  // 🇵🇱 POLÓNIA — BLIK, P24 não disponível
  // ═══════════════════════════════════════════════════════════
  { country_code: 'PL', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PL', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PL', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PL', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'PL', payment_method: 'BLIK',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'PL', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },
  { country_code: 'PL', payment_method: 'Przelewy24',         availability_status: 'LIMITED',   capacity_status: 'UNLIMITED', notes: 'P24 não disponível ainda' },

  // ═══════════════════════════════════════════════════════════
  // 🇬🇧 REINO UNIDO — Pay by Bank, Bacs
  // ═══════════════════════════════════════════════════════════
  { country_code: 'UK', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'UK', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'UK', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'UK', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'UK', payment_method: 'Revolut Pay',        availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'UK', payment_method: 'Pay by Bank',        availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'UK', payment_method: 'Bacs Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 72, capacity_status: 'UNLIMITED', is_local: true },
  { country_code: 'UK', payment_method: 'Klarna',             availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  // 🇨🇭 SUÍÇA (limitado) — TWINT pendente
  // ═══════════════════════════════════════════════════════════
  { country_code: 'CH', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'CH', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'CH', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'CH', payment_method: 'TWINT',              availability_status: 'INTEGRATION_IN_PROGRESS', capacity_status: 'UNLIMITED', notes: 'TWINT pendente — aguardando aprovação', is_local: true },

  // ═══════════════════════════════════════════════════════════
  // 🇩🇪 ALEMANHA — Klarna
  // ═══════════════════════════════════════════════════════════
  { country_code: 'DE', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'DE', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'DE', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'DE', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'DE', payment_method: 'Klarna',             availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'DE', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  // 🇮🇹 ITÁLIA — Klarna
  // ═══════════════════════════════════════════════════════════
  { country_code: 'IT', payment_method: 'Card',               availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'IT', payment_method: 'Apple Pay',          availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'IT', payment_method: 'Google Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'IT', payment_method: 'Amazon Pay',         availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'IT', payment_method: 'Klarna',             availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 2, sla_hours: 24, capacity_status: 'UNLIMITED' },
  { country_code: 'IT', payment_method: 'SEPA Direct Debit',  availability_status: 'AVAILABLE', provider_name: 'Stripe', priority: 1, sla_hours: 48, capacity_status: 'UNLIMITED' },
];

/* ── Country metadata ─────────────────────────────────────── */

export const countryMeta: Record<
  string,
  { name: string; flag: string; region: string; tagline?: string }
> = {
  PT: { name: 'Portugal',     flag: '🇵🇹', region: 'EU-SOUTH',   tagline: 'Muito forte em localização' },
  ES: { name: 'Espanha',     flag: '🇪🇸', region: 'EU-SOUTH',   tagline: 'Falta Bizum (crítico)' },
  FR: { name: 'França',      flag: '🇫🇷', region: 'EU-WEST',    tagline: 'Cartes Bancaires (local)' },
  NL: { name: 'Países Baixos', flag: '🇳🇱', region: 'EU-NORTH', tagline: 'iDEAL = essencial para conversão' },
  BE: { name: 'Bélgica',     flag: '🇧🇪', region: 'EU-NORTH' },
  AT: { name: 'Áustria',     flag: '🇦🇹', region: 'EU-CENTRAL' },
  PL: { name: 'Polónia',     flag: '🇵🇱', region: 'EU-EAST',    tagline: 'P24 não disponível' },
  UK: { name: 'Reino Unido', flag: '🇬🇧', region: 'UK' },
  CH: { name: 'Suíça',       flag: '🇨🇭', region: 'EU-CENTRAL', tagline: 'TWINT pendente' },
  DE: { name: 'Alemanha',    flag: '🇩🇪', region: 'EU-CENTRAL' },
  IT: { name: 'Itália',      flag: '🇮🇹', region: 'EU-SOUTH' },
};

/* ── Derived helpers (mirrors what the real API consumer does) ── */

export function getUniqueCountries(data: SystemStateEntry[]): string[] {
  return [...new Set(data.map((d) => d.country_code))].sort();
}

export function filterByCountry(
  data: SystemStateEntry[],
  code: string
): SystemStateEntry[] {
  return data.filter((item) => item.country_code === code);
}

/** Status → colour mapping (enforced by frontend rules) */
export const statusColorMap: Record<
  AvailabilityStatus,
  { color: string; bgClass: string; badgeClass: string; glowClass: string; label: string }
> = {
  AVAILABLE: {
    color: '#00FF41',
    bgClass: 'bg-[rgba(0,255,65,0.08)]',
    badgeClass: 'cyber-badge-green',
    glowClass: 'shadow-[0_0_12px_rgba(0,255,65,0.15)]',
    label: 'Disponível',
  },
  LIMITED: {
    color: '#FF8C00',
    bgClass: 'bg-[rgba(255,140,0,0.08)]',
    badgeClass: 'cyber-badge-amber',
    glowClass: 'shadow-[0_0_12px_rgba(255,140,0,0.15)]',
    label: 'Limitado',
  },
  CRITICAL: {
    color: '#FF0040',
    bgClass: 'bg-[rgba(255,0,64,0.08)]',
    badgeClass: 'cyber-badge-red',
    glowClass: 'shadow-[0_0_12px_rgba(255,0,64,0.2)]',
    label: 'Crítico',
  },
  INTEGRATION_IN_PROGRESS: {
    color: '#FFD600',
    bgClass: 'bg-[rgba(255,214,0,0.06)]',
    badgeClass: 'cyber-badge-amber',
    glowClass: 'shadow-[0_0_12px_rgba(255,214,0,0.12)]',
    label: 'Integração',
  },
};

/** Highlight rules: specific country + payment_method combinations */
export const highlightRules: Array<{
  country_code: string;
  payment_method: string;
  reason: string;
}> = [
  {
    country_code: 'NL',
    payment_method: 'iDEAL',
    reason: 'Essencial para conversão — iDEAL domina pagamentos NL',
  },
  {
    country_code: 'PT',
    payment_method: 'MBWay',
    reason: 'Rail local prioritário — via Stripe (não direto)',
  },
  {
    country_code: 'ES',
    payment_method: 'Bizum',
    reason: 'GAP CRÍTICO — método essencial não integrado',
  },
];

export function isHighlighted(
  entry: SystemStateEntry
): { active: boolean; reason: string } {
  const match = highlightRules.find(
    (r) =>
      r.country_code === entry.country_code &&
      r.payment_method === entry.payment_method
  );
  return match ? { active: true, reason: match.reason } : { active: false, reason: '' };
}

/** Capacity display rule */
export function formatCapacity(entry: SystemStateEntry): string {
  if (entry.capacity_status === 'UNLIMITED') return '∞';
  if (entry.remaining_volume != null) {
    return `${entry.remaining_volume.toLocaleString('pt-PT')} / dia`;
  }
  return 'Em análise';
}

/** Provider display rule */
export function formatProvider(entry: SystemStateEntry): string {
  return entry.provider_name ?? 'N/A';
}
