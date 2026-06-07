import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditoriaEvento } from '../models/auditoria-evento.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { ApiService } from './api.service';

export interface AuditoriaFilters {
  idUsuario?: string;
  entidad?: string;
  accion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  constructor(private readonly api: ApiService) {}

  list(filters: AuditoriaFilters = {}): Observable<PaginatedResponse<AuditoriaEvento>> {
    const params: any = {};
    if (filters.idUsuario) params.idUsuario = filters.idUsuario;
    if (filters.entidad) params.entidad = filters.entidad;
    if (filters.accion) params.accion = filters.accion;
    if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
    if (filters.fechaFin) params.fechaFin = filters.fechaFin;
    params.limit = filters.limit ?? 20;
    params.offset = filters.offset ?? 0;

    return this.api.get<PaginatedResponse<AuditoriaEvento>>('/api/admin/auditoria', params);
  }
}
