export interface Store {
  id: string;
  owner_id: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  description?: string | null;
  facebook_url?: string | null;
  email?: string | null;
  logo_url?: string | null;
  maps_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hours_sat_thu?: string | null;
  hours_fri?: string | null;
  hours_notes?: string | null;
  created_at?: string;
}

export interface StoreInput {
  name: string;
  phone?: string | null;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  description?: string | null;
  facebook_url?: string | null;
  email?: string | null;
  logo_url?: string | null;
  maps_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hours_sat_thu?: string | null;
  hours_fri?: string | null;
  hours_notes?: string | null;
}

export interface PartInput {
  name: string;
  type: string;
  brand?: string;
  socket?: string;
  chipset?: string;
  ram_type?: string;
  ram_slots?: number;
  max_ram_gb?: number;
  tdp_watts?: number;
  max_gpu_length_mm?: number;
  psu_wattage?: number;
  gpu_length_mm?: number;
  form_factor?: string;
  market_price_egp?: number;
}
