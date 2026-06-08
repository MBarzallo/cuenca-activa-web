import { Component, OnInit, signal } from '@angular/core';
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
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-6 py-5">
            <h2 class="text-lg font-bold text-slate-800">Listado de reportes</h2>
            <p class="mt-1 text-sm text-slate-500">Haz clic en ver detalle para revisar comentarios, fotos y votar.</p>
          </div>
          
          <div class="p-1 sm:p-4">
            <p-table [value]="filteredIncidencias()" [paginator]="true" [rows]="10" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table border-0">
              <ng-template pTemplate="header">
                <tr class="hidden lg:table-row">
                  <th class="w-[50%]">Reporte</th>
                  <th class="w-[18%]">Categoría</th>
                  <th class="w-[14%] font-medium">Estado</th>
                  <th class="w-[14%] font-medium">Sector</th>
                  <th class="w-[4%]"></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-incidencia>
                <tr class="group hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-100/60">
                  <td class="py-4">
                    <div class="font-bold text-slate-800 group-hover:text-[var(--ca-teal)] transition-colors">{{ incidencia.titulo }}</div>
                    <div class="mt-1.5 line-clamp-1 max-w-xl text-sm text-slate-500">{{ incidencia.descripcion }}</div>
                  </td>
                  <td class="py-4 text-sm">
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {{ incidencia.nombreCategoria }}
                    </span>
                  </td>
                  <td class="py-4"><p-tag [value]="incidencia.nombreEstado" [severity]="tagSeverity(incidencia.codigoEstado)"></p-tag></td>
                  <td class="py-4 text-sm text-slate-500">
                    <span class="inline-flex items-center gap-1.5 truncate">
                      <i class="pi pi-map-marker text-xs shrink-0 text-slate-400"></i>
                      <span class="truncate">{{ incidencia.nombreSector || incidencia.direccionReferencial || 'Cuenca' }}</span>
                    </span>
                  </td>
                  <td class="py-4 text-right">
                    <a [routerLink]="['/incidencias', incidencia.idIncidencia]" pButton size="small" icon="pi pi-chevron-right" label="Ver" class="p-button-text p-button-rounded group-hover:translate-x-1 transition-all"></a>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
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

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly catalogosService: CatalogosService,
  ) {}

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
