import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUILT_IN_ZONES, type ZoneConfig } from '../constants/zones';

const STORAGE_KEY = '@dwelline/custom_zones';
const ACTIVE_ZONES_KEY = '@dwelline/active_zone_ids';

interface ZonesState {
    customZones: ZoneConfig[];
    activeZoneIds: string[]; // какие зоны пользователь реально отслеживает (выбрано на онбординге/настройках)
    isLoaded: boolean;

    loadZones: () => Promise<void>;
    addCustomZone: (zone: Omit<ZoneConfig, 'isCustom' | 'isImplemented'>) => Promise<void>;
    deleteCustomZone: (id: string) => Promise<void>;
    setActiveZoneIds: (ids: string[]) => Promise<void>;

    getAllZones: () => ZoneConfig[]; // встроенные + пользовательские вместе
    getZone: (id: string) => ZoneConfig | undefined;
    getActiveZones: () => ZoneConfig[]; // только те, что реально отслеживаются
}

export const useZonesStore = create<ZonesState>((set, get) => ({
    customZones: [],
    activeZoneIds: ['schengen'], // по умолчанию хотя бы Шенген, пока не пройден онбординг
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
            isImplemented: true, // пользователь сам ввёл данные — считаем реализованной по его вводу
        };
        const updated = [...get().customZones, newZone];
        set({ customZones: updated });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Автоматически активируем только что добавленную зону
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