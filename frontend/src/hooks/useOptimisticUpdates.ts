import { create } from 'zustand';

interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
}

interface OptimisticStore {
  updates: Map<string, OptimisticUpdate<any>>;
  addUpdate: <T>(id: string, type: OptimisticUpdate<T>['type'], data: T) => void;
  removeUpdate: (id: string) => void;
  clearUpdates: () => void;
  getUpdate: <T>(id: string) => OptimisticUpdate<T> | undefined;
}

export const useOptimisticStore = create<OptimisticStore>((set, get) => ({
  updates: new Map(),
  
  addUpdate: (id, type, data) => {
    set((state) => {
      const newUpdates = new Map(state.updates);
      newUpdates.set(id, {
        id,
        type,
        data,
        timestamp: Date.now(),
      });
      return { updates: newUpdates };
    });
  },
  
  removeUpdate: (id) => {
    set((state) => {
      const newUpdates = new Map(state.updates);
      newUpdates.delete(id);
      return { updates: newUpdates };
    });
  },
  
  clearUpdates: () => {
    set({ updates: new Map() });
  },
  
  getUpdate: (id) => {
    return get().updates.get(id);
  },
}));

// Helper hook for optimistic updates with React Query
export function useOptimisticUpdate<T>(
  queryKey: string[],
  mutationFn: (data: T) => Promise<any>
) {
  const { addUpdate, removeUpdate } = useOptimisticStore();
  
  const performOptimisticUpdate = async (
    id: string,
    data: T,
    type: 'create' | 'update' | 'delete'
  ) => {
    // Add optimistic update
    addUpdate(id, type, data);
    
    try {
      // Perform actual mutation
      const result = await mutationFn(data);
      
      // Remove optimistic update on success
      removeUpdate(id);
      
      return result;
    } catch (error) {
      // Remove optimistic update on error
      removeUpdate(id);
      throw error;
    }
  };
  
  return { performOptimisticUpdate };
}
