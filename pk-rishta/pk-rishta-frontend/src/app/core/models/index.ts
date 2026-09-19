export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  first_name?: string;
  last_name?: string;
  profile_id?: string;
  gender?: 'male' | 'female' | string;
  profile_photo?: string;
  is_profile_complete?: boolean;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  date_of_birth?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number | null;
  marital_status?: string;
  religion?: string;
  sect?: string;
  caste?: string;
  color?: string;
  house_own_location?: string;
  house_rent_location?: string;
  abroad_country?: string;
  abroad_house_own_location?: string;
  abroad_house_rent_location?: string;
  pk_house_type?: 'own' | 'rent' | null;
  abroad_house_type?: 'own' | 'rent' | null;
  address_visible?: boolean;
  i_shared_address?: boolean;
  they_shared_address?: boolean;
  disability?: string;
  mother_tongue?: string;
  languages?: string;
  guardian_type?: string;
  guardian_name?: string;
  city: string;
  province: string;
  country?: string;
  education?: string;
  profession?: string;
  /** Yes | No — Hafiz-e-Quran */
  hafiz_quran?: string;
  income_range?: string;
  about_me?: string;
  looking_for?: string;
  family_details?: string;
  profile_photo?: string;
  email?: string;
  user_email?: string;
  user_phone?: string;
  is_admin_view?: boolean;
  is_verified?: boolean;
  admin_rating?: number | null;
  contact_request_limit?: number | null;
  profile_views?: number;
  visibility?: string;
  is_profile_complete?: boolean;
  match_score?: number;
  match_reasons?: string[];
  contacts?: ProfileContact[];
  partner_preferences?: PartnerPreferences;
}

export interface PartnerPreferences {
  min_age?: number;
  max_age?: number;
  min_height_cm?: number;
  max_height_cm?: number;
  religion?: string;
  sect?: string;
  city?: string;
  province?: string;
  country?: string;
  education?: string;
  profession?: string;
  caste?: string;
  marital_status?: string;
  requirements_notes?: string;
}

export interface ProfileContact {
  id?: string;
  type: 'phone' | 'whatsapp';
  number: string;
}

export interface ContactAccessRequest {
  id: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  user_message?: string;
  admin_message?: string;
  response_source?: 'admin' | 'target' | 'system' | string;
  reviewed_at?: string;
  expires_at?: string;
  created_at: string;
  target_first_name?: string;
  target_last_name?: string;
  target_city?: string;
  target_age?: number;
  target_gender?: string;
  target_photo?: string;
  requester_first_name?: string;
  requester_last_name?: string;
  requester_city?: string;
  requester_age?: number;
  requester_gender?: string;
  requester_photo?: string;
  contacts?: { id?: string; type: string; number: string }[];
}

export interface ContactAccessStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected' | 'expired' | 'own';
  request_id?: string;
  admin_message?: string;
  expires_at?: string;
  created_at?: string;
  contacts?: ProfileContact[];
  pending_limit?: number;
  pending_used?: number;
  pending_remaining?: number;
  can_request?: boolean;
  daily_limit?: number;
  daily_used?: number;
  daily_remaining?: number;
  can_request_today?: boolean;
  can_request_again?: boolean;
  cooldown_until?: string;
  cooldown_days_remaining?: number;
  reviewed_at?: string;
  last_status?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ComplaintMessage {
  id: string;
  sender_role: 'admin' | 'reporter' | 'reported';
  recipient_role?: 'reporter' | 'reported' | 'both' | null;
  message: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  reporter_profile_id: string;
  reported_profile_id: string;
  category: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes?: string;
  reviewed_at?: string;
  created_at: string;
  messages?: ComplaintMessage[];
  reporter_first_name?: string;
  reporter_last_name?: string;
  reporter_city?: string;
  reporter_email?: string;
  reported_first_name?: string;
  reported_last_name?: string;
  reported_city?: string;
  reported_email?: string;
}

export interface MyComplaintsData {
  filed: Complaint[];
  against_me: Complaint[];
  support?: Complaint[];
}

export interface AdminContactRequest extends ContactAccessRequest {
  requester_first_name?: string;
  requester_last_name?: string;
  requester_city?: string;
  requester_age?: number;
  requester_gender?: string;
  requester_contacts?: { type: string; number: string }[];
  target_contacts?: { type: string; number: string }[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  code?: string;
  data: {
    token?: string;
    user?: User;
    requires_otp?: boolean;
    email?: string;
    purpose?: 'email_verify' | 'password_reset';
    resend_after_seconds?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

export interface Stats {
  total_profiles: string;
  successful_matches: string;
  active_users: string;
  cities_covered: string;
}

export interface FilterOptions {
  provinces: string[];
  cities: string[];
  religions: string[];
  sects: string[];
  marital_statuses: string[];
  education_levels: string[];
}

export interface AdminStats {
  total_users: string;
  active_users: string;
  inactive_users: string;
  total_profiles: string;
  verified_profiles: string;
  unverified_profiles: string;
  pending_contact_requests: string;
  total_contact_requests?: string;
  pending_complaints: string;
  new_contact_messages: string;
  new_users_week: string;
  visitors_today: string;
  page_views_today: string;
  visitors_yesterday: string;
  visit_date?: string;
}

export interface ContactFormMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  profile_id?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  city?: string;
  province?: string;
  is_profile_complete?: boolean;
  profile_verified?: boolean;
}
