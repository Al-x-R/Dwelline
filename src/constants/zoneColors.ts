const PALETTE = ['#3B82F6', '#F59E0B', '#22C55E', '#A855F7', '#EC4899', '#14B8A6'];

export function colorForZone(zoneId: string, allZoneIds: string[]): string {
  const index = allZoneIds.indexOf(zoneId);
  if (index === -1) return '#6B7280';
  return PALETTE[index % PALETTE.length];
}