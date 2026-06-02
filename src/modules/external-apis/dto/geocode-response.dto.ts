export interface GeocodeResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  county?: string;
  state: string;
  zipCode: string;
}
