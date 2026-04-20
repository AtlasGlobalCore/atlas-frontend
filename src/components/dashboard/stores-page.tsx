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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Pencil,
  Trash2,
  Store as StoreIcon,
  Globe,
  Palette,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { api, NexFlowXAPIError } from '@/lib/api/client';
import type { Store, CreateStoreRequest, UpdateStoreRequest } from '@/lib/api/contracts';
import { useToast } from '@/hooks/use-toast';

export default function StoresPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<CreateStoreRequest>({
    name: '',
    logo_url: '',
    primary_color: '#00FF41',
    accent_color: '#00F0FF',
    webhook_url: '',
  });

  // Webhook secret visibility and copy state
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copySecret = async (secret: string, id: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(id);
      toast({
        title: 'Secret copiado!',
        description: 'Webhook Secret copiado para a área de transferência.',
        className: 'border-[#00FF41] bg-[rgba(0,255,65,0.1)] text-[#00FF41]',
      });
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o secret.',
        variant: 'destructive',
      });
    }
  };

  // Fetch stores
  const { data: storesResponse, isLoading, error } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.stores.list(),
    staleTime: 5 * 60 * 1000,
  });

  const stores = storesResponse?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStoreRequest) => api.stores.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: 'Loja criada com sucesso!',
        className: 'border-[#00FF41] bg-[rgba(0,255,65,0.1)] text-[#00FF41]',
      });
      handleCloseDialog();
    },
    onError: (err: NexFlowXAPIError) => {
      toast({
        title: 'Erro ao criar loja',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreRequest }) =>
      api.stores.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: 'Loja atualizada com sucesso!',
        className: 'border-[#00FF41] bg-[rgba(0,255,65,0.1)] text-[#00FF41]',
      });
      handleCloseDialog();
    },
    onError: (err: NexFlowXAPIError) => {
      toast({
        title: 'Erro ao atualizar loja',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.stores.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: 'Loja eliminada com sucesso!',
        className: 'border-[#00FF41] bg-[rgba(0,255,65,0.1)] text-[#00FF41]',
      });
    },
    onError: (err: NexFlowXAPIError) => {
      toast({
        title: 'Erro ao eliminar loja',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleOpenDialog = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        logo_url: store.logo_url || '',
        primary_color: store.primary_color,
        accent_color: store.accent_color,
        webhook_url: store.webhook_url || '',
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        logo_url: '',
        primary_color: '#00FF41',
        accent_color: '#00F0FF',
        webhook_url: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStore(null);
    setFormData({
      name: '',
      logo_url: '',
      primary_color: '#00FF41',
      accent_color: '#00F0FF',
      webhook_url: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja eliminar esta loja?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#E0E0E8]">Gestão de Lojas</h2>
          <p className="text-sm text-[#888899] mt-1">
            Gerencia as suas lojas, branding e configurações
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="cyber-btn-primary px-4 py-2 rounded-lg text-sm cyber-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Loja
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#12121A] border-[rgba(51,51,51,0.5)] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#E0E0E8]">
                {editingStore ? 'Editar Loja' : 'Nova Loja'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name" className="text-[#E0E0E8]">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Loja Principal"
                  className="bg-[#0A0A0C] border-[rgba(51,51,51,0.5)] text-[#E0E0E8]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="logo_url" className="text-[#E0E0E8]">
                  Logo URL
                </Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-[#0A0A0C] border-[rgba(51,51,51,0.5)] text-[#E0E0E8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color" className="text-[#E0E0E8] flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Cor Primária
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, primary_color: e.target.value })
                      }
                      className="w-12 h-10 p-1 bg-[#0A0A0C] border-[rgba(51,51,51,0.5)]"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, primary_color: e.target.value })
                      }
                      placeholder="#00FF41"
                      className="flex-1 bg-[#0A0A0C] border-[rgba(51,51,51,0.5)] text-[#E0E0E8] cyber-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent_color" className="text-[#E0E0E8] flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Cor de Acento
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, accent_color: e.target.value })
                      }
                      className="w-12 h-10 p-1 bg-[#0A0A0C] border-[rgba(51,51,51,0.5)]"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, accent_color: e.target.value })
                      }
                      placeholder="#00F0FF"
                      className="flex-1 bg-[#0A0A0C] border-[rgba(51,51,51,0.5)] text-[#E0E0E8] cyber-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="webhook_url" className="text-[#E0E0E8] flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Webhook URL
                </Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://seu-site.com/api/webhook"
                  className="bg-[#0A0A0C] border-[rgba(51,51,51,0.5)] text-[#E0E0E8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="border-[rgba(51,51,51,0.5)] text-[#888899] hover:text-[#E0E0E8]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="cyber-btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A guardar...
                    </>
                  ) : editingStore ? (
                    'Atualizar'
                  ) : (
                    'Criar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="cyber-panel overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00FF41] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[#FF0040]">Erro ao carregar lojas</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <StoreIcon className="w-12 h-12 text-[#555566] mb-3" />
            <p className="text-sm text-[#888899]">Nenhuma loja criada</p>
            <p className="text-xs text-[#555566] mt-1">
              Crie a sua primeira loja para começar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto cyber-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-[#0A0A0C] z-10">
                <TableRow className="border-b border-[rgba(51,51,51,0.6)]">
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    NOME
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    LOGO
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    COR PRIMÁRIA
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    COR DE ACENTO
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    WEBHOOK URL
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    WEBHOOK SECRET
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider">
                    CRIADO EM
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] font-medium tracking-wider text-right">
                    AÇÕES
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow
                    key={store.id}
                    className="border-b border-[rgba(51,51,51,0.3)] hover:bg-[rgba(0,255,65,0.02)] transition-colors"
                  >
                    <TableCell className="text-xs text-[#E0E0E8] font-medium">
                      {store.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-[#555566]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-[rgba(255,255,255,0.2)]"
                          style={{ backgroundColor: store.primary_color }}
                        />
                        <span className="cyber-mono text-[#888899]">
                          {store.primary_color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-[rgba(255,255,255,0.2)]"
                          style={{ backgroundColor: store.accent_color }}
                        />
                        <span className="cyber-mono text-[#888899]">
                          {store.accent_color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {store.webhook_url ? (
                        <span className="text-[#00F0FF] underline truncate max-w-[150px] block">
                          {store.webhook_url}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#555566]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {store.webhook_secret ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleSecretVisibility(store.id)}
                            className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#555566] hover:text-[#E0E0E8] transition-colors"
                          >
                            {visibleSecrets.has(store.id) ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <code className="text-[11px] cyber-mono text-[#FFB800] truncate max-w-[120px]">
                            {visibleSecrets.has(store.id)
                              ? store.webhook_secret
                              : 'nx_sec_••••••••••••'}
                          </code>
                          <button
                            onClick={() => copySecret(store.webhook_secret!, store.id)}
                            className={`p-1 rounded transition-colors ${
                              copiedSecret === store.id
                                ? 'text-[#00FF41]'
                                : 'hover:bg-[rgba(255,255,255,0.05)] text-[#555566] hover:text-[#E0E0E8]'
                            }`}
                          >
                            {copiedSecret === store.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#555566]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs cyber-mono text-[#888899]">
                      {formatDate(store.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(store)}
                          className="h-8 w-8 text-[#555566] hover:text-[#00F0FF]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(store.id)}
                          className="h-8 w-8 text-[#555566] hover:text-[#FF0040]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] cyber-mono text-[#444455]">
          Mostrando {stores.length} loja{stores.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
