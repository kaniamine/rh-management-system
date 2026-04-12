export const COMPANY_CONFIG = {
  name: 'alBaraka Assurances',

  // Work schedule
  workStartTime: '08:30',
  workEndTime:   '17:30',
  standardHoursPerDay: 8,
  graceMinutes: 5,            // minutes before flagging as late

  // GPS geofence — replace with real company coordinates
  location: {
    lat: 36.8065,
    lng: 10.1815,
    radiusMeters: 100
  },

  // Company IP whitelist — replace with real IP(s)
  allowedIPs: [
    '196.XXX.XXX.XXX'
  ]
} as const;

export type ValidationMethod = 'gps' | 'ip' | 'none';

export interface ValidationResult {
  allowed: boolean;
  method: ValidationMethod;
  label: string;
  detail: string;
}
