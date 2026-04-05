import crypto from "crypto";

/**
 * Her 60 saniyede bir değişen QR token üretir.
 * secret: etkinliğe ait rastgele string
 * window: kaç 60 saniyelik pencere (0=şu an, -1=bir önceki pencere)
 */
export function generateQrToken(secret: string, window = 0): string {
  const timeSlot = Math.floor(Date.now() / 60000) + window;
  return crypto
    .createHmac("sha256", secret)
    .update(String(timeSlot))
    .digest("hex")
    .slice(0, 32);
}

export function verifyQrToken(secret: string, token: string): boolean {
  // Şu anki ve bir önceki pencereyi kabul et (gecikme toleransı)
  return (
    generateQrToken(secret, 0) === token ||
    generateQrToken(secret, -1) === token
  );
}

/** Haversine formülü: iki koordinat arası mesafe (metre) */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
