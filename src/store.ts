import { create } from "zustand";
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
  applyFilters: (mrs: MergeRequestNode[]) => MergeRequestNode[];
}

function getStoredConfig(): Config | null {
  const storedUser = localStorage.getItem("mr-config");
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
}

export const useConfig = create<Store>()((set, get) => ({
  config: getStoredConfig(),
  setConfig: (c: Config) => {
    set({ config: c });
    localStorage.setItem("mr-config", JSON.stringify(c));
  },

  filters: [],
  addFilter: (f) => set((c) => ({ filters: [...c.filters, f] })),
  removeFilter: (id) =>
    set((c) => ({ filters: c.filters.filter((f) => f.id !== id) })),
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
}));

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
