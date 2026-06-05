export interface UserDocument {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'driver' | 'admin';
  membership_tier: 'none' | 'silver' | 'gold' | 'platinum';
  membership_expiry: string | null;
  created_at: string;
}
