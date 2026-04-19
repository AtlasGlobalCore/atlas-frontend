'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Search, Package, Globe, Mail, MoreVertical, CheckCircle2, Truck, Package2 } from 'lucide-react';
import { api, NexFlowXAPIError } from '@/lib/api/client';
import type { Transaction, LogisticsStatus } from '@/lib/api/contracts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// ─── TYPES ────────────────────────────────────────────────────────────

interface CRMEntry extends Transaction {
  logisticsStatus?: LogisticsStatus;
}

// ─── HELPERS ────────────────────────────────────────────────────────────

/** Get logistics status badge styling */
function getLogisticsBadgeVariant(status: LogisticsStatus): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'processing':
      return 'outline';
    case 'shipped':
      return 'secondary';
    case 'delivered':
      return 'default';
    default:
      return 'outline';
  }
}

/** Get logistics status color class */
function getLogisticsStatusColor(status: LogisticsStatus): string {
  switch (status) {
    case 'processing':
      return 'text-[#FFB800] border-[rgba(255,184,0,0.3)] bg-[rgba(255,184,0,0.1)]';
    case 'shipped':
      return 'text-[#00F0FF] border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)]';
    case 'delivered':
      return 'text-[#00FF41] border-[rgba(0,255,65,0.3)] bg-[rgba(0,255,65,0.1)]';
    default:
      return 'text-[#888899] border-[rgba(136,136,153,0.3)] bg-[rgba(136,136,153,0.1)]';
  }
}

/** Get logistics status label in Portuguese */
function getLogisticsStatusLabel(status: LogisticsStatus): string {
  switch (status) {
    case 'processing':
      return 'Em Processamento';
    case 'shipped':
      return 'Enviado';
    case 'delivered':
      return 'Entregue';
    default:
      return 'Desconhecido';
  }
}

/** Get logistics status icon */
function getLogisticsStatusIcon(status: LogisticsStatus) {
  switch (status) {
    case 'processing':
      return <Package2 className="w-3 h-3" />;
    case 'shipped':
      return <Truck className="w-3 h-3" />;
    case 'delivered':
      return <CheckCircle2 className="w-3 h-3" />;
    default:
      return <Package2 className="w-3 h-3" />;
  }
}

/** Map transaction status to logistics status (mock logic) */
function mapTransactionToLogisticsStatus(transaction: Transaction): LogisticsStatus {
  // Use the backend's logistics_status if available
  if (transaction.logistics_status) {
    return transaction.logistics_status;
  }
  // Otherwise, infer from payment status
  if (transaction.status === 'completed') {
    return 'delivered';
  }
  if (transaction.status === 'distributed') {
    return 'shipped';
  }
  return 'processing';
}

/** Extract product name from metadata */
function getProductName(transaction: Transaction): string {
  if (typeof transaction.metadata === 'object' && transaction.metadata !== null) {
    const metadata = transaction.metadata as Record<string, unknown>;
    if (typeof metadata.product === 'string') {
      return metadata.product;
    }
  }
  return transaction.description || 'Produto não identificado';
}

