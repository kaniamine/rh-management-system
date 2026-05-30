import { Injectable } from '@angular/core';
import { COMPANY_CONFIG, ValidationResult } from '../../config/company.config';

@Injectable({ providedIn: 'root' })
export class GeoValidationService {

  private haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async checkGPS(): Promise<{ valid: boolean; distance?: number }> {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve({ valid: false });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const dist = this.haversineDistance(
            pos.coords.latitude, pos.coords.longitude,
            COMPANY_CONFIG.location.lat, COMPANY_CONFIG.location.lng
          );
          resolve({ valid: dist <= COMPANY_CONFIG.location.radiusMeters, distance: Math.round(dist) });
        },
        () => resolve({ valid: false }),
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  }

  async validate(): Promise<ValidationResult> {
    const gps = await this.checkGPS();
    if (gps.valid) {
      return {
        allowed: true,
        method:  'gps',
        label:   '✓ Sur site',
        detail:  `Position GPS validée (${gps.distance ?? '?'} m du bureau).`
      };
    }

    return {
      allowed: false,
      method:  'none',
      label:   '✗ Hors site',
      detail:  'Vous n\'êtes pas dans les locaux de l\'entreprise.'
    };
  }
}
