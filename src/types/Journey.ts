export interface Journey {
  id: string;
  name: string;
  originCountryName: string | null;
  originCountryFlag: string | null;
  originDepartureTime: string | null;
  originTransportMode: string | null;
  destinationCountryName: string | null;
  destinationCountryFlag: string | null;
  destinationArrivalTime: string | null;
  turnaroundTripId: string | null;
  tripIds: string[];
  createdAt: string;
}