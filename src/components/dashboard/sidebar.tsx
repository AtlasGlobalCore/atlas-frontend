'use client';

import {
  LayoutDashboard,
  Network,
  ArrowLeftRight,
  Key,
  Link2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
  Package,
  Store,
  ExternalLink,
  Landmark,
} from 'lucide-react';
import { useDashboardStore, type DashboardSection } from '@/lib/dashboard-store';
import { systemStateMock } from '@/lib/mock-system-state';

const navItems: { id: DashboardSection; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Visão geral'
  },
  {
    id: 'capacity',
    label: 'Capacidade de Rede',
    icon: <Network className="w-4 h-4" />,
    description: `${systemStateMock.length} trilhos · ${new Set(systemStateMock.map(e => e.country_code)).size} países`
  },
  {
    id: 'crm',
    label: 'Clientes & Encomendas',
    icon: <Users className="w-4 h-4" />,
    description: 'Mini-CRM e logística'
  },
  {
    id: 'transactions',
    label: 'Transações',
    icon: <ArrowLeftRight className="w-4 h-4" />,
    description: 'Fluxo de pagamentos'
  },
  {
    id: 'api-integration',
    label: 'API & Integração',
    icon: <Key className="w-4 h-4" />,
    description: 'Chaves e Webhooks'
  },
  {
    id: 'payment-links',
    label: 'Gerar Link de Pagamento',
    icon: <Link2 className="w-4 h-4" />,
    description: 'Criar URLs de checkout'
  },
  {
    id: 'stores',
    label: 'Lojas',
    icon: <Store className="w-4 h-4" />,
    description: 'Gestão de lojas multi-tenant'
  },
  {
    id: 'catalog',
    label: 'Catálogo Rápido',
    icon: <Package className="w-4 h-4" />,
    description: 'Gestão de produtos'
  },
  {
    id: 'treasury',
    label: 'Tesouraria',
    icon: <Landmark className="w-4 h-4" />,
    description: 'Cofre · Saldos · Saques'
  },
];

const externalLinks: {
  id: string;
  label: string;
  icon: React.ReactNode;
  url: string;
  description: string;
}[] = [
  {
    id: 'core-bank',
    label: 'NeXFlowX Core Bank',
    icon: <ExternalLink className="w-3.5 h-3.5" />,
    url: 'https://fintech.nexflowx.tech',
    description: 'Plataforma bancária',
  },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, sidebarCollapsed, toggleSidebar } = useDashboardStore();

  return (
    <aside
      className={`
        cyber-sidebar fixed left-0 top-0 h-screen z-50 flex flex-col
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'}
      `}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[rgba(51,51,51,0.5)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[rgba(0,255,65,0.2)] to-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.3)] cyber-breathe shrink-0">
          <Zap className="w-5 h-5 text-[#00FF41]" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold tracking-wider text-[#E0E0E8] cyber-mono">
              NeXFlow<span className="text-[#00FF41]">X</span>
            </h1>
            <p className="text-[9px] tracking-[0.2em] text-[#555566] uppercase cyber-mono">
              Control Tower v2.9
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto cyber-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200 group relative
              ${activeSection === item.id ? 'cyber-sidebar-link active' : 'cyber-sidebar-link'}
            `}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className={`shrink-0 transition-colors duration-200 ${
              activeSection === item.id ? 'text-[#00FF41]' : 'text-[#666677] group-hover:text-[#9999AA]'
            }`}>
              {item.icon}
            </span>
            {!sidebarCollapsed && (
              <div className="text-left">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-[10px] text-[#555566] cyber-mono">{item.description}</span>
              </div>
            )}
            {!sidebarCollapsed && activeSection === item.id && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="status-dot active" />
              </div>
            )}
          </button>
        ))}

        {/* Separator */}
        {!sidebarCollapsed && (
          <div className="my-4 px-3">
            <div className="h-px bg-[rgba(51,51,51,0.3)]" />
          </div>
        )}

        {/* External Links */}
        {externalLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200 group relative cyber-sidebar-link
              hover:text-[#00F0FF] hover:bg-[rgba(0,240,255,0.04)] hover:border-l-[rgba(0,240,255,0.3)]
            `}
            title={sidebarCollapsed ? link.label : undefined}
          >
            <span className="shrink-0 transition-colors duration-200 text-[#666677] group-hover:text-[#00F0FF]">
              {link.icon}
            </span>
            {!sidebarCollapsed && (
              <div className="text-left">
                <span className="block text-sm font-medium">{link.label}</span>
                <span className="block text-[10px] text-[#555566] cyber-mono">{link.description}</span>
              </div>
            )}
          </a>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-[rgba(51,51,51,0.5)]">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2 px-2">
            <span className="status-dot active" />
            <div>
              <p className="text-[10px] cyber-mono text-[#00FF41]">SYSTEM ONLINE</p>
              <p className="text-[9px] cyber-mono text-[#555566]">Uptime: 99.97%</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="status-dot active" />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full 
          bg-[#0A0A0C] border border-[rgba(51,51,51,0.8)] 
          flex items-center justify-center
          text-[#555566] hover:text-[#00FF41] hover:border-[rgba(0,255,65,0.4)]
          transition-all duration-200 z-50"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
