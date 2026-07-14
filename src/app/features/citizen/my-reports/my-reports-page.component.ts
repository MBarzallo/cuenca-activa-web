import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal, effect, untracked } from '@angular/core';
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
    <main class="ca-page-shell">
      <!-- PAGE HEADER: Light and citizen-focused -->
      <header class="ca-page-header">
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
      <div class="ca-filter-panel mb-6">
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
        </div>
      </div>

      <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <!-- Unified Responsive Card Grid -->
        <div class="space-y-6">
          <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            @for (reporte of paginatedReports(); track reporte.idIncidencia) {
              <article class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:shadow-md">
                <div class="space-y-3">
                  <!-- Header: Category & Status -->
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ca-teal)]">
                      {{ reporte.nombreCategoria }}
                    </span>
                    <p-tag [value]="reporte.nombreEstado" [severity]="tagSeverity(reporte.codigoEstado)" styleClass="text-[9px] px-2 py-0.5 font-bold"></p-tag>
                  </div>

                  <!-- Content -->
                  <div>
                    <h3 class="font-bold text-slate-800 group-hover:text-[var(--ca-teal)] transition-colors line-clamp-1 leading-snug">
                      {{ reporte.titulo }}
                    </h3>
                    <p class="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {{ reporte.descripcion }}
                    </p>
                  </div>
                </div>

                <div class="mt-5 pt-4 border-t border-slate-100 space-y-3.5">
                  <!-- Metadata: Location & Date -->
                  <div class="flex flex-col gap-1 text-[11px] text-slate-400">
                    <span class="flex items-center gap-1.5 min-w-0">
                      <i class="pi pi-map-marker text-[var(--ca-teal)] shrink-0"></i>
                      <span class="truncate font-semibold text-slate-500">{{ reporte.nombreSector || reporte.direccionReferencial || 'Cuenca' }}</span>
                    </span>
                    <span class="text-[10px] text-slate-400 mt-0.5">Reportado el {{ reporte.fechaReporte | date:'dd MMM yyyy' }}</span>
                  </div>

                  <!-- Footer actions and stats -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex gap-2.5 text-slate-450 text-[11px] font-bold">
                      <span class="flex items-center gap-1" title="Comentarios">
                        <i class="pi pi-comment"></i>
                        <span>{{ reporte.cantidadComentarios }}</span>
                      </span>
                      <span class="flex items-center gap-1 text-emerald-600" title="Confirmaciones">
                        <i class="pi pi-check-circle"></i>
                        <span>{{ reporte.cantidadConfirmaciones }}</span>
                      </span>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <a [routerLink]="['/incidencias', reporte.idIncidencia]" pButton size="small" icon="pi pi-eye" severity="secondary" outlined class="h-7 w-7 p-0 flex items-center justify-center rounded-full" title="Ver detalle"></a>
                      <button pButton size="small" icon="pi pi-sync" [disabled]="isFinal(reporte) || availableStatusOptions(reporte).length === 0" (click)="openStatusDialog(reporte)" class="h-7 px-2.5 text-xs font-bold" label="Estado" title="Cambiar estado"></button>
                    </div>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="ca-empty-state col-span-full">
                <i class="pi pi-inbox text-slate-300 text-4xl"></i>
                <p class="mt-3 font-bold text-slate-700">No se encontraron reportes</p>
                <p class="mt-1 text-xs text-slate-500">Prueba ajustando los filtros o creando una incidencia.</p>
              </div>
            }
          </div>

          <!-- Pagination Controls -->
          @if (totalPageCount() > 1) {
            <div class="flex items-center justify-center gap-2 pt-4">
              <button pButton severity="secondary" outlined icon="pi pi-angle-left" [disabled]="currentPage() === 0" (click)="prevPage()"></button>
              <span class="text-xs font-bold text-slate-500 px-3">
                Página {{ currentPage() + 1 }} de {{ totalPageCount() }}
              </span>
              <button pButton severity="secondary" outlined icon="pi pi-angle-right" [disabled]="currentPage() >= totalPageCount() - 1" (click)="nextPage()"></button>
            </div>
          }
        </div>

        <!-- SIDEBAR -->
        <aside class="space-y-6">
          <!-- Report CTA: Light & bordered -->
          <div class="ca-panel bg-slate-50/70 p-6">
            <i class="pi pi-plus-circle text-xl text-[var(--ca-teal)]"></i>
            <h2 class="mt-3 text-base font-bold text-slate-800">Crear otro reporte</h2>
            <p class="mt-2 text-sm leading-relaxed text-slate-500">¿Identificaste otro problema en la ciudad? Reporta una nueva incidencia con ubicación y foto opcional.</p>
            <a routerLink="/reportar" class="mt-4 w-full justify-center transition-all duration-200" pButton icon="pi pi-arrow-right" label="Nuevo reporte"></a>
          </div>

          <!-- Actions Helper: Light & clean -->
          <div class="ca-panel p-6">
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

  // Pagination
  readonly currentPage = signal(0);
  readonly pageSize = 6;

  readonly paginatedReports = computed(() => {
    const list = this.filteredReports();
    const start = this.currentPage() * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly totalPageCount = computed(() => {
    return Math.ceil(this.filteredReports().length / this.pageSize);
  });

  constructor() {
    effect(() => {
      this.filteredReports();
      untracked(() => this.currentPage.set(0));
    });
  }

  prevPage() {
    this.currentPage.update((p) => Math.max(0, p - 1));
  }

  nextPage() {
    this.currentPage.update((p) => Math.min(this.totalPageCount() - 1, p + 1));
  }

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
