// =====================================================================
// Single Zustand store with localStorage persistence.
// We intentionally keep all UI state derived rather than stored, so
// every render reflects the current inputs without staleness.
// =====================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppState, Grant, ProfileInputs, CompanyContext } from "../engine/types";
import { SEED_STATE } from "./seed";
import { rid } from "../utils/format";

interface StoreActions {
  setProfile: (patch: Partial<ProfileInputs>) => void;
  setCompany: (patch: Partial<CompanyContext>) => void;
  setHorizon: (years: number) => void;
  addGrant: (grant?: Partial<Grant>) => void;
  updateGrant: (id: string, patch: Partial<Grant>) => void;
  removeGrant: (id: string) => void;
  resetAll: () => void;
  importState: (next: AppState) => void;
}

export type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...SEED_STATE,
      setProfile: (patch) =>
        set((s) => ({
          ...s,
          profile: { ...s.profile, ...patch },
          updatedAt: Date.now(),
        })),
      setCompany: (patch) =>
        set((s) => ({
          ...s,
          company: { ...s.company, ...patch },
          updatedAt: Date.now(),
        })),
      setHorizon: (years) =>
        set((s) => ({
          ...s,
          horizonYears: Math.max(1, Math.min(15, Math.round(years))),
          updatedAt: Date.now(),
        })),
      addGrant: (grant) =>
        set((s) => ({
          ...s,
          grants: [
            ...s.grants,
            {
              id: rid(),
              type: "RSU",
              label: "New grant",
              grantDate: new Date().toISOString().slice(0, 10),
              shares: 1000,
              strikePrice: 0,
              fmvAtGrant: s.company.currentPrice,
              vesting: { totalMonths: 48, cliffMonths: 12, cadence: "quarterly" },
              ...grant,
            } as Grant,
          ],
          updatedAt: Date.now(),
        })),
      updateGrant: (id, patch) =>
        set((s) => ({
          ...s,
          grants: s.grants.map((g) => (g.id === id ? { ...g, ...patch } : g)),
          updatedAt: Date.now(),
        })),
      removeGrant: (id) =>
        set((s) => ({
          ...s,
          grants: s.grants.filter((g) => g.id !== id),
          updatedAt: Date.now(),
        })),
      resetAll: () => set(() => ({ ...SEED_STATE, updatedAt: Date.now() })),
      importState: (next) => set(() => ({ ...next, updatedAt: Date.now() })),
    }),
    {
      name: "equity-compass:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** Pure-data selector helper to avoid pulling in actions in derivations. */
export function selectAppState(s: Store): AppState {
  return {
    profile: s.profile,
    company: s.company,
    grants: s.grants,
    horizonYears: s.horizonYears,
    updatedAt: s.updatedAt,
  };
}
