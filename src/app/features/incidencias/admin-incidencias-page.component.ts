import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Incidencia, IncidenciaRelacionada } from '../../core/models/incidencia.model';
import { EstadoIncidencia } from '../../core/models/catalogo.model';
import { CatalogosService } from '../../core/services/catalogos.service';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { 
  ArchivoMultimedia, 
  ComentarioIncidencia, 
  ConfirmacionCompletadoDetalle, 
  HistorialEstadoIncidencia 
} from '../../core/models/incidencia-detail.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-incidencias-page',
  standalone: true,
  imports: [
    CommonModule, 
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
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>
      <!-- Compact Admin Header -->
      <div class="ca-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ca-teal)] block">Moderación</span>
          <h2 class="text-2xl font-bold text-[var(--ca-navy)] mt-1">Gestión de Incidencias</h2>
          <p class="text-xs text-slate-500 mt-1 max-w-2xl">
            Revisa reportes ciudadanos, actualiza estados y crea relaciones oficiales entre incidencias.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="loadIncidencias()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
            <i class="pi pi-refresh"></i>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

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
            <tr class="hover:bg-slate-50/40 cursor-pointer transition-colors" (click)="openManageDrawer(incidencia)">
              <td>
                <div class="font-semibold text-slate-800">{{ incidencia.titulo }}</div>
                <div class="line-clamp-1 text-sm text-slate-500">{{ incidencia.descripcion }}</div>
              </td>
              <td>{{ incidencia.nombreCategoria }}</td>
              <td><p-tag [value]="incidencia.nombreEstado" [severity]="tagSeverity(incidencia.codigoEstado)"></p-tag></td>
              <td>{{ incidencia.nombreSector || incidencia.direccionReferencial || 'Sin sector' }}</td>
              <td class="text-sm text-slate-600">
                {{ incidencia.cantidadComentarios }} comentarios · {{ incidencia.cantidadConfirmaciones }} confirmaciones
              </td>
              <td class="text-right" (click)="$event.stopPropagation()">
                <button pButton size="small" severity="secondary" outlined label="Gestionar" (click)="openManageDrawer(incidencia)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center py-6 text-slate-450 text-xs font-semibold">
                No se encontraron incidencias con los criterios seleccionados.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- DETAIL/MANAGE DRAWER -->
    @if (drawerVisible() && selected(); as item) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs" (click)="drawerVisible.set(false)"></div>
      
      <!-- Drawer Container -->
      <div class="fixed inset-y-0 right-0 z-[1001] flex h-full w-full max-w-4xl transform flex-col bg-white shadow-[0_20px_60px_rgba(17,24,39,0.18)] transition-transform duration-300">
        <!-- Header -->
        <div class="bg-[var(--ca-navy)] text-white p-6 flex items-center justify-between shrink-0">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-gold)]">Gestión Administrativa</span>
            <h3 class="text-xl font-bold mt-1">Incidencia #{{ item.idIncidencia.slice(0, 8) }}</h3>
          </div>
          <button (click)="drawerVisible.set(false)" class="text-white hover:text-slate-200 transition cursor-pointer p-1">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Tab Bar -->
        <div class="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto scrollbar-none">
          <button 
            (click)="activeTab.set('resumen')" 
            [class.border-[var(--ca-teal)]]="activeTab() === 'resumen'"
            [class.text-[var(--ca-teal)]]="activeTab() === 'resumen'"
            class="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
          >
            Resumen y Actividad
          </button>
          <button 
            (click)="activeTab.set('estado')" 
            [class.border-[var(--ca-teal)]]="activeTab() === 'estado'"
            [class.text-[var(--ca-teal)]]="activeTab() === 'estado'"
            class="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
          >
            Cambiar Estado
          </button>
          <button 
            (click)="activeTab.set('relaciones')" 
            [class.border-[var(--ca-teal)]]="activeTab() === 'relaciones'"
            [class.text-[var(--ca-teal)]]="activeTab() === 'relaciones'"
            class="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
          >
            Relaciones
          </button>
          <button 
            (click)="activeTab.set('historial')" 
            [class.border-[var(--ca-teal)]]="activeTab() === 'historial'"
            [class.text-[var(--ca-teal)]]="activeTab() === 'historial'"
            class="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
          >
            Historial de Cambios
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- TAB 1: RESUMEN Y ACTIVIDAD -->
          @if (activeTab() === 'resumen') {
            <!-- Info principal -->
            <div class="bg-slate-50 p-5 rounded-[var(--ca-radius)] border border-slate-100 space-y-4 shadow-sm">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Título</span>
                  <h4 class="text-base font-bold text-slate-800">{{ item.titulo }}</h4>
                </div>
                <p-tag [value]="item.nombreEstado" [severity]="tagSeverity(item.codigoEstado)"></p-tag>
              </div>

              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Descripción</span>
                <p class="mt-1 text-xs text-slate-600 leading-relaxed">{{ item.descripcion }}</p>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200/60 text-xs font-semibold text-slate-500">
                <div>
                  <span class="text-[10px] text-slate-400 block uppercase">Reportado Por</span>
                  <span class="text-slate-800 font-bold">&#64;{{ item.aliasUsuarioReporta || 'Anónimo' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block uppercase">Fecha de Reporte</span>
                  <span class="text-slate-800">{{ item.fechaReporte | date:'medium' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block uppercase">Categoría</span>
                  <span class="text-slate-800">{{ item.nombreCategoria }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block uppercase">Sector / Dirección</span>
                  <span class="text-slate-800 truncate block" [title]="item.nombreSector || item.direccionReferencial || ''">
                    {{ item.nombreSector || item.direccionReferencial || 'Sin sector asignado' }}
                  </span>
                </div>
              </div>

              <div class="pt-2">
                <a [routerLink]="['/incidencias', item.idIncidencia]" target="_blank" class="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 text-xs font-bold transition">
                  <i class="pi pi-external-link"></i>
                  <span>Ver en mapa / Detalle público</span>
                </a>
              </div>
            </div>

            <!-- Loader for extra content -->
            @if (detailLoading()) {
              <div class="text-center py-12 text-slate-400">
                <i class="pi pi-spin pi-spinner text-2xl block mb-2"></i>
                Cargando actividad e imágenes...
              </div>
            } @else {
              <!-- Evidencia fotos -->
              <div class="space-y-3">
                <h4 class="text-sm font-bold text-slate-855 uppercase tracking-wider flex items-center gap-1.5">
                  <i class="pi pi-images text-[var(--ca-teal)]"></i>
                  <span>Fotos de Evidencia ({{ multimedia().length }})</span>
                </h4>
                @if (multimedia().length > 0) {
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    @for (img of multimedia(); track img.idMultimedia) {
                      <div class="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50 flex items-center justify-center shadow-sm">
                        <img [src]="img.downloadUrl" class="object-cover w-full h-full" alt="Evidencia" />
                        <a [href]="img.downloadUrl" target="_blank" class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                          <i class="pi pi-external-link"></i> Ampliar
                        </a>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="bg-slate-50 border border-slate-150 rounded-[var(--ca-radius)] p-6 text-center text-xs text-slate-400 font-medium italic">
                    No hay imágenes de evidencia adjuntas para esta incidencia.
                  </div>
                }
              </div>

              <!-- Comentarios Recientes -->
              <div class="space-y-3">
                <h4 class="text-sm font-bold text-slate-855 uppercase tracking-wider flex items-center gap-1.5">
                  <i class="pi pi-comments text-[var(--ca-teal)]"></i>
                  <span>Comentarios Ciudadanos ({{ comentarios().length }})</span>
                </h4>
                @if (comentarios().length > 0) {
                  <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    @for (com of comentarios(); track com.idComentario) {
                      <div class="bg-slate-50 border border-slate-150 rounded-[var(--ca-radius)] p-4 space-y-1">
                        <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>&#64;{{ com.aliasUsuario || 'Ciudadano' }}</span>
                          <span>{{ com.creadoEn | date:'short' }}</span>
                        </div>
                        <p class="text-xs text-slate-700 leading-relaxed">{{ com.contenido }}</p>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="bg-slate-50 border border-slate-150 rounded-[var(--ca-radius)] p-6 text-center text-xs text-slate-400 font-medium italic">
                    Esta incidencia no registra comentarios de ciudadanos.
                  </div>
                }
              </div>

              <!-- Confirmaciones de solución -->
              <div class="space-y-3">
                <h4 class="text-sm font-bold text-slate-855 uppercase tracking-wider flex items-center gap-1.5">
                  <i class="pi pi-check-circle text-[var(--ca-teal)]"></i>
                  <span>Confirmaciones de Solución ({{ confirmaciones().length }})</span>
                </h4>
                @if (confirmaciones().length > 0) {
                  <div class="space-y-3">
                    @for (conf of confirmaciones(); track conf.idConfirmacion) {
                      <div class="bg-white border border-slate-200 rounded-[var(--ca-radius)] p-4 space-y-2 shadow-sm">
                        <div class="flex justify-between items-center text-[10px]">
                          <span class="font-bold text-slate-600">&#64;{{ conf.aliasUsuario || 'Ciudadano' }}</span>
                          <span class="text-slate-400">{{ conf.creadoEn | date:'short' }}</span>
                        </div>
                        <p class="text-xs text-slate-650 italic">"{{ conf.observacion || 'Confirmado sin comentarios adicionales' }}"</p>
                        @if (conf.multimedia && conf.multimedia.length > 0) {
                          <div class="flex gap-2 pt-1.5 overflow-x-auto">
                            @for (m of conf.multimedia; track m.idMultimedia) {
                              <a [href]="m.downloadUrl" target="_blank" class="block h-12 w-12 rounded border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm hover:border-[var(--ca-teal)] transition">
                                <img [src]="m.downloadUrl" class="h-full w-full object-cover" />
                              </a>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="bg-slate-50 border border-slate-150 rounded-[var(--ca-radius)] p-6 text-center text-xs text-slate-400 font-medium italic">
                    Ningún ciudadano ha confirmado todavía que este problema haya sido solucionado.
                  </div>
                }
              </div>
            }
          }

          <!-- TAB 2: CAMBIAR ESTADO -->
          @if (activeTab() === 'estado') {
            <div class="bg-white border border-slate-200 rounded-[var(--ca-radius)] p-6 space-y-6 shadow-sm">
              <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado actual:</span>
                <p-tag [value]="item.nombreEstado" [severity]="tagSeverity(item.codigoEstado)"></p-tag>
              </div>

              <div class="space-y-4">
                <label class="block">
                  <span class="mb-2 block text-xs font-bold text-slate-700 uppercase tracking-wide">Nuevo Estado</span>
                  <p-select
                    class="w-full"
                    [(ngModel)]="nuevoEstado"
                    [options]="estados()"
                    optionLabel="nombre"
                    optionValue="codigo"
                    placeholder="Selecciona un estado"
                    styleClass="w-full"
                  ></p-select>
                </label>

                <label class="block">
                  <span class="mb-2 block text-xs font-bold text-slate-700 uppercase tracking-wide">Observación Administrativa</span>
                  <textarea 
                    pTextarea 
                    class="w-full rounded-xl border border-slate-200 focus:border-[var(--ca-teal)] p-3 text-xs outline-none transition" 
                    rows="5" 
                    [(ngModel)]="observacion" 
                    placeholder="Escriba los motivos administrativos del cambio..."
                  ></textarea>
                </label>

                @if (isObservationRequired()) {
                  <div class="bg-amber-50 border border-amber-200 text-amber-850 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                    <i class="pi pi-info-circle text-sm shrink-0"></i>
                    <span>La observación es obligatoria para cerrar, rechazar o marcar como resuelta la incidencia.</span>
                  </div>
                }

                <div class="pt-2">
                  <button 
                    (click)="confirmarCambiarEstado()" 
                    [disabled]="!nuevoEstado || (isObservationRequired() && !observacion.trim())"
                    class="w-full rounded-xl bg-[var(--ca-teal)] hover:bg-[var(--ca-teal)]/90 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i class="pi pi-save"></i>
                    <span>Guardar cambio de estado</span>
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- TAB 3: RELACIONES -->
          @if (activeTab() === 'relaciones') {
            <!-- Relaciones actuales -->
            <div class="space-y-3">
              <h4 class="text-sm font-bold text-slate-855 uppercase tracking-wider flex items-center gap-1.5">
                <i class="pi pi-share-alt text-[var(--ca-teal)]"></i>
                <span>Relaciones Existentes ({{ relacionadas().length }})</span>
              </h4>
              @if (relacionadas().length > 0) {
                <div class="grid gap-3">
                  @for (rel of relacionadas(); track rel.idRelacion) {
                    <div class="bg-white border border-slate-200 rounded-[var(--ca-radius)] p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <h5 class="text-xs font-bold text-slate-800">{{ rel.titulo }}</h5>
                        <div class="flex gap-3 text-[10px] text-slate-400 font-semibold mt-1">
                          <span>Categoría: {{ rel.nombreCategoria }}</span>
                          <span>Estado: {{ rel.nombreEstado }}</span>
                          <span class="text-[var(--ca-gold)] uppercase font-bold">{{ rel.tipoRelacion }}</span>
                        </div>
                      </div>
                      <a [routerLink]="['/incidencias', rel.idIncidenciaRelacionada]" target="_blank" class="text-slate-400 hover:text-[var(--ca-teal)] transition" title="Ver detalle">
                        <i class="pi pi-external-link"></i>
                      </a>
                    </div>
                  }
                </div>
              } @else {
                <div class="bg-slate-50 border border-slate-150 rounded-[var(--ca-radius)] p-6 text-center text-xs text-slate-400 font-medium italic">
                  Esta incidencia no registra relaciones previas con otros reportes.
                </div>
              }
            </div>

            <!-- Crear nueva relación -->
            <div class="bg-white border border-slate-200 rounded-[var(--ca-radius)] p-6 space-y-4 shadow-sm">
              <h4 class="text-sm font-bold text-slate-855 uppercase tracking-wider">Crear nueva relación</h4>
              
              <!-- Buscador -->
              <div class="flex flex-col gap-1.5">
                <span class="p-input-icon-left w-full block">
                  <i class="pi pi-search text-slate-400"></i>
                  <input 
                    pInputText 
                    class="w-full" 
                    [ngModel]="relacionSearchTerm()" 
                    (ngModelChange)="relacionSearchTerm.set($event)" 
                    placeholder="Buscar incidencia por título, categoría, sector..." 
                  />
                </span>
              </div>

              <!-- Lista de resultados -->
              <div class="max-h-[200px] overflow-y-auto pr-2 space-y-2 border border-slate-150 rounded-xl p-2 bg-slate-50">
                @for (candidate of filteredRelacionables(); track candidate.idIncidencia) {
                  <div class="bg-white border border-slate-150 rounded-xl p-3 flex items-center justify-between shadow-xs">
                    <div class="max-w-[75%]">
                      <h5 class="text-xs font-bold text-slate-800 truncate">{{ candidate.titulo }}</h5>
                      <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ candidate.nombreCategoria }} · {{ candidate.nombreSector || candidate.direccionReferencial || 'Sin sector' }}</p>
                    </div>
                    <button 
                      (click)="selectedRelacionCandidate.set(candidate)"
                      [class.bg-[var(--ca-teal)]]="selectedRelacionCandidate()?.idIncidencia === candidate.idIncidencia"
                      [class.text-white]="selectedRelacionCandidate()?.idIncidencia === candidate.idIncidencia"
                      class="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      {{ selectedRelacionCandidate()?.idIncidencia === candidate.idIncidencia ? 'Seleccionada' : 'Seleccionar' }}
                    </button>
                  </div>
                } @empty {
                  <p class="text-xs text-slate-400 text-center py-4 italic">No se encontraron incidencias candidatas.</p>
                }
              </div>

              <!-- Formulario de relación -->
              @if (selectedRelacionCandidate(); as candidate) {
                <div class="border-t border-slate-150 pt-4 space-y-4">
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1.5">
                    <span class="text-[10px] text-slate-400 font-bold uppercase block font-semibold">Incidencia Seleccionada</span>
                    <h5 class="text-xs font-bold text-slate-800">{{ candidate.titulo }}</h5>
                    <p class="text-[10px] text-slate-500 leading-relaxed">{{ candidate.descripcion | slice:0:150 }}...</p>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label class="block">
                      <span class="mb-2 block text-xs font-bold text-slate-700 uppercase tracking-wide">Tipo de Relación</span>
                      <p-select
                        class="w-full"
                        [(ngModel)]="tipoRelacion"
                        [options]="[
                          { label: 'Reporte Duplicado (DUPLICADA)', value: 'DUPLICADA' },
                          { label: 'Causada por otra incidencia (CAUSADA_POR)', value: 'CAUSADA_POR' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        styleClass="w-full"
                      ></p-select>
                    </label>

                    <div class="flex items-end">
                      <button 
                        (click)="confirmarCrearRelacion()"
                        class="w-full rounded-xl bg-slate-850 hover:bg-slate-900 text-white py-3.5 text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        <i class="pi pi-link"></i>
                        <span>Crear relación oficial</span>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- TAB 4: HISTORIAL DE CAMBIOS -->
          @if (activeTab() === 'historial') {
            <div class="space-y-4">
              <h4 class="text-sm font-bold text-slate-855 uppercase tracking-wider flex items-center gap-1.5">
                <i class="pi pi-history text-[var(--ca-teal)]"></i>
                <span>Historial de Auditoría ({{ historial().length }})</span>
              </h4>
              
              @if (historial().length > 0) {
                <div class="relative pl-6 border-l border-slate-200 space-y-6">
                  @for (h of historial(); track h.idHistorial) {
                    <div class="relative">
                      <!-- Dot indicators -->
                      <span class="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white border-2 border-[var(--ca-teal)] shadow-xxs"></span>
                      
                      <div class="bg-white border border-slate-200 rounded-[var(--ca-radius)] p-4 space-y-2 shadow-sm">
                        <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-1.5">
                          <span class="flex items-center gap-1">
                            <i class="pi pi-user text-[9px]"></i>
                            <span>Administrador: &#64;{{ h.aliasUsuarioAccion || 'Sistema' }}</span>
                          </span>
                          <span>{{ h.cambiadoEn | date:'medium' }}</span>
                        </div>
                        
                        <div class="flex items-center gap-2 pt-1 text-xs">
                          <span class="text-slate-400">Estado:</span>
                          <span class="text-slate-500 line-through">{{ h.nombreEstadoAnterior || 'Sin estado previo' }}</span>
                          <i class="pi pi-arrow-right text-[10px] text-slate-400"></i>
                          <p-tag [value]="h.nombreEstadoNuevo" [severity]="tagSeverity(h.codigoEstadoNuevo)"></p-tag>
                        </div>

                        @if (h.observacion) {
                          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-150 mt-2">
                            <span class="text-[9px] text-slate-400 font-bold uppercase block">Observación/Justificación</span>
                            <p class="text-xs text-slate-700 leading-relaxed mt-0.5 whitespace-pre-wrap font-medium font-mono">"{{ h.observacion }}"</p>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="bg-slate-50 border border-slate-150 rounded-[var(--ca-radius)] p-6 text-center text-xs text-slate-400 font-medium italic">
                  No se registran cambios de estado anteriores en esta incidencia.
                </div>
              }
            </div>
          }

        </div>
      </div>
    }

    <!-- CONFIRMATION MODAL -->
    @if (showConfirmModal()) {
      <div class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div class="w-full max-w-md bg-white rounded-[var(--ca-radius-lg)] border border-slate-200 p-6 shadow-[0_20px_60px_rgba(17,24,39,0.18)] space-y-4">
          <div class="flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-600 shrink-0">
              <i class="pi pi-exclamation-triangle text-lg"></i>
            </span>
            <h3 class="text-lg font-bold text-slate-800">{{ confirmTitle }}</h3>
          </div>
          <p class="text-sm text-slate-500 leading-relaxed">{{ confirmMessage }}</p>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="onConfirmReject()" class="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 transition cursor-pointer">
              Cancelar
            </button>
            <button (click)="onConfirmAccept()" class="rounded-xl bg-slate-850 hover:bg-slate-900 text-white px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-sm">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminIncidenciasPageComponent implements OnInit {
  readonly incidencias = signal<Incidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  readonly selected = signal<Incidencia | null>(null);
  
  // Drawer states
  readonly drawerVisible = signal<boolean>(false);
  readonly activeTab = signal<'resumen' | 'estado' | 'relaciones' | 'historial'>('resumen');
  readonly detailLoading = signal<boolean>(false);

  // Extra loaded datasets
  readonly multimedia = signal<ArchivoMultimedia[]>([]);
  readonly comentarios = signal<ComentarioIncidencia[]>([]);
  readonly confirmaciones = signal<ConfirmacionCompletadoDetalle[]>([]);
  readonly historial = signal<HistorialEstadoIncidencia[]>([]);
  readonly relacionadas = signal<IncidenciaRelacionada[]>([]);

  // Relation forms
  readonly relacionSearchTerm = signal<string>('');
  readonly selectedRelacionCandidate = signal<Incidencia | null>(null);
  tipoRelacion = 'DUPLICADA';

  // Confirmation modals
  readonly showConfirmModal = signal<boolean>(false);
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  nuevoEstado: string | null = null;
  observacion = '';
  searchTerm = '';

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly catalogosService: CatalogosService,
    private readonly messageService: MessageService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadIncidencias();
    this.catalogosService.estados$.subscribe((estados) => this.estados.set(estados));
    this.route.queryParams.subscribe(params => {
      if (params['usuario']) {
        this.searchTerm = params['usuario'];
      } else if (params['buscar']) {
        this.searchTerm = params['buscar'];
      }
    });
  }

  openManageDrawer(incidencia: Incidencia) {
    this.selected.set(incidencia);
    this.nuevoEstado = incidencia.codigoEstado;
    this.observacion = '';
    this.selectedRelacionCandidate.set(null);
    this.relacionSearchTerm.set('');
    this.tipoRelacion = 'DUPLICADA';
    this.activeTab.set('resumen');
    this.drawerVisible.set(true);
    
    // Load extra details
    this.loadExtraDetails(incidencia.idIncidencia);
  }

  loadExtraDetails(idIncidencia: string) {
    this.detailLoading.set(true);
    forkJoin({
      multimedia: this.incidenciasService.getMultimedia(idIncidencia),
      comentarios: this.incidenciasService.getComentarios(idIncidencia, 10),
      confirmaciones: this.incidenciasService.getConfirmaciones(idIncidencia, 5),
      historial: this.incidenciasService.getHistorialEstados(idIncidencia),
      relacionadas: this.incidenciasService.getRelacionadas(idIncidencia)
    }).subscribe({
      next: (res) => {
        this.multimedia.set(res.multimedia);
        this.comentarios.set(res.comentarios);
        this.confirmaciones.set(res.confirmaciones);
        this.historial.set(res.historial);
        this.relacionadas.set(res.relacionadas);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
      }
    });
  }

  isObservationRequired(): boolean {
    const estado = this.nuevoEstado;
    if (!estado) return false;
    const criticalStates = ['RESUELTA', 'CERRADA', 'RECHAZADA', 'CANCELADA', 'CERRADO', 'RESUELTO', 'RECHAZADO'];
    return criticalStates.some(code => estado.toUpperCase().includes(code));
  }

  confirmarCambiarEstado() {
    const item = this.selected();
    if (!item || !this.nuevoEstado) return;

    if (this.isObservationRequired() && !this.observacion.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Observación requerida',
        detail: 'Por favor ingrese una observación para registrar el cambio de estado.'
      });
      return;
    }

    this.confirmTitle = 'Cambiar Estado';
    this.confirmMessage = `¿Seguro que deseas cambiar el estado de esta incidencia a "${this.obtenerNombreEstado(this.nuevoEstado)}"?`;
    this.confirmAction = () => {
      this.incidenciasService.changeStatus(item.idIncidencia, this.nuevoEstado!, this.observacion).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Estado Actualizado',
            detail: 'El estado de la incidencia ha sido cambiado con éxito.'
          });
          this.loadIncidencias();
          this.loadExtraDetails(item.idIncidencia);
          item.codigoEstado = this.nuevoEstado!;
          item.nombreEstado = this.obtenerNombreEstado(this.nuevoEstado!) || item.nombreEstado;
          this.selected.set({ ...item });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo cambiar el estado de la incidencia.'
          });
        }
      });
    };
    this.showConfirmModal.set(true);
  }

  confirmarCrearRelacion() {
    const item = this.selected();
    const candidate = this.selectedRelacionCandidate();
    if (!item || !candidate) return;

    if (this.relacionadas().some(r => r.idIncidenciaRelacionada === candidate.idIncidencia)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Relación duplicada',
        detail: 'Estas incidencias ya se encuentran relacionadas.'
      });
      return;
    }

    this.confirmTitle = 'Relacionar Incidencias';
    this.confirmMessage = `¿Seguro que deseas relacionar la incidencia "${item.titulo}" con "${candidate.titulo}" con tipo "${this.tipoRelacion}"?`;
    this.confirmAction = () => {
      this.incidenciasService.relate(item.idIncidencia, candidate.idIncidencia, this.tipoRelacion).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Relación Creada',
            detail: 'La relación entre las incidencias ha sido creada exitosamente.'
          });
          this.loadExtraDetails(item.idIncidencia);
          this.selectedRelacionCandidate.set(null);
          this.relacionSearchTerm.set('');
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo crear la relación.'
          });
        }
      });
    };
    this.showConfirmModal.set(true);
  }

  onConfirmAccept() {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.showConfirmModal.set(false);
  }

  onConfirmReject() {
    this.showConfirmModal.set(false);
  }

  obtenerNombreEstado(codigo: string): string {
    const est = this.estados().find(e => e.codigo === codigo);
    return est ? est.nombre : codigo;
  }

  incidenciasRelacionables(): Incidencia[] {
    const selectedId = this.selected()?.idIncidencia;
    return this.incidencias().filter((incidencia) => incidencia.idIncidencia !== selectedId);
  }

  readonly filteredRelacionables = computed(() => {
    const term = this.relacionSearchTerm().trim().toLowerCase();
    const currentId = this.selected()?.idIncidencia;
    const list = this.incidencias().filter(inc => inc.idIncidencia !== currentId);
    
    if (!term) return list.slice(0, 5); // Show first 5 by default
    return list.filter(inc => 
      inc.titulo.toLowerCase().includes(term) ||
      inc.descripcion.toLowerCase().includes(term) ||
      inc.nombreCategoria.toLowerCase().includes(term) ||
      (inc.nombreSector ?? '').toLowerCase().includes(term)
    );
  });

  filteredIncidencias(): Incidencia[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.incidencias();
    }
    return this.incidencias().filter((incidencia) =>
      incidencia.titulo.toLowerCase().includes(term) ||
      incidencia.nombreCategoria.toLowerCase().includes(term) ||
      (incidencia.nombreSector ?? '').toLowerCase().includes(term) ||
      (incidencia.aliasUsuarioReporta ?? '').toLowerCase().includes(term) ||
      (incidencia.idIncidencia ?? '').toLowerCase().includes(term) ||
      (incidencia.idUsuarioReporta ?? '').toLowerCase().includes(term)
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
