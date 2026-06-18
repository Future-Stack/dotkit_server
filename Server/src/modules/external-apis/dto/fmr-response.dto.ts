export interface FmrResult {
  year: number;
  county: string;
  state: string;
  studio: number;
  oneBedroom: number;
  twoBedroom: number;
  threeBedroom: number;
  fourBedroom: number;
  /** Raw HUD data object for debugging */
  raw?: Record<string, unknown>;
}
