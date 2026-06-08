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
      <!-- PAGE HEADER: Light and citizen-focused -->
      <header class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-teal)]">Zona ciudadana</span>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 mt-1">Mis reportes</h1>
          <p class="mt-1 text-sm text-slate-500">Consulta el estado de las incidencias que has reportado y realiza actualizaciones de estado.</p>
        </div>
        <div class="flex flex-wrap gap-2.5 shrink-0 sm:self-end">
          <button pButton severity="secondary" outlined icon="pi pi-refresh" label="Actualizar" [loading]="loading()" (click)="load()" class="hover:bg-slate-50 transition-colors"></button>
          <a routerLink="/reportar" pButton icon="pi pi-plus-circle" label="Nuevo reporte" class="transition-all"></a>
        </div>
      </header>

      <!-- FILTER BAR: Compact and functional -->
      <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 sm:grid-cols-[1fr_200px_200px_120px] sm:items-end">
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-slate-500">Buscar reporte</span>
            <span class="p-input-icon-left w-full block">
              <i class="pi pi-search text-slate-400"></i>
              <input pInputText class="w-full" [(ngModel)]="searchTerm" placeholder="Título o descripción" />
            </span>
          </div>
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-slate-500">Filtrar por estado</span>
            <p-select class="w-full" [(ngModel)]="selectedStatus" [options]="statusOptions()" optionLabel="nombre" optionValue="codigo" placeholder="Todos" [showClear]="true"></p-select>
          </div>
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-slate-500">Categoría</span>
            <p-select class="w-full" [(ngModel)]="selectedCategory" [options]="categoryOptions()" optionLabel="nombre" optionValue="idCategoria" placeholder="Todas" [showClear]="true"></p-select>
          </div>
          <button pButton severity="secondary" outlined icon="pi pi-filter-slash" label="Limpiar" (click)="clearFilters()" class="w-full hover:bg-slate-50 transition-colors"></button>
        </div>
      </div>

      <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <!-- TABLE VIEW -->
        <div class="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-6 py-5">
            <h2 class="text-lg font-bold text-slate-800">Listado de reportes</h2>
            <p class="mt-1 text-sm text-slate-500">Accede al detalle o actualiza el estado si el reporte sigue activo.</p>
          </div>

          <div class="p-4">
            <p-table [value]="filteredReports()" [paginator]="true" [rows]="10" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table border-0">
              <ng-template pTemplate="header">
                <tr class="hidden lg:table-row">
                  <th>Reporte</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Actividad</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-reporte>
                <tr class="group hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-100/60">
                  <td class="py-4">
                    <div class="max-w-md">
                      <div class="font-bold text-slate-800 group-hover:text-[var(--ca-teal)] transition-colors">{{ reporte.titulo }}</div>
                      <div class="mt-1 line-clamp-1 text-sm text-slate-500">{{ reporte.descripcion }}</div>
                      <div class="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                        <i class="pi pi-map-marker"></i>
                        <span>{{ reporte.nombreSector || reporte.direccionReferencial || 'Cuenca' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 text-sm">{{ reporte.nombreCategoria }}</td>
                  <td class="py-4"><p-tag [value]="reporte.nombreEstado" [severity]="tagSeverity(reporte.codigoEstado)"></p-tag></td>
                  <td class="py-4">
                    <div class="flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                      <span class="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-slate-600"><i class="pi pi-check-circle text-[10px]"></i> {{ reporte.cantidadValidaciones }}</span>
                      <span class="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-slate-600"><i class="pi pi-comments text-[10px]"></i> {{ reporte.cantidadComentarios }}</span>
                    </div>
                  </td>
                  <td class="py-4 text-sm text-slate-500">{{ reporte.fechaReporte | date:'dd MMM yyyy' }}</td>
                  <td class="py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <a [routerLink]="['/incidencias', reporte.idIncidencia]" pButton size="small" severity="secondary" outlined icon="pi pi-eye" label="Detalle" class="px-3 hover:bg-slate-50 transition-colors"></a>
                      <button pButton size="small" icon="pi pi-sync" label="Estado" [disabled]="isFinal(reporte) || availableStatusOptions(reporte).length === 0" (click)="openStatusDialog(reporte)" class="px-3"></button>
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6">
                    <div class="p-8 text-center text-slate-400 font-medium">No hay reportes que coincidan con los filtros.</div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>

        <!-- MOBILE VIEW -->
        <section class="grid gap-4 md:hidden">
          @for (reporte of filteredReports(); track reporte.idIncidencia) {
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="font-bold text-slate-800 line-clamp-2">{{ reporte.titulo }}</h2>
                  <p class="mt-1 text-xs text-slate-400 font-semibold">{{ reporte.nombreCategoria }}</p>
                </div>
                <p-tag [value]="reporte.nombreEstado" [severity]="tagSeverity(reporte.codigoEstado)"></p-tag>
              </div>
              <p class="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{{ reporte.descripcion }}</p>
              <div class="mt-3.5 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span class="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600"><i class="pi pi-comments text-[9px]"></i> {{ reporte.cantidadComentarios }} com.</span>
                <span class="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600"><i class="pi pi-check-circle text-[9px]"></i> {{ reporte.cantidadValidaciones }} val.</span>
                <span class="ml-auto text-slate-400 font-normal">{{ reporte.fechaReporte | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="mt-4 flex gap-2">
                <a [routerLink]="['/incidencias', reporte.idIncidencia]" class="flex-1 justify-center hover:bg-slate-50 transition-colors" pButton size="small" severity="secondary" outlined icon="pi pi-eye" label="Detalle"></a>
                <button pButton class="flex-1 justify-center" size="small" icon="pi pi-sync" label="Estado" [disabled]="isFinal(reporte) || availableStatusOptions(reporte).length === 0" (click)="openStatusDialog(reporte)"></button>
              </div>
            </article>
          } @empty {
            <div class="rounded-2xl border border-dashed border-slate-350 bg-white p-8 text-center text-slate-400 font-medium">No hay reportes que coincidan con los filtros.</div>
          }
        </section>

        <!-- SIDEBAR -->
        <aside class="space-y-6">
          <!-- Report CTA: Light & bordered -->
          <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
            <i class="pi pi-plus-circle text-xl text-[var(--ca-teal)]"></i>
            <h2 class="mt-3 text-base font-bold text-slate-800">Crear otro reporte</h2>
            <p class="mt-2 text-sm leading-relaxed text-slate-500">¿Identificaste otro problema en la ciudad? Reporta una nueva incidencia con ubicación y foto opcional.</p>
            <a routerLink="/reportar" class="mt-4 w-full justify-center transition-all duration-200" pButton icon="pi pi-arrow-right" label="Nuevo reporte"></a>
          </div>

          <!-- Actions Helper: Light & clean -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-base font-bold text-slate-800">Acciones ciudadanas</h2>
            <p class="mt-2 text-sm leading-relaxed text-slate-500">
              Desde el panel de detalles puedes responder a comentarios, validar que la solución sea la correcta o invitar a otros vecinos a votar por la incidencia. Puedes modificar el estado a "Resuelto por la comunidad" cuando corresponda.
            </p>
          </div>
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
            <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">Reporte</p>
              <p class="mt-1 font-bold text-slate-800">{{ reporte.titulo }}</p>
              <p class="mt-2 text-xs text-slate-500 font-semibold">Estado actual: {{ reporte.nombreEstado }}</p>
            </div>

            <label class="block">
              <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nuevo estado</span>
              <p-select class="w-full" [(ngModel)]="newStatusCode" [options]="availableStatusOptions(reporte)" optionLabel="nombre" optionValue="codigo" placeholder="Selecciona un estado"></p-select>
            </label>

            <label class="block">
              <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Observación opcional</span>
              <textarea pTextarea class="w-full" rows="4" maxlength="500" [(ngModel)]="statusObservation" placeholder="Ej. Ya fue atendido por el barrio..."></textarea>
              <small class="mt-1.5 block text-right text-xs text-slate-400">{{ statusObservation.length }}/500</small>
            </label>
          </div>

          <ng-template pTemplate="footer">
            <button pButton severity="secondary" outlined label="Cancelar" (click)="statusDialogVisible = false" class="hover:bg-slate-50 transition-colors"></button>
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
