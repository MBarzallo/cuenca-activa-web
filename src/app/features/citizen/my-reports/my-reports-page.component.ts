import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { CategoriaIncidencia, EstadoIncidencia } from '../../../core/models/catalogo.model';
import { Incidencia } from '../../../core/models/incidencia.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { IncidenciasService } from '../../../core/services/incidencias.service';
import { citizenStatusOptions, isFinalCitizenIncident } from '../../../shared/utils/citizen-status-options';

@Component({
  selector: 'app-my-reports-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
  ],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 overflow-hidden rounded-[30px] bg-[var(--ca-navy)] text-white shadow-xl shadow-slate-900/10">
        <div class="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Zona ciudadana</p>
            <h1 class="mt-3 text-3xl font-semibold">Mis reportes</h1>
            <p class="mt-2 max-w-3xl leading-7 text-slate-300">
              Revisa las incidencias que publicaste, filtra por estado y actualiza el avance cuando corresponda.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button pButton severity="secondary" outlined icon="pi pi-refresh" label="Actualizar" [loading]="loading()" (click)="load()"></button>
            <a routerLink="/reportar" pButton icon="pi pi-plus-circle" label="Nuevo reporte"></a>
          </div>
        </div>
      </section>

      <section class="mb-6 grid gap-4 md:grid-cols-4">
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Total</p>
              <strong class="mt-1 block text-3xl">{{ reportes().length }}</strong>
            </div>
            <span class="ca-metric-icon bg-[var(--ca-navy)] text-white"><i class="pi pi-file-edit"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">En seguimiento</p>
              <strong class="mt-1 block text-3xl text-[var(--ca-teal)]">{{ openCount() }}</strong>
            </div>
            <span class="ca-metric-icon bg-teal-50 text-[var(--ca-teal)]"><i class="pi pi-clock"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Cerrados</p>
              <strong class="mt-1 block text-3xl text-emerald-600">{{ closedCount() }}</strong>
            </div>
            <span class="ca-metric-icon bg-emerald-50 text-emerald-600"><i class="pi pi-check-circle"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Resultados</p>
              <strong class="mt-1 block text-3xl text-[var(--ca-gold)]">{{ filteredReports().length }}</strong>
            </div>
            <span class="ca-metric-icon bg-amber-50 text-[var(--ca-gold)]"><i class="pi pi-filter"></i></span>
          </div>
        </p-card>
      </section>

      <p-card styleClass="mb-6 border-0 shadow-sm">
        <div class="grid gap-4 xl:grid-cols-[1fr_240px_240px_150px] xl:items-end">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar</span>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input pInputText class="w-full" [(ngModel)]="searchTerm" placeholder="Título, descripción o sector" />
            </span>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
            <p-select class="w-full" [(ngModel)]="selectedStatus" [options]="statusOptions()" optionLabel="nombre" optionValue="codigo" placeholder="Todos" [showClear]="true"></p-select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Categoría</span>
            <p-select class="w-full" [(ngModel)]="selectedCategory" [options]="categoryOptions()" optionLabel="nombre" optionValue="idCategoria" placeholder="Todas" [showClear]="true"></p-select>
          </label>
          <button pButton severity="secondary" outlined icon="pi pi-filter-slash" label="Limpiar" (click)="clearFilters()"></button>
        </div>
      </p-card>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <p-card styleClass="hidden overflow-hidden border-0 shadow-sm md:block">
          <ng-template pTemplate="header">
            <div class="border-b border-slate-100 px-5 py-4">
              <h2 class="text-xl font-semibold">Listado de reportes</h2>
              <p class="mt-1 text-sm text-slate-500">Accede al detalle o cambia el estado si el reporte sigue activo.</p>
            </div>
          </ng-template>

          <p-table [value]="filteredReports()" [paginator]="true" [rows]="10" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Reporte</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Actividad</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-reporte>
              <tr>
                <td>
                  <div class="max-w-md">
                    <div class="font-semibold text-[var(--ca-navy)]">{{ reporte.titulo }}</div>
                    <div class="mt-1 line-clamp-1 text-sm text-slate-500">{{ reporte.descripcion }}</div>
                    <div class="mt-1 text-xs font-semibold text-slate-400">{{ reporte.nombreSector || reporte.direccionReferencial || 'Cuenca' }}</div>
                  </div>
                </td>
                <td>{{ reporte.nombreCategoria }}</td>
                <td><p-tag [value]="reporte.nombreEstado" [severity]="tagSeverity(reporte.codigoEstado)"></p-tag></td>
                <td>
                  <div class="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span><i class="pi pi-check-circle"></i> {{ reporte.cantidadValidaciones }}</span>
                    <span><i class="pi pi-comments"></i> {{ reporte.cantidadComentarios }}</span>
                    <span><i class="pi pi-bell"></i> {{ reporte.cantidadSeguidores }}</span>
                  </div>
                </td>
                <td>{{ reporte.fechaReporte | date:'dd MMM yyyy' }}</td>
                <td>
                  <div class="flex justify-end gap-2">
                    <a [routerLink]="['/incidencias', reporte.idIncidencia]" pButton size="small" severity="secondary" outlined icon="pi pi-eye" label="Detalle"></a>
                    <button pButton size="small" icon="pi pi-sync" label="Estado" [disabled]="isFinal(reporte) || availableStatusOptions(reporte).length === 0" (click)="openStatusDialog(reporte)"></button>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6">
                  <div class="p-8 text-center text-slate-500">No hay reportes que coincidan con los filtros.</div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <section class="grid gap-3 md:hidden">
          @for (reporte of filteredReports(); track reporte.idIncidencia) {
            <article class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="line-clamp-2 font-semibold">{{ reporte.titulo }}</h2>
                  <p class="mt-1 text-sm text-slate-500">{{ reporte.nombreCategoria }}</p>
                </div>
                <p-tag [value]="reporte.nombreEstado" [severity]="tagSeverity(reporte.codigoEstado)"></p-tag>
              </div>
              <p class="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{{ reporte.descripcion }}</p>
              <div class="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                <span><i class="pi pi-comments"></i> {{ reporte.cantidadComentarios }}</span>
                <span><i class="pi pi-check-circle"></i> {{ reporte.cantidadValidaciones }}</span>
                <span>{{ reporte.fechaReporte | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="mt-4 flex gap-2">
                <a [routerLink]="['/incidencias', reporte.idIncidencia]" class="flex-1 justify-center" pButton size="small" severity="secondary" outlined icon="pi pi-eye" label="Detalle"></a>
                <button pButton class="flex-1 justify-center" size="small" icon="pi pi-sync" label="Estado" [disabled]="isFinal(reporte) || availableStatusOptions(reporte).length === 0" (click)="openStatusDialog(reporte)"></button>
              </div>
            </article>
          } @empty {
            <div class="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No hay reportes que coincidan con los filtros.</div>
          }
        </section>

        <aside class="space-y-4">
          <p-card styleClass="border-0 bg-[var(--ca-navy)] text-white shadow-sm">
            <i class="pi pi-plus-circle text-2xl text-[var(--ca-gold)]"></i>
            <h2 class="mt-4 text-xl font-semibold">Crear otro reporte</h2>
            <p class="mt-3 text-sm leading-6 text-slate-300">Si detectas una nueva incidencia, publícala con ubicación y foto opcional.</p>
            <a routerLink="/reportar" class="mt-5 inline-flex" pButton icon="pi pi-arrow-right" label="Reportar"></a>
          </p-card>

          <p-card styleClass="border-0 shadow-sm">
            <h2 class="text-lg font-semibold">Acciones disponibles</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Puedes abrir el detalle para comentar, validar información, notificar que fue completado o seguir el historial. Desde aquí puedes cambiar el estado de tus reportes si siguen activos.
            </p>
          </p-card>
        </aside>
      </section>

      <p-dialog
        header="Cambiar estado"
        [(visible)]="statusDialogVisible"
        [modal]="true"
        [style]="{ width: 'min(520px, 94vw)' }"
        [draggable]="false"
      >
        @if (selectedReport(); as reporte) {
          <div class="grid gap-4">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Reporte</p>
              <p class="mt-1 font-semibold">{{ reporte.titulo }}</p>
              <p class="mt-2 text-sm text-slate-500">Estado actual: {{ reporte.nombreEstado }}</p>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Nuevo estado</span>
              <p-select class="w-full" [(ngModel)]="newStatusCode" [options]="availableStatusOptions(reporte)" optionLabel="nombre" optionValue="codigo" placeholder="Selecciona un estado"></p-select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Observación opcional</span>
              <textarea pTextarea class="w-full" rows="4" maxlength="500" [(ngModel)]="statusObservation" placeholder="Ej. Ya fue atendido parcialmente"></textarea>
              <small class="mt-2 block text-slate-500">{{ statusObservation.length }}/500</small>
            </label>
          </div>

          <ng-template pTemplate="footer">
            <button pButton severity="secondary" outlined label="Cancelar" (click)="statusDialogVisible = false"></button>
            <button pButton icon="pi pi-check" label="Guardar estado" [loading]="statusChanging()" [disabled]="!newStatusCode" (click)="changeStatus()"></button>
          </ng-template>
        }
      </p-dialog>
    </main>
  `,
})
export class MyReportsPageComponent implements OnInit {
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly catalogosService = inject(CatalogosService);
  private readonly messageService = inject(MessageService);

  readonly reportes = signal<Incidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  readonly categorias = signal<CategoriaIncidencia[]>([]);
  readonly loading = signal(false);
  readonly statusChanging = signal(false);
  readonly selectedReport = signal<Incidencia | null>(null);
  readonly openCount = computed(() => this.reportes().filter((reporte) => !this.isFinal(reporte)).length);
  readonly closedCount = computed(() => this.reportes().filter((reporte) => this.isFinal(reporte)).length);

  searchTerm = '';
  selectedStatus: string | null = null;
  selectedCategory: string | null = null;
  statusDialogVisible = false;
  newStatusCode: string | null = null;
  statusObservation = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    forkJoin({
      reportes: this.incidenciasService.listMine({ limit: 100, offset: 0 }),
      estados: this.catalogosService.estados$,
      categorias: this.catalogosService.categorias$,
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ reportes, estados, categorias }) => {
          this.reportes.set(reportes);
          this.estados.set(estados);
          this.categorias.set(categorias);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudieron cargar tus reportes',
            detail: 'Intenta nuevamente en unos segundos.',
          });
        },
      });
  }

  filteredReports(): Incidencia[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.reportes().filter((reporte) => {
      const matchesTerm =
        !term ||
        reporte.titulo.toLowerCase().includes(term) ||
        reporte.descripcion.toLowerCase().includes(term) ||
        reporte.nombreCategoria.toLowerCase().includes(term) ||
        (reporte.nombreSector ?? '').toLowerCase().includes(term) ||
        (reporte.direccionReferencial ?? '').toLowerCase().includes(term);
      const matchesStatus = !this.selectedStatus || reporte.codigoEstado === this.selectedStatus;
      const matchesCategory = !this.selectedCategory || reporte.idCategoria === this.selectedCategory;
      return matchesTerm && matchesStatus && matchesCategory;
    });
  }

  statusOptions(): EstadoIncidencia[] {
    const used = new Set(this.reportes().map((reporte) => reporte.codigoEstado));
    return this.estados().filter((estado) => used.has(estado.codigo));
  }

  categoryOptions(): CategoriaIncidencia[] {
    const used = new Set(this.reportes().map((reporte) => reporte.idCategoria));
    return this.categorias().filter((categoria) => used.has(categoria.idCategoria));
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedCategory = null;
  }

  openStatusDialog(reporte: Incidencia) {
    const options = this.availableStatusOptions(reporte);
    this.selectedReport.set(reporte);
    this.newStatusCode = options[0]?.codigo ?? null;
    this.statusObservation = '';
    this.statusDialogVisible = true;
  }

  availableStatusOptions(reporte: Incidencia): EstadoIncidencia[] {
    return citizenStatusOptions(this.estados(), reporte);
  }

  changeStatus() {
    const reporte = this.selectedReport();
    if (!reporte || !this.newStatusCode) {
      return;
    }

    this.statusChanging.set(true);
    this.incidenciasService
      .changeStatus(reporte.idIncidencia, this.newStatusCode, this.statusObservation, 'CIUDADANO')
      .pipe(finalize(() => this.statusChanging.set(false)))
      .subscribe({
        next: (updated) => {
          this.reportes.update((items) => items.map((item) => (item.idIncidencia === updated.idIncidencia ? updated : item)));
          this.statusDialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Estado actualizado',
            detail: 'El reporte quedó actualizado correctamente.',
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo cambiar el estado',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  isFinal(reporte: Incidencia): boolean {
    return isFinalCitizenIncident(reporte);
  }

  tagSeverity(codigoEstado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const value = codigoEstado.toUpperCase();
    if (value.includes('CERR') || value.includes('RESUEL')) {
      return 'success';
    }
    if (value.includes('PEND') || value.includes('REPORT') || value.includes('NUEVA')) {
      return 'warn';
    }
    if (value.includes('RECH') || value.includes('CANCEL')) {
      return 'danger';
    }
    return 'info';
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      return body?.message || 'Intenta nuevamente.';
    }
    return error instanceof Error ? error.message : 'Intenta nuevamente.';
  }
}
