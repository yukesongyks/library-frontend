import { create } from 'zustand';

interface FilterState {
  deptId?: number;
  projectId?: number;
  bizLineId?: number;
  periodStart?: string;
  periodEnd?: string;
  costType?: string;
  timeGranularity: string;
  groupBy: string;
  setFilter: (partial: Partial<FilterState>) => void;
  reset: () => void;
}

const initialState = {
  timeGranularity: 'month',
  groupBy: 'dept',
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setFilter: (partial) => set(partial),
  reset: () => set(initialState),
}));
