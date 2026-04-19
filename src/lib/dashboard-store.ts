import { create } from 'zustand';

export type DashboardSection =
  | 'dashboard'
  | 'capacity'
  | 'transactions'
  | 'api-integration'
  | 'payment-links'
  | 'crm'
  | 'catalog'
  | 'stores'
  | 'treasury';

interface DashboardStore {
  activeSection: DashboardSection;
  sidebarCollapsed: boolean;
  /** Set by pipeline drill-down — filters transactions by stage */
  pipelineFilter: string | null;
  setActiveSection: (section: DashboardSection) => void;
  toggleSidebar: () => void;
  setPipelineFilter: (filter: string | null) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeSection: 'dashboard',
  sidebarCollapsed: false,
  pipelineFilter: null,
  setActiveSection: (section) => set({ activeSection: section, pipelineFilter: null }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setPipelineFilter: (filter) =>
    set({ pipelineFilter: filter, activeSection: 'transactions' }),
}));
