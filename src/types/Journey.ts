export interface Journey {
  id: string;
  name: string;
  originCountryCode?: string | null;
  originCountryName: string | null;
  originCountryFlag: string | null;
  originDepartureDate?: string | null;
  originDepartureTime: string | null;
  originTransportMode: string | null;
  // Border crossing on the first leg when it isn't the departure date.
  originBorderDate?: string | null;
  destinationCountryCode?: string | null;
  destinationCountryName: string | null;
  destinationCountryFlag: string | null;
  destinationArrivalDate?: string | null;
  destinationArrivalTime: string | null;
  turnaroundTripId: string | null;
  tripIds: string[];
  createdAt: string;
}