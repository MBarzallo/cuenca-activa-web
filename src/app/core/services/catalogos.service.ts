import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { CategoriaIncidencia, EstadoIncidencia } from '../models/catalogo.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  readonly categorias$: Observable<CategoriaIncidencia[]>;
  readonly estados$: Observable<EstadoIncidencia[]>;

  constructor(private readonly api: ApiService) {
    this.categorias$ = this.api
      .get<CategoriaIncidencia[]>('/api/catalogos/categorias-incidencia')
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    this.estados$ = this.api
      .get<EstadoIncidencia[]>('/api/catalogos/estados-incidencia')
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }
}
