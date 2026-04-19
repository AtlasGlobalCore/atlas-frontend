'use client';

import { useState, useMemo } from 'react';
import {
  Globe,
  CheckCircle2,
  XCircle,
  Construction,
  Info,
  Shield,
  Zap,
  Star,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  systemStateMock,
  countryMeta,
  getUniqueCountries,
  filterByCountry,
  statusColorMap,
  isHighlighted,
  formatCapacity,
  formatProvider,
  type SystemStateEntry,
  type AvailabilityStatus,
} from '@/lib/mock-system-state';

/* ── Status icon ── */
function StatusIcon({ status }: { status: AvailabilityStatus }) {
  const cfg = statusColorMap[status];
  switch (status) {
    case 'AVAILABLE':
      return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cfg.color }} />;
    case 'LIMITED':
      return <AlertTriangle className="w-3.5 h-3.5" style={{ color: cfg.color }} />;
    case 'CRITICAL':
      return <XCircle className="w-3.5 h-3.5" style={{ color: cfg.color }} />;
    case 'INTEGRATION_IN_PROGRESS':
      return <Construction className="w-3.5 h-3.5" style={{ color: cfg.color }} />;
    default:
      return null;
  }
}

/* ── Mini rail chip (compact for grid view) ── */
function RailChip({ entry }: { entry: SystemStateEntry }) {
  const cfg = statusColorMap[entry.availability_status];
  const highlight = isHighlighted(entry);
  const provider = formatProvider(entry);
  const capacity = formatCapacity(entry);

  return (
    <div
      className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-md border transition-all duration-200
        hover:scale-[1.01] cursor-default
        ${highlight.active ? 'border-dashed' : ''}`}
      style={{
        backgroundColor: `${cfg.color}06`,
        borderColor: highlight.active ? `${cfg.color}66` : `${cfg.color}18`,
      }}
      title={`${entry.payment_method} — ${cfg.label}${highlight.active ? `\n⚠ ${highlight.reason}` : ''}${entry.notes ? `\n📝 ${entry.notes}` : ''}`}
    >
      <StatusIcon status={entry.availability_status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#E0E0E8] truncate">{entry.payment_method}</span>
          {entry.is_local && (
            <span className="shrink-0 text-[7px] cyber-mono px-1 py-px rounded bg-[rgba(0,240,255,0.1)] text-[#00F0FF] border border-[rgba(0,240,255,0.2)]">
              LOCAL
            </span>
          )}
        </div>
      </div>

      <span className="shrink-0 text-[9px] cyber-mono text-[#555566]">{capacity}</span>

      {highlight.active && (
        <div className="absolute -top-1.5 right-1">
          <Star className="w-2.5 h-2.5" style={{ color: cfg.color }} />
        </div>
      )}
    </div>
  );
}

/* ── Country panel ── */
function CountryPanel({ code }: { code: string }) {
  const entries = useMemo(() => filterByCountry(systemStateMock, code), [code]);
  const meta = countryMeta[code];
  if (!meta) return null;

  const availableCount = entries.filter(e => e.availability_status === 'AVAILABLE').length;
  const issueCount = entries.filter(e => e.availability_status !== 'AVAILABLE').length;
  const hasCritical = entries.some(e => e.availability_status === 'CRITICAL');

  return (
    <div className={`cyber-panel p-4 transition-all duration-300 ${hasCritical ? 'neon-border-red' : ''}`}>
      {/* Country header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{meta.flag}</span>
          <div>
            <h3 className="text-sm font-semibold text-[#E0E0E8]">{meta.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] cyber-mono text-[#555566] tracking-wider">
                {code} · {meta.region}
              </span>
              {meta.tagline && (
                <span className="text-[8px] cyber-mono px-1.5 py-px rounded bg-[rgba(0,240,255,0.06)] text-[#00F0FF] border border-[rgba(0,240,255,0.15)]">
                  {meta.tagline}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] cyber-mono text-[#00FF41]">{availableCount} ✓</span>
          {issueCount > 0 && (
            <span className="text-[10px] cyber-mono text-[#FF0040]">{issueCount} ⚠</span>
          )}
        </div>
      </div>

      {/* Rails grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {entries.map((entry) => (
          <RailChip key={entry.payment_method} entry={entry} />
        ))}
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function CapacityMatrix() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countries = useMemo(() => getUniqueCountries(systemStateMock), []);

  const summary = useMemo(() => {
    const available = systemStateMock.filter(e => e.availability_status === 'AVAILABLE').length;
    const limited = systemStateMock.filter(e => e.availability_status === 'LIMITED').length;
    const critical = systemStateMock.filter(e => e.availability_status === 'CRITICAL').length;
    const integrating = systemStateMock.filter(e => e.availability_status === 'INTEGRATION_IN_PROGRESS').length;
    const localRails = systemStateMock.filter(e => e.is_local).length;
    return { available, limited, critical, integrating, localRails, total: systemStateMock.length };
  }, []);

  const displayCountries = selectedCountry
    ? [selectedCountry]
    : countries;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="cyber-panel p-3 border" style={{ borderColor: 'rgba(0,255,65,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF41]" />
            <span className="text-[9px] cyber-mono text-[#555566]">AVAILABLE</span>
          </div>
          <p className="text-xl font-bold text-[#00FF41] cyber-mono">{summary.available}</p>
        </div>
        <div className="cyber-panel p-3 border" style={{ borderColor: 'rgba(255,140,0,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF8C00]" />
            <span className="text-[9px] cyber-mono text-[#555566]">LIMITED</span>
          </div>
          <p className="text-xl font-bold text-[#FF8C00] cyber-mono">{summary.limited}</p>
        </div>
        <div className="cyber-panel p-3 border" style={{ borderColor: 'rgba(255,0,64,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle className="w-3.5 h-3.5 text-[#FF0040]" />
            <span className="text-[9px] cyber-mono text-[#555566]">CRITICAL</span>
          </div>
          <p className="text-xl font-bold text-[#FF0040] cyber-mono">{summary.critical}</p>
        </div>
        <div className="cyber-panel p-3 border" style={{ borderColor: 'rgba(255,214,0,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Construction className="w-3.5 h-3.5 text-[#FFD600]" />
            <span className="text-[9px] cyber-mono text-[#555566]">INTEGRATING</span>
          </div>
          <p className="text-xl font-bold text-[#FFD600] cyber-mono">{summary.integrating}</p>
        </div>
        <div className="cyber-panel p-3 border col-span-2 sm:col-span-1" style={{ borderColor: 'rgba(0,240,255,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-[9px] cyber-mono text-[#555566]">LOCAL RAILS</span>
          </div>
          <p className="text-xl font-bold text-[#00F0FF] cyber-mono">{summary.localRails}</p>
        </div>
      </div>

      {/* Multi-provider banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-[rgba(51,51,51,0.4)] bg-[rgba(10,10,14,0.3)]">
        <Shield className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#888899] leading-relaxed">
          <span className="text-[#E0E0E8] font-medium">Multi-provider routing:</span>{' '}
          Estrutura normalizada para suportar múltiplos providers e routing dinâmico. Não assumir Stripe como único provider.
          <code className="text-[#00F0FF] bg-[rgba(0,240,255,0.06)] px-1 rounded text-[10px] ml-1">/api/v1/system-state</code>
        </div>
      </div>

      {/* Country Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 cyber-scrollbar">
        <button
          onClick={() => setSelectedCountry(null)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cyber-mono transition-all
            ${selectedCountry === null
              ? 'border-[rgba(0,255,65,0.4)] bg-[rgba(0,255,65,0.06)] text-[#00FF41]'
              : 'border-[rgba(51,51,51,0.4)] bg-[rgba(10,10,14,0.3)] text-[#555566] hover:text-[#888899] hover:border-[rgba(51,51,51,0.7)]'
            }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Todos</span>
        </button>
        {countries.map((code) => {
          const meta = countryMeta[code];
          const rails = filterByCountry(systemStateMock, code);
          const hasCritical = rails.some(e => e.availability_status === 'CRITICAL');
          return (
            <button
              key={code}
              onClick={() => setSelectedCountry(selectedCountry === code ? null : code)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cyber-mono transition-all
                ${selectedCountry === code
                  ? 'border-[rgba(0,255,65,0.4)] bg-[rgba(0,255,65,0.06)] text-[#00FF41]'
                  : `border-[rgba(51,51,51,0.4)] bg-[rgba(10,10,14,0.3)] text-[#555566] hover:text-[#888899] hover:border-[rgba(51,51,51,0.7)]`
                }`}
            >
              <span>{meta.flag}</span>
              <span>{meta.name}</span>
              <span className="text-[9px] opacity-60">({rails.length})</span>
              {hasCritical && <span className="text-[9px] text-[#FF0040]">!</span>}
            </button>
          );
        })}
      </div>

      {/* Country Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayCountries.map((code) => (
          <CountryPanel key={code} code={code} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-lg border border-[rgba(51,51,51,0.3)] bg-[rgba(10,10,14,0.3)]">
        <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">LEGENDA:</span>
        {(Object.keys(statusColorMap) as AvailabilityStatus[]).map((status) => {
          const cfg = statusColorMap[status];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-[10px] cyber-mono" style={{ color: cfg.color }}>
                {status.replace(/_/g, ' ')}
              </span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5">
          <Star className="w-3 h-3 text-[#BF40FF]" />
          <span className="text-[10px] cyber-mono text-[#BF40FF]">Auto-highlight</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] cyber-mono px-1 py-px rounded bg-[rgba(0,240,255,0.1)] text-[#00F0FF] border border-[rgba(0,240,255,0.2)]">LOCAL</span>
          <span className="text-[10px] cyber-mono text-[#00F0FF]">Rail específico do mercado</span>
        </div>
      </div>
    </div>
  );
}
