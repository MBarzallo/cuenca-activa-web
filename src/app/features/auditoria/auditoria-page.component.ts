import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuditoriaService, AuditoriaFilters } from '../../core/services/auditoria.service';
import { AuditoriaEvento } from '../../core/models/auditoria-evento.model';

@Component({
  selector: 'app-auditoria-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>
      <section class="rounded-[28px] bg-[var(--ca-navy)] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Trazabilidad</p>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Auditoría de Eventos</h2>
        <p class="mt-3 max-w-3xl leading-7 text-slate-300">
          Consulta y analiza el historial cronológico de cambios realizados por ciudadanos y administradores en la plataforma.
        </p>
      </section>

      <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <!-- Filtros de búsqueda -->
        <div class="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Entidad</label>
            <input pInputText type="text" [(ngModel)]="filterEntidad" placeholder="Ej: USUARIO, INCIDENCIA" class="w-full" (keyup.enter)="applyFilters()" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Acción</label>
            <input pInputText type="text" [(ngModel)]="filterAccion" placeholder="Ej: EDICION_PERFIL" class="w-full" (keyup.enter)="applyFilters()" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Desde</label>
            <p-datepicker [(ngModel)]="filterFechaInicio" placeholder="Fecha inicio" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full"></p-datepicker>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Hasta</label>
            <p-datepicker [(ngModel)]="filterFechaFin" placeholder="Fecha fin" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full"></p-datepicker>
          </div>
          <div class="flex gap-2">
            <button (click)="applyFilters()" class="flex-1 rounded-xl bg-[var(--ca-navy)] hover:bg-[var(--ca-navy)]/90 px-4 py-2 text-sm font-semibold text-white transition">Filtrar</button>
            <button (click)="clearFilters()" class="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition">Limpiar</button>
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
              <th>Entidad</th>
              <th>ID Entidad</th>
              <th>Acción</th>
              <th>Origen IP</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-evento let-expanded="expanded">
            <tr>
              <td>
                <button type="button" [pRowToggler]="evento" class="p-button-text p-button-rounded p-button-plain p-button-sm border-0 bg-transparent text-slate-500 hover:text-slate-800 transition">
                  <i class="pi" [ngClass]="expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                </button>
              </td>
              <td class="text-sm">
                {{ evento.creadoEn | date:'medium' }}
              </td>
              <td>
                <div *ngIf="evento.idUsuario">
                  <div class="font-semibold text-xs">{{ evento.aliasPublicoUsuario || 'Usuario registrado' }}</div>
                  <div class="text-[10px] text-slate-500">{{ evento.emailUsuario }}</div>
                </div>
                <div *ngIf="!evento.idUsuario" class="text-slate-400 text-xs italic">
                  Sistema / Anónimo
                </div>
              </td>
              <td>
                <p-tag [value]="evento.entidad" severity="secondary"></p-tag>
              </td>
              <td class="font-mono text-xs text-slate-500">
                {{ evento.idEntidad }}
              </td>
              <td>
                <span class="font-semibold text-sm text-[var(--ca-navy)]">{{ evento.accion }}</span>
              </td>
              <td class="text-xs text-slate-500">
                <div>{{ evento.ipOrigen }}</div>
                <div class="truncate max-w-[150px] text-[10px] text-slate-400" [title]="evento.userAgent">{{ evento.userAgent || 'N/A' }}</div>
              </td>
            </tr>
          </ng-template>

          <!-- Detalles del cambio expandidos -->
          <ng-template pTemplate="rowexpansion" let-evento>
            <tr>
              <td colspan="7">
                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid md:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <span class="text-xs font-bold text-slate-500 uppercase">Valor Anterior</span>
                    <pre class="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono overflow-auto max-h-[200px]">{{ formatJson(evento.valorAnterior) }}</pre>
                  </div>
                  <div class="flex flex-col gap-2">
                    <span class="text-xs font-bold text-slate-500 uppercase">Valor Nuevo</span>
                    <pre class="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono overflow-auto max-h-[200px]">{{ formatJson(evento.valorNuevo) }}</pre>
                  </div>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
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

  filterEntidad = '';
  filterAccion = '';
  filterFechaInicio: Date | null = null;
  filterFechaFin: Date | null = null;

  constructor(
    private readonly auditoriaService: AuditoriaService,
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
    this.fetchEventos();
  }

  clearFilters() {
    this.filterEntidad = '';
    this.filterAccion = '';
    this.filterFechaInicio = null;
    this.filterFechaFin = null;
    this.currentOffset = 0;
    this.fetchEventos();
  }

  fetchEventos() {
    this.loading.set(true);

    const filters: AuditoriaFilters = {
      entidad: this.filterEntidad || undefined,
      accion: this.filterAccion || undefined,
      limit: this.rows,
      offset: this.currentOffset,
    };

    if (this.filterFechaInicio) {
      filters.fechaInicio = this.filterFechaInicio.toISOString();
    }
    if (this.filterFechaFin) {
      // Ajustar fin del día
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

  formatJson(value: string | null): string {
    if (!value) return '(vacío)';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
}
