import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminDashboardAnalyticsFilters,
  AdminDashboardAnalyticsResponse,
} from '../models/admin-dashboard-analytics.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  constructor(private readonly api: ApiService) {}

  getDashboard(filters: AdminDashboardAnalyticsFilters): Observable<AdminDashboardAnalyticsResponse> {
    return this.api.get<AdminDashboardAnalyticsResponse>('/api/admin/analytics/dashboard', { ...filters });
  }
}
