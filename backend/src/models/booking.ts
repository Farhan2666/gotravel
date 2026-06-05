export interface BookingDocument {
  id: string;
  user_id: string;
  driver_id: string | null;
  route_from: string;
  route_to: string;
  waypoints: string[];
  vehicle_type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_location_updated_at: string | null;
  created_at: string;
}
