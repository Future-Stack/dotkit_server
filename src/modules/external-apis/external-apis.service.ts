import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GeocodeResult } from './dto/geocode-response.dto';
import { FmrResult } from './dto/fmr-response.dto';
import { CompsResult, RentalComp, SoldComp } from './dto/comps-response.dto';
import { CrimeResult, CrimeRiskLabel, CrimeTypeBreakdown } from './dto/crime-response.dto';

/** National average offenses per 100k population (FBI UCR baseline ~2022) */
const FBI_NATIONAL_BASELINE_PER_100K = 2109;

/** FBI offense category → friendly display name */
const OFFENSE_LABEL_MAP: Record<string, string> = {
  'larceny': 'Theft / Larceny',
  'aggravated-assault': 'Aggravated Assault',
  'burglary': 'Burglary',
  'motor-vehicle-theft': 'Motor Vehicle Theft',
  'robbery': 'Robbery',
  'rape': 'Rape',
  'murder': 'Homicide',
  'arson': 'Arson',
  'violent-crime': 'Violent Crime (Total)',
  'property-crime': 'Property Crime (Total)',
};

/** FBI Crime Data API base URL (updated to sapi) */
const FBI_BASE_URL = 'https://api.usa.gov/crime/fbi/sapi/api';

@Injectable()
export class ExternalApisService {
  private readonly logger = new Logger(ExternalApisService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. GOOGLE GEOCODING
  // ─────────────────────────────────────────────────────────────────────────────
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — returning mock geocode');
      return this.mockGeocode(address);
    }

