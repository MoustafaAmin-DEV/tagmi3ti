export interface UserProfile {
  id: string;
  display_name: string;
  phone: string | null;
  city: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileInput {
  display_name: string;
  phone?: string | null;
  city?: string | null;
}
