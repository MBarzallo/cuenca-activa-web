import { AfterViewInit, Component, OnDestroy, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import * as L from 'leaflet';
import { CategoriaIncidencia, EstadoIncidencia } from '../../../core/models/catalogo.model';
import { Incidencia, IncidenciaCercana } from '../../../core/models/incidencia.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { IncidenciasService } from '../../../core/services/incidencias.service';

@Component({
  selector: 'app-public-map-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonModule, CardModule, InputTextModule, SelectModule, TagModule],
  template: `
    <main class="h-[calc(100vh-125px)] min-h-[450px] xl:h-screen xl:min-h-0 p-4 xl:p-5">
      <div class="relative flex h-full overflow-hidden w-full min-h-0">
        <!-- BACKDROP OVERLAY FOR MOBILE -->
        @if (isMobile() && mobileFiltersOpen()) {
          <div class="fixed inset-0 z-[1020] bg-slate-900/40 backdrop-blur-xs xl:hidden" (click)="closeMobileFilters()"></div>
        }

        <!-- SIDEBAR (ADAPTIVE: DRAWER ON MOBILE, STATIC SIDEBAR ON DESKTOP) -->
        <aside 
          [class.translate-x-0]="!isMobile() && !collapsed() || isMobile() && mobileFiltersOpen()"
          [class.translate-x-[-100%]]="isMobile() && !mobileFiltersOpen()"
          [class.xl:w-[360px]]="!collapsed()"
          [class.xl:w-0]="collapsed()"
          [class.xl:mr-4]="!collapsed()"
          [class.xl:mr-0]="collapsed()"
          [class.xl:opacity-100]="!collapsed()"
          [class.xl:opacity-0]="collapsed()"
          [class.xl:pointer-events-none]="collapsed()"
          [class.overflow-hidden]="collapsed()"
          class="fixed inset-y-0 left-0 z-[1030] w-80 max-w-[calc(100vw-3rem)] transform bg-white p-5 shadow-2xl transition-all duration-300 ease-in-out xl:static xl:z-auto xl:max-w-none xl:bg-transparent xl:p-0 xl:shadow-none xl:translate-x-0 flex flex-col gap-4 overflow-y-auto max-h-full xl:pr-1 min-h-0 shrink-0"
        >
          <!-- Mobile Drawer Header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-1 xl:hidden shrink-0">
            <div class="flex items-center gap-2">
              <i class="pi pi-filter text-[var(--ca-teal)] font-bold text-lg"></i>
              <span class="font-bold text-slate-800 text-base">Filtros y Resultados</span>
            </div>
            <button pButton size="small" severity="secondary" rounded [outlined]="true" icon="pi pi-times" (click)="closeMobileFilters()"></button>
          </div>

          <!-- Filters Card -->
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-start justify-between gap-2">
              <div>
                <h1 class="text-xl font-bold tracking-tight text-[var(--ca-navy)]">Explorar incidencias</h1>
                <p class="text-xs text-slate-500 font-medium">Busca y filtra reportes en Cuenca.</p>
              </div>
              <button 
                (click)="toggleSidebar()" 
                class="hidden xl:flex h-8 w-8 items-center justify-center rounded-full border border-slate-150 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-[var(--ca-teal)] cursor-pointer shadow-xs shrink-0"
                title="Ocultar filtros"
              >
                <i class="pi pi-chevron-left text-xs font-bold"></i>
              </button>
            </div>

            <div class="space-y-4">
              <label class="block">
                <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Buscar</span>
                <span class="p-input-icon-left w-full block">
                  <i class="pi pi-search text-slate-400"></i>
                  <input pInputText class="w-full" [(ngModel)]="searchTerm" (ngModelChange)="refreshMap()" placeholder="Título, sector o dirección" />
                </span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</span>
                  <p-select class="w-full" [(ngModel)]="categoriaSeleccionada" (ngModelChange)="refreshMap()" [options]="categorias()" optionLabel="nombre" optionValue="codigo" [showClear]="true" placeholder="Todas"></p-select>
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Estado</span>
                  <p-select class="w-full" [(ngModel)]="estadoSeleccionado" (ngModelChange)="refreshMap()" [options]="estados()" optionLabel="nombre" optionValue="codigo" [showClear]="true" placeholder="Todos"></p-select>
                </label>
              </div>
              <label class="block">
                <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Sector</span>
                <p-select class="w-full" [(ngModel)]="sectorSeleccionado" (ngModelChange)="refreshMap()" [options]="sectores()" [showClear]="true" placeholder="Todos"></p-select>
              </label>
              <div class="rounded-xl border border-slate-150 bg-slate-50 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-compass text-[var(--ca-teal)]"></i>
                    <span class="text-xs font-bold text-[var(--ca-navy)]">Cerca de mí</span>
                  </div>
                  <p-select
                    class="w-24"
                    [(ngModel)]="nearbyRadiusKm"
                    [options]="nearbyRadiusOptions"
                    optionLabel="label"
                    optionValue="value"
                    [disabled]="locating()"
                  ></p-select>
                </div>
                <div class="mt-3 flex gap-2">
                  <button
                    pButton
                    icon="pi pi-location-arrow"
                    label="Buscar cerca"
                    class="w-full justify-center text-xs"
                    [loading]="locating()"
                    (click)="loadNearby()"
                  ></button>
                  @if (nearbyMode()) {
                    <button pButton severity="secondary" outlined icon="pi pi-map" label="Ver todo" class="w-full justify-center text-xs" (click)="showAll()"></button>
                  }
                </div>
              </div>
              <button pButton severity="secondary" outlined icon="pi pi-filter-slash" label="Limpiar filtros" class="w-full justify-center transition-colors hover:bg-slate-50" (click)="clearFilters()"></button>
            </div>
          </div>

          <!-- Results Card -->
          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-0">
            <div class="border-b border-slate-100 px-5 py-4">
              <h2 class="text-base font-bold text-slate-800">Resultados</h2>
              <p class="mt-1 text-xs text-slate-500">
                {{ filteredIncidencias().length }} incidencias encontradas
                @if (nearbyMode()) {
                  <span>cerca de ti</span>
                }
              </p>
            </div>
            
            <div class="p-4 space-y-3 overflow-y-auto max-h-[340px] xl:max-h-[calc(100vh-560px)]">
              @for (incidencia of filteredIncidencias(); track incidencia.idIncidencia) {
                <button type="button" class="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[var(--ca-teal)] hover:bg-slate-50/50 cursor-pointer block" (click)="selectIncidencia(incidencia)">
                  <span class="block font-bold text-slate-850 text-sm">{{ incidencia.titulo }}</span>
                  <span class="mt-1 block text-xs text-slate-400 font-medium flex items-center gap-1">
                    <i class="pi pi-map-marker text-[10px]"></i>
                    <span>{{ incidencia.nombreSector || incidencia.direccionReferencial || 'Cuenca' }}</span>
                  </span>
                  <span class="mt-3 flex flex-wrap items-center gap-2">
                    <p-tag [value]="incidencia.nombreEstado" severity="info"></p-tag>
                    @if (distanceLabel(incidencia); as distance) {
                      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{{ distance }}</span>
                    }
                  </span>
                </button>
              } @empty {
                <p class="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 font-medium bg-slate-50/50">No encontramos incidencias con esos filtros.</p>
              }
            </div>
          </div>
        </aside>

        <!-- MAP CONTAINER -->
        <section class="relative flex-1 min-h-[520px] overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
          <div id="citizen-map" class="h-full min-h-[520px] w-full"></div>

          <!-- Floating Button to Open Filters on Desktop -->
          @if (collapsed()) {
            <button 
              (click)="toggleSidebar()" 
              class="absolute top-4 left-4 z-[1005] hidden xl:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[var(--ca-teal)] cursor-pointer"
              title="Mostrar filtros y resultados"
            >
              <i class="pi pi-filter text-[var(--ca-teal)]"></i>
              <span>Mostrar filtros</span>
            </button>
          }

          <!-- Floating Button to Open Filters on Mobile -->
          <button 
            pButton 
            severity="primary" 
            rounded
            icon="pi pi-filter" 
            label="Filtros"
            (click)="openMobileFilters()" 
            class="absolute top-4 left-4 z-[1005] shadow-lg xl:hidden bg-[var(--ca-teal)] border-[var(--ca-teal)] hover:bg-[var(--ca-teal-dark)]"
          ></button>

          @if (selected(); as item) {
            <div class="absolute bottom-4 left-4 right-4 z-[1005] max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-900/15 backdrop-blur">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wider text-[var(--ca-teal)]">{{ item.nombreCategoria }}</p>
                  <h2 class="mt-1.5 text-base font-bold text-slate-800">{{ item.titulo }}</h2>
                  <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{{ item.descripcion }}</p>
                </div>
                <p-tag [value]="item.nombreEstado" severity="info"></p-tag>
              </div>
              <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span class="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <i class="pi pi-map-marker text-slate-400"></i>
                  <span>{{ item.nombreSector || item.direccionReferencial || 'Cuenca' }}</span>
                  @if (distanceLabel(item); as distance) {
                    <span class="ml-1 font-bold text-[var(--ca-teal)]">({{ distance }})</span>
                  }
                </span>
                <a [routerLink]="['/incidencias', item.idIncidencia]" pButton size="small" icon="pi pi-eye" label="Ver detalle" class="text-xs"></a>
              </div>
            </div>
          }
        </section>
      </div>
    </main>
  `,
})
export class PublicMapPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly incidencias = signal<Incidencia[]>([]);
  readonly nearbyIncidencias = signal<IncidenciaCercana[]>([]);
  readonly categorias = signal<CategoriaIncidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  readonly selected = signal<Incidencia | null>(null);
  readonly nearbyMode = signal(false);
  readonly locating = signal(false);
  searchTerm = '';
  categoriaSeleccionada: string | null = null;
  estadoSeleccionado: string | null = null;
  sectorSeleccionado: string | null = null;
  nearbyRadiusKm = 2;
  readonly nearbyRadiusOptions = [
    { label: '1 km', value: 1 },
    { label: '2 km', value: 2 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
  ];
  private map: L.Map | null = null;
  private markers = L.layerGroup();
  private userMarker: L.Marker | null = null;
  private userCircle: L.Circle | null = null;

  readonly collapsed = signal(false);
  readonly mobileFiltersOpen = signal(false);
  readonly isMobile = signal(false);

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly catalogosService: CatalogosService,
    private readonly messages: MessageService,
  ) {}

  ngOnInit() {
    const saved = localStorage.getItem('ca-map-sidebar-collapsed');
    this.collapsed.set(saved === 'true');
    this.checkViewport();

    this.incidenciasService.list({ limit: 150, offset: 0 }).subscribe((items) => {
      this.incidencias.set(items);
      this.refreshMap();
    });
    this.catalogosService.categorias$.subscribe((items) => this.categorias.set(items));
    this.catalogosService.estados$.subscribe((items) => this.estados.set(items));
  }

  ngAfterViewInit() {
    this.map = L.map('citizen-map', { zoomControl: false }).setView([-2.9006, -79.0045], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    this.markers.addTo(this.map);
    this.refreshMap();
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  toggleSidebar() {
    this.collapsed.set(!this.collapsed());
    localStorage.setItem('ca-map-sidebar-collapsed', String(this.collapsed()));
    
    // Trigger size invalidation multiple times during transition
    const steps = [100, 200, 300];
    steps.forEach((delay) => {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize({ animate: true });
        }
      }, delay);
    });
  }

  openMobileFilters() {
    this.mobileFiltersOpen.set(true);
  }

  closeMobileFilters() {
    this.mobileFiltersOpen.set(false);
  }

  private checkViewport() {
    const mobile = window.innerWidth < 1280; // xl threshold
    this.isMobile.set(mobile);
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  sectores(): string[] {
    return Array.from(
      new Set(this.baseIncidencias().map((item) => item.nombreSector || item.direccionReferencial).filter((value): value is string => !!value)),
    ).sort();
  }

  filteredIncidencias(): (Incidencia | IncidenciaCercana)[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.baseIncidencias().filter((item) => {
      const textMatches =
        !term ||
        item.titulo.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term) ||
        (item.nombreSector ?? '').toLowerCase().includes(term) ||
        (item.direccionReferencial ?? '').toLowerCase().includes(term);
      return (
        textMatches &&
        (!this.categoriaSeleccionada || item.codigoCategoria === this.categoriaSeleccionada) &&
        (!this.estadoSeleccionado || item.codigoEstado === this.estadoSeleccionado) &&
        (!this.sectorSeleccionado || item.nombreSector === this.sectorSeleccionado || item.direccionReferencial === this.sectorSeleccionado)
      );
    });
  }

  selectIncidencia(incidencia: Incidencia | IncidenciaCercana) {
    this.selected.set(incidencia);
    this.map?.setView([incidencia.latitud, incidencia.longitud], 16);
  }

  clearFilters() {
    this.searchTerm = '';
    this.categoriaSeleccionada = null;
    this.estadoSeleccionado = null;
    this.sectorSeleccionado = null;
    this.refreshMap();
  }

  loadNearby() {
    if (!navigator.geolocation) {
      this.messages.add({
        severity: 'warn',
        summary: 'Ubicación no disponible',
        detail: 'Tu navegador no permite consultar la ubicación desde esta pantalla.',
      });
      return;
    }

    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitud = coords.latitude;
        const longitud = coords.longitude;
        const radioMetros = this.nearbyRadiusKm * 1000;
        this.setUserLocation(latitud, longitud, radioMetros);
        this.incidenciasService.listNearby(latitud, longitud, radioMetros, 80, 0).subscribe({
          next: (items) => {
            this.nearbyIncidencias.set(items);
            this.nearbyMode.set(true);
            this.selected.set(items[0] ?? null);
            this.refreshMap(true);
            this.locating.set(false);
          },
          error: () => {
            this.locating.set(false);
            this.messages.add({
              severity: 'error',
              summary: 'No se pudieron cargar incidencias cercanas',
              detail: 'Intenta nuevamente en unos segundos.',
            });
          },
        });
      },
      () => {
        this.locating.set(false);
        this.messages.add({
          severity: 'warn',
          summary: 'Permiso de ubicación bloqueado',
          detail: 'Activa la ubicación del navegador para buscar reportes cercanos a ti.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  showAll() {
    this.nearbyMode.set(false);
    this.nearbyIncidencias.set([]);
    this.selected.set(null);
    this.userMarker?.remove();
    this.userCircle?.remove();
    this.userMarker = null;
    this.userCircle = null;
    this.refreshMap(true);
  }

  distanceLabel(incidencia: Incidencia | IncidenciaCercana): string | null {
    if (!('distanciaMetros' in incidencia) || incidencia.distanciaMetros === null || incidencia.distanciaMetros === undefined) {
      return null;
    }
    if (incidencia.distanciaMetros < 1000) {
      return `${Math.round(incidencia.distanciaMetros)} m`;
    }
    return `${(incidencia.distanciaMetros / 1000).toFixed(1)} km`;
  }

  refreshMap(fit = false) {
    if (!this.map) {
      return;
    }
    this.markers.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    this.filteredIncidencias().forEach((incidencia) => {
      if (Number.isFinite(incidencia.latitud) && Number.isFinite(incidencia.longitud)) {
        bounds.push([incidencia.latitud, incidencia.longitud]);
        L.marker([incidencia.latitud, incidencia.longitud], { icon: this.getMarkerIcon(incidencia.codigoEstado) })
          .on('click', () => this.selected.set(incidencia))
          .bindPopup(`<strong>${incidencia.titulo}</strong><br>${incidencia.nombreEstado}`)
          .addTo(this.markers);
      }
    });
    if (fit && bounds.length > 0) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [42, 42], maxZoom: 15 });
    }
  }

  private baseIncidencias(): (Incidencia | IncidenciaCercana)[] {
    return this.nearbyMode() ? this.nearbyIncidencias() : this.incidencias();
  }

  private setUserLocation(latitud: number, longitud: number, radioMetros: number) {
    if (!this.map) {
      return;
    }
    const position: L.LatLngExpression = [latitud, longitud];
    if (!this.userMarker) {
      this.userMarker = L.marker(position, { icon: this.getUserLocationIcon() }).addTo(this.map).bindPopup('Tu ubicación aproximada');
    } else {
      this.userMarker.setLatLng(position);
    }

    if (!this.userCircle) {
      this.userCircle = L.circle(position, {
        radius: radioMetros,
        color: '#14B8A6',
        fillColor: '#14B8A6',
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(this.map);
    } else {
      this.userCircle.setLatLng(position);
      this.userCircle.setRadius(radioMetros);
    }
  }

  private getMarkerIcon(codigoEstado: string): L.DivIcon {
    const status = (codigoEstado || '').toUpperCase();
    let color = '#64748B'; // slate
    if (status.includes('PEND') || status.includes('REPORT') || status.includes('NUEV')) {
      color = '#D4A937'; // gold
    } else if (status.includes('PROC') || status.includes('ATENC')) {
      color = '#14B8A6'; // teal
    } else if (status.includes('CERR') || status.includes('RESUEL') || status.includes('COMPL')) {
      color = '#10B981'; // green
    } else if (status.includes('RECH') || status.includes('CANC')) {
      color = '#EF4444'; // red
    }

    const svg = `
      <div class="relative flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8 filter drop-shadow-md">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
        <span class="absolute top-[8px] w-2 h-2 bg-white rounded-full"></span>
      </div>
    `;
    return L.divIcon({
      html: svg,
      className: 'custom-status-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  private getUserLocationIcon(): L.DivIcon {
    const html = `
      <div class="relative flex items-center justify-center h-6 w-6">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border-2 border-white shadow-md"></span>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'user-location-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }
}
