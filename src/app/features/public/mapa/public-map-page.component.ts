import { AfterViewInit, Component, OnDestroy, OnInit, signal } from '@angular/core';
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
    <main class="h-[calc(100vh-73px)] min-h-[760px] p-4 lg:h-screen lg:min-h-0 lg:p-5">
      <section class="grid h-full gap-4 xl:grid-cols-[360px_1fr]">
        <aside class="flex min-h-0 flex-col gap-4">
          <p-card styleClass="border-0 shadow-sm">
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-teal)]">Mapa ciudadano</p>
            <h1 class="mt-2 text-2xl font-semibold">Explora incidencias</h1>
            <p class="mt-2 text-sm leading-6 text-slate-600">Filtra reportes y revisa qué ocurre en diferentes sectores de Cuenca.</p>
          </p-card>

          <p-card styleClass="border-0 shadow-sm">
            <div class="space-y-4">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar</span>
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-search"></i>
                  <input pInputText class="w-full" [(ngModel)]="searchTerm" (ngModelChange)="refreshMap()" placeholder="Título, sector o dirección" />
                </span>
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Categoría</span>
                <p-select class="w-full" [(ngModel)]="categoriaSeleccionada" (ngModelChange)="refreshMap()" [options]="categorias()" optionLabel="nombre" optionValue="codigo" [showClear]="true" placeholder="Todas"></p-select>
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
                <p-select class="w-full" [(ngModel)]="estadoSeleccionado" (ngModelChange)="refreshMap()" [options]="estados()" optionLabel="nombre" optionValue="codigo" [showClear]="true" placeholder="Todos"></p-select>
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Sector</span>
                <p-select class="w-full" [(ngModel)]="sectorSeleccionado" (ngModelChange)="refreshMap()" [options]="sectores()" [showClear]="true" placeholder="Todos"></p-select>
              </label>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex items-start gap-3">
                  <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--ca-teal)]/10 text-[var(--ca-teal)]">
                    <i class="pi pi-compass"></i>
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-[var(--ca-navy)]">Incidencias cercanas</p>
                    <p class="mt-1 text-sm leading-5 text-slate-500">Usa tu ubicación para ver reportes dentro del radio elegido.</p>
                  </div>
                </div>
                <label class="mt-4 block">
                  <span class="mb-2 block text-sm font-semibold text-slate-700">Radio</span>
                  <p-select
                    class="w-full"
                    [(ngModel)]="nearbyRadiusKm"
                    [options]="nearbyRadiusOptions"
                    optionLabel="label"
                    optionValue="value"
                    [disabled]="locating()"
                  ></p-select>
                </label>
                <div class="mt-4 grid gap-2">
                  <button
                    pButton
                    icon="pi pi-location-arrow"
                    label="Ver cerca de mí"
                    class="w-full justify-center"
                    [loading]="locating()"
                    (click)="loadNearby()"
                  ></button>
                  @if (nearbyMode()) {
                    <button pButton severity="secondary" outlined icon="pi pi-map" label="Mostrar todo Cuenca" class="w-full justify-center" (click)="showAll()"></button>
                  }
                </div>
              </div>
              <button pButton severity="secondary" outlined icon="pi pi-filter-slash" label="Limpiar filtros" class="w-full justify-center" (click)="clearFilters()"></button>
            </div>
          </p-card>

          <p-card styleClass="min-h-0 flex-1 overflow-hidden border-0 shadow-sm">
            <ng-template pTemplate="header">
              <div class="border-b border-slate-100 px-5 py-4">
              <h2 class="text-lg font-semibold">Resultados</h2>
                <p class="mt-1 text-sm text-slate-500">
                  {{ filteredIncidencias().length }} incidencias encontradas
                  @if (nearbyMode()) {
                    <span>cerca de ti</span>
                  }
                </p>
              </div>
            </ng-template>
            <div class="max-h-[360px] space-y-3 overflow-auto pr-1 xl:max-h-[calc(100vh-520px)]">
              @for (incidencia of filteredIncidencias(); track incidencia.idIncidencia) {
                <button type="button" class="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[var(--ca-teal)] hover:bg-slate-50" (click)="selectIncidencia(incidencia)">
                  <span class="block font-semibold">{{ incidencia.titulo }}</span>
                  <span class="mt-1 block text-sm text-slate-500">{{ incidencia.nombreSector || incidencia.direccionReferencial || 'Cuenca' }}</span>
                  <span class="mt-3 flex flex-wrap items-center gap-2">
                    <p-tag [value]="incidencia.nombreEstado" severity="info"></p-tag>
                    @if (distanceLabel(incidencia); as distance) {
                      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{{ distance }}</span>
                    }
                  </span>
                </button>
              } @empty {
                <p class="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No encontramos incidencias con esos filtros.</p>
              }
            </div>
          </p-card>
        </aside>

        <section class="relative min-h-[520px] overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
          <div id="citizen-map" class="h-full min-h-[520px] w-full"></div>

          @if (selected(); as item) {
            <div class="absolute bottom-4 left-4 right-4 z-[500] max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-900/15 backdrop-blur">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-[var(--ca-teal)]">{{ item.nombreCategoria }}</p>
                  <h2 class="mt-1 text-lg font-semibold">{{ item.titulo }}</h2>
                  <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{{ item.descripcion }}</p>
                </div>
                <p-tag [value]="item.nombreEstado" severity="info"></p-tag>
              </div>
              <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span class="text-sm text-slate-500">
                  {{ item.nombreSector || item.direccionReferencial || 'Cuenca' }}
                  @if (distanceLabel(item); as distance) {
                    <span class="ml-2 font-semibold text-[var(--ca-teal)]">{{ distance }}</span>
                  }
                </span>
                <a [routerLink]="['/incidencias', item.idIncidencia]" pButton size="small" icon="pi pi-eye" label="Ver detalle"></a>
              </div>
            </div>
          }
        </section>
      </section>
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

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly catalogosService: CatalogosService,
    private readonly messages: MessageService,
  ) {}

  ngOnInit() {
    this.incidenciasService.list({ limit: 150, offset: 0 }).subscribe((items) => {
      this.incidencias.set(items);
      this.refreshMap();
    });
    this.catalogosService.categorias$.subscribe((items) => this.categorias.set(items));
    this.catalogosService.estados$.subscribe((items) => this.estados.set(items));
  }

  ngAfterViewInit() {
    this.map = L.map('citizen-map').setView([-2.9006, -79.0045], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
    this.markers.addTo(this.map);
    this.refreshMap();
  }

  ngOnDestroy() {
    this.map?.remove();
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