/** Format currency amount */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LogisticsStatus | 'all'>('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch transactions using TanStack Query
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['crm-transactions'],
    queryFn: async () => {
      try {
        return await api.transactions.list({ limit: 100 });
      } catch (err) {
        if (err instanceof NexFlowXAPIError) {
          throw err;
        }
        throw new Error('Erro ao carregar transações');
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to update logistics status
  const updateLogisticsMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LogisticsStatus }) => {
      return await api.transactions.updateLogistics(id, { status });
    },
    onSuccess: () => {
      // Invalidate and refetch the transactions list
      queryClient.invalidateQueries({ queryKey: ['crm-transactions'] });
      toast({
        title: 'Status atualizado com sucesso',
        description: 'O status logístico da encomenda foi atualizado.',
        className: 'border-[#00FF41] bg-[rgba(0,255,65,0.1)] text-[#00FF41]',
      });
    },
    onError: (error: NexFlowXAPIError) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Ocorreu um erro ao tentar atualizar o status.',
        variant: 'destructive',
      });
    },
  });

  // Transform transactions into CRM entries
  const crmEntries: CRMEntry[] = (response?.data || []).map((t) => ({
    ...t,
    logisticsStatus: mapTransactionToLogisticsStatus(t),
  }));

  // Filter entries
  const filteredEntries = crmEntries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProductName(entry).toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.country_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || entry.logisticsStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: filteredEntries.length,
    processing: filteredEntries.filter((e) => e.logisticsStatus === 'processing').length,
    shipped: filteredEntries.filter((e) => e.logisticsStatus === 'shipped').length,
    delivered: filteredEntries.filter((e) => e.logisticsStatus === 'delivered').length,
  };

  // Handle logistics status update
  const handleUpdateLogistics = (id: string, status: LogisticsStatus) => {
    updateLogisticsMutation.mutate({ id, status });
  };

  // ─── RENDER ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ═══ Stats Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] cyber-mono text-[#555566] mb-1">TOTAL</p>
              <p className="text-2xl font-bold text-[#E0E0E8]">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.2)] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#00FF41]" />
            </div>
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] cyber-mono text-[#555566] mb-1">EM PROCESSAMENTO</p>
              <p className="text-2xl font-bold text-[#FFB800]">{stats.processing}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(255,184,0,0.1)] border border-[rgba(255,184,0,0.2)] flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#FFB800] animate-spin" />
            </div>
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] cyber-mono text-[#555566] mb-1">ENVIADOS</p>
              <p className="text-2xl font-bold text-[#00F0FF]">{stats.shipped}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)] flex items-center justify-center">
              <Truck className="w-5 h-5 text-[#00F0FF]" />
            </div>
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] cyber-mono text-[#555566] mb-1">ENTREGUES</p>
              <p className="text-2xl font-bold text-[#00FF41]">{stats.delivered}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.2)] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#00FF41]" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Filters ═══ */}
      <div className="cyber-panel p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555566]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por email, produto ou país..."
              className="cyber-input w-full pl-10 pr-4 py-2 rounded-lg text-sm cyber-mono text-[#E0E0E8]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'processing', 'shipped', 'delivered'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-medium cyber-mono transition-all duration-200 border ${
                  statusFilter === status
                    ? status === 'all'
                      ? 'border-[rgba(136,136,153,0.5)] bg-[rgba(136,136,153,0.1)] text-[#E0E0E8]'
                      : status === 'processing'
                      ? 'border-[rgba(255,184,0,0.5)] bg-[rgba(255,184,0,0.1)] text-[#FFB800]'
                      : status === 'shipped'
                      ? 'border-[rgba(0,240,255,0.5)] bg-[rgba(0,240,255,0.1)] text-[#00F0FF]'
                      : 'border-[rgba(0,255,65,0.5)] bg-[rgba(0,255,65,0.1)] text-[#00FF41]'
                    : 'border-[rgba(51,51,51,0.5)] bg-[rgba(10,10,14,0.4)] text-[#888899] hover:border-[rgba(51,51,51,0.8)] hover:text-[#E0E0E8]'
                }`}
              >
                {status === 'all'
                  ? 'Todos'
                  : status === 'processing'
                  ? 'Processamento'
                  : status === 'shipped'
                  ? 'Enviados'
                  : 'Entregues'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Table ═══ */}
      <div className="cyber-panel overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#00FF41] animate-spin" />
              <span className="text-xs cyber-mono text-[#555566]">A carregar dados...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-[#FF0040] mb-3">Erro ao carregar dados</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg text-xs cyber-mono border border-[rgba(0,255,65,0.3)] bg-[rgba(0,255,65,0.06)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.12)] transition-all"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-[#555566] mb-3" />
            <p className="text-sm text-[#888899] mb-1">Nenhum resultado encontrado</p>
            <p className="text-xs text-[#555566]">Tenta ajustar os filtros ou buscar outro termo</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto cyber-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-[#0A0A0C] z-10">
                <TableRow className="border-b border-[rgba(51,51,51,0.6)]">
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    DATA
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    EMAIL DO CLIENTE
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    PAÍS
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    PRODUTO
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-right">
                    VALOR
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-center">
                    STATUS DO PAGAMENTO
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-center">
                    STATUS LOGÍSTICO
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-center">
                    AÇÕES
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="border-b border-[rgba(51,51,51,0.3)] hover:bg-[rgba(0,255,65,0.02)] transition-colors"
                  >
                    <TableCell className="text-xs cyber-mono text-[#E0E0E8]">
                      {format(new Date(entry.created_at), 'dd MMM yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs text-[#E0E0E8]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#555566] shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {entry.customer_email || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#555566] shrink-0" />
                        <span className="cyber-mono text-[#E0E0E8]">{entry.country_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[#E0E0E8]">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-[#555566] shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {getProductName(entry)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs cyber-mono text-[#00FF41] text-right font-medium">
                      {formatAmount(entry.amount, entry.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] cyber-mono font-medium ${
                          entry.status === 'completed'
                            ? 'text-[#00FF41] border-[rgba(0,255,65,0.3)] bg-[rgba(0,255,65,0.1)]'
                            : entry.status === 'failed'
                            ? 'text-[#FF0040] border-[rgba(255,0,64,0.3)] bg-[rgba(255,0,64,0.1)]'
                            : entry.status === 'pending'
                            ? 'text-[#FFB800] border-[rgba(255,184,0,0.3)] bg-[rgba(255,184,0,0.1)]'
                            : 'text-[#00F0FF] border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)]'
                        }`}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.logisticsStatus && (
                        <Badge
                          variant={getLogisticsBadgeVariant(entry.logisticsStatus)}
                          className={`text-[10px] cyber-mono font-medium ${getLogisticsStatusColor(entry.logisticsStatus)}`}
                        >
                          <span className="flex items-center gap-1.5">
                            {getLogisticsStatusIcon(entry.logisticsStatus)}
                            {getLogisticsStatusLabel(entry.logisticsStatus)}
                          </span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded-md hover:bg-[rgba(0,255,65,0.1)] text-[#555566] hover:text-[#00FF41] transition-all duration-200"
                            disabled={updateLogisticsMutation.isPending}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#12121A] border-[rgba(51,51,51,0.5)] min-w-[200px]"
                        >
                          <DropdownMenuItem
                            onClick={() => handleUpdateLogistics(entry.id, 'processing')}
                            className="text-xs cyber-mono text-[#E0E0E8] hover:bg-[rgba(255,184,0,0.1)] hover:text-[#FFB800] cursor-pointer"
                            disabled={updateLogisticsMutation.isPending}
                          >
                            <Package2 className="w-3.5 h-3.5 mr-2 text-[#FFB800]" />
                            Marcar como Em Processamento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateLogistics(entry.id, 'shipped')}
                            className="text-xs cyber-mono text-[#E0E0E8] hover:bg-[rgba(0,240,255,0.1)] hover:text-[#00F0FF] cursor-pointer"
                            disabled={updateLogisticsMutation.isPending}
                          >
                            <Truck className="w-3.5 h-3.5 mr-2 text-[#00F0FF]" />
                            Marcar como Enviado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateLogistics(entry.id, 'delivered')}
                            className="text-xs cyber-mono text-[#E0E0E8] hover:bg-[rgba(0,255,65,0.1)] hover:text-[#00FF41] cursor-pointer"
                            disabled={updateLogisticsMutation.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-[#00FF41]" />
                            Marcar como Entregue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ═══ Footer Info ═══ */}
      <div className="text-center">
        <p className="text-[10px] cyber-mono text-[#444455]">
          Mostrando {filteredEntries.length} de {crmEntries.length} registros
        </p>
      </div>
    </div>
  );
}
