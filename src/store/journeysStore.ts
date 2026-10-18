import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Journey } from '../types/Journey';

const STORAGE_KEY = '@dwelline/journeys';

interface JourneysState {
    journeys: Journey[];
    isLoaded: boolean;

    loadJourneys: () => Promise<void>;
    addJourney: (journey: Omit<Journey, 'id' | 'createdAt'>) => Promise<Journey>;
    updateJourney: (id: string, updates: Partial<Journey>) => Promise<void>;
    deleteJourney: (id: string) => Promise<void>;
    clearJourneys: () => Promise<void>;
    // Restore from a backup: replaces every journey.
    setAllJourneys: (journeys: Journey[]) => Promise<void>;

    getJourney: (id: string) => Journey | undefined;
}

async function persist(journeys: Journey[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

export const useJourneysStore = create<JourneysState>((set, get) => ({
    journeys: [],
    isLoaded: false,

    loadJourneys: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const journeys: Journey[] = raw ? JSON.parse(raw) : [];
            set({ journeys, isLoaded: true });
        } catch (e) {
            console.error('Failed to load journeys', e);
            set({ journeys: [], isLoaded: true });
        }
    },

    addJourney: async (journeyData) => {
        const newJourney: Journey = {
            ...journeyData,
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
        };
        const updated = [...get().journeys, newJourney];
        set({ journeys: updated });
        await persist(updated);
        return newJourney;
    },

    updateJourney: async (id, updates) => {
        const updated = get().journeys.map((j) => (j.id === id ? { ...j, ...updates } : j));
        set({ journeys: updated });
        await persist(updated);
    },

    deleteJourney: async (id) => {
        const updated = get().journeys.filter((j) => j.id !== id);
        set({ journeys: updated });
        await persist(updated);
    },

    clearJourneys: async () => {
        set({ journeys: [] });
        await AsyncStorage.removeItem(STORAGE_KEY);
    },

    setAllJourneys: async (journeys) => {
        set({ journeys });
        await persist(journeys);
    },

    getJourney: (id) => {
        return get().journeys.find((j) => j.id === id);
    },
}));