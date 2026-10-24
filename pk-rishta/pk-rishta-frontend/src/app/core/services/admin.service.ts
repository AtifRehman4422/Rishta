import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminStats, AdminUser, ApiResponse, Complaint, ComplaintMessage, Profile, AdminContactRequest, PartnerPreferences, ContactFormMessage } from '../models';

export interface AdminVisitorRow {
  visitor_key: string;
  user_id?: string | null;
  email?: string | null;
  profile_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  page_views: number;
  last_path?: string | null;
  first_seen_at?: string;
  last_seen_at?: string;
  searches_count: number;
  profile_views_count: number;
  display_name: string;
}

export interface AdminVisitorDetail {
  from: string;
  to: string;
  visitor_key: string;
  meta: {
    page_views?: number;
    first_visit?: string;
    last_visit?: string;
    visit_days?: number;
  } | null;
  user: {
    id: string;
    email?: string;
    profile_id?: string;
    first_name?: string;
    last_name?: string;
    gender?: string;
    city?: string;
  } | null;
  visit_days: {
    visit_date: string;
    page_views: number;
    last_path?: string;
    first_seen_at?: string;
    last_seen_at?: string;
  }[];
  searches: {
    id: string;
    created_at: string;
    path?: string;
    summary: string;
    filters: Record<string, unknown>;
  }[];
  profile_views: {
    id: string;
    created_at: string;
    profile_id: string;
    first_name: string;
    last_name: string;
    gender?: string | null;
    city?: string | null;
    province?: string | null;
  }[];
}

