import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface PublicDropdownOption {
  id: string;
  field_key: string;
  category?: string | null;
  label: string;
  sort_order?: number;
}

@Injectable({ providedIn: 'root' })
export class DropdownService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dropdowns`;

  getOptions(field?: string, category?: string): Observable<ApiResponse<PublicDropdownOption[]>> {
    let params = new HttpParams();
    if (field) params = params.set('field', field);
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<PublicDropdownOption[]>>(this.baseUrl, { params });
  }

  requestOption(data: {
    field_key?: string;
    field_label?: string;
    category?: string;
    requested_label: string;
    name: string;
    email: string;
  }): Observable<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>(`${this.baseUrl}/requests`, data);
  }
}
