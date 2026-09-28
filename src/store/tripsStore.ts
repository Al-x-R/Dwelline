import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, ZoneId } from '../types/Trip';
import { calculateCompliance, findExitDeadline, findMaxStayFromDate } from '../core/schengenCalculator';
import { useZonesStore } from './zonesStore';

const STORAGE_KEY = '@dwelline/trips';

interface TripsState {
    trips: Trip[];
    isLoaded: boolean;

    loadTrips: () => Promise<void>;
    addTrip: (trip: Omit<Trip, 'id'>) => Promise<void>;
    updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;

    getCompliance: (zoneId: ZoneId) => ReturnType<typeof calculateCompliance>;
    getExitDeadline: (zoneId: ZoneId) => string | null;
    addTrips: (trips: Omit<Trip, 'id'>[]) => Promise<void>;
    clearTrips: () => Promise<void>;
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
        const zone = useZonesStore.getState().getZone(zoneId);
        const windowSizeDays = zone?.windowSizeDays ?? 180;
        const maxStayDays = zone?.maxStayDays ?? 90;
        return calculateCompliance(get().trips, zoneId, undefined, windowSizeDays, maxStayDays);
    },

    getExitDeadline: (zoneId) => {
        const zone = useZonesStore.getState().getZone(zoneId);
        const windowSizeDays = zone?.windowSizeDays ?? 180;
        const maxStayDays = zone?.maxStayDays ?? 90;
        return findExitDeadline(get().trips, zoneId, undefined, windowSizeDays, maxStayDays);
    },

    addTrips: async (tripsData) => {
        const newTrips: Trip[] = tripsData.map((t) => ({
            ...t,
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        }));
        const updated = [...get().trips, ...newTrips];
        set({ trips: updated });
        await persist(updated);
    },

    clearTrips: async () => {
        set({ trips: [] });
        await AsyncStorage.removeItem(STORAGE_KEY);
    },
}));