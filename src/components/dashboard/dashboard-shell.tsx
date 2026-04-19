'use client';

import { useDashboardStore, type DashboardSection } from '@/lib/dashboard-store';
import { useAuthStore } from '@/lib/auth-store';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import DashboardOverview from '@/components/dashboard/dashboard-overview';
import CapacityMatrix from '@/components/dashboard/capacity-matrix';
import LogisticPipeline from '@/components/dashboard/logistic-pipeline';
import TransactionsTable from '@/components/dashboard/transactions-table';
import PaymentLinkGenerator from '@/components/dashboard/payment-link-generator';
import APIManagement from '@/components/dashboard/api-management';
import CRMPage from '@/components/dashboard/crm-page';
import CatalogPage from '@/components/dashboard/catalog-page';
import StoresPage from '@/components/dashboard/stores-page';
import WalletCards from '@/components/dashboard/wallet-cards';
import { LogOut } from 'lucide-react';

export default function DashboardShell() {
  const { activeSection, sidebarCollapsed } = useDashboardStore();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">PIPELINE // ATUAL</span>
                  <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
                </div>
                <LogisticPipeline />
              </div>
              <DashboardOverview />
            </div>
          )}

          {/* Capacity Section */}
          {activeSection === 'capacity' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">MATRIZ // CAPACIDADE</span>
                <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
              </div>
              <CapacityMatrix />
            </div>
          )}

          {/* Transactions Section */}
          {activeSection === 'transactions' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">REGISTRO // TRANSAÇÕES</span>
                <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
              </div>
              <TransactionsTable />
            </div>
          )}

          {/* API & Integration Section */}
          {activeSection === 'api-integration' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">INTEGRAÇÃO // API</span>
                <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
              </div>
              <APIManagement />
            </div>
          )}

          {/* Payment Links Section */}
          {activeSection === 'payment-links' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">GERADOR // LINKS</span>
                <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
              </div>
              <PaymentLinkGenerator />
            </div>
          )}

          {/* CRM Section */}
          {activeSection === 'crm' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">CLIENTES // ENCOMENDAS</span>
                <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
              </div>
              <CRMPage />
            </div>
          )}

          {/* Catalog Section */}
          {activeSection === 'catalog' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">CATÁLOGO // PRODUTOS</span>
                <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
              </div>
              <CatalogPage />
            </div>
          )}

          {/* Stores Section */}
          {activeSection === 'stores' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">GESTÃO // LOJAS</span>
                <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
              </div>
              <StoresPage />
            </div>
          )}

          {/* Treasury Section */}
          {activeSection === 'treasury' && (
            <div>
              <WalletCards />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto px-6 py-3 border-t border-[rgba(51,51,51,0.3)] bg-[rgba(10,10,12,0.5)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] cyber-mono text-[#444455]">NeXFlowX™ Control Tower v3.0</span>
              <span className="text-[8px] cyber-mono text-[#333]">|</span>
              <span className="text-[10px] cyber-mono text-[#444455]">Core Bank V2</span>
              {user && (
                <>
                  <span className="text-[8px] cyber-mono text-[#333]">|</span>
                  <span className="text-[10px] cyber-mono text-[#00FF41]">{user.username}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] cyber-mono text-[#444455]">11 MARKETS</span>
              <span className="text-[8px] cyber-mono text-[#333]">|</span>
              <span className="text-[10px] cyber-mono text-[#444455]">MULTI-PROVIDER</span>
              <span className="text-[8px] cyber-mono text-[#333]">|</span>
              <span className="text-[10px] cyber-mono text-[#00FF41]">● SECURE</span>
              <button
                onClick={logout}
                className="flex items-center gap-1 ml-2 px-2 py-1 rounded border border-[rgba(255,0,64,0.2)] 
                  text-[#555566] hover:text-[#FF0040] hover:border-[rgba(255,0,64,0.4)] transition-all duration-200"
                title="Terminar sessão"
              >
                <LogOut className="w-3 h-3" />
                <span className="text-[9px] cyber-mono hidden sm:inline">SAIR</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
