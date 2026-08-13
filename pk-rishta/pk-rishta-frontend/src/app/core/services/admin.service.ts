import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminStats, AdminUser, ApiResponse, Complaint, ComplaintMessage, Profile, AdminContactRequest, PartnerPreferences, ContactFormMessage } from '../models';

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

  sendComplaintMessage(id: string, message: string): Observable<ApiResponse<ComplaintMessage>> {
    return this.http.post<ApiResponse<ComplaintMessage>>(`${this.baseUrl}/complaints/${id}/message`, { message });
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
