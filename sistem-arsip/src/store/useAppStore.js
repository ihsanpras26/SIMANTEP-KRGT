import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    arsipList: [],
    klasifikasiList: [],
    labels: [], // New Labels State
    isLoading: false,
    loadingItems: new Set(), // Track individual items being processed

    // Actions
    setArsipList: (arsipList) => set({ arsipList }),
    setKlasifikasiList: (klasifikasiList) => set({ klasifikasiList }),
    setLabels: (labels) => set({ labels }), // New Labels Action
    setIsLoading: (isLoading) => set({ isLoading }),

    // Optimistic updates for Arsip
    addArsipOptimistic: (tempArsip) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticArsip = { ...tempArsip, id: tempId, isOptimistic: true };
      set(state => ({
        arsipList: [optimisticArsip, ...state.arsipList],
        loadingItems: new Set([...state.loadingItems, tempId])
      }));
      return tempId;
    },

    confirmArsipOptimistic: (tempId, realArsip) => {
      set(state => ({
        arsipList: state.arsipList.map(item =>
          item.id === tempId ? { ...realArsip, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    rollbackArsipOptimistic: (tempId) => {
      set(state => ({
        arsipList: state.arsipList.filter(item => item.id !== tempId),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    updateArsipOptimistic: (id, updates) => {
      set(state => ({
        arsipList: state.arsipList.map(item =>
          item.id === id ? { ...item, ...updates, isOptimistic: true } : item
        ),
        loadingItems: new Set([...state.loadingItems, id])
      }));
    },

    confirmArsipUpdate: (id, realArsip) => {
      set(state => ({
        arsipList: state.arsipList.map(item =>
          item.id === id ? { ...realArsip, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    rollbackArsipUpdate: (id, originalData) => {
      set(state => ({
        arsipList: state.arsipList.map(item =>
          item.id === id ? { ...originalData, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    deleteArsipOptimistic: (id) => {
      const originalItem = get().arsipList.find(item => item.id === id);
      set(state => ({
        arsipList: state.arsipList.filter(item => item.id !== id),
        loadingItems: new Set([...state.loadingItems, id])
      }));
      return originalItem;
    },

    rollbackArsipDelete: (originalItem) => {
      set(state => ({
        arsipList: [originalItem, ...state.arsipList].sort((a, b) =>
          new Date(b.tanggalSurat) - new Date(a.tanggalSurat)
        ),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== originalItem.id))
      }));
    },

    confirmArsipDelete: (id) => {
      set(state => ({
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    // Optimistic updates for Klasifikasi
    addKlasifikasiOptimistic: (tempKlasifikasi) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticKlasifikasi = { ...tempKlasifikasi, id: tempId, isOptimistic: true };
      set(state => ({
        klasifikasiList: [...state.klasifikasiList, optimisticKlasifikasi]
          .sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })),
        loadingItems: new Set([...state.loadingItems, tempId])
      }));
      return tempId;
    },

    confirmKlasifikasiOptimistic: (tempId, realKlasifikasi) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item =>
          item.id === tempId ? { ...realKlasifikasi, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    rollbackKlasifikasiOptimistic: (tempId) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.filter(item => item.id !== tempId),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    updateKlasifikasiOptimistic: (id, updates) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item =>
          item.id === id ? { ...item, ...updates, isOptimistic: true } : item
        ),
        loadingItems: new Set([...state.loadingItems, id])
      }));
    },

    confirmKlasifikasiUpdate: (id, realKlasifikasi) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item =>
          item.id === id ? { ...realKlasifikasi, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    rollbackKlasifikasiUpdate: (id, originalData) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item =>
          item.id === id ? { ...originalData, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    deleteKlasifikasiOptimistic: (id) => {
      const originalItem = get().klasifikasiList.find(item => item.id === id);
      set(state => ({
        klasifikasiList: state.klasifikasiList.filter(item => item.id !== id),
        loadingItems: new Set([...state.loadingItems, id])
      }));
      return originalItem;
    },

    rollbackKlasifikasiDelete: (originalItem) => {
      set(state => ({
        klasifikasiList: [...state.klasifikasiList, originalItem]
          .sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== originalItem.id))
      }));
    },

    confirmKlasifikasiDelete: (id) => {
      set(state => ({
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    // Optimistic updates for Labels
    addLabelOptimistic: (tempLabel) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticLabel = { ...tempLabel, id: tempId, isOptimistic: true };
      set(state => ({
        labels: [...state.labels, optimisticLabel].sort((a, b) => a.name.localeCompare(b.name)),
        loadingItems: new Set([...state.loadingItems, tempId])
      }));
      return tempId;
    },

    confirmLabelOptimistic: (tempId, realLabel) => {
      set(state => ({
        labels: state.labels.map(item =>
          item.id === tempId ? { ...realLabel, isOptimistic: false } : item
        ).sort((a, b) => a.name.localeCompare(b.name)),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    rollbackLabelOptimistic: (tempId) => {
      set(state => ({
        labels: state.labels.filter(item => item.id !== tempId),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    updateLabelOptimistic: (id, updates) => {
      set(state => ({
        labels: state.labels.map(item =>
          item.id === id ? { ...item, ...updates, isOptimistic: true } : item
        ),
        loadingItems: new Set([...state.loadingItems, id])
      }));
    },

    confirmLabelUpdate: (id, realLabel) => {
      set(state => ({
        labels: state.labels.map(item =>
          item.id === id ? { ...realLabel, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    rollbackLabelUpdate: (id, originalData) => {
      set(state => ({
        labels: state.labels.map(item =>
          item.id === id ? { ...originalData, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    deleteLabelOptimistic: (id) => {
      const originalItem = get().labels.find(item => item.id === id);
      set(state => ({
        labels: state.labels.filter(item => item.id !== id),
        loadingItems: new Set([...state.loadingItems, id])
      }));
      return originalItem;
    },

    rollbackLabelDelete: (originalItem) => {
      set(state => ({
        labels: [...state.labels, originalItem].sort((a, b) => a.name.localeCompare(b.name)),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== originalItem.id))
      }));
    },

    confirmLabelDelete: (id) => {
      set(state => ({
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },

    // Bulk Actions (Optimistic)
    bulkUpdateLabelsOptimistic: (arsipIds, labelId, action) => {
      // action: 'add' or 'remove'
      const tempId = `bulk-${Date.now()}`;

      set(state => {
        const newArsipList = state.arsipList.map(arsip => {
          if (!arsipIds.includes(arsip.id)) return arsip;

          const currentLabels = arsip.arsip_labels || [];
          let newLabels = [...currentLabels];
          const targetLabel = state.labels.find(l => l.id === labelId);

          if (action === 'add') {
            if (!newLabels.some(al => al.label_id === labelId)) {
              newLabels.push({
                arsip_id: arsip.id,
                label_id: labelId,
                labels: targetLabel
              });
            }
          } else if (action === 'remove') {
            newLabels = newLabels.filter(al => al.label_id !== labelId);
          }

          return { ...arsip, arsip_labels: newLabels, isOptimistic: true };
        });

        return {
          arsipList: newArsipList,
          loadingItems: new Set([...state.loadingItems, tempId])
        };
      });
      return tempId;
    },

    confirmBulkUpdate: (tempId) => {
      set(state => ({
        arsipList: state.arsipList.map(item => ({ ...item, isOptimistic: false })), // Simplification
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    rollbackBulkUpdate: (tempId, originalArsips) => { // originalArsips should be passed by component
      set(state => ({
        arsipList: state.arsipList.map(arsip => {
          const original = originalArsips.find(o => o.id === arsip.id);
          return original ? { ...original, isOptimistic: false } : arsip;
        }),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },

    // Utility functions
    isItemLoading: (id) => get().loadingItems.has(id),
    clearLoadingItems: () => set({ loadingItems: new Set() })
  }))
);

export default useAppStore;