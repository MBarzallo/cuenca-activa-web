import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';

type QueryValue = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, params?: Record<string, QueryValue>) {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }

  post<T>(path: string, body?: unknown, params?: Record<string, QueryValue>) {
    return this.http.post<T>(this.url(path), body ?? {}, { params: this.toParams(params) });
  }

  patch<T>(path: string, body?: unknown) {
    return this.http.patch<T>(this.url(path), body ?? {});
  }

  put<T>(path: string, body?: unknown) {
    return this.http.put<T>(this.url(path), body ?? {});
  }

  delete<T>(path: string) {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private toParams(params?: Record<string, QueryValue>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
