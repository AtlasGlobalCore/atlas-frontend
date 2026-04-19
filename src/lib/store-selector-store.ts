import { create } from 'zustand';

export type StoreFilter = string | null;

interface StoreSelectorStore {
  selectedStoreId: StoreFilter;
  setSelectedStoreId: (storeId: StoreFilter) => void;
  resetStoreFilter: () => void;
}

export const useStoreSelectorStore = create<StoreSelectorStore>((set) => ({
  selectedStoreId: null,
  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
  resetStoreFilter: () => set({ selectedStoreId: null }),
}));
