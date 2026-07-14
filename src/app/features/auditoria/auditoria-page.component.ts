import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuditoriaService, AuditoriaFilters } from '../../core/services/auditoria.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { AuditoriaEvento } from '../../core/models/auditoria-evento.model';

@Component({
  selector: 'app-auditoria-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    ToastModule,
    ButtonModule,
  ],
  providers: [MessageService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>
      
      <!-- Compact Admin Header -->
      <div class="ca-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ca-gold)] block">Panel de Trazabilidad</span>
          <h2 class="text-2xl font-bold text-[var(--ca-navy)] mt-1">Auditoría de Eventos</h2>
          <p class="text-xs text-slate-500 mt-1 max-w-2xl">
            Consulta y analiza el historial cronológico de acciones y cambios realizados por usuarios y procesos en el sistema.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="fetchEventos()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
            <i class="pi pi-refresh"></i>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div class="ca-panel p-6">
        <!-- Filtros de búsqueda -->
        <div class="mb-6 bg-slate-50 p-5 rounded-[var(--ca-radius)] border border-slate-100 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Usuario Ejecutor (Alias, email o UUID) -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Usuario Ejecutor</label>
              <input pInputText type="text" [(ngModel)]="filterUsuarioEjecutor" placeholder="Alias, email o UUID..." class="w-full bg-white rounded-xl border border-slate-250 py-2 px-3 text-sm" (keyup.enter)="applyFilters()" />
            </div>

            <!-- Entidad Afectada -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Entidad</label>
              <p-select [options]="entidadesOptions" [(ngModel)]="filterEntidad" optionLabel="label" optionValue="value" placeholder="Todas las entidades" styleClass="w-full bg-white border border-slate-250" (onChange)="applyFilters()"></p-select>
            </div>

            <!-- Acción Realizada -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Acción</label>
              <p-select [options]="accionesOptions" [(ngModel)]="filterAccion" optionLabel="label" optionValue="value" placeholder="Todas las acciones" styleClass="w-full bg-white border border-slate-250" (onChange)="applyFilters()"></p-select>
            </div>

            <!-- Rango Fechas: Desde -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase">Desde</label>
              <p-datepicker [(ngModel)]="filterFechaInicio" placeholder="Fecha de inicio" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full bg-white border border-slate-250" (onChange)="applyFilters()"></p-datepicker>
            </div>

          </div>

          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-200/60">
            <!-- Rango Fechas: Hasta -->
            <div class="flex flex-col gap-1.5 w-full sm:max-w-xs">
              <label class="text-xs font-bold text-slate-500 uppercase">Hasta</label>
              <p-datepicker [(ngModel)]="filterFechaFin" placeholder="Fecha de fin" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full bg-white border border-slate-250" (onChange)="applyFilters()"></p-datepicker>
            </div>

            <!-- Botones Filtros -->
            <div class="flex items-center gap-2 self-end w-full sm:w-auto">
              <button (click)="clearFilters()" class="flex-1 sm:flex-none justify-center rounded-xl border border-slate-250 hover:bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-650 transition cursor-pointer flex items-center gap-2">
                <i class="pi pi-filter-slash"></i>
                <span>Limpiar Filtros</span>
              </button>
              <button (click)="applyFilters()" class="flex-1 sm:flex-none justify-center rounded-xl bg-[var(--ca-navy)] hover:bg-[var(--ca-navy)]/90 px-6 py-2.5 text-xs font-bold text-white transition cursor-pointer flex items-center gap-2">
                <i class="pi pi-filter"></i>
                <span>Filtrar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla de Auditoría con filas expandibles -->
        <p-table 
          [value]="eventos()" 
          dataKey="idEvento"
          [lazy]="true" 
          (onLazyLoad)="loadEventos($event)" 
          [paginator]="true" 
          [rows]="rows" 
          [totalRecords]="totalRecords()" 
          [loading]="loading()" 
          responsiveLayout="stack" 
          styleClass="p-datatable-sm ca-clean-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem"></th>
              <th>Fecha y Hora</th>
              <th>Usuario Ejecutor</th>
              <th>Entidad / ID</th>
              <th>Acción</th>
              <th>Descripción</th>
              <th>Origen IP</th>
              <th style="width: 7rem" class="text-center">Acciones</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-evento let-expanded="expanded">
            <tr class="hover:bg-slate-50/45 cursor-pointer transition-colors" (click)="verDetalle(evento)">
              <td>
                <button type="button" [pRowToggler]="evento" (click)="$event.stopPropagation()" class="p-button-text p-button-rounded p-button-plain p-button-sm border-0 bg-transparent text-slate-500 hover:text-slate-800 transition cursor-pointer p-1">
                  <i class="pi" [ngClass]="expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                </button>
              </td>
              <td class="text-xs text-slate-650 font-medium">
                {{ evento.creadoEn | date:'medium' }}
              </td>
              <td>
                <div *ngIf="evento.idUsuario">
                  <div class="font-bold text-xs text-slate-800">&#64;{{ evento.aliasPublicoUsuario || 'Usuario registrado' }}</div>
                  <div class="text-[10px] text-slate-400 font-medium">{{ evento.emailUsuario }}</div>
                </div>
                <div *ngIf="!evento.idUsuario" class="text-slate-400 text-xs italic font-medium">
                  Sistema / Anónimo
                </div>
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider w-fit" [ngClass]="getEntidadClass(evento.entidad)">
                    {{ formatEntidadLabel(evento.entidad) }}
                  </span>
                  <div class="flex items-center gap-1 mt-0.5" *ngIf="evento.idEntidad">
                    <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50" [title]="evento.idEntidad">
                      {{ evento.idEntidad.substring(0, 8) }}...
                    </span>
                    <button (click)="copiarAlPortapapeles($event, evento.idEntidad)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-0.5" title="Copiar ID Entidad">
                      <i class="pi pi-copy text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </td>
              <td>
                <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide inline-block" [ngClass]="getAccionBadgeClass(evento.accion)">
                  {{ formatAccionLabel(evento.accion) }}
                </span>
              </td>
              <td>
                <span class="text-xs text-slate-600 font-medium leading-relaxed">
                  {{ getDescripcionCorta(evento) }}
                </span>
              </td>
              <td>
                <div class="text-xs font-semibold text-slate-650">{{ evento.ipOrigen }}</div>
                <div class="text-[10px] text-slate-400 truncate max-w-[130px] font-medium" [title]="evento.userAgent">
                  {{ parseUserAgent(evento.userAgent) }}
                </div>
              </td>
              <td>
                <div class="flex items-center justify-center gap-1.5">
                  <button (click)="$event.stopPropagation(); verDetalle(evento)" class="p-button-text p-button-rounded text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-1 bg-transparent border-0 hover:bg-slate-100" title="Ver Detalle Completo">
                    <i class="pi pi-eye text-sm"></i>
                  </button>
                  <button (click)="copiarAlPortapapeles($event, evento.idEvento)" class="p-button-text p-button-rounded text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 bg-transparent border-0 hover:bg-slate-100" title="Copiar ID Evento">
                    <i class="pi pi-copy text-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <!-- Detalles del cambio expandidos (Opción B) -->
          <ng-template pTemplate="rowexpansion" let-evento>
            <tr>
              <td colspan="8" class="p-4 bg-slate-50 border-y border-slate-100">
                <div class="bg-white rounded-[var(--ca-radius)] border border-slate-150 p-6 shadow-sm space-y-6">
                  <!-- Grid de Info del Evento -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Bloque Usuario -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario Ejecutor</span>
                      <div class="flex items-center gap-2.5">
                        <span class="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                          {{ evento.aliasPublicoUsuario ? evento.aliasPublicoUsuario.slice(0, 2).toUpperCase() : 'SI' }}
                        </span>
                        <div>
                          <span class="block text-xs font-bold text-slate-800" *ngIf="evento.idUsuario">&#64;{{ evento.aliasPublicoUsuario }}</span>
                          <span class="block text-xs font-bold text-slate-800" *ngIf="!evento.idUsuario">Sistema / Anónimo</span>
                          <span class="block text-[10px] text-slate-400 font-medium" *ngIf="evento.idUsuario">{{ evento.emailUsuario }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Bloque Entidad -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entidad Afectada</span>
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider w-fit" [ngClass]="getEntidadClass(evento.entidad)">
                          {{ formatEntidadLabel(evento.entidad) }}
                        </span>
                        <div class="flex items-center gap-1" *ngIf="evento.idEntidad">
                          <span class="font-mono text-[10px] text-slate-650 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {{ evento.idEntidad }}
                          </span>
                          <button (click)="copiarAlPortapapeles($event, evento.idEntidad)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-0.5" title="Copiar ID Entidad">
                            <i class="pi pi-copy text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Bloque Acción -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acción Realizada</span>
                      <div>
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="getAccionBadgeClass(evento.accion)">
                          {{ formatAccionLabel(evento.accion) }}
                        </span>
                      </div>
                    </div>

                    <!-- Bloque Fecha & Origen -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha y Hora / IP</span>
                      <div class="text-xs text-slate-700">
                        <div class="font-semibold">{{ evento.creadoEn | date:'medium' }}</div>
                        <div class="text-[10px] text-slate-500">IP: {{ evento.ipOrigen }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Fila de User Agent -->
                  <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                    <i class="pi pi-desktop text-slate-400 mt-0.5"></i>
                    <div class="text-[11px] text-slate-600 leading-normal">
                      <span class="font-bold text-slate-500 uppercase tracking-wider mr-1">User-Agent:</span>
                      {{ evento.userAgent || 'N/A' }}
                    </div>
                  </div>

                  <!-- Observación o Resumen -->
                  <div class="space-y-1 bg-teal-50/30 border border-teal-100/50 p-4 rounded-xl">
                    <span class="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Resumen del Evento</span>
                    <p class="text-xs text-slate-700 font-medium">
                      {{ getDescripcionCorta(evento) }}
                    </p>
                  </div>

                  <!-- Valores Anteriores / Nuevos (JSON) -->
                  <div class="grid md:grid-cols-2 gap-4 pt-2">
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-500 uppercase">Valor Anterior</span>
                        <button *ngIf="evento.valorAnterior" (click)="copiarAlPortapapeles($event, evento.valorAnterior)" class="text-slate-400 hover:text-slate-600 text-[10px] flex items-center gap-1 cursor-pointer">
                          <i class="pi pi-copy text-[10px]"></i> Copiar JSON
                        </button>
                      </div>
                      <pre class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono overflow-auto max-h-[220px] leading-relaxed text-slate-650">{{ formatJson(evento.valorAnterior) }}</pre>
                    </div>
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-500 uppercase">Valor Nuevo</span>
                        <button *ngIf="evento.valorNuevo" (click)="copiarAlPortapapeles($event, evento.valorNuevo)" class="text-slate-400 hover:text-slate-600 text-[10px] flex items-center gap-1 cursor-pointer">
                          <i class="pi pi-copy text-[10px]"></i> Copiar JSON
                        </button>
                      </div>
                      <pre class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono overflow-auto max-h-[220px] leading-relaxed text-slate-650">{{ formatJson(evento.valorNuevo) }}</pre>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- DETAIL DRAWER -->
    <div *ngIf="showDetailDrawer() && selectedEvento() as evento">
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs transition-opacity" (click)="closeDetailDrawer()"></div>
      
      <!-- Drawer Container -->
      <div class="fixed inset-y-0 right-0 z-[1001] flex h-full w-full max-w-xl transform flex-col bg-white shadow-[0_20px_60px_rgba(17,24,39,0.18)] transition-transform duration-300">
        <!-- Header -->
        <div class="bg-[var(--ca-navy)] text-white p-6 flex items-center justify-between shrink-0">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-gold)]">Detalle del Evento</span>
            <h3 class="text-lg font-bold mt-1">ID: {{ evento.idEvento }}</h3>
          </div>
          <button (click)="closeDetailDrawer()" class="text-white hover:text-slate-200 transition cursor-pointer p-1">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Resumen General -->
          <div class="bg-slate-50 p-4 rounded-[var(--ca-radius)] border border-slate-100 space-y-3">
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acción Realizada</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 inline-block" [ngClass]="getAccionBadgeClass(evento.accion)">
                {{ formatAccionLabel(evento.accion) }}
              </span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción del Evento</span>
              <span class="text-sm font-semibold text-slate-700 block mt-1 leading-normal">{{ getDescripcionCorta(evento) }}</span>
            </div>
          </div>

          <!-- Usuario Ejecutor -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-400 tracking-wider uppercase">Usuario Ejecutor</h4>
            <div class="bg-white border border-slate-250 rounded-[var(--ca-radius)] p-4 flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 font-bold text-sm">
                {{ evento.aliasPublicoUsuario ? evento.aliasPublicoUsuario.slice(0, 2).toUpperCase() : 'SI' }}
              </span>
              <div class="flex-1 min-w-0">
                <span class="block font-semibold text-sm text-slate-800" *ngIf="evento.idUsuario">&#64;{{ evento.aliasPublicoUsuario }}</span>
                <span class="block font-semibold text-sm text-slate-850" *ngIf="!evento.idUsuario">Sistema / Anónimo</span>
                <span class="block text-xs text-slate-400 font-medium truncate" *ngIf="evento.idUsuario">{{ evento.emailUsuario }}</span>
              </div>
              <button *ngIf="evento.idUsuario" (click)="copiarAlPortapapeles($event, evento.idUsuario)" class="text-slate-400 hover:text-[var(--ca-teal)] transition p-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer" title="Copiar ID de Usuario">
                <i class="pi pi-copy text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Entidad Afectada -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-400 tracking-wider uppercase">Entidad Relacionada</h4>
            <div class="bg-white border border-slate-250 rounded-[var(--ca-radius)] p-4 space-y-3">
              <div class="flex justify-between items-center gap-4">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Tipo de Entidad</span>
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider w-fit inline-block mt-1" [ngClass]="getEntidadClass(evento.entidad)">
                    {{ formatEntidadLabel(evento.entidad) }}
                  </span>
                </div>
                <div class="text-right" *ngIf="evento.idEntidad">
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">ID de Entidad</span>
                  <div class="flex items-center gap-1.5 mt-1 justify-end">
                    <span class="font-mono text-xs text-slate-650 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {{ evento.idEntidad }}
                    </span>
                    <button (click)="copiarAlPortapapeles($event, evento.idEntidad)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-1 bg-slate-50 rounded border border-slate-200" title="Copiar ID">
                      <i class="pi pi-copy text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Botón de Navegación a Entidad Relacionada -->
              <div class="pt-2 border-t border-slate-100 flex justify-end animate-fade-in" *ngIf="tieneRutaEntidad(evento)">
                <a [routerLink]="getRutaEntidad(evento)" (click)="closeDetailDrawer()" class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--ca-teal)] hover:bg-[var(--ca-teal)]/90 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">
                  <i class="pi pi-external-link"></i>
                  <span>Ver {{ formatEntidadLabel(evento.entidad) }}</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Datos Técnicos / Origen -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-400 tracking-wider uppercase">Detalles Técnicos</h4>
            <div class="bg-white border border-slate-250 rounded-[var(--ca-radius)] p-4 space-y-3 text-xs text-slate-700">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Fecha y Hora Completa</span>
                  <span class="font-semibold block mt-1">{{ evento.creadoEn | date:'medium' }}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">IP Origen</span>
                  <span class="font-semibold block mt-1">{{ evento.ipOrigen }}</span>
                </div>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 block uppercase">Navegador / Dispositivo</span>
                <span class="font-semibold block mt-1 text-slate-750">{{ parseUserAgent(evento.userAgent) }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 block uppercase">User-Agent Completo</span>
                <pre class="mt-1 bg-slate-50 border border-slate-200 p-2.5 rounded-lg font-mono text-[10px] overflow-auto whitespace-pre-wrap max-h-[80px] text-slate-500 leading-normal">{{ evento.userAgent || 'N/A' }}</pre>
              </div>
            </div>
          </div>

          <!-- Valores Anteriores y Nuevos (JSON) -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-slate-400 tracking-wider uppercase">Payload de Datos (JSON)</h4>
            
            <div class="space-y-4">
              <!-- Anterior -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Valor Anterior</span>
                  <button *ngIf="evento.valorAnterior" (click)="copiarAlPortapapeles($event, evento.valorAnterior)" class="text-slate-400 hover:text-slate-700 text-[10px] flex items-center gap-1 font-medium cursor-pointer">
                    <i class="pi pi-copy"></i> Copiar
                  </button>
                </div>
                <pre class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] font-mono overflow-auto max-h-[180px] text-slate-650 leading-relaxed">{{ formatJson(evento.valorAnterior) }}</pre>
              </div>

              <!-- Nuevo -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Valor Nuevo</span>
                  <button *ngIf="evento.valorNuevo" (click)="copiarAlPortapapeles($event, evento.valorNuevo)" class="text-slate-400 hover:text-slate-700 text-[10px] flex items-center gap-1 font-medium cursor-pointer">
                    <i class="pi pi-copy"></i> Copiar
                  </button>
                </div>
                <pre class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] font-mono overflow-auto max-h-[180px] text-slate-650 leading-relaxed">{{ formatJson(evento.valorNuevo) }}</pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class AuditoriaPageComponent implements OnInit {
  readonly eventos = signal<AuditoriaEvento[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly rows = 20;
  private currentOffset = 0;

  // Filtros
  filterUsuarioEjecutor = '';
  resolvedUsuarioId = '';
  filterEntidad = '';
  filterAccion = '';
  filterFechaInicio: Date | null = null;
  filterFechaFin: Date | null = null;

  // Drawer
  readonly showDetailDrawer = signal<boolean>(false);
  readonly selectedEvento = signal<AuditoriaEvento | null>(null);

  entidadesOptions = [
    { label: 'Todas las entidades', value: '' },
    { label: 'Usuario', value: 'USUARIO' },
    { label: 'Incidencia', value: 'INCIDENCIA' },
    { label: 'Comentario', value: 'COMENTARIO' },
    { label: 'Reporte de Contenido', value: 'REPORTE_CONTENIDO' },
    { label: 'Voto', value: 'VOTO' },
    { label: 'Parámetro de Sistema', value: 'PARAMETRO_SISTEMA' }
  ];

  accionesOptions = [
    { label: 'Todas las acciones', value: '' },
    { label: 'Autenticación', value: 'AUTENTICACION' },
    { label: 'Registro de Usuario', value: 'REGISTRO' },
    { label: 'Creación', value: 'CREAR' },
    { label: 'Edición Perfil', value: 'EDICION_PERFIL' },
    { label: 'Cambio de Estado', value: 'CAMBIO_ESTADO' },
    { label: 'Cambio Estado Denegado', value: 'CAMBIO_ESTADO_DENEGADO' },
    { label: 'Relación de Incidencia', value: 'RELACIONAR' },
    { label: 'Ocultar/Eliminar', value: 'ELIMINAR' },
    { label: 'Aprobar Reporte', value: 'APROBAR_REPORTE' },
    { label: 'Rechazar Reporte', value: 'RECHAZAR_REPORTE' }
  ];

  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly userService: UserProfileService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchEventos();
  }

  loadEventos(event: TableLazyLoadEvent) {
    this.currentOffset = event.first ?? 0;
    this.fetchEventos();
  }

  applyFilters() {
    this.currentOffset = 0;
    this.resolveUserAndFetchEventos();
  }

  clearFilters() {
    this.filterUsuarioEjecutor = '';
    this.resolvedUsuarioId = '';
    this.filterEntidad = '';
    this.filterAccion = '';
    this.filterFechaInicio = null;
    this.filterFechaFin = null;
    this.currentOffset = 0;
    this.fetchEventos();
  }

  private resolveUserAndFetchEventos() {
    const queryUser = this.filterUsuarioEjecutor.trim();
    if (!queryUser) {
      this.resolvedUsuarioId = '';
      this.fetchEventos();
      return;
    }

    // Si es un UUID válido, lo usamos directamente
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(queryUser)) {
      this.resolvedUsuarioId = queryUser;
      this.fetchEventos();
      return;
    }

    this.loading.set(true);

    // Intentamos buscar por alias público primero
    this.userService.listUsersAdmin({
      aliasPublico: queryUser,
      limit: 5
    }).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          // Buscamos coincidencia exacta o tomamos el primero
          const match = res.data.find(u => u.aliasPublico.toLowerCase() === queryUser.toLowerCase());
          this.resolvedUsuarioId = match ? match.idUsuario : res.data[0].idUsuario;
          this.fetchEventos();
        } else {
          // Intentamos por email
          this.userService.listUsersAdmin({
            email: queryUser,
            limit: 5
          }).subscribe({
            next: (resEmail) => {
              if (resEmail.data && resEmail.data.length > 0) {
                const matchEmail = resEmail.data.find(u => u.email.toLowerCase() === queryUser.toLowerCase());
                this.resolvedUsuarioId = matchEmail ? matchEmail.idUsuario : resEmail.data[0].idUsuario;
              } else {
                // No se encontró ningún usuario. Para evitar traer todos los eventos,
                // enviamos un UUID dummy que garantice 0 resultados.
                this.resolvedUsuarioId = '00000000-0000-0000-0000-000000000000';
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Sin coincidencias',
                  detail: `No se encontró ningún usuario con alias o email "${queryUser}"`
                });
              }
              this.fetchEventos();
            },
            error: () => {
              this.resolvedUsuarioId = '00000000-0000-0000-0000-000000000000';
              this.fetchEventos();
            }
          });
        }
      },
      error: () => {
        this.resolvedUsuarioId = '00000000-0000-0000-0000-000000000000';
        this.fetchEventos();
      }
    });
  }

  fetchEventos() {
    this.loading.set(true);

    const filters: AuditoriaFilters = {
      idUsuario: this.resolvedUsuarioId || undefined,
      entidad: this.filterEntidad || undefined,
      accion: this.filterAccion || undefined,
      limit: this.rows,
      offset: this.currentOffset,
    };

    if (this.filterFechaInicio) {
      filters.fechaInicio = new Date(this.filterFechaInicio).toISOString();
    }
    if (this.filterFechaFin) {
      const copyFin = new Date(this.filterFechaFin);
      copyFin.setHours(23, 59, 59, 999);
      filters.fechaFin = copyFin.toISOString();
    }

    this.auditoriaService.list(filters).subscribe({
      next: (response) => {
        this.eventos.set(response.data);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los eventos de auditoría' });
        this.loading.set(false);
      }
    });
  }

  // Helpers para mapeo de labels visuales y badges

  formatEntidadLabel(entidad: string): string {
    if (!entidad) return 'N/A';
    const ent = entidad.toUpperCase();
    switch (ent) {
      case 'USUARIO': return 'Usuario';
      case 'INCIDENCIA': return 'Incidencia';
      case 'COMENTARIO': return 'Comentario';
      case 'REPORTE_CONTENIDO': return 'Reporte de Contenido';
      case 'VOTO': return 'Voto';
      case 'BARRIO': return 'Barrio';
      case 'CATEGORIA': return 'Categoría';
      case 'CATALOGO': return 'Catálogo';
      case 'PARAMETRO_SISTEMA': return 'Parámetro de Sistema';
      default:
        return ent.replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  getEntidadClass(entidad: string): string {
    const ent = (entidad || '').toUpperCase();
    switch (ent) {
      case 'INCIDENCIA': return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'USUARIO': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'COMENTARIO': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'REPORTE_CONTENIDO': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-50 text-slate-650 border border-slate-200';
    }
  }

  formatAccionLabel(accion: string): string {
    if (!accion) return 'Desconocido';
    const act = accion.toUpperCase();
    switch (act) {
      case 'AUTENTICACION': return 'Autenticación';
      case 'REGISTRO': return 'Registro de usuario';
      case 'CREAR':
      case 'CREACION': return 'Creación';
      case 'EDICION_PERFIL': return 'Edición de perfil';
      case 'CAMBIO_ESTADO': return 'Cambio de estado';
      case 'CAMBIO_ESTADO_DENEGADO': return 'Cambio de estado denegado';
      case 'RELACIONAR':
      case 'RELACION_CREAR': return 'Relación de incidencia';
      case 'RELACION_ELIMINAR': return 'Eliminación de relación';
      case 'ELIMINAR':
      case 'ELIMINACION': return 'Eliminación';
      case 'OCULTAR': return 'Ocultar contenido';
      case 'APROBAR_REPORTE': return 'Aprobación de reporte';
      case 'RECHAZAR_REPORTE': return 'Rechazo de reporte';
      default:
        return act.replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  getAccionBadgeClass(accion: string): string {
    const act = (accion || '').toUpperCase();
    if (act.includes('AUTENTICACION') || act.includes('REGISTRO')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
    if (act.includes('CREAR') || act.includes('CREACION')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    if (act.includes('EDICION') || act.includes('PERFIL') || act.includes('MODERAR')) {
      return 'bg-teal-50 text-teal-700 border border-teal-200';
    }
    if (act.includes('ELIMINAR') || act.includes('ELIMINACION') || act.includes('OCULTAR') || act.includes('DENEGADO')) {
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
    if (act.includes('RELACIONAR') || act.includes('RELACION')) {
      return 'bg-violet-50 text-violet-700 border border-violet-200';
    }
    if (act.includes('CAMBIO_ESTADO') || act.includes('ESTADO')) {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border border-slate-200';
  }

  getDescripcionCorta(evento: AuditoriaEvento): string {
    const user = evento.aliasPublicoUsuario || 'Sistema';
    const action = this.formatAccionLabel(evento.accion);
    const entity = this.formatEntidadLabel(evento.entidad);
    
    if (evento.accion === 'AUTENTICACION') {
      return `${user} inició sesión en la plataforma`;
    }
    if (evento.accion === 'REGISTRO') {
      return `${user} se registró en el sistema`;
    }
    return `${action} sobre la entidad ${entity}`;
  }

  parseUserAgent(userAgent: string | null): string {
    if (!userAgent) return 'Desconocido';
    const ua = userAgent.toLowerCase();
    
    // OS
    let os = 'OS Desconocido';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    else if (ua.includes('linux')) os = 'Linux';
    
    // Browser
    let browser = 'Navegador';
    if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
    
    return `${browser} (${os})`;
  }

  formatJson(value: string | null): string {
    if (!value) return '(vacío)';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  tieneRutaEntidad(evento: AuditoriaEvento): boolean {
    if (!evento.idEntidad) return false;
    const ent = (evento.entidad || '').toUpperCase();
    return ent === 'INCIDENCIA' || ent === 'INCIDENCIA_RELACIONADA' || ent === 'USUARIO';
  }

  getRutaEntidad(evento: AuditoriaEvento): string | any[] {
    if (!evento.idEntidad) return '';
    const ent = (evento.entidad || '').toUpperCase();
    if (ent === 'INCIDENCIA' || ent === 'INCIDENCIA_RELACIONADA') {
      return `/incidencias/${evento.idEntidad}`;
    }
    if (ent === 'USUARIO') {
      return `/admin/usuarios`;
    }
    return '';
  }

  // Acciones en la UI
  copiarAlPortapapeles(event: Event, texto: string) {
    event.stopPropagation();
    navigator.clipboard.writeText(texto).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado',
        detail: 'Contenido copiado al portapapeles',
        life: 2000
      });
    });
  }

  verDetalle(evento: AuditoriaEvento) {
    this.selectedEvento.set(evento);
    this.showDetailDrawer.set(true);
  }

  closeDetailDrawer() {
    this.showDetailDrawer.set(false);
    this.selectedEvento.set(null);
  }
}
