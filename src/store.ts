import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MergeRequestNode } from "./types";

export interface User {
  username: string;
  avatarUrl?: string;
}

export interface Config {
  currentUser: User | null;
  projectId: string;
  gitlabToken: string;
}

export interface Filter {
  id: string;
  label: string;
  fn: string; // (mr: MergeRequestNode) => unknown;
  data?: any;
}

export interface Store {
  config: Config | null;
  setConfig: (config: Config) => void;

  filters: Filter[];
  addFilter: (filter: Filter) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  applyFilters: (mrs: MergeRequestNode[]) => MergeRequestNode[];
}

export const useConfig = create<Store>()(
  persist(
    (set, get) => ({
      config: null,
      setConfig: (c: Config) => set({ config: c }),

      filters: [],
      addFilter: (f) => set((c) => ({ filters: [...c.filters, f] })),
      removeFilter: (id) =>
        set((c) => ({ filters: c.filters.filter((f) => f.id !== id) })),
      clearFilters: () => set({ filters: [] }),
      applyFilters: (mrs: MergeRequestNode[]) => {
        let filtered = mrs;
        get().filters.forEach((f) => {
          try {
            filtered = filtered.filter(eval(f.fn));
          } catch (err) {
            console.error(err);
            get().removeFilter(f.id);
            console.log("Removed errored filter");
          }
        });
        return filtered;
      },
    }),
    {
      name: "mr-config-store",
      version: 2,
      migrate: (s, v) => {
        if (v === 1) {
          return { config: (s as any).config };
        }
      },
    },
  ),
);
