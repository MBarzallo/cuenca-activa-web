import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ParametroSistema } from '../models/parametro-sistema.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ParametrosSistemaService {
  constructor(private readonly api: ApiService) {}

  list(): Observable<ParametroSistema[]> {
    return this.api.get<ParametroSistema[]>('/api/admin/parametros');
  }

  update(codigo: string, valor: string): Observable<void> {
    return this.api.put<void>(`/api/admin/parametros/${codigo}`, { valor });
  }
}
