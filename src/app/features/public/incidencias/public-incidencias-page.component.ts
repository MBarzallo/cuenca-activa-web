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
      <!-- HEADER BANNER: Clean and modern brand section -->
      <section class="mb-8 rounded-[30px] bg-white border border-slate-200/80 p-6 shadow-sm sm:p-8 relative overflow-hidden">
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--ca-teal)]/5 blur-3xl pointer-events-none"></div>
        <div class="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ca-teal)]">
              Reportes comunitarios
            </span>
            <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Incidencias públicas</h1>
            <p class="mt-2.5 max-w-3xl text-sm leading-relaxed text-slate-500">Revisa reportes publicados por la comunidad, conoce su estado de atención en tiempo real y abre los detalles para participar.</p>
          </div>
          <div class="flex flex-wrap gap-2.5">
            <a routerLink="/reportar" pButton icon="pi pi-plus-circle" label="Crear reporte" class="shadow-sm shadow-teal-500/10 hover:scale-102 transition-transform"></a>
            <a routerLink="/mapa" pButton severity="secondary" outlined icon="pi pi-map" label="Ver mapa" class="hover:bg-slate-50 transition-colors"></a>
          </div>
        </div>
      </section>

      <!-- METRIC STATS: High-end card indicators with hover elevations -->
      <section class="mb-8 grid gap-5 md:grid-cols-3">
        <p-card styleClass="ca-metric-card border border-slate-100 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Reportes visibles</p>
              <strong class="mt-2 block text-3xl font-black text-slate-800">{{ incidencias().length }}</strong>
            </div>
            <span class="ca-metric-icon bg-slate-900 text-white shadow-sm shadow-slate-900/10"><i class="pi pi-list text-lg"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card border border-slate-100 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Resultados filtrados</p>
              <strong class="mt-2 block text-3xl font-black text-[var(--ca-teal)]">{{ filteredIncidencias().length }}</strong>
            </div>
            <span class="ca-metric-icon bg-[var(--ca-teal)]/10 text-[var(--ca-teal)]"><i class="pi pi-filter text-lg"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card border border-slate-100 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Con actividad</p>
              <strong class="mt-2 block text-3xl font-black text-[var(--ca-gold)]">{{ activeCount() }}</strong>
            </div>
            <span class="ca-metric-icon bg-[var(--ca-gold)]/10 text-[var(--ca-gold)]"><i class="pi pi-comments text-lg"></i></span>
          </div>
        </p-card>
      </section>

      <!-- FILTER BOX: Clean layout with soft drop shadow -->
      <p-card styleClass="mb-8 border border-slate-200/80 shadow-sm">
        <div class="grid gap-5 lg:grid-cols-[1fr_300px_160px] lg:items-end">
          <label class="block">
            <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Buscar reporte</span>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search text-slate-400"></i>
              <input pInputText class="w-full" [(ngModel)]="searchTerm" placeholder="Título, sector o dirección" />
            </span>
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Filtrar por estado</span>
            <p-select class="w-full" [(ngModel)]="estadoSeleccionado" [options]="estados()" optionLabel="nombre" optionValue="codigo" placeholder="Todos los estados" [showClear]="true"></p-select>
          </label>
          <button pButton severity="secondary" outlined icon="pi pi-filter-slash" label="Limpiar" (click)="clearFilters()" class="w-full hover:bg-slate-50 transition-colors"></button>
        </div>
      </p-card>

      <!-- LISTING AREA: Grid with custom styled borderless table & sidebar prompts -->
      <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <p-card styleClass="overflow-hidden border border-slate-200/80 shadow-sm">
          <ng-template pTemplate="header">
            <div class="border-b border-slate-100 px-6 py-5">
              <h2 class="text-lg font-bold text-slate-800">Listado de reportes</h2>
              <p class="mt-1 text-sm text-slate-500">Haz clic en ver detalle para revisar comentarios, fotos y votar.</p>
            </div>
          </ng-template>
          
          <p-table [value]="filteredIncidencias()" [paginator]="true" [rows]="9" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table border-0">
            <ng-template pTemplate="header">
              <tr class="hidden lg:table-row">
                <th class="w-[50%]">Reporte</th>
                <th class="w-[18%]">Categoría</th>
                <th class="w-[14%]">Estado</th>
                <th class="w-[14%]">Sector</th>
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
        </p-card>

        <aside class="space-y-5">
          <!-- Location CTA Card -->
          <div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 to-[var(--ca-navy)] p-7 text-white shadow-md">
            <div class="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[var(--ca-gold)]/10 blur-3xl pointer-events-none"></div>
            <i class="pi pi-map text-2xl text-[var(--ca-gold)]"></i>
            <h2 class="mt-4 text-xl font-bold tracking-tight">Explora por ubicación</h2>
            <p class="mt-3 text-sm leading-relaxed text-slate-300">Usa el mapa interactivo para ver incidencias en tu vecindario o cercanas a tu ubicación actual.</p>
            <a routerLink="/mapa" class="mt-6 w-full justify-center p-button-raised hover:scale-[1.02] transition-transform" pButton icon="pi pi-arrow-right" label="Ver mapa"></a>
          </div>

          <!-- Participate CTA Card -->
          <p-card styleClass="border border-slate-200/80 shadow-sm">
            <i class="pi pi-users text-2xl text-[var(--ca-teal)]"></i>
            <h2 class="mt-4 text-lg font-bold text-slate-800">Participa del cambio</h2>
            <p class="mt-3 text-sm leading-relaxed text-slate-500">Desde tu cuenta ciudadana puedes reportar problemas, comentar con detalles o confirmar soluciones.</p>
            <a routerLink="/reportar" class="mt-6 w-full justify-center hover:scale-[1.02] transition-transform" pButton size="small" severity="secondary" outlined icon="pi pi-plus-circle" label="Crear reporte"></a>
          </p-card>
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
