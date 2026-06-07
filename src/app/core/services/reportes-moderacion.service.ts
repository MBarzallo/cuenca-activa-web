import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminReporteContenido } from '../models/admin-reporte-contenido.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportesModeracionService {
  constructor(private readonly api: ApiService) {}

  list(filters: {
    estadoRevision?: string;
    limit?: number;
    offset?: number;
  } = {}): Observable<PaginatedResponse<AdminReporteContenido>> {
    const params: any = {};
    if (filters.estadoRevision) params.estadoRevision = filters.estadoRevision;
    params.limit = filters.limit ?? 20;
    params.offset = filters.offset ?? 0;

    return this.api.get<PaginatedResponse<AdminReporteContenido>>('/api/admin/reportes-contenido', params);
  }

  resolve(idReporte: string, resolucion: 'APROBADO' | 'RECHAZADO'): Observable<void> {
    return this.api.patch<void>(`/api/admin/reportes-contenido/${idReporte}/resolver`, { resolucion });
  }
}
