import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminImagenModeracion } from '../models/admin-imagen-moderacion.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ImagenModeracionService {
  constructor(private readonly api: ApiService) {}

  list(filters: {
    estadoRevision?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    limit?: number;
    offset?: number;
  } = {}): Observable<PaginatedResponse<AdminImagenModeracion>> {
    const params: any = {};
    if (filters.estadoRevision) params.estadoRevision = filters.estadoRevision;
    if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
    if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
    params.limit = filters.limit ?? 20;
    params.offset = filters.offset ?? 0;

    return this.api.get<PaginatedResponse<AdminImagenModeracion>>('/api/admin/moderacion/imagenes', params);
  }

  getById(idArchivo: string): Observable<AdminImagenModeracion> {
    return this.api.get<AdminImagenModeracion>(`/api/admin/moderacion/imagenes/${idArchivo}`);
  }

  approve(idArchivo: string, motivo?: string): Observable<void> {
    return this.api.post<void>(`/api/admin/moderacion/imagenes/${idArchivo}/aprobar`, { motivo });
  }

  reject(idArchivo: string, motivo?: string): Observable<void> {
    return this.api.post<void>(`/api/admin/moderacion/imagenes/${idArchivo}/rechazar`, { motivo });
  }

  retry(idArchivo: string): Observable<void> {
    return this.api.post<void>(`/api/admin/moderacion/imagenes/${idArchivo}/reintentar`, {});
  }
}
