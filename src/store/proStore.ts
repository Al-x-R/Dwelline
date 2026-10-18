import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// What the free tier gets: one tracked zone at a time. Day counts and limit alerts work for every zone regardless.
export const FREE_ZONE_LIMIT = 1;

export type DevProMode = 'pro' | 'free';

interface ProState {
  // Set by the store purchase layer once it exists; nothing grants it yet.
  purchased: boolean;
  // Development builds only: test both tiers without buying.
  devMode: DevProMode;

  setPurchased: (purchased: boolean) => void;
  setDevMode: (mode: DevProMode) => void;
}

export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      purchased: false,
      devMode: 'pro',
      setPurchased: (purchased) => set({purchased}),
      setDevMode: (devMode) => set({devMode}),
    }),
    {
      name: '@dwelline/pro',
      storage: createJSONStorage(() => AsyncStorage),
      // The purchase state must come from the store on every launch, never from a local flag.
      partialize: ({devMode}) => ({devMode}),
    }
  )
);

export function resolveIsPro(purchased: boolean, devMode: DevProMode, isDev: boolean): boolean {
  return isDev ? devMode === 'pro' : purchased;
}

export function useIsPro(): boolean {
  const purchased = useProStore((s) => s.purchased);
  const devMode = useProStore((s) => s.devMode);
  return resolveIsPro(purchased, devMode, __DEV__);
}
