import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ImagenModeracionService } from '../../core/services/imagen-moderacion.service';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { AdminImagenModeracion } from '../../core/models/admin-imagen-moderacion.model';

@Component({
  selector: 'app-imagen-moderacion-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    SelectModule,
    ButtonModule,
    TagModule,
    ToastModule,
    InputTextModule,
  ],
  providers: [MessageService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>

      <!-- Encabezado del Módulo -->
      <section class="rounded-[28px] bg-[var(--ca-navy)] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Administración</p>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Moderación de Imágenes</h2>
        <p class="mt-3 max-w-3xl leading-7 text-slate-300">
          Revisa y gestiona de forma manual los archivos multimedia del sistema que requieren atención o han sido moderados por Google Cloud Vision.
        </p>
      </section>

      <!-- Panel de Filtros -->
      <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div class="mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Buscar -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Buscar incidencia / motivo</label>
              <span class="p-input-icon-left w-full block">
                <i class="pi pi-search text-slate-400"></i>
                <input 
                  pInputText 
                  class="w-full" 
                  [ngModel]="searchTerm()" 
                  (ngModelChange)="searchTerm.set($event)" 
                  placeholder="ID, incidencia, motivo..." 
                />
              </span>
            </div>

            <!-- Estado de revisión -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Estado de Revisión</label>
              <p-select 
                [options]="estadosOptions" 
                [ngModel]="filterEstado" 
                (ngModelChange)="onFilterEstadoChange($event)" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Filtrar por estado" 
                styleClass="w-full"
              ></p-select>
            </div>

            <!-- Fecha Desde -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Fecha Desde</label>
              <input 
                type="date" 
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[var(--ca-teal)] transition" 
                [ngModel]="filterFechaDesde()" 
                (ngModelChange)="filterFechaDesde.set($event)" 
              />
            </div>

            <!-- Fecha Hasta -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Fecha Hasta</label>
              <input 
                type="date" 
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[var(--ca-teal)] transition" 
                [ngModel]="filterFechaHasta()" 
                (ngModelChange)="filterFechaHasta.set($event)" 
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button 
              (click)="clearFilters()" 
              class="rounded-xl border border-slate-250 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition cursor-pointer flex items-center gap-1.5"
            >
              <i class="pi pi-filter-slash"></i>
              <span>Limpiar Filtros</span>
            </button>
          </div>
        </div>

        <!-- Tabla de Imágenes -->
        <p-table 
          [value]="filteredImagenes()" 
          [paginator]="true" 
          [rows]="10" 
          [loading]="loading()" 
          responsiveLayout="stack" 
          styleClass="p-datatable-sm ca-clean-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 8rem">Miniatura</th>
              <th>Incidencia / Contexto</th>
              <th>Estado</th>
              <th>Motivo de Revisión</th>
              <th>Fecha Subida</th>
              <th style="width: 10rem" class="text-center">Acciones</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-img>
            <tr class="hover:bg-slate-50/40 cursor-pointer transition-colors" (click)="verDetalle(img)">
              <!-- Miniatura -->
              <td>
                <div class="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                  @if (img.downloadUrl) {
                    <img [src]="img.downloadUrl" class="h-full w-full object-cover" alt="Miniatura" />
                  } @else {
                    <i class="pi pi-image text-slate-400 text-xl"></i>
                  }
                </div>
              </td>
              
              <!-- Contexto -->
              <td>
                <div class="flex flex-col">
                  @if (img.tituloIncidencia) {
                    <span class="font-bold text-xs text-slate-800 line-clamp-1" [title]="img.tituloIncidencia">
                      Incidencia: {{ img.tituloIncidencia }}
                    </span>
                    <span class="text-[10px] text-slate-400 mt-0.5">
                      Categoría: {{ img.nombreCategoriaIncidencia || 'Sin categoría' }}
                    </span>
                  } @else {
                    <span class="font-bold text-xs text-slate-500 italic">
                      Sin incidencia directa (Confirmación)
                    </span>
                  }
                  <div class="flex items-center gap-1.5 mt-1">
                    <span class="font-mono text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                      ID: {{ img.idMultimedia.slice(0, 8) }}...
                    </span>
                    @if (img.aliasUsuarioSubida) {
                      <span class="text-[9px] text-slate-400">
                        Subido por: &#64;{{ img.aliasUsuarioSubida }}
                      </span>
                    }
                  </div>
                </div>
              </td>
              
              <!-- Estado -->
              <td>
                <p-tag [value]="img.estadoRevision" [severity]="obtenerSeverityEstado(img.estadoRevision)"></p-tag>
              </td>
              
              <!-- Motivo -->
              <td>
                <div class="text-xs text-slate-700 max-w-[250px] truncate" [title]="img.motivoRevision">
                  {{ img.motivoRevision || 'Sin observaciones' }}
                </div>
                @if (img.revisadoManualmente) {
                  <span class="text-[9px] bg-sky-50 text-sky-650 px-1.5 py-0.5 rounded border border-sky-200 mt-1 inline-block">
                    Revisión Manual
                  </span>
                }
              </td>
              
              <!-- Fecha -->
              <td class="text-xs text-slate-500">
                {{ img.subidoEn | date:'medium' }}
              </td>
              
              <!-- Acciones -->
              <td class="text-center">
                <button 
                  pButton 
                  size="small" 
                  severity="secondary"
                  outlined
                  icon="pi pi-eye" 
                  label="Revisar" 
                  (click)="$event.stopPropagation(); verDetalle(img)"
                  class="text-ca-teal"
                ></button>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center py-8 text-slate-450 text-xs font-semibold">
                No se encontraron imágenes pendientes de moderación en este estado.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- DETAIL DRAWER -->
    @if (showDetailDrawer() && selectedImagen(); as img) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs" (click)="closeDetailDrawer()"></div>
      
      <!-- Drawer Container -->
      <div class="fixed inset-y-0 right-0 z-[1001] w-full max-w-xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300">
        <!-- Header -->
        <div class="bg-[var(--ca-navy)] text-white p-6 flex items-center justify-between shrink-0">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-gold)]">Detalle de Imagen</span>
            <h3 class="text-xl font-bold mt-1">Revisión #{{ img.idMultimedia.slice(0, 8) }}</h3>
          </div>
          <button (click)="closeDetailDrawer()" class="text-white hover:text-slate-200 transition cursor-pointer p-1">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Vista de la Imagen -->
          <div class="space-y-2">
            <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Archivo Multimedia</h4>
            <div class="bg-slate-50 p-4 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col items-center">
              @if (img.downloadUrl) {
                <div class="relative overflow-hidden rounded-2xl border border-slate-200 max-h-64 bg-white flex justify-center items-center">
                  <img [src]="img.downloadUrl" class="max-h-60 object-contain rounded" alt="Moderación" />
                </div>
                <div class="w-full flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-2.5">
                  <span>{{ img.nombreArchivo || 'sin-nombre.jpg' }} ({{ (img.sizeBytes || 0) / 1024 | number:'1.0-0' }} KB)</span>
                  <a [href]="img.downloadUrl" target="_blank" class="text-[var(--ca-teal)] hover:underline flex items-center gap-1">
                    <i class="pi pi-external-link"></i> Ver pantalla completa
                  </a>
                </div>
              } @else {
                <div class="py-8 text-slate-400 text-center">
                  <i class="pi pi-image text-3xl block mb-2"></i>
                  URL de descarga no disponible
                </div>
              }
            </div>
          </div>

          <!-- Estado y Detalles -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span class="block text-xs font-semibold text-slate-400 uppercase">Estado Actual</span>
              <p-tag [value]="img.estadoRevision" [severity]="obtenerSeverityEstado(img.estadoRevision)" class="mt-1.5 block w-fit"></p-tag>
            </div>
            <div>
              <span class="block text-xs font-semibold text-slate-400 uppercase">Fecha Subida</span>
              <span class="text-sm font-semibold text-slate-700 block mt-1.5">{{ img.subidoEn | date:'medium' }}</span>
            </div>
          </div>

          <!-- Información de Moderación por Vision -->
          <div class="space-y-3">
            <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Moderación Automática (Google Vision)</h4>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
              <div>
                <span class="text-xs font-bold text-slate-400 block uppercase">Motivo del Sistema</span>
                <span class="text-xs text-slate-700 mt-1 block font-medium">{{ img.motivoRevision || 'Ninguno' }}</span>
              </div>
              
              <!-- SafeSearch Detection -->
              @if (obtenerSafeSearch(img); as safeSearch) {
                <div>
                  <span class="text-xs font-bold text-slate-400 block uppercase mb-2">SafeSearch Likelihoods</span>
                  <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div class="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span class="block text-[9px] font-bold text-slate-450 uppercase">Adulto</span>
                      <span class="text-[10px] font-bold block mt-1" [ngClass]="obtenerColorLikelihood(safeSearch.adult)">{{ safeSearch.adult }}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span class="block text-[9px] font-bold text-slate-450 uppercase">Violencia</span>
                      <span class="text-[10px] font-bold block mt-1" [ngClass]="obtenerColorLikelihood(safeSearch.violence)">{{ safeSearch.violence }}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span class="block text-[9px] font-bold text-slate-450 uppercase">Sensual</span>
                      <span class="text-[10px] font-bold block mt-1" [ngClass]="obtenerColorLikelihood(safeSearch.racy)">{{ safeSearch.racy }}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span class="block text-[9px] font-bold text-slate-450 uppercase">Médico</span>
                      <span class="text-[10px] font-bold block mt-1" [ngClass]="obtenerColorLikelihood(safeSearch.medical)">{{ safeSearch.medical }}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span class="block text-[9px] font-bold text-slate-450 uppercase">Broma</span>
                      <span class="text-[10px] font-bold block mt-1" [ngClass]="obtenerColorLikelihood(safeSearch.spoof)">{{ safeSearch.spoof }}</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Labels Detection -->
              <div>
                <span class="text-xs font-bold text-slate-400 block uppercase mb-1.5">Etiquetas Detectadas (Labels)</span>
                @if (obtenerLabels(img); as labels) {
                  @if (labels.length > 0) {
                    <div class="flex flex-wrap gap-1.5">
                      @for (label of labels; track label) {
                        <span class="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/60">
                          {{ label }}
                        </span>
                      }
                    </div>
                  } @else {
                    <span class="text-xs text-slate-450 italic">Ninguna etiqueta detectada</span>
                  }
                } @else {
                  <span class="text-xs text-slate-450 italic">Ninguna etiqueta detectada</span>
                }
              </div>
            </div>
          </div>

          <!-- Incidencia Relacionada -->
          <div class="space-y-3">
            <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Incidencia Relacionada</h4>
            @if (img.idIncidencia) {
              <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div>
                  <span class="text-xs font-bold text-slate-400 block uppercase">Título</span>
                  <span class="text-sm font-semibold text-slate-800 mt-1 block">{{ img.tituloIncidencia || 'Sin título' }}</span>
                </div>
                @if (incidenciaDetalleCargado(); as inc) {
                  <div>
                    <span class="text-xs font-bold text-slate-400 block uppercase">Descripción</span>
                    <p class="text-xs text-slate-600 mt-1 leading-relaxed">{{ inc.descripcion }}</p>
                  </div>
                  <div class="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
                    <span>Estado Incidencia: {{ inc.nombreEstado }}</span>
                    <span>Reportado: {{ inc.fechaReporte | date:'shortDate' }}</span>
                  </div>
                } @else {
                  <div class="text-center py-2 text-xs text-slate-400">
                    <i class="pi pi-spin pi-spinner mr-2"></i> Cargando más detalles de incidencia...
                  </div>
                }
                
                <!-- NAVEGACIÓN A INCIDENCIA -->
                @if (incidenciaDetalleCargado(); as inc) {
                  <div class="pt-2">
                    <a [routerLink]="['/admin/incidencias']" class="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-xs font-bold transition">
                      <i class="pi pi-external-link"></i>
                      <span>Ver Incidencia en Administración</span>
                    </a>
                  </div>
                }
              </div>
            } @else {
              <div class="bg-white border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-450 italic">
                La imagen pertenece a una confirmación de solución.
              </div>
            }
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="border-t border-slate-150 p-6 bg-slate-50 flex flex-col gap-3 shrink-0">
          <div class="flex gap-3">
            <button 
              (click)="confirmarRechazo(img)"
              class="flex-1 rounded-xl border border-red-200 hover:bg-red-50 text-red-650 py-3 text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <i class="pi pi-times-circle"></i>
              <span>Rechazar</span>
            </button>
            <button 
              (click)="confirmarAprobacion(img)"
              class="flex-1 rounded-xl bg-[var(--ca-teal)] hover:bg-[var(--ca-teal)]/90 text-white py-3 text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <i class="pi pi-check-circle"></i>
              <span>Aprobar</span>
            </button>
          </div>
          
          @if (img.estadoRevision === 'ERROR_REVISION' || img.estadoRevision === 'REVISION_MANUAL') {
            <button 
              (click)="reintentarAnalisis(img)"
              class="w-full rounded-xl border border-slate-350 hover:bg-slate-100 text-slate-700 py-2.5 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i class="pi pi-refresh"></i>
              <span>Reintentar moderación automática</span>
            </button>
          }
        </div>
      </div>
    }

    <!-- CONFIRMATION MODAL -->
    @if (showConfirmModal()) {
      <div class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div class="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4">
          <div class="flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-full shrink-0" 
                  [ngClass]="confirmMode === 'aprobar' ? 'bg-emerald-50 text-emerald-650' : 'bg-red-50 text-red-655'">
              <i class="pi text-lg" [ngClass]="confirmMode === 'aprobar' ? 'pi-check-circle' : 'pi-exclamation-triangle'"></i>
            </span>
            <h3 class="text-lg font-bold text-slate-800">{{ confirmTitle }}</h3>
          </div>
          
          <p class="text-sm text-slate-500 leading-relaxed">{{ confirmMessage }}</p>
          
          <!-- Motivo Input (Opcional, pero se resalta al rechazar) -->
          <div class="flex flex-col gap-1.5 pt-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Motivo / Observación (Opcional)</label>
            <input 
              pInputText 
              class="w-full" 
              [(ngModel)]="confirmMotivo" 
              placeholder="Ingresa un motivo para esta revisión..." 
            />
          </div>
          
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="onConfirmReject()" class="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 transition cursor-pointer">
              Cancelar
            </button>
            <button (click)="onConfirmAccept()" class="rounded-xl text-white px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-sm"
                    [ngClass]="confirmMode === 'aprobar' ? 'bg-[var(--ca-teal)] hover:bg-[var(--ca-teal)]/90' : 'bg-red-650 hover:bg-red-750'">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ImagenModeracionPageComponent implements OnInit {
  readonly allLoadedImagenes = signal<AdminImagenModeracion[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalRecords = signal<number>(0);

  // Filter values
  filterEstado = 'REVISION_MANUAL'; // Priority by default
  readonly searchTerm = signal<string>('');
  readonly filterFechaDesde = signal<string>('');
  readonly filterFechaHasta = signal<string>('');

  // Selected Image for detail drawer
  readonly selectedImagen = signal<AdminImagenModeracion | null>(null);
  readonly showDetailDrawer = signal<boolean>(false);
  readonly incidenciaDetalleCargado = signal<any | null>(null);

  // Confirmation Modal properties
  readonly showConfirmModal = signal<boolean>(false);
  confirmTitle = '';
  confirmMessage = '';
  confirmMode: 'aprobar' | 'rechazar' = 'aprobar';
  confirmMotivo = '';
  confirmAction: (() => void) | null = null;

  estadosOptions = [
    { label: 'Todos', value: '' },
    { label: 'Revisión Manual', value: 'REVISION_MANUAL' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Errores', value: 'ERROR_REVISION' },
    { label: 'Aprobados', value: 'APROBADO' },
    { label: 'Rechazados', value: 'RECHAZADO' },
  ];

  constructor(
    private readonly moderacionService: ImagenModeracionService,
    private readonly incidenciasService: IncidenciasService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchImagenes();
  }

  // Local filtering computed property
  readonly filteredImagenes = computed(() => {
    let list = this.allLoadedImagenes();
    const search = this.searchTerm().trim().toLowerCase();
    const desde = this.filterFechaDesde();
    const hasta = this.filterFechaHasta();

    if (search) {
      list = list.filter(img => 
        (img.motivoRevision ?? '').toLowerCase().includes(search) ||
        (img.idMultimedia ?? '').toLowerCase().includes(search) ||
        (img.tituloIncidencia ?? '').toLowerCase().includes(search) ||
        (img.nombreCategoriaIncidencia ?? '').toLowerCase().includes(search) ||
        (img.aliasUsuarioSubida ?? '').toLowerCase().includes(search)
      );
    }

    if (desde) {
      const dateDesde = new Date(desde);
      list = list.filter(img => new Date(img.subidoEn) >= dateDesde);
    }

    if (hasta) {
      const dateHasta = new Date(hasta);
      dateHasta.setHours(23, 59, 59, 999);
      list = list.filter(img => new Date(img.subidoEn) <= dateHasta);
    }

    return list;
  });

  onFilterEstadoChange(value: string) {
    this.filterEstado = value;
    this.fetchImagenes();
  }

  clearFilters() {
    this.filterEstado = 'REVISION_MANUAL';
    this.searchTerm.set('');
    this.filterFechaDesde.set('');
    this.filterFechaHasta.set('');
    this.fetchImagenes();
  }

  fetchImagenes() {
    this.loading.set(true);
    this.moderacionService.list({
      estadoRevision: this.filterEstado || undefined,
      limit: 150, // High usability local filtering
      offset: 0,
    }).subscribe({
      next: (response) => {
        this.allLoadedImagenes.set(response.data);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las imágenes para moderación.' });
        this.loading.set(false);
      }
    });
  }

  verDetalle(img: AdminImagenModeracion) {
    this.selectedImagen.set(img);
    this.incidenciaDetalleCargado.set(null);
    this.showDetailDrawer.set(true);
    
    if (img.idIncidencia) {
      this.fetchIncidenciaDetail(img.idIncidencia);
    }
  }

  closeDetailDrawer() {
    this.showDetailDrawer.set(false);
    this.selectedImagen.set(null);
    this.incidenciaDetalleCargado.set(null);
  }

  fetchIncidenciaDetail(idIncidencia: string) {
    this.incidenciasService.getById(idIncidencia).subscribe({
      next: (inc) => {
        this.incidenciaDetalleCargado.set(inc);
      },
      error: () => {
        this.incidenciaDetalleCargado.set(null);
      }
    });
  }

  // SafeSearch and Labels helper
  obtenerSafeSearch(img: AdminImagenModeracion) {
    if (!img.resultadoModeracion) return null;
    try {
      const data = JSON.parse(img.resultadoModeracion);
      return data.safeSearch;
    } catch (e) {
      return null;
    }
  }

  obtenerLabels(img: AdminImagenModeracion): string[] {
    if (!img.resultadoModeracion) return [];
    try {
      const data = JSON.parse(img.resultadoModeracion);
      return data.labels || [];
    } catch (e) {
      return [];
    }
  }

  obtenerColorLikelihood(lh: string): string {
    switch (lh) {
      case 'VERY_UNLIKELY':
      case 'UNLIKELY':
        return 'text-emerald-600';
      case 'POSSIBLE':
        return 'text-amber-500';
      case 'LIKELY':
      case 'VERY_LIKELY':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  }

  obtenerSeverityEstado(estado: string): 'success' | 'danger' | 'warn' | 'secondary' | 'info' {
    switch (estado) {
      case 'APROBADO':
        return 'success';
      case 'RECHAZADO':
        return 'danger';
      case 'REVISION_MANUAL':
        return 'warn';
      case 'ERROR_REVISION':
        return 'danger';
      default:
        return 'info';
    }
  }

  // Moderation manual actions
  confirmarAprobacion(img: AdminImagenModeracion) {
    this.confirmTitle = 'Aprobar Imagen';
    this.confirmMessage = '¿Estás seguro de que deseas aprobar esta imagen? Esto la hará visible al público en la aplicación.';
    this.confirmMode = 'aprobar';
    this.confirmMotivo = 'Aprobado en revisión manual';
    this.confirmAction = () => this.ejecutarAprobacion(img.idMultimedia, this.confirmMotivo);
    this.showConfirmModal.set(true);
  }

  confirmarRechazo(img: AdminImagenModeracion) {
    this.confirmTitle = 'Rechazar Imagen';
    this.confirmMessage = '¿Estás seguro de que deseas rechazar esta imagen? Esto ocultará permanentemente la imagen del público.';
    this.confirmMode = 'rechazar';
    this.confirmMotivo = 'Rechazado en revisión manual';
    this.confirmAction = () => this.ejecutarRechazo(img.idMultimedia, this.confirmMotivo);
    this.showConfirmModal.set(true);
  }

  reintentarAnalisis(img: AdminImagenModeracion) {
    this.loading.set(true);
    this.moderacionService.retry(img.idMultimedia).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Reintento Exitoso', detail: 'La imagen ha sido programada para moderación automática.' });
        this.closeDetailDrawer();
        this.fetchImagenes();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reintentar el análisis automático.' });
        this.loading.set(false);
      }
    });
  }

  ejecutarAprobacion(id: string, motivo: string) {
    this.loading.set(true);
    this.moderacionService.approve(id, motivo).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Aprobado', detail: 'Imagen aprobada y visible al público.' });
        this.closeDetailDrawer();
        this.fetchImagenes();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo aprobar la imagen.' });
        this.loading.set(false);
      }
    });
  }

  ejecutarRechazo(id: string, motivo: string) {
    this.loading.set(true);
    this.moderacionService.reject(id, motivo).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Rechazado', detail: 'Imagen rechazada y ocultada del público.' });
        this.closeDetailDrawer();
        this.fetchImagenes();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la imagen.' });
        this.loading.set(false);
      }
    });
  }

  onConfirmAccept() {
    this.showConfirmModal.set(false);
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  onConfirmReject() {
    this.showConfirmModal.set(false);
    this.confirmAction = null;
  }
}