export interface DropdownOption {
  id: string;
  field_key: string;
  category?: string | null;
  label: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DropdownOptionRequest {
  id: string;
  user_id?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  field_key: string;
  category?: string | null;
  requested_label: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.baseUrl}/dashboard`);
  }

  getVisitorAnalytics(from: string, to: string): Observable<ApiResponse<{
    from: string;
    to: string;
    total_visitors: number;
    total_page_views: number;
    daily: { date: string; visitors: number; page_views: number }[];
    return_gaps: {
      new: number;
      daily: number;
      skip_1: number;
      skip_2: number;
      skip_3: number;
      skip_4_plus: number;
    };
  }>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<{
      from: string;
      to: string;
      total_visitors: number;
      total_page_views: number;
      daily: { date: string; visitors: number; page_views: number }[];
      return_gaps: {
        new: number;
        daily: number;
        skip_1: number;
        skip_2: number;
        skip_3: number;
        skip_4_plus: number;
      };
    }>>(`${this.baseUrl}/analytics/visitors`, { params });
  }

  getDayVisitors(date: string): Observable<ApiResponse<{
    date: string;
    visitors: AdminVisitorRow[];
  }>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<{ date: string; visitors: AdminVisitorRow[] }>>(
      `${this.baseUrl}/analytics/visitors/day`,
      { params }
    );
  }

  getGapVisitors(gap: string, from: string, to: string): Observable<ApiResponse<{
    from: string;
    to: string;
    gap: string;
    visitors: AdminVisitorRow[];
  }>> {
    const params = new HttpParams().set('gap', gap).set('from', from).set('to', to);
    return this.http.get<ApiResponse<{
      from: string;
      to: string;
      gap: string;
      visitors: AdminVisitorRow[];
    }>>(`${this.baseUrl}/analytics/visitors/gap`, { params });
  }

  getVisitorDetail(visitorKey: string, from: string, to: string): Observable<ApiResponse<AdminVisitorDetail>> {
    const params = new HttpParams()
      .set('visitor_key', visitorKey)
      .set('from', from)
      .set('to', to);
    return this.http.get<ApiResponse<AdminVisitorDetail>>(
      `${this.baseUrl}/analytics/visitor-detail`,
      { params }
    );
  }

  getUsers(page = 1, search = '', status = ''): Observable<ApiResponse<AdminUser[]>> {
    let params = new HttpParams().set('page', page).set('limit', 15);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<AdminUser[]>>(`${this.baseUrl}/users`, { params });
  }

  toggleUserStatus(id: string): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.baseUrl}/users/${id}/toggle-status`, {});
  }

  getProfiles(page = 1, verified = '', search = '', limit = 20): Observable<ApiResponse<Profile[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (verified) params = params.set('verified', verified);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Profile[]>>(`${this.baseUrl}/profiles`, { params });
  }

  verifyProfile(id: string): Observable<ApiResponse<Profile>> {
    return this.http.patch<ApiResponse<Profile>>(`${this.baseUrl}/profiles/${id}/verify`, {});
  }

  rateProfile(id: string, rating: number | null): Observable<ApiResponse<Profile>> {
    return this.http.patch<ApiResponse<Profile>>(`${this.baseUrl}/profiles/${id}/rating`, { rating });
  }

  setRequestLimit(id: string, limit: number | null): Observable<ApiResponse<Profile>> {
    return this.http.patch<ApiResponse<Profile>>(`${this.baseUrl}/profiles/${id}/request-limit`, { limit });
  }

  deleteProfile(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/profiles/${id}`);
  }

  updateProfile(id: string, data: Partial<Profile> & { partner_preferences?: PartnerPreferences }): Observable<ApiResponse<Profile>> {
    return this.http.put<ApiResponse<Profile>>(`${this.baseUrl}/profiles/${id}`, data);
  }

  createProfile(data: Partial<Profile> & {
    email?: string;
    password?: string;
    phone?: string;
    contacts?: { type: string; number: string }[];
    partner_preferences?: PartnerPreferences;
  }): Observable<ApiResponse<Profile>> {
    return this.http.post<ApiResponse<Profile>>(`${this.baseUrl}/profiles`, data);
  }

  getContactRequests(status = 'pending', page = 1): Observable<ApiResponse<AdminContactRequest[]>> {
    const params = new HttpParams().set('status', status).set('page', page).set('limit', 20);
    return this.http.get<ApiResponse<AdminContactRequest[]>>(`${this.baseUrl}/contact-requests`, { params });
  }

  reviewContactRequest(id: string, action: 'approve' | 'reject', adminMessage?: string): Observable<ApiResponse<AdminContactRequest>> {
    return this.http.patch<ApiResponse<AdminContactRequest>>(`${this.baseUrl}/contact-requests/${id}`, {
      action,
      admin_message: adminMessage,
    });
  }

  getComplaints(status = 'pending', page = 1, search = ''): Observable<ApiResponse<Complaint[]>> {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Complaint[]>>(`${this.baseUrl}/complaints`, { params });
  }

  reviewComplaint(id: string, status: 'resolved' | 'dismissed', adminNotes?: string): Observable<ApiResponse<Complaint>> {
    return this.http.patch<ApiResponse<Complaint>>(`${this.baseUrl}/complaints/${id}`, {
      status,
      admin_notes: adminNotes,
    });
  }

  sendComplaintMessage(id: string, message: string, recipient: 'reporter' | 'reported'): Observable<ApiResponse<ComplaintMessage>> {
    return this.http.post<ApiResponse<ComplaintMessage>>(`${this.baseUrl}/complaints/${id}/message`, {
      message,
      recipient,
    });
  }

  getContactMessages(status = 'new', page = 1, search = ''): Observable<ApiResponse<ContactFormMessage[]>> {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<ContactFormMessage[]>>(`${this.baseUrl}/contact-messages`, { params });
  }

  updateContactMessage(id: string, data: { status?: string; admin_notes?: string }): Observable<ApiResponse<ContactFormMessage>> {
    return this.http.patch<ApiResponse<ContactFormMessage>>(`${this.baseUrl}/contact-messages/${id}`, data);
  }

  replyContactMessage(id: string, data: { message: string; admin_notes?: string }): Observable<ApiResponse<ContactFormMessage>> {
    return this.http.post<ApiResponse<ContactFormMessage>>(`${this.baseUrl}/contact-messages/${id}/reply`, data);
  }

  getDropdownOptions(field = ''): Observable<ApiResponse<DropdownOption[]>> {
    let params = new HttpParams();
    if (field) params = params.set('field', field);
    return this.http.get<ApiResponse<DropdownOption[]>>(`${this.baseUrl}/dropdown-options`, { params });
  }

  createDropdownOption(data: {
    field_key: string;
    label: string;
    category?: string;
    sort_order?: number;
  }): Observable<ApiResponse<DropdownOption>> {
    return this.http.post<ApiResponse<DropdownOption>>(`${this.baseUrl}/dropdown-options`, data);
  }

  seedDropdownOptions(): Observable<ApiResponse<{ inserted: number; skipped: number; total: number }>> {
    return this.http.post<ApiResponse<{ inserted: number; skipped: number; total: number }>>(
      `${this.baseUrl}/dropdown-options/seed`,
      {}
    );
  }

  updateDropdownOption(
    id: string,
    data: { label?: string; category?: string | null; is_active?: boolean; sort_order?: number }
  ): Observable<ApiResponse<DropdownOption>> {
    return this.http.patch<ApiResponse<DropdownOption>>(`${this.baseUrl}/dropdown-options/${id}`, data);
  }

  deleteDropdownOption(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/dropdown-options/${id}`);
  }

  getDropdownRequests(status = 'pending'): Observable<ApiResponse<DropdownOptionRequest[]>> {
    const params = new HttpParams().set('status', status);
    return this.http.get<ApiResponse<DropdownOptionRequest[]>>(`${this.baseUrl}/dropdown-requests`, { params });
  }

  reviewDropdownRequest(
    id: string,
    action: 'approve' | 'reject',
    adminNotes?: string
  ): Observable<ApiResponse<{ request: DropdownOptionRequest; option: DropdownOption | null }>> {
    return this.http.patch<ApiResponse<{ request: DropdownOptionRequest; option: DropdownOption | null }>>(
      `${this.baseUrl}/dropdown-requests/${id}`,
      { action, admin_notes: adminNotes }
    );
  }
}
