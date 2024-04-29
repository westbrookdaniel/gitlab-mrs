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

interface Filter {
  id: string;
  name: string;
  field: string;
  includes?: string;
  matches?: string;
  excludes?: string;
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
          filtered = filtered.filter((mr) =>
            f.includes
              ? getField(mr, f.field).includes(f.includes)
              : f.matches
                ? getField(mr, f.field).trim() === f.matches.trim()
                : f.excludes
                  ? !getField(mr, f.field).includes(f.excludes)
                  : false,
          );
        });
        return filtered;
      },
    }),
    {
      name: "mr-config-store",
      version: 1,
    },
  ),
);

function getField(obj: any, path: string) {
  const keys = path.split(".");
  for (const key of keys) {
    if (obj && typeof obj === "object") {
      obj = (obj as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return obj;
}

// Needed for older versions pre zustand store persist
// If we have mr-config set, migrate it to the new store and then cleanup
const oldConfig = localStorage.getItem("mr-config");
if (oldConfig) {
  try {
    const parsed = JSON.parse(oldConfig);
    useConfig.getState().setConfig(parsed);
  } finally {
    localStorage.removeItem("mr-config");
  }
}