    try {
      const url = 'https://maps.googleapis.com/maps/api/geocode/json';
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: { address, key: apiKey },
        }),
      );

      if (data.status !== 'OK' || !data.results?.length) {
        this.logger.warn(`Geocode returned status: ${data.status} for address: ${address}`);
        return this.mockGeocode(address);
      }

      const result = data.results[0];
      const components: Record<string, string> = {};

      for (const comp of result.address_components) {
        for (const type of comp.types) {
          components[type] = comp.long_name;
          if (type === 'administrative_area_level_1') {
            components['state_short'] = comp.short_name;
          }
        }
      }

      return {
        formattedAddress: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        city:
          components['locality'] ||
          components['sublocality'] ||
          components['administrative_area_level_2'] ||
          '',
        state: components['state_short'] || components['administrative_area_level_1'] || '',
        zipCode: components['postal_code'] || '',
      };
    } catch (err: any) {
      this.logger.error(`Geocode API error: ${err.message}`);
      return this.mockGeocode(address);
    }
  }

  private mockGeocode(address: string): GeocodeResult {
    return {
      formattedAddress: address,
      latitude: 0,
      longitude: 0,
      city: '',
      state: '',
      zipCode: '',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HUD FMR (Fair Market Rent) — Free Public API, no key required
  // ─────────────────────────────────────────────────────────────────────────────
  async getFmrByZipCode(zipCode: string): Promise<FmrResult | null> {
    if (!zipCode) return null;

    try {
      const hudToken = this.configService.get<string>('HUD_API_TOKEN');
      const url = `https://www.huduser.gov/hudapi/public/fmr/listFMRs`;

      const headers: Record<string, string> = {};
      if (hudToken) {
        headers['Authorization'] = `Bearer ${hudToken}`;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: { zip_code: zipCode },
          headers,
          timeout: 8000,
        }),
      );

      if (!data?.data?.basicdata) {
        this.logger.warn(`HUD FMR: no data for zip ${zipCode}`);
        return null;
      }

      const bd = data.data.basicdata;

      return {
        year: data.data.year || new Date().getFullYear(),
        county: bd.county_name || '',
        state: bd.statename || '',
        studio: Number(bd.Efficiency || 0),
        oneBedroom: Number(bd.One_Bedroom || 0),
        twoBedroom: Number(bd.Two_Bedroom || 0),
        threeBedroom: Number(bd.Three_Bedroom || 0),
        fourBedroom: Number(bd.Four_Bedroom || 0),
        raw: bd,
      };
    } catch (err: any) {
      this.logger.error(`HUD FMR API error for zip ${zipCode}: ${err.message}`);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. RENTCAST — Rental & Sold Comps
  // ─────────────────────────────────────────────────────────────────────────────
  async getRentalAndSoldComps(
    latitude: number,
    longitude: number,
    address: string,
    bedrooms?: number,
  ): Promise<CompsResult> {
    const apiKey = this.configService.get<string>('RENTCAST_API_KEY');
    const empty: CompsResult = { rental: [], sold: [] };

    if (!apiKey) {
      this.logger.warn('RENTCAST_API_KEY not set — skipping comps fetch');
      return empty;
    }

    const headers = {
      'X-Api-Key': apiKey,
      Accept: 'application/json',
    };

    const params: Record<string, any> = {
      latitude,
      longitude,
      radius: 1,
      limit: 10,
    };
    if (bedrooms) params.bedrooms = bedrooms;

    try {
      // Rental comps
      const [rentalRes, soldRes, estimateRes] = await Promise.allSettled([
        firstValueFrom(
          this.httpService.get('https://api.rentcast.io/v1/listings/rental/long-term', {
            headers,
            params,
            timeout: 8000,
          }),
        ),
        firstValueFrom(
          this.httpService.get('https://api.rentcast.io/v1/listings/sale', {
            headers,
            params,
            timeout: 8000,
          }),
        ),
        firstValueFrom(
          this.httpService.get('https://api.rentcast.io/v1/avm/rent/long-term', {
            headers,
            params: { address, bedrooms },
            timeout: 8000,
          }),
        ),
      ]);

      const rentalComps: RentalComp[] =
        rentalRes.status === 'fulfilled'
          ? (rentalRes.value.data || []).map((p: any): RentalComp => ({
            id: p.id || '',
            address: p.formattedAddress || p.addressLine1 || '',
            city: p.city || '',
            state: p.state || '',
            zipCode: p.zipCode || '',
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            squareFootage: p.squareFootage,
            rent: p.price || p.rent || 0,
            distance: p.distance,
            listedDate: p.listedDate,
            propertyType: p.propertyType,
            photoUrl: p.photoUrl ?? undefined,
          }))
          : [];

      const soldComps: SoldComp[] =
        soldRes.status === 'fulfilled'
          ? (soldRes.value.data || []).map((p: any): SoldComp => ({
            id: p.id || '',
            address: p.formattedAddress || p.addressLine1 || '',
            city: p.city || '',
            state: p.state || '',
            zipCode: p.zipCode || '',
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            squareFootage: p.squareFootage,
            price: p.price || 0,
            pricePerSqFt:
              p.price && p.squareFootage ? Math.round(p.price / p.squareFootage) : undefined,
            soldDate: p.listedDate || p.soldDate,
            distance: p.distance,
            propertyType: p.propertyType,
            photoUrl: p.photoUrl ?? undefined,
          }))
          : [];

      const estimate =
        estimateRes.status === 'fulfilled' ? estimateRes.value.data : null;

      return {
        rental: rentalComps,
        sold: soldComps,
        rentEstimate: estimate?.rent,
        valueEstimate: estimate?.value,
      };
    } catch (err: any) {
      this.logger.error(`RentCast API error: ${err.message}`);
      return empty;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. FBI CRIME DATA API — Primary crime source (replaces SpotCrime entirely)
  //
  // Strategy:
  //   1. Use the state abbreviation from geocode to query the FBI CDE API
  //   2. Pull the most recent year's offense summary for the state
  //   3. Attempt a city-level query first; fall back to state-level
  //   4. Map FBI offense categories → crimesByType breakdown
  //   5. Compute crimeScore from offenses-per-100k vs national baseline
  //   6. Return full CrimeResult with dashboard data
  // ─────────────────────────────────────────────────────────────────────────────
  async getCrimeData(latitude: number, longitude: number, state?: string, city?: string): Promise<CrimeResult> {
    const fbiKey = this.configService.get<string>('FBI_API_KEY');

    if (!fbiKey) {
      this.logger.warn('FBI_API_KEY not set — returning UNKNOWN crime result');
      return this.unknownCrimeResult();
    }

    if (!state) {
      this.logger.warn(`getCrimeData: no state provided for (${latitude}, ${longitude}) — returning UNKNOWN`);
      return this.unknownCrimeResult();
    }

    // Try city-level first, then fall back to state-level
    const cityResult = city
      ? await this.fetchFbiCityData(state, city, fbiKey)
      : null;

    if (cityResult && cityResult.dataSource === 'FBI') {
      return cityResult;
    }

    return this.fetchFbiStateData(state, fbiKey);
  }

  // ─── FBI: City-level offense data ────────────────────────────────────────────
  private async fetchFbiCityData(
    stateAbbr: string,
    city: string,
    apiKey: string,
  ): Promise<CrimeResult | null> {
    try {
      const year = new Date().getFullYear() - 2; // FBI data is typically 2 years behind
      const encodedCity = encodeURIComponent(city.trim().toUpperCase());

      // FBI CDE: summarized city-level data by offense type
      const url = `${FBI_BASE_URL}/summarized/agency/city/${encodedCity}/state/${stateAbbr}/offense-type/all-offenses/${year}`;

      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: { api_key: apiKey },
          timeout: 10000,
        }),
      );

      const results: any[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);

      if (!results.length) {
        this.logger.warn(`FBI city-level: no data for ${city}, ${stateAbbr}`);
        return null;
      }

      return this.mapFbiResponseToResult(results, `${city}, ${stateAbbr}`);
    } catch (err: any) {
      this.logger.warn(`FBI city-level query failed (${city}, ${stateAbbr}): ${err.message}`);
      return null;
    }
  }

  // ─── FBI: State-level offense data (fallback) ─────────────────────────────────
  private async fetchFbiStateData(
    stateAbbr: string,
    apiKey: string,
  ): Promise<CrimeResult> {
    try {
      const year = new Date().getFullYear() - 2;
      const url = `${FBI_BASE_URL}/summarized/state/${stateAbbr}/all-offenses/${year}`;

      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: { api_key: apiKey },
          timeout: 10000,
        }),
      );

      const results: any[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);

      if (!results.length) {
        this.logger.warn(`FBI state-level: no data for ${stateAbbr}`);
        return this.unknownCrimeResult();
      }

      return this.mapFbiResponseToResult(results, stateAbbr);
    } catch (err: any) {
      this.logger.error(`FBI state-level API error (${stateAbbr}): ${err.message}`);
      return this.unknownCrimeResult();
    }
  }

  // ─── Map raw FBI response → CrimeResult ──────────────────────────────────────
  private mapFbiResponseToResult(results: any[], areaLabel: string): CrimeResult {
    // FBI results are per-offense-type per agency; aggregate them
    const offenseTotals: Record<string, number> = {};
    let totalPopulation = 0;
    const seenAgencies = new Set<string>();

    for (const row of results) {
      const offense: string = (row.offense || row.offense_name || 'other').toLowerCase().replace(/\s+/g, '-');
      const count = Number(row.actual_count ?? row.incidents ?? row.count ?? 0);
      offenseTotals[offense] = (offenseTotals[offense] || 0) + count;

      // Accumulate population once per agency (avoid double-counting)
      const agencyId = row.ori || row.agency_id || row.pub_agency_name;
      if (agencyId && !seenAgencies.has(agencyId)) {
        seenAgencies.add(agencyId);
        totalPopulation += Number(row.population ?? 0);
      }
    }

    // Build breakdown array (exclude meta-categories to avoid double counting)
    const EXCLUDED_CATEGORIES = new Set(['all-offenses', 'part-i-crimes', 'part-ii-crimes']);
    const totalIncidents = Object.entries(offenseTotals)
      .filter(([key]) => !EXCLUDED_CATEGORIES.has(key))
      .reduce((sum, [, v]) => sum + v, 0);

    const crimesByType: CrimeTypeBreakdown[] = Object.entries(offenseTotals)
      .filter(([key, count]) => !EXCLUDED_CATEGORIES.has(key) && count > 0)
      .sort((a, b) => b[1] - a[1]) // highest first
      .map(([key, count]) => ({
        type: OFFENSE_LABEL_MAP[key] ?? this.formatOffenseKey(key),
        count,
        percentage: totalIncidents > 0 ? Number(((count / totalIncidents) * 100).toFixed(1)) : 0,
      }));

    // Compute score: offenses-per-100k vs national baseline
    const per100k =
      totalPopulation > 0 ? (totalIncidents / totalPopulation) * 100_000 : 0;

    const crimeScore = this.computeCrimeScoreFromRate(per100k);
    const riskLabel = this.crimeRiskLabel(crimeScore);

    // Human-readable summary
    const areaSummary = this.buildAreaSummary(areaLabel, per100k, riskLabel, totalIncidents);

    return {
      crimeScore,
      riskLabel,
      totalIncidents,
      areaName: areaLabel,
      population: totalPopulation || undefined,
      crimesByType,
      areaSummary,
      dataSource: 'FBI',
      // Backward-compatible incidents array mapped from breakdown
      incidents: crimesByType.map((b) => ({ type: b.type, description: `${b.count} reported incidents` })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Converts FBI offense rate (per 100k population) to a 0-100 safety score.
   * Higher = safer.
   * National baseline ~2,109 per 100k (FBI UCR 2022).
   */
  private computeCrimeScoreFromRate(per100k: number): number {
    if (per100k === 0) return 50; // No data — neutral
    if (per100k <= 500) return 95;    // Very safe
    if (per100k <= 1000) return 82;   // Safe
    if (per100k <= 1800) return 68;   // Below average risk
    if (per100k <= 2500) return 52;   // Near national average
    if (per100k <= 3500) return 38;   // Above average risk
    if (per100k <= 5000) return 22;   // High risk
    return 10;                         // Very high risk
  }

  private crimeRiskLabel(score: number): CrimeRiskLabel {
    if (score >= 70) return 'LOW';
    if (score >= 45) return 'MEDIUM';
    if (score > 0) return 'HIGH';
    return 'UNKNOWN';
  }

  private buildAreaSummary(
    area: string,
    per100k: number,
    riskLabel: CrimeRiskLabel,
    total: number,
  ): string {
    if (per100k === 0 || total === 0) {
      return `Crime statistics for ${area} are not available at this time.`;
    }

    const rateStr = Math.round(per100k).toLocaleString();
    const comparisonStr =
      per100k < FBI_NATIONAL_BASELINE_PER_100K
        ? `below the national average of ~${FBI_NATIONAL_BASELINE_PER_100K.toLocaleString()} per 100k`
        : `above the national average of ~${FBI_NATIONAL_BASELINE_PER_100K.toLocaleString()} per 100k`;

    const riskDesc =
      riskLabel === 'LOW'
        ? 'a relatively safe area'
        : riskLabel === 'MEDIUM'
          ? 'a moderate-risk area'
          : 'a higher-risk area';

    return (
      `${area} is ${riskDesc} with a crime rate of ${rateStr} incidents per 100k population, ` +
      `${comparisonStr}. A total of ${total.toLocaleString()} offenses were reported in the most recent FBI data.`
    );
  }

  /** Convert a raw FBI offense slug to a readable label */
  private formatOffenseKey(key: string): string {
    return key
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private unknownCrimeResult(): CrimeResult {
    return {
      crimeScore: 0,
      riskLabel: 'UNKNOWN',
      totalIncidents: 0,
      crimesByType: [],
      dataSource: 'UNKNOWN',
      incidents: [],
    };
  }
}
