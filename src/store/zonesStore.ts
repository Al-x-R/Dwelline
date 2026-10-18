import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUILT_IN_ZONES, type ZoneConfig } from '../constants/zones';

const STORAGE_KEY = '@dwelline/custom_zones';
const ACTIVE_ZONES_KEY = '@dwelline/active_zone_ids';

interface ZonesState {
    customZones: ZoneConfig[];
    activeZoneIds: string[]; // zones the user actually tracks (chosen during onboarding/settings)
    isLoaded: boolean;

    loadZones: () => Promise<void>;
    addCustomZone: (zone: Omit<ZoneConfig, 'isCustom' | 'isImplemented'>) => Promise<void>;
    deleteCustomZone: (id: string) => Promise<void>;
    setActiveZoneIds: (ids: string[]) => Promise<void>;
    // Restore from a backup: replaces custom zones and the tracked list.
    restoreZones: (customZones: ZoneConfig[], activeZoneIds: string[]) => Promise<void>;

    getAllZones: () => ZoneConfig[];
    getZone: (id: string) => ZoneConfig | undefined;
    getActiveZones: () => ZoneConfig[];
}

export const useZonesStore = create<ZonesState>((set, get) => ({
    customZones: [],
    activeZoneIds: ['schengen'], // at least Schengen by default until onboarding is done
    isLoaded: false,

    loadZones: async () => {
        try {
            const [rawCustom, rawActive] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY),
                AsyncStorage.getItem(ACTIVE_ZONES_KEY),
            ]);
            const customZones: ZoneConfig[] = rawCustom ? JSON.parse(rawCustom) : [];
            const activeZoneIds: string[] = rawActive ? JSON.parse(rawActive) : ['schengen'];
            set({ customZones, activeZoneIds, isLoaded: true });
        } catch (e) {
            console.error('Failed to load zones', e);
            set({ customZones: [], activeZoneIds: ['schengen'], isLoaded: true });
        }
    },

    addCustomZone: async (zoneData) => {
        const newZone: ZoneConfig = {
            ...zoneData,
            isCustom: true,
            isImplemented: true, // user-entered data — treated as implemented based on their input
        };
        const updated = [...get().customZones, newZone];
        set({ customZones: updated });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Auto-activate the newly added zone
        const updatedActive = [...get().activeZoneIds, newZone.id];
        set({ activeZoneIds: updatedActive });
        await AsyncStorage.setItem(ACTIVE_ZONES_KEY, JSON.stringify(updatedActive));
    },

    deleteCustomZone: async (id) => {
        const updated = get().customZones.filter((z) => z.id !== id);
        set({ customZones: updated });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        const updatedActive = get().activeZoneIds.filter((zid) => zid !== id);
        set({ activeZoneIds: updatedActive });
        await AsyncStorage.setItem(ACTIVE_ZONES_KEY, JSON.stringify(updatedActive));
    },

    setActiveZoneIds: async (ids) => {
        set({ activeZoneIds: ids });
        await AsyncStorage.setItem(ACTIVE_ZONES_KEY, JSON.stringify(ids));
    },

    restoreZones: async (customZones, activeZoneIds) => {
        set({ customZones, activeZoneIds });
        await AsyncStorage.multiSet([
            [STORAGE_KEY, JSON.stringify(customZones)],
            [ACTIVE_ZONES_KEY, JSON.stringify(activeZoneIds)],
        ]);
    },

    getAllZones: () => {
        return [...BUILT_IN_ZONES, ...get().customZones];
    },

    getZone: (id) => {
        return get().getAllZones().find((z) => z.id === id);
    },

    getActiveZones: () => {
        const all = get().getAllZones();
        return get().activeZoneIds.map((id) => all.find((z) => z.id === id)).filter(Boolean) as ZoneConfig[];
    },
}));