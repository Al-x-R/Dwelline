// src/store/tripsStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, ZoneId } from '../types/Trip';
import { calculateCompliance, findExitDeadline } from '../core/schengenCalculator';

const STORAGE_KEY = '@dwelline/trips';

interface TripsState {
    trips: Trip[];
    isLoaded: boolean;

    loadTrips: () => Promise<void>;
    addTrip: (trip: Omit<Trip, 'id'>) => Promise<void>;
    updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;

    // Computed getters — a wrapper around the core engine
    getCompliance: (zoneId: ZoneId) => ReturnType<typeof calculateCompliance>;
    getExitDeadline: (zoneId: ZoneId) => string | null;
}

async function persist(trips: Trip[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export const useTripsStore = create<TripsState>((set, get) => ({
    trips: [],
    isLoaded: false,

    loadTrips: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const trips: Trip[] = raw ? JSON.parse(raw) : [];
            set({ trips, isLoaded: true });
        } catch (e) {
            console.error('Failed to load trips', e);
            set({ trips: [], isLoaded: true });
        }
    },

    addTrip: async (tripData) => {
        const newTrip: Trip = { ...tripData, id: Date.now().toString() };
        const updated = [...get().trips, newTrip];
        set({ trips: updated });
        await persist(updated);
    },

    updateTrip: async (id, updates) => {
        const updated = get().trips.map((t) => (t.id === id ? { ...t, ...updates } : t));
        set({ trips: updated });
        await persist(updated);
    },

    deleteTrip: async (id) => {
        const updated = get().trips.filter((t) => t.id !== id);
        set({ trips: updated });
        await persist(updated);
    },

    getCompliance: (zoneId) => {
        return calculateCompliance(get().trips, zoneId);
    },

    getExitDeadline: (zoneId) => {
        return findExitDeadline(get().trips, zoneId);
    },
}));