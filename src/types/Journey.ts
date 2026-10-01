export interface Journey {
    id: string;
    name: string;
    originCountryName: string | null;
    originCountryFlag: string | null;
    tripIds: string[];
    createdAt: string;
}