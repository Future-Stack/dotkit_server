export interface RentalComp {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  rent: number;
  distance?: number;
  listedDate?: string;
  propertyType?: string;
  photoUrl?: string;
}

export interface SoldComp {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  price: number;
  pricePerSqFt?: number;
  soldDate?: string;
  distance?: number;
  propertyType?: string;
  photoUrl?: string;
}

export interface CompsResult {
  rental: RentalComp[];
  sold: SoldComp[];
  rentEstimate?: number;
  valueEstimate?: number;
}
