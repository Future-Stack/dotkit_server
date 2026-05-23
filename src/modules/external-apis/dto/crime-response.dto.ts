export type CrimeRiskLabel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

/** Breakdown of offenses by crime category (from FBI UCR/NIBRS) */
export interface CrimeTypeBreakdown {
  type: string;      // e.g. "Theft", "Assault", "Burglary"
  count: number;     // number of incidents for this type
  percentage: number; // share of total incidents (0–100)
}

/**
 * @deprecated Legacy shape from SpotCrime — kept for type compatibility in
 * any existing save DTOs. New FBI data stores breakdowns in crimesByType.
 */
export interface CrimeIncident {
  type: string;
  description?: string;
  date?: string;
  distance?: number;
  lat?: number;
  lng?: number;
}

export interface CrimeResult {
  /** 0–100: higher is safer */
  crimeScore: number;

  /** Qualitative risk tier */
  riskLabel: CrimeRiskLabel;

  /** Total offense count in the resolved area */
  totalIncidents: number;

  /** FBI: county/city name for the resolved area */
  areaName?: string;

  /** FBI: estimated population for the resolved area (for per-capita context) */
  population?: number;

  /** Offense breakdown by crime type */
  crimesByType: CrimeTypeBreakdown[];

  /** Human-readable summary sentence for the area's crime rate */
  areaSummary?: string;

  /** Data source identifier */
  dataSource: 'FBI' | 'UNKNOWN';

  /**
   * @deprecated Legacy — was used for SpotCrime per-incident data.
   * Now populated with crimesByType mapped as CrimeIncident[] for
   * backward compatibility with any existing save endpoints.
   */
  incidents: CrimeIncident[];
}
