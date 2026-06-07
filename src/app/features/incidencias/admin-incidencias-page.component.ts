import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { Incidencia } from '../../core/models/incidencia.model';
import { EstadoIncidencia } from '../../core/models/catalogo.model';
import { CatalogosService } from '../../core/services/catalogos.service';
import { IncidenciasService } from '../../core/services/incidencias.service';

@Component({
  selector: 'app-admin-incidencias-page',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule],
  template: `
    <div class="space-y-6">
      <section class="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
        <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-teal)]">Moderación</p>
            <h2 class="mt-2 text-3xl font-semibold">Gestión de incidencias</h2>
            <p class="mt-2 max-w-3xl text-slate-600">Revisa reportes ciudadanos, actualiza estados y crea relaciones oficiales entre incidencias.</p>
          </div>
          <button pButton icon="pi pi-refresh" severity="secondary" outlined label="Actualizar" (click)="loadIncidencias()"></button>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Total cargadas</p>
              <strong class="mt-1 block text-3xl">{{ incidencias().length }}</strong>
            </div>
            <span class="ca-metric-icon bg-[var(--ca-navy)] text-white"><i class="pi pi-map-marker"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Con comentarios</p>
              <strong class="mt-1 block text-3xl text-[var(--ca-teal)]">{{ withCommentsCount() }}</strong>
            </div>
            <span class="ca-metric-icon bg-[var(--ca-teal)] text-white"><i class="pi pi-comments"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Cerradas</p>
              <strong class="mt-1 block text-3xl text-[var(--ca-gold)]">{{ closedCount() }}</strong>
            </div>
            <span class="ca-metric-icon bg-[var(--ca-gold)] text-[var(--ca-navy)]"><i class="pi pi-check-circle"></i></span>
          </div>
        </p-card>
      </section>

      <p-card styleClass="overflow-hidden border-0 shadow-sm">
        <ng-template pTemplate="header">
          <div class="grid gap-4 border-b border-slate-100 px-5 py-4 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <h3 class="text-lg font-semibold">Bandeja de incidencias</h3>
              <p class="mt-1 text-sm text-slate-500">Listado administrativo con acciones de moderación.</p>
            </div>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input pInputText class="w-full" [(ngModel)]="searchTerm" placeholder="Buscar título, categoría o sector" />
            </span>
          </div>
        </ng-template>
        <p-table [value]="filteredIncidencias()" [paginator]="true" [rows]="10" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Sector</th>
              <th>Actividad</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-incidencia>
            <tr>
              <td>
                <div class="font-semibold">{{ incidencia.titulo }}</div>
                <div class="line-clamp-1 text-sm text-slate-500">{{ incidencia.descripcion }}</div>
              </td>
              <td>{{ incidencia.nombreCategoria }}</td>
              <td><p-tag [value]="incidencia.nombreEstado" [severity]="tagSeverity(incidencia.codigoEstado)"></p-tag></td>
              <td>{{ incidencia.nombreSector || incidencia.direccionReferencial || 'Sin sector' }}</td>
              <td class="text-sm text-slate-600">
                {{ incidencia.cantidadComentarios }} comentarios · {{ incidencia.cantidadConfirmaciones }} confirmaciones
              </td>
              <td class="text-right">
                <button pButton size="small" severity="secondary" outlined label="Gestionar" (click)="openDialog(incidencia)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <p-dialog
      [modal]="true"
      [(visible)]="dialogVisible"
      [style]="{ width: 'min(720px, 94vw)' }"
      header="Gestionar incidencia"
    >
      @if (selected(); as item) {
        <div class="space-y-5">
          <div>
            <h3 class="text-xl font-semibold">{{ item.titulo }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.descripcion }}</p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <label>
              <span class="mb-2 block text-sm font-medium">Nuevo estado</span>
              <p-select
                class="w-full"
                [(ngModel)]="nuevoEstado"
                [options]="estados()"
                optionLabel="nombre"
                optionValue="codigo"
                placeholder="Selecciona un estado"
              ></p-select>
            </label>
            <label>
              <span class="mb-2 block text-sm font-medium">Relacionar con incidencia</span>
              <p-select
                class="w-full"
                [(ngModel)]="idRelacionada"
                [options]="incidenciasRelacionables()"
                optionLabel="titulo"
                optionValue="idIncidencia"
                placeholder="Buscar incidencia"
                [filter]="true"
                filterBy="titulo,nombreCategoria,nombreSector"
                [showClear]="true"
              ></p-select>
            </label>
          </div>
          <label class="block">
            <span class="mb-2 block text-sm font-medium">Observación</span>
            <textarea pTextarea class="w-full" rows="4" [(ngModel)]="observacion"></textarea>
          </label>
          <div class="flex flex-wrap justify-end gap-2">
            <button pButton severity="secondary" outlined label="Cerrar" (click)="dialogVisible = false"></button>
            <button pButton severity="secondary" label="Crear relación" [disabled]="!idRelacionada" (click)="relate(item)"></button>
            <button pButton label="Cambiar estado" [disabled]="!nuevoEstado" (click)="changeStatus(item)"></button>
          </div>
        </div>
      }
    </p-dialog>
  `,
})
export class AdminIncidenciasPageComponent implements OnInit {
  readonly incidencias = signal<Incidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  readonly selected = signal<Incidencia | null>(null);
  dialogVisible = false;
  nuevoEstado: string | null = null;
  observacion = '';
  idRelacionada: string | null = null;
  searchTerm = '';

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly catalogosService: CatalogosService,
  ) {}

  ngOnInit() {
    this.loadIncidencias();
    this.catalogosService.estados$.subscribe((estados) => this.estados.set(estados));
  }

  openDialog(incidencia: Incidencia) {
    this.selected.set(incidencia);
    this.nuevoEstado = incidencia.codigoEstado;
    this.observacion = '';
    this.idRelacionada = null;
    this.dialogVisible = true;
  }

  changeStatus(incidencia: Incidencia) {
    if (!this.nuevoEstado) {
      return;
    }
    this.incidenciasService.changeStatus(incidencia.idIncidencia, this.nuevoEstado, this.observacion).subscribe(() => {
      this.dialogVisible = false;
      this.loadIncidencias();
    });
  }

  relate(incidencia: Incidencia) {
    const id = this.idRelacionada;
    if (!id) {
      return;
    }
    this.incidenciasService.relate(incidencia.idIncidencia, id).subscribe(() => {
      this.idRelacionada = null;
    });
  }

  incidenciasRelacionables(): Incidencia[] {
    const selectedId = this.selected()?.idIncidencia;
    return this.incidencias().filter((incidencia) => incidencia.idIncidencia !== selectedId);
  }

  filteredIncidencias(): Incidencia[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.incidencias();
    }
    return this.incidencias().filter((incidencia) =>
      incidencia.titulo.toLowerCase().includes(term) ||
      incidencia.nombreCategoria.toLowerCase().includes(term) ||
      (incidencia.nombreSector ?? '').toLowerCase().includes(term),
    );
  }

  withCommentsCount(): number {
    return this.incidencias().filter((incidencia) => incidencia.cantidadComentarios > 0).length;
  }

  closedCount(): number {
    return this.incidencias().filter((incidencia) => !!incidencia.cerradoEn).length;
  }

  tagSeverity(codigoEstado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const value = codigoEstado.toUpperCase();
    if (value.includes('CERR') || value.includes('RESUEL')) {
      return 'success';
    }
    if (value.includes('PEND') || value.includes('REPORT')) {
      return 'warn';
    }
    if (value.includes('RECH') || value.includes('CANCEL')) {
      return 'danger';
    }
    return 'info';
  }

  loadIncidencias() {
    this.incidenciasService.list({ limit: 100, offset: 0 }).subscribe((items) => this.incidencias.set(items));
  }
}
