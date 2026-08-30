import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, FilterOptions, Profile, PartnerPreferences, Stats, ContactAccessRequest, ContactAccessStatus, Complaint, ComplaintMessage, MyComplaintsData } from '../models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/profiles`;
  private readonly apiUrl = environment.apiUrl;

  getStats(): Observable<ApiResponse<Stats>> {
    return this.http.get<ApiResponse<Stats>>(`${this.baseUrl}/stats`);
  }

  getFilters(): Observable<ApiResponse<FilterOptions>> {
    return this.http.get<ApiResponse<FilterOptions>>(`${this.baseUrl}/filters`);
  }

  search(filters: Record<string, string | number>): Observable<ApiResponse<Profile[]>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<ApiResponse<Profile[]>>(`${this.baseUrl}/search`, { params });
  }

  getMatches(filters: Record<string, string | number>): Observable<ApiResponse<Profile[]>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined && key !== 'gender') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<ApiResponse<Profile[]>>(`${this.baseUrl}/matches`, { params });
  }

  getById(id: string): Observable<ApiResponse<Profile>> {
    return this.http.get<ApiResponse<Profile>>(`${this.baseUrl}/${id}`);
  }

  getMyProfile(): Observable<ApiResponse<Profile>> {
    return this.http.get<ApiResponse<Profile>>(`${this.baseUrl}/me`);
  }

  updateMyProfile(data: Partial<Profile> & { partner_preferences?: PartnerPreferences }): Observable<ApiResponse<Profile>> {
    return this.http.put<ApiResponse<Profile>>(`${this.baseUrl}/me`, data);
  }

  uploadProfilePhoto(file: File): Observable<ApiResponse<{ profile_photo: string }>> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<ApiResponse<{ profile_photo: string }>>(`${this.baseUrl}/me/photo`, formData);
  }

  requestContact(targetProfileId: string, userMessage?: string): Observable<ApiResponse<ContactAccessRequest>> {
    return this.http.post<ApiResponse<ContactAccessRequest>>(`${this.apiUrl}/contact-requests`, {
      target_profile_id: targetProfileId,
      user_message: userMessage,
    });
  }

  getMyContactRequests(): Observable<ApiResponse<ContactAccessRequest[]>> {
    return this.http.get<ApiResponse<ContactAccessRequest[]>>(`${this.apiUrl}/contact-requests`);
  }

  getIncomingContactRequests(): Observable<ApiResponse<ContactAccessRequest[]> & { locked?: boolean }> {
    return this.http.get<ApiResponse<ContactAccessRequest[]> & { locked?: boolean }>(
      `${this.apiUrl}/contact-requests/incoming`
    );
  }

  respondToContactRequest(
    requestId: string,
    action: 'approve' | 'reject',
    message?: string
  ): Observable<ApiResponse<ContactAccessRequest>> {
    return this.http.patch<ApiResponse<ContactAccessRequest>>(
      `${this.apiUrl}/contact-requests/${requestId}/respond`,
      { action, message }
    );
  }

  cancelContactRequest(requestId: string): Observable<ApiResponse<ContactAccessRequest>> {
    return this.http.patch<ApiResponse<ContactAccessRequest>>(
      `${this.apiUrl}/contact-requests/${requestId}/cancel`,
      {}
    );
  }

  getContactAccessStatus(profileId: string): Observable<ApiResponse<ContactAccessStatus>> {
    return this.http.get<ApiResponse<ContactAccessStatus>>(`${this.apiUrl}/contact-requests/status/${profileId}`);
  }

  submitComplaint(reportedProfileId: string, category: string, description: string): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(`${this.apiUrl}/complaints`, {
      reported_profile_id: reportedProfileId,
      category,
      description,
    });
  }

  getMyComplaints(): Observable<ApiResponse<MyComplaintsData>> {
    return this.http.get<ApiResponse<MyComplaintsData>>(`${this.apiUrl}/complaints`);
  }

  replyToComplaint(complaintId: string, message: string): Observable<ApiResponse<ComplaintMessage>> {
    return this.http.post<ApiResponse<ComplaintMessage>>(`${this.apiUrl}/complaints/${complaintId}/reply`, { message });
  }
}
