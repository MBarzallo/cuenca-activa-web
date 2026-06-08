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
import { ReportesModeracionService } from '../../core/services/reportes-moderacion.service';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { AdminReporteContenido } from '../../core/models/admin-reporte-contenido.model';

@Component({
  selector: 'app-reportes-contenido-page',
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
      <section class="rounded-[28px] bg-[var(--ca-navy)] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Moderación</p>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Reportes de Contenido</h2>
        <p class="mt-3 max-w-3xl leading-7 text-slate-300">
          Procesa denuncias enviadas por los ciudadanos sobre incidencias, comentarios o imágenes inapropiadas en el sistema.
        </p>
      </section>

      <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <!-- Filtros de búsqueda -->
        <div class="mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Buscar -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Buscar</label>
              <span class="p-input-icon-left w-full block">
                <i class="pi pi-search text-slate-400"></i>
                <input pInputText class="w-full" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Usuario, ID o detalle..." />
              </span>
            </div>

            <!-- Estado -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Estado de Revisión</label>
              <p-select [options]="estadosOptions" [ngModel]="filterEstado" (ngModelChange)="onFilterEstadoChange($event)" optionLabel="label" optionValue="value" placeholder="Filtrar por estado" styleClass="w-full"></p-select>
            </div>

            <!-- Tipo -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Tipo de Contenido</label>
              <p-select [options]="tiposOptions" [ngModel]="filterTipo()" (ngModelChange)="filterTipo.set($event)" optionLabel="label" optionValue="value" placeholder="Todos" styleClass="w-full"></p-select>
            </div>

            <!-- Motivo -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Motivo de Denuncia</label>
              <p-select [options]="motivosOptions" [ngModel]="filterMotivo()" (ngModelChange)="filterMotivo.set($event)" optionLabel="label" optionValue="value" placeholder="Todos" styleClass="w-full"></p-select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-end">
            <!-- Fecha Desde -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Fecha Desde</label>
              <input type="date" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[var(--ca-teal)] transition" [ngModel]="filterFechaDesde()" (ngModelChange)="filterFechaDesde.set($event)" />
            </div>

            <!-- Fecha Hasta -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Fecha Hasta</label>
              <input type="date" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[var(--ca-teal)] transition" [ngModel]="filterFechaHasta()" (ngModelChange)="filterFechaHasta.set($event)" />
            </div>

            <!-- Acciones Filtros -->
            <div class="flex justify-end gap-2">
              <button (click)="clearFilters()" class="rounded-xl border border-slate-250 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition cursor-pointer flex items-center gap-1.5">
                <i class="pi pi-filter-slash"></i>
                <span>Limpiar Filtros</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla de Reportes -->
        <p-table 
          [value]="filteredReportes()" 
          [paginator]="true" 
          [rows]="10" 
          [loading]="loading()" 
          responsiveLayout="stack" 
          styleClass="p-datatable-sm ca-clean-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Fecha Denuncia</th>
              <th>Denunciante</th>
              <th>Tipo</th>
              <th>Contenido</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th style="width: 10rem" class="text-center">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-reporte>
            <tr class="hover:bg-slate-50/40 cursor-pointer transition-colors" (click)="verDetalle(reporte)">
              <td class="text-xs font-medium text-slate-600">
                {{ reporte.creadoEn | date:'medium' }}
              </td>
              <td>
                <div class="font-bold text-xs text-slate-800">&#64;{{ reporte.aliasUsuarioReporta }}</div>
                <div class="text-[10px] text-slate-400 font-medium">{{ reporte.emailUsuarioReporta }}</div>
              </td>
              <td>
                <p-tag [value]="obtenerTipoContenido(reporte)" [severity]="obtenerSeverityTipo(reporte)"></p-tag>
              </td>
              <td>
                @if (reporte.idIncidencia) {
                  <div class="flex flex-col">
                    <span class="font-bold text-xs text-slate-800 line-clamp-1" [title]="reporte.tituloIncidencia">
                      Incidencia: {{ reporte.tituloIncidencia || 'Cargando...' }}
                    </span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                        {{ reporte.idIncidencia.slice(0, 8) }}...
                      </span>
                      <button (click)="$event.stopPropagation(); copiarAlPortapapeles(reporte.idIncidencia)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-0.5" title="Copiar ID">
                        <i class="pi pi-copy text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                } @else if (reporte.idComentario) {
                  <div class="flex flex-col">
                    <span class="text-xs text-slate-700 italic line-clamp-1" [title]="reporte.contenidoComentario">
                      Comentario: "{{ reporte.contenidoComentario }}"
                    </span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                        {{ reporte.idComentario.slice(0, 8) }}...
                      </span>
                      <button (click)="$event.stopPropagation(); copiarAlPortapapeles(reporte.idComentario)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-0.5" title="Copiar ID">
                        <i class="pi pi-copy text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                } @else if (reporte.idMultimedia) {
                  <div class="flex flex-col">
                    <span class="text-xs text-slate-700 font-medium line-clamp-1">
                      Imagen / Multimedia
                    </span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                        {{ reporte.idMultimedia.slice(0, 8) }}...
                      </span>
                      <button (click)="$event.stopPropagation(); copiarAlPortapapeles(reporte.idMultimedia)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-0.5" title="Copiar ID">
                        <i class="pi pi-copy text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                } @else if (reporte.idConfirmacion) {
                  <div class="flex flex-col">
                    <span class="text-xs text-slate-700 line-clamp-1" [title]="reporte.observacionConfirmacion">
                      Confirmación: "{{ reporte.observacionConfirmacion || 'Sin observaciones' }}"
                    </span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                        {{ reporte.idConfirmacion.slice(0, 8) }}...
                      </span>
                      <button (click)="$event.stopPropagation(); copiarAlPortapapeles(reporte.idConfirmacion)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-0.5" title="Copiar ID">
                        <i class="pi pi-copy text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                } @else {
                  <span class="text-xs text-slate-400">N/A</span>
                }
              </td>
              <td>
                <div class="font-semibold text-xs text-slate-700 max-w-[200px] truncate" [title]="reporte.motivo">{{ reporte.motivo }}</div>
                <div class="text-slate-400 text-[10px] truncate max-w-[200px] mt-0.5" [title]="reporte.detalle">{{ reporte.detalle || 'Sin observaciones' }}</div>
              </td>
              <td>
                <p-tag [value]="reporte.estadoRevision" [severity]="obtenerSeverityEstado(reporte.estadoRevision)"></p-tag>
              </td>
              <td class="text-center">
                <button 
                  pButton 
                  size="small" 
                  severity="secondary"
                  outlined
                  icon="pi pi-eye" 
                  label="Ver detalle" 
                  (click)="$event.stopPropagation(); verDetalle(reporte)"
                  class="text-xs"
                ></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center py-6 text-slate-450 text-xs font-semibold">
                No se encontraron reportes con los criterios seleccionados.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- DETAIL DRAWER -->
    @if (showDetailDrawer() && selectedReport(); as reporte) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs" (click)="closeDetailDrawer()"></div>
      
      <!-- Drawer Container -->
      <div class="fixed inset-y-0 right-0 z-[1001] w-full max-w-xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300">
        <!-- Header -->
        <div class="bg-[var(--ca-navy)] text-white p-6 flex items-center justify-between shrink-0">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-gold)]">Detalle de Moderación</span>
            <h3 class="text-xl font-bold mt-1">Reporte #{{ reporte.idReporteContenido.slice(0, 8) }}</h3>
          </div>
          <button (click)="closeDetailDrawer()" class="text-white hover:text-slate-200 transition cursor-pointer p-1">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Estado y Fecha -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span class="block text-xs font-semibold text-slate-400 uppercase">Estado</span>
              <p-tag [value]="reporte.estadoRevision" [severity]="obtenerSeverityEstado(reporte.estadoRevision)" class="mt-1.5 block w-fit"></p-tag>
            </div>
            <div>
              <span class="block text-xs font-semibold text-slate-400 uppercase">Fecha Denuncia</span>
              <span class="text-sm font-semibold text-slate-700 block mt-1.5">{{ reporte.creadoEn | date:'medium' }}</span>
            </div>
          </div>

          <!-- Denunciante -->
          <div class="space-y-2">
            <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Denunciante</h4>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 font-bold text-sm">
                {{ reporte.aliasUsuarioReporta ? reporte.aliasUsuarioReporta.slice(0, 2).toUpperCase() : 'US' }}
              </span>
              <div>
                <span class="block font-semibold text-sm text-slate-800">&#64;{{ reporte.aliasUsuarioReporta }}</span>
                <span class="block text-xs text-slate-400 font-medium">{{ reporte.emailUsuarioReporta }}</span>
              </div>
            </div>
          </div>

          <!-- Motivo y Detalles -->
          <div class="space-y-2">
            <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Motivo de Denuncia</h4>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div>
                <span class="text-xs font-bold text-slate-400 block uppercase">Motivo</span>
                <span class="text-sm font-semibold text-slate-850 mt-1 block">{{ reporte.motivo }}</span>
              </div>
              @if (reporte.detalle) {
                <div>
                  <span class="text-xs font-bold text-slate-400 block uppercase">Detalles del Denunciante</span>
                  <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1.5 whitespace-pre-wrap italic">
                    "{{ reporte.detalle }}"
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Contenido Reportado -->
          <div class="space-y-3">
            <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Contenido Reportado</h4>
            
            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-slate-400 block uppercase">Tipo de Recurso</span>
                  <p-tag [value]="obtenerTipoContenido(reporte)" [severity]="obtenerSeverityTipo(reporte)" class="mt-1 block"></p-tag>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold text-slate-400 block uppercase">Identificador</span>
                  <span class="font-mono text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 mt-1 inline-flex items-center gap-1.5">
                    {{ obtenerIdContenido(reporte) }}
                    <button (click)="copiarAlPortapapeles(obtenerIdContenido(reporte))" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer" title="Copiar ID">
                      <i class="pi pi-copy text-[10px]"></i>
                    </button>
                  </span>
                </div>
              </div>

              <!-- SPECIFIC DETAILS BY TYPE -->
              
              <!-- 1. INCIDENCIA -->
              @if (reporte.idIncidencia) {
                <div class="border-t border-slate-100 pt-4 space-y-3">
                  <span class="text-xs font-bold text-slate-400 block uppercase">Detalle de Incidencia Denunciada</span>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div>
                      <h5 class="text-sm font-bold text-slate-800">{{ reporte.tituloIncidencia }}</h5>
                      @if (incidenciaDetalleCargado(); as inc) {
                        <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">{{ inc.descripcion }}</p>
                        <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-200/60 mt-2">
                          <span>Categoría: {{ inc.nombreCategoria }}</span>
                          <span>Estado: {{ inc.nombreEstado }}</span>
                          <span>Autor: &#64;{{ inc.aliasUsuarioReporta || 'Anónimo' }}</span>
                        </div>
                      } @else {
                        <div class="text-center py-2 text-xs text-slate-400">
                          <i class="pi pi-spin pi-spinner mr-2"></i>
                          Cargando más detalles...
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- 2. COMENTARIO -->
              @if (reporte.idComentario) {
                <div class="border-t border-slate-100 pt-4 space-y-3">
                  <span class="text-xs font-bold text-slate-400 block uppercase">Comentario Denunciado</span>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                    <p class="text-xs text-slate-750 italic leading-relaxed">
                      "{{ reporte.contenidoComentario }}"
                    </p>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-200/60">
                      <span>Autor: &#64;{{ reporte.aliasAutorComentario || 'Anónimo' }}</span>
                    </div>
                  </div>
                </div>
              }

              <!-- 3. MULTIMEDIA -->
              @if (reporte.idMultimedia) {
                <div class="border-t border-slate-100 pt-4 space-y-3">
                  <span class="text-xs font-bold text-slate-400 block uppercase">Evidencia / Imagen Denunciada</span>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    @if (reporte.urlMultimedia) {
                      <div class="relative group overflow-hidden rounded-xl border border-slate-200 shadow-sm max-h-64 bg-white flex justify-center items-center">
                        <img [src]="reporte.urlMultimedia" class="max-h-60 object-contain rounded" alt="Evidencia reportada" />
                      </div>
                      <div class="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                        <span>Autor subida: &#64;{{ reporte.aliasAutorMultimedia || 'Anónimo' }}</span>
                        <a [href]="reporte.urlMultimedia" target="_blank" class="text-[var(--ca-teal)] hover:underline flex items-center gap-1">
                          <i class="pi pi-external-link"></i> Ver pantalla completa
                        </a>
                      </div>
                    } @else {
                      <div class="text-center py-4 text-xs text-slate-450">
                        <i class="pi pi-image text-lg block mb-1"></i>
                        No hay vista previa disponible
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- 4. CONFIRMACION -->
              @if (reporte.idConfirmacion) {
                <div class="border-t border-slate-100 pt-4 space-y-3">
                  <span class="text-xs font-bold text-slate-400 block uppercase">Confirmación de Solución Denunciada</span>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                    <p class="text-xs text-slate-750 leading-relaxed italic">
                      "{{ reporte.observacionConfirmacion || 'Sin observaciones escritas' }}"
                    </p>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-200/60">
                      <span>Autor: &#64;{{ reporte.aliasAutorConfirmacion || 'Anónimo' }}</span>
                    </div>
                  </div>
                </div>
              }

              <!-- PARENT INCIDENCE INFO CARD FOR COMMENT, MULTIMEDIA OR CONFIRMATION -->
              @if ((reporte.idComentario || reporte.idMultimedia || reporte.idConfirmacion) && (reporte.idIncidenciaRelacionada || incidenciaDetalleCargado())) {
                <div class="border-t border-slate-100 pt-4 space-y-3">
                  <span class="text-xs font-bold text-slate-400 block uppercase">Incidencia Relacionada</span>
                  @if (incidenciaDetalleCargado(); as inc) {
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <h5 class="text-xs font-bold text-slate-800 line-clamp-1">{{ inc.titulo }}</h5>
                      <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{{ inc.descripcion }}</p>
                      <div class="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60">
                        <span>Categoría: {{ inc.nombreCategoria }}</span>
                        <span>Estado: {{ inc.nombreEstado }}</span>
                      </div>
                    </div>
                  } @else {
                    <div class="text-center py-2 text-xs text-slate-400">
                      <i class="pi pi-spin pi-spinner mr-2"></i>
                      Cargando detalles de la incidencia...
                    </div>
                  }
                </div>
              }

              <!-- NAVEGACIÓN A INCIDENCIA -->
              @if (incidenciaDetalleCargado(); as inc) {
                <div class="pt-2">
                  <a [routerLink]="['/incidencias', inc.idIncidencia]" target="_blank" class="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 text-xs font-bold transition">
                    <i class="pi pi-external-link"></i>
                    <span>Abrir Incidencia en Mapa / Detalle</span>
                  </a>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        @if (reporte.estadoRevision === 'PENDI_PENDIENTE' || reporte.estadoRevision === 'PENDIENTE') {
          <div class="border-t border-slate-150 p-6 bg-slate-50 grid grid-cols-2 gap-4 shrink-0">
            <button 
              (click)="confirmarDescartar(reporte)"
              class="w-full rounded-xl border border-slate-350 hover:bg-slate-100 text-slate-700 py-3 text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <i class="pi pi-times-circle"></i>
              <span>Descartar reporte</span>
            </button>
            <button 
              (click)="confirmarOcultar(reporte)"
              class="w-full rounded-xl bg-red-650 hover:bg-red-750 text-white py-3 text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <i class="pi pi-eye-slash"></i>
              <span>Ocultar contenido</span>
            </button>
          </div>
        } @else {
          <div class="border-t border-slate-150 p-6 bg-slate-50 text-center text-xs text-slate-400 italic shrink-0">
            Este reporte ya fue procesado y su resolución está marcada como: <strong class="text-slate-650 font-bold uppercase">{{ reporte.estadoRevision }}</strong>
          </div>
        }
      </div>
    }

    <!-- CONFIRMATION MODAL -->
    @if (showConfirmModal()) {
      <div class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div class="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4">
          <div class="flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-655 shrink-0">
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
export class ReportesContenidoPageComponent implements OnInit {
  readonly allLoadedReportes = signal<AdminReporteContenido[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalRecords = signal<number>(0);

  // Filter values
  filterEstado = 'PENDIENTE';
  readonly searchTerm = signal<string>('');
  readonly filterTipo = signal<string>('');
  readonly filterMotivo = signal<string>('');
  readonly filterFechaDesde = signal<string>('');
  readonly filterFechaHasta = signal<string>('');

  // Selected Report for detail drawer
  readonly selectedReport = signal<AdminReporteContenido | null>(null);
  readonly showDetailDrawer = signal<boolean>(false);
  readonly incidenciaDetalleCargado = signal<any | null>(null);

  // Confirmation Modal properties
  readonly showConfirmModal = signal<boolean>(false);
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  estadosOptions = [
    { label: 'Todos', value: '' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Aprobados (Ocultados)', value: 'APROBADO' },
    { label: 'Rechazados (Descartados)', value: 'RECHAZADO' },
  ];

  tiposOptions = [
    { label: 'Todos', value: '' },
    { label: 'Incidencia', value: 'INCIDENCIA' },
    { label: 'Comentario', value: 'COMENTARIO' },
    { label: 'Imagen/Multimedia', value: 'MULTIMEDIA' },
    { label: 'Confirmación', value: 'CONFIRMACION' },
  ];

  motivosOptions = [
    { label: 'Todos', value: '' },
    { label: 'Información incorrecta', value: 'Información incorrecta' },
    { label: 'Contenido ofensivo o inapropiado', value: 'Contenido ofensivo o inapropiado' },
    { label: 'Spam o duplicado', value: 'Spam o duplicado' },
    { label: 'Ubicación incorrecta', value: 'Ubicación incorrecta' },
    { label: 'Otro', value: 'Otro' },
  ];

  constructor(
    private readonly reportesService: ReportesModeracionService,
    private readonly incidenciasService: IncidenciasService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchReportes();
  }

  // Local filtering computed property
  readonly filteredReportes = computed(() => {
    let list = this.allLoadedReportes();
    const search = this.searchTerm().trim().toLowerCase();
    const tipo = this.filterTipo();
    const motivo = this.filterMotivo();
    const desde = this.filterFechaDesde();
    const hasta = this.filterFechaHasta();

    if (search) {
      list = list.filter(r => 
        (r.aliasUsuarioReporta ?? '').toLowerCase().includes(search) ||
        (r.emailUsuarioReporta ?? '').toLowerCase().includes(search) ||
        (r.detalle ?? '').toLowerCase().includes(search) ||
        (r.idIncidencia ?? '').toLowerCase().includes(search) ||
        (r.idComentario ?? '').toLowerCase().includes(search) ||
        (r.idMultimedia ?? '').toLowerCase().includes(search) ||
        (r.idConfirmacion ?? '').toLowerCase().includes(search) ||
        (r.motivo ?? '').toLowerCase().includes(search) ||
        (r.contenidoComentario ?? '').toLowerCase().includes(search) ||
        (r.tituloIncidencia ?? '').toLowerCase().includes(search) ||
        (r.observacionConfirmacion ?? '').toLowerCase().includes(search)
      );
    }

    if (tipo) {
      list = list.filter(r => {
        if (tipo === 'INCIDENCIA') return !!r.idIncidencia;
        if (tipo === 'COMENTARIO') return !!r.idComentario;
        if (tipo === 'MULTIMEDIA') return !!r.idMultimedia;
        if (tipo === 'CONFIRMACION') return !!r.idConfirmacion;
        return true;
      });
    }

    if (motivo) {
      list = list.filter(r => r.motivo === motivo);
    }

    if (desde) {
      const dateDesde = new Date(desde);
      list = list.filter(r => new Date(r.creadoEn) >= dateDesde);
    }

    if (hasta) {
      const dateHasta = new Date(hasta);
      dateHasta.setHours(23, 59, 59, 999);
      list = list.filter(r => new Date(r.creadoEn) <= dateHasta);
    }

    return list;
  });

  onFilterEstadoChange(value: string) {
    this.filterEstado = value;
    this.fetchReportes();
  }

  clearFilters() {
    this.filterEstado = 'PENDIENTE';
    this.searchTerm.set('');
    this.filterTipo.set('');
    this.filterMotivo.set('');
    this.filterFechaDesde.set('');
    this.filterFechaHasta.set('');
    this.fetchReportes();
  }

  fetchReportes() {
    this.loading.set(true);
    this.reportesService.list({
      estadoRevision: this.filterEstado || undefined,
      limit: 150, // Load 150 records for high usability and local filtering
      offset: 0,
    }).subscribe({
      next: (response) => {
        this.allLoadedReportes.set(response.data);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los reportes de contenido' });
        this.loading.set(false);
      }
    });
  }

  verDetalle(reporte: AdminReporteContenido) {
    this.selectedReport.set(reporte);
    this.incidenciaDetalleCargado.set(null);
    this.showDetailDrawer.set(true);
    
    // Resolve parent incidence ID: prefer idIncidenciaRelacionada from join, fallback to idIncidencia
    const idIncidencia = reporte.idIncidenciaRelacionada || reporte.idIncidencia;
    if (idIncidencia) {
      this.fetchIncidenciaDetail(idIncidencia);
    }
  }

  closeDetailDrawer() {
    this.showDetailDrawer.set(false);
    this.selectedReport.set(null);
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

  copiarAlPortapapeles(texto: string) {
    navigator.clipboard.writeText(texto).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'ID copiado al portapapeles' });
    });
  }

  confirm(title: string, message: string, action: () => void) {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmAction = action;
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

  confirmarOcultar(reporte: AdminReporteContenido) {
    this.confirm(
      'Ocultar contenido',
      '¿Seguro que deseas ocultar este contenido? Esta acción aceptará la denuncia y ocultará el contenido reportado de la plataforma.',
      () => {
        this.resolver(reporte, 'APROBADO');
      }
    );
  }

  confirmarDescartar(reporte: AdminReporteContenido) {
    this.confirm(
      'Descartar reporte',
      '¿Seguro que deseas descartar este reporte? La denuncia se marcará como rechazada y el contenido permanecerá visible.',
      () => {
        this.resolver(reporte, 'RECHAZADO');
      }
    );
  }

  obtenerTipoContenido(reporte: AdminReporteContenido): string {
    if (reporte.idIncidencia) return 'Incidencia';
    if (reporte.idComentario) return 'Comentario';
    if (reporte.idMultimedia) return 'Imagen/Multimedia';
    if (reporte.idConfirmacion) return 'Confirmación';
    return 'Desconocido';
  }

  obtenerSeverityTipo(reporte: AdminReporteContenido): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (reporte.idIncidencia) return 'danger';
    if (reporte.idComentario) return 'info';
    if (reporte.idMultimedia) return 'warn';
    if (reporte.idConfirmacion) return 'success';
    return 'secondary';
  }

  obtenerIdContenido(reporte: AdminReporteContenido): string {
    return reporte.idIncidencia || reporte.idComentario || reporte.idMultimedia || reporte.idConfirmacion || 'N/A';
  }

  obtenerSeverityEstado(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const val = estado.toUpperCase();
    if (val.includes('PEND')) return 'warn';
    if (val.includes('APROB') || val.includes('ACEPT')) return 'danger';
    if (val.includes('RECH') || val.includes('DESC')) return 'success';
    return 'secondary';
  }

  resolver(reporte: AdminReporteContenido, resolucion: 'APROBADO' | 'RECHAZADO') {
    this.reportesService.resolve(reporte.idReporteContenido, resolucion).subscribe({
      next: () => {
        reporte.estadoRevision = resolucion;
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Reporte Procesado', 
          detail: `Se ha marcado la denuncia como ${resolucion === 'APROBADO' ? 'aceptada (contenido ocultado)' : 'rechazada (descartada)'} con éxito.` 
        });
        this.closeDetailDrawer();
        
        // Remove from list if viewing pending ones
        if (this.filterEstado === 'PENDIENTE') {
          this.allLoadedReportes.set(this.allLoadedReportes().filter(r => r.idReporteContenido !== reporte.idReporteContenido));
          this.totalRecords.set(this.totalRecords() - 1);
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err.error?.message || 'Ocurrió un error al procesar el reporte.' 
        });
      }
    });
  }
}
