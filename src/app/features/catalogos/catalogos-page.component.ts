import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CategoriaIncidencia, EstadoIncidencia } from '../../core/models/catalogo.model';
import { CatalogosService } from '../../core/services/catalogos.service';

@Component({
  selector: 'app-catalogos-page',
  standalone: true,
  imports: [TableModule, CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Compact Admin Header -->
      <div class="bg-white p-6 rounded-[var(--ca-radius-lg)] border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ca-teal)] block">Catálogos y Reglas</span>
          <h2 class="text-2xl font-bold text-[var(--ca-navy)] mt-1">Diccionarios y Parámetros del Sistema</h2>
          <p class="text-xs text-slate-500 mt-1 max-w-2xl">
            Consulta los tipos de incidencias, estados del flujo, niveles de reputación, notificaciones y reglas de gamificación del sistema.
          </p>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="flex border-b border-slate-200 bg-slate-50 px-4 rounded-t-2xl overflow-x-auto scrollbar-none shrink-0">
        <button 
          (click)="activeTab.set('categorias')" 
          [class.border-[var(--ca-teal)]]="activeTab() === 'categorias'"
          [class.text-[var(--ca-teal)]]="activeTab() === 'categorias'"
          class="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
        >
          Categorías
        </button>
        <button 
          (click)="activeTab.set('estados')" 
          [class.border-[var(--ca-teal)]]="activeTab() === 'estados'"
          [class.text-[var(--ca-teal)]]="activeTab() === 'estados'"
          class="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
        >
          Estados
        </button>
        <button 
          (click)="activeTab.set('gamificacion')" 
          [class.border-[var(--ca-teal)]]="activeTab() === 'gamificacion'"
          [class.text-[var(--ca-teal)]]="activeTab() === 'gamificacion'"
          class="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
        >
          Reglas de Puntos
        </button>
        <button 
          (click)="activeTab.set('niveles')" 
          [class.border-[var(--ca-teal)]]="activeTab() === 'niveles'"
          [class.text-[var(--ca-teal)]]="activeTab() === 'niveles'"
          class="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
        >
          Niveles de Usuario
        </button>
        <button 
          (click)="activeTab.set('notificaciones')" 
          [class.border-[var(--ca-teal)]]="activeTab() === 'notificaciones'"
          [class.text-[var(--ca-teal)]]="activeTab() === 'notificaciones'"
          class="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent hover:text-[var(--ca-teal)] transition-colors cursor-pointer whitespace-nowrap"
        >
          Notificaciones
        </button>
      </div>

      <!-- Tab Contents -->
      <div class="rounded-b-2xl border-x border-b border-slate-100 bg-white p-6 shadow-sm space-y-4">
        
        <!-- Categorías Tab -->
        @if (activeTab() === 'categorias') {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Categorías de Incidencia</h3>
                <p class="text-[11px] text-slate-400">Listado de tipos de reportes que los ciudadanos pueden levantar.</p>
              </div>
              <span class="px-2.5 py-1 bg-slate-100 text-slate-650 rounded text-xs font-bold border border-slate-200">Solo lectura</span>
            </div>
            
            <p-table [value]="categorias()" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Icono</th>
                  <th>Color</th>
                  <th>Requiere Foto</th>
                  <th>Descripción</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-categoria>
                <tr class="hover:bg-slate-50/20">
                  <td class="font-mono text-xs text-slate-500">{{ categoria.codigo }}</td>
                  <td class="font-bold text-slate-850 text-sm">{{ categoria.nombre }}</td>
                  <td class="text-slate-600"><span class="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">{{ categoria.icono }}</span></td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full border border-slate-200" [style.background-color]="categoria.colorHex"></span>
                      <span class="font-mono text-xs">{{ categoria.colorHex }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-bold" [ngClass]="categoria.requiereFoto ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-550 border border-slate-200'">
                      {{ categoria.requiereFoto ? 'Obligatorio' : 'Opcional' }}
                    </span>
                  </td>
                  <td class="text-xs text-slate-600 leading-normal max-w-sm">{{ categoria.descripcion || 'Sin descripción.' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }

        <!-- Estados Tab -->
        @if (activeTab() === 'estados') {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Estados de Incidencia</h3>
                <p class="text-[11px] text-slate-400">Estados por los que pasa una incidencia desde su reporte hasta su solución.</p>
              </div>
              <span class="px-2.5 py-1 bg-slate-100 text-slate-650 rounded text-xs font-bold border border-slate-200">Solo lectura</span>
            </div>

            <p-table [value]="estados()" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 5rem">Orden</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Estado Final</th>
                  <th>Descripción</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-estado>
                <tr class="hover:bg-slate-50/20">
                  <td class="font-bold text-sm text-[var(--ca-navy)]">{{ estado.ordenFlujo }}</td>
                  <td class="font-mono text-xs text-slate-500">{{ estado.codigo }}</td>
                  <td class="font-semibold text-slate-850 text-sm">{{ estado.nombre }}</td>
                  <td>
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-bold" [ngClass]="estado.esEstadoFinal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'">
                      {{ estado.esEstadoFinal ? 'Sí (Cierre)' : 'No (Abierto)' }}
                    </span>
                  </td>
                  <td class="text-xs text-slate-600 leading-normal max-w-sm">{{ estado.descripcion || 'Sin descripción.' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }

        <!-- Gamificación Tab -->
        @if (activeTab() === 'gamificacion') {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Reglas de Puntos (Gamificación)</h3>
                <p class="text-[11px] text-slate-400">Puntos otorgados a los ciudadanos por sus contribuciones a la comunidad.</p>
              </div>
              <span class="px-2.5 py-1 bg-slate-100 text-slate-650 rounded text-xs font-bold border border-slate-200">Sistema</span>
            </div>

            <p-table [value]="gamificacionReglas" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style="width: 8rem" class="text-center">Puntos otorgados</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-regla>
                <tr class="hover:bg-slate-50/20">
                  <td class="font-mono text-xs text-slate-500">{{ regla.codigo }}</td>
                  <td class="font-bold text-slate-850 text-sm">{{ regla.nombre }}</td>
                  <td class="text-xs text-slate-600 leading-normal">{{ regla.descripcion }}</td>
                  <td class="text-center font-bold text-emerald-600 text-sm">+{{ regla.puntos }} pts</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }

        <!-- Niveles Tab -->
        @if (activeTab() === 'niveles') {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Niveles de Reputación Ciudadana</h3>
                <p class="text-[11px] text-slate-400">Rangos de nivel alcanzables en base a los puntos acumulados.</p>
              </div>
              <span class="px-2.5 py-1 bg-slate-100 text-slate-650 rounded text-xs font-bold border border-slate-200">Sistema</span>
            </div>

            <p-table [value]="nivelesUsuario" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Código</th>
                  <th>Nombre Rango</th>
                  <th>Rango de Puntos</th>
                  <th>Icono Representativo</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-nivel>
                <tr class="hover:bg-slate-50/20">
                  <td class="font-mono text-xs text-slate-500">{{ nivel.codigo }}</td>
                  <td class="font-bold text-slate-850 text-sm">{{ nivel.nombre }}</td>
                  <td class="text-xs font-semibold text-slate-700">
                    {{ nivel.puntosMin }} - {{ nivel.puntosMax === 999999 ? '∞' : nivel.puntosMax }} pts
                  </td>
                  <td>
                    <span class="flex items-center gap-1.5 font-bold text-xs text-amber-600">
                      <i class="pi pi-star-fill text-amber-500"></i>
                      <span>{{ nivel.icono }}</span>
                    </span>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }

        <!-- Notificaciones Tab -->
        @if (activeTab() === 'notificaciones') {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Tipos de Notificaciones</h3>
                <p class="text-[11px] text-slate-400">Eventos del sistema que disparan notificaciones al ciudadano.</p>
              </div>
              <span class="px-2.5 py-1 bg-slate-100 text-slate-650 rounded text-xs font-bold border border-slate-200">Sistema</span>
            </div>

            <p-table [value]="tiposNotificacion" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Código</th>
                  <th>Nombre Evento</th>
                  <th>Descripción del Disparador</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-notif>
                <tr class="hover:bg-slate-50/20">
                  <td class="font-mono text-xs text-slate-500">{{ notif.codigo }}</td>
                  <td class="font-bold text-slate-850 text-sm">{{ notif.nombre }}</td>
                  <td class="text-xs text-slate-650 leading-normal">{{ notif.descripcion }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }

      </div>
    </div>
  `,
})
export class CatalogosPageComponent implements OnInit {
  readonly categorias = signal<CategoriaIncidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  readonly activeTab = signal<string>('categorias');

  gamificacionReglas = [
    { codigo: 'REPORTE_CREADO', nombre: 'Crear Reporte', descripcion: 'Puntos por registrar una nueva incidencia.', puntos: 10 },
    { codigo: 'REPORTE_CONFIRMADO', nombre: 'Reporte Validado', descripcion: 'Puntos extra si la comunidad valida tu reporte.', puntos: 20 },
    { codigo: 'VOTO_EMITIDO', nombre: 'Colaborar Votando', descripcion: 'Puntos por validar o refutar el reporte de un vecino.', puntos: 2 },
    { codigo: 'CONFIRMACION_SOLUCION', nombre: 'Confirmar Solución', descripcion: 'Confirmar con evidencia que un problema se resolvió.', puntos: 15 }
  ];

  nivelesUsuario = [
    { codigo: 'NOVATO', nombre: 'Vecino Novato', puntosMin: 0, puntosMax: 100, icono: 'Vecino bronce (star_1)' },
    { codigo: 'OBSERVADOR', nombre: 'Observador Urbano', puntosMin: 101, puntosMax: 500, icono: 'Vecino plata (star_2)' },
    { codigo: 'GUARDIAN', nombre: 'Guardián de Cuenca', puntosMin: 501, puntosMax: 999999, icono: 'Vecino oro (star_3)' }
  ];

  tiposNotificacion = [
    { codigo: 'NUEVO_COMENTARIO', nombre: 'Nuevo Comentario', descripcion: 'Alguien comentó en una incidencia que sigues.' },
    { codigo: 'CAMBIO_ESTADO', nombre: 'Cambio de Estado', descripcion: 'Una incidencia tuya cambió de estado.' },
    { codigo: 'INCIDENCIA_CERCANA', nombre: 'Incidencia Cercana', descripcion: 'Se reportó algo cerca de tu ubicación.' },
    { codigo: 'LOGRO_DESBLOQUEADO', nombre: 'Logro Comunitario', descripcion: 'Has alcanzado un nuevo nivel.' }
  ];

  constructor(private readonly catalogosService: CatalogosService) {}

  ngOnInit() {
    this.catalogosService.categorias$.subscribe((items) => this.categorias.set(items));
    this.catalogosService.estados$.subscribe((items) => this.estados.set(items));
  }
}
