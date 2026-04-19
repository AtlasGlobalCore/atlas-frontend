'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Store, Store as StoreIcon, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api/client';
import { useStoreSelectorStore } from '@/lib/store-selector-store';

export function StoreSelector() {
  const { selectedStoreId, setSelectedStoreId } = useStoreSelectorStore();

  const { data: storesResponse, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.stores.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const stores = storesResponse?.data || [];

  useEffect(() => {
    // Initialize from URL query parameter on mount
    const urlParams = new URLSearchParams(window.location.search);
    const storeIdFromUrl = urlParams.get('store');
    if (storeIdFromUrl) {
      setSelectedStoreId(storeIdFromUrl);
    }
  }, [setSelectedStoreId]);

  const handleStoreChange = (value: string) => {
    if (value === 'all') {
      setSelectedStoreId(null);
      // Remove from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('store');
      window.history.replaceState({}, '', url.toString());
    } else {
      setSelectedStoreId(value);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('store', value);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-[#555566]" />
      <Select
        value={selectedStoreId || 'all'}
        onValueChange={handleStoreChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px] bg-[#0A0A0C] border-[rgba(51,51,51,0.5)] text-[#E0E0E8] text-sm cyber-mono">
          <SelectValue placeholder="Todas as Lojas" />
        </SelectTrigger>
        <SelectContent className="bg-[#12121A] border-[rgba(51,51,51,0.5)]">
          <SelectItem value="all" className="text-sm text-[#E0E0E8] cyber-mono">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-3.5 h-3.5 text-[#555566]" />
              <span>Todas as Lojas</span>
            </div>
          </SelectItem>
          {stores.map((store) => (
            <SelectItem
              key={store.id}
              value={store.id}
              className="text-sm text-[#E0E0E8] cyber-mono"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-[rgba(255,255,255,0.2)]"
                  style={{ backgroundColor: store.primary_color }}
                />
                <span>{store.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
