export interface PhysicalStore {
  id?: number;
  name: string;
  logo_url?: string | null;
  logo_file?: File | null;
  address: string | null;
  url: string | null;
  url_text: string | null;
  order: number;
  is_active: boolean;
}

export interface PhysicalStoreSection {
  id?: number;
  title: string;
  subtitle: string | null;
  is_active: boolean;
  stores: PhysicalStore[];
  updated_at?: string;
}