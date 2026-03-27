export type UserType = 'customer' | 'campus_rep' | 'account_manager';
export type OrderStatus = 'new' | 'proof_pending' | 'proof_ready' | 'approved' | 'in_production' | 'shipped' | 'complete';
export type PrintType = 'screen_print' | 'embroidery' | 'puff_print' | 'foil' | 'dye_sublimation';
export type ProofStatus = 'pending' | 'approved' | 'revision_requested';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
  organization?: string;
  school?: string;
  loyalty_points: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  turnaround_days: number;
  starting_price: number;
  is_featured: boolean;
  print_types_available: PrintType[];
  image_url?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  event_name: string;
  due_date: string;
  status: OrderStatus;
  order_type: string;
  products_selected: any;
  print_type: PrintType;
  front_design_description?: string;
  back_design_description?: string;
  front_design_file?: string;
  back_design_file?: string;
  created_at: string;
}

export interface Proof {
  id: string;
  order_id: string;
  proof_number: number;
  product_id: string;
  color: string;
  print_type: PrintType;
  est_ship_date?: string;
  price_tiers: any;
  mockup_image_url?: string;
  status: ProofStatus;
  uploaded_at: string;
}