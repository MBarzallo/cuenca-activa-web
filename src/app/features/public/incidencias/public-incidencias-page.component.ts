import { Component, OnInit, signal, computed, effect, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EstadoIncidencia } from '../../../core/models/catalogo.model';
import { Incidencia } from '../../../core/models/incidencia.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { IncidenciasService } from '../../../core/services/incidencias.service';

@Component({
  selector: 'app-public-incidencias-page',
  standalone: true,
  imports: [RouterLink, FormsModule, ButtonModule, CardModule, InputTextModule, SelectModule, TableModule, TagModule],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- PAGE HEADER: Light, semantic, and modern -->
      <header class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-teal)]">Reportes comunitarios</span>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 mt-1">Incidencias públicas</h1>
          <p class="mt-1 text-sm text-slate-500">Revisa reportes publicados por la comunidad, conoce su estado de atención en tiempo real y abre los detalles para participar.</p>
        </div>
        <div class="flex flex-wrap gap-2.5 shrink-0 sm:self-end">
          <a routerLink="/reportar" pButton icon="pi pi-plus-circle" label="Crear reporte" class="shadow-sm transition-all duration-200 hover:opacity-90"></a>
          <a routerLink="/mapa" pButton severity="secondary" outlined icon="pi pi-map" label="Ver mapa" class="hover:bg-slate-50 transition-all duration-200"></a>
        </div>
      </header>

      <!-- FILTER BAR: Compact and functional -->
      <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-[1fr_250px_120px] md:items-end">
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-slate-500">Buscar reporte</span>
            <span class="p-input-icon-left w-full block">
              <i class="pi pi-search text-slate-400"></i>
              <input pInputText class="w-full" [(ngModel)]="searchTerm" placeholder="Título, sector o dirección" />
            </span>
          </div>
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-slate-500">Filtrar por estado</span>
            <p-select class="w-full" [(ngModel)]="estadoSeleccionado" [options]="estados()" optionLabel="nombre" optionValue="codigo" placeholder="Todos los estados" [showClear]="true"></p-select>
          </div>
          <button pButton severity="secondary" outlined icon="pi pi-filter-slash" label="Limpiar" (click)="clearFilters()" class="w-full transition-colors hover:bg-slate-50"></button>
        </div>
      </div>

      <!-- LISTING AREA: Grid with custom styled borderless table & sidebar prompts -->
      <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="space-y-6">
          <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            @for (incidencia of paginatedIncidencias(); track incidencia.idIncidencia) {
              <article class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:shadow-md">
                <div class="space-y-3">
                  <!-- Header: Category & Status -->
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ca-teal)]">
                      {{ incidencia.nombreCategoria }}
                    </span>
                    <p-tag [value]="incidencia.nombreEstado" [severity]="tagSeverity(incidencia.codigoEstado)" styleClass="text-[9px] px-2 py-0.5 font-bold"></p-tag>
                  </div>

                  <!-- Content -->
                  <div>
                    <h3 class="font-bold text-slate-800 group-hover:text-[var(--ca-teal)] transition-colors line-clamp-1 leading-snug">
                      {{ incidencia.titulo }}
                    </h3>
                    <p class="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {{ incidencia.descripcion }}
                    </p>
                  </div>
                </div>

                <div class="mt-5 pt-4 border-t border-slate-100 space-y-3.5">
                  <!-- Metadata: Location -->
                  <div class="flex flex-col gap-1 text-[11px] text-slate-400">
                    <span class="flex items-center gap-1.5 min-w-0">
                      <i class="pi pi-map-marker text-[var(--ca-teal)] shrink-0"></i>
                      <span class="truncate font-semibold text-slate-500">{{ incidencia.nombreSector || incidencia.direccionReferencial || 'Cuenca' }}</span>
                    </span>
                  </div>

                  <!-- Footer actions and stats -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex gap-2.5 text-slate-400 text-[11px] font-bold">
                      <span class="flex items-center gap-1" title="Comentarios">
                        <i class="pi pi-comment"></i>
                        <span>{{ incidencia.cantidadComentarios }}</span>
                      </span>
                      <span class="flex items-center gap-1 text-emerald-600" title="Confirmaciones">
                        <i class="pi pi-check-circle"></i>
                        <span>{{ incidencia.cantidadConfirmaciones }}</span>
                      </span>
                    </div>

                    <a [routerLink]="['/incidencias', incidencia.idIncidencia]" pButton size="small" icon="pi pi-arrow-right" severity="secondary" label="Ver detalle" class="p-button-text p-0 text-xs font-bold hover:text-[var(--ca-teal)]"></a>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <i class="pi pi-inbox text-slate-300 text-4xl"></i>
                <p class="mt-3 font-bold text-slate-700">No se encontraron reportes</p>
                <p class="mt-1 text-xs text-slate-500">Prueba ajustando los filtros o buscando otro término.</p>
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

        <aside class="space-y-6">
          <!-- Location CTA Card: Light and clean -->
          <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
            <i class="pi pi-map text-xl text-[var(--ca-teal)]"></i>
            <h2 class="mt-3 text-base font-bold text-slate-800">Explora por ubicación</h2>
            <p class="mt-2 text-sm leading-relaxed text-slate-500">Usa el mapa interactivo para ver incidencias en tu vecindario o cercanas a tu ubicación actual.</p>
            <a routerLink="/mapa" class="mt-4 w-full justify-center hover:bg-slate-100 transition-colors" pButton severity="secondary" outlined icon="pi pi-arrow-right" label="Ver mapa"></a>
          </div>

          <!-- Participate CTA Card: Light and clean -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <i class="pi pi-users text-xl text-[var(--ca-teal)]"></i>
            <h2 class="mt-3 text-base font-bold text-slate-800">Participa del cambio</h2>
            <p class="mt-2 text-sm leading-relaxed text-slate-500">Desde tu cuenta ciudadana puedes reportar problemas, comentar con detalles o confirmar soluciones.</p>
            <a routerLink="/reportar" class="mt-4 w-full justify-center transition-all duration-200 hover:opacity-90" pButton icon="pi pi-plus-circle" label="Crear reporte"></a>
          </div>
        </aside>
      </section>
    </main>
  `,
})
export class PublicIncidenciasPageComponent implements OnInit {
  readonly incidencias = signal<Incidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  searchTerm = '';
  estadoSeleccionado: string | null = null;

  // Pagination properties
  readonly currentPage = signal(0);
  readonly pageSize = 9;

  readonly paginatedIncidencias = computed(() => {
    const list = this.filteredIncidencias();
    const start = this.currentPage() * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly totalPageCount = computed(() => {
    return Math.ceil(this.filteredIncidencias().length / this.pageSize);
  });

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly catalogosService: CatalogosService,
  ) {
    // Reset page to 0 when search term or filter changes
    effect(() => {
      this.filteredIncidencias();
      untracked(() => this.currentPage.set(0));
    });
  }

  ngOnInit() {
    this.incidenciasService.list({ limit: 100, offset: 0 }).subscribe((items) => this.incidencias.set(items));
    this.catalogosService.estados$.subscribe((estados) => this.estados.set(estados));
  }

  filteredIncidencias(): Incidencia[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.incidencias().filter((incidencia) => {
      const matchesText =
        !term ||
        incidencia.titulo.toLowerCase().includes(term) ||
        incidencia.descripcion.toLowerCase().includes(term) ||
        (incidencia.nombreSector ?? '').toLowerCase().includes(term) ||
        (incidencia.direccionReferencial ?? '').toLowerCase().includes(term);
      return matchesText && (!this.estadoSeleccionado || incidencia.codigoEstado === this.estadoSeleccionado);
    });
  }

  prevPage() {
    this.currentPage.update((p) => Math.max(0, p - 1));
  }

  nextPage() {
    this.currentPage.update((p) => Math.min(this.totalPageCount() - 1, p + 1));
  }

  activeCount(): number {
    return this.incidencias().filter((item) => item.cantidadComentarios > 0 || item.cantidadConfirmaciones > 0).length;
  }

  clearFilters() {
    this.searchTerm = '';
    this.estadoSeleccionado = null;
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
}
