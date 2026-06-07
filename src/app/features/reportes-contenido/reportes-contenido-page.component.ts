import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReportesModeracionService } from '../../core/services/reportes-moderacion.service';
import { AdminReporteContenido } from '../../core/models/admin-reporte-contenido.model';

@Component({
  selector: 'app-reportes-contenido-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SelectModule,
    ButtonModule,
    TagModule,
    ToastModule,
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
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div class="flex flex-col gap-2 w-full max-w-xs">
            <label class="text-xs font-semibold text-slate-500 uppercase">Estado de Revisión</label>
            <p-select [options]="estadosOptions" [(ngModel)]="filterEstado" optionLabel="label" optionValue="value" placeholder="Filtrar por estado" styleClass="w-full" (onChange)="applyFilters()"></p-select>
          </div>
          <div class="flex gap-2">
            <button (click)="clearFilters()" class="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition">Limpiar Filtros</button>
          </div>
        </div>

        <!-- Tabla de Reportes -->
        <p-table 
          [value]="reportes()" 
          [lazy]="true" 
          (onLazyLoad)="loadReportes($event)" 
          [paginator]="true" 
          [rows]="rows" 
          [totalRecords]="totalRecords()" 
          [loading]="loading()" 
          responsiveLayout="stack" 
          styleClass="p-datatable-sm ca-clean-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Fecha Denuncia</th>
              <th>Denunciante</th>
              <th>Tipo de Contenido</th>
              <th>Identificador Contenido</th>
              <th>Motivo y Detalles</th>
              <th>Estado</th>
              <th style="width: 15rem">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-reporte>
            <tr>
              <td class="text-sm">
                {{ reporte.creadoEn | date:'medium' }}
              </td>
              <td>
                <div class="font-semibold text-xs">&#64;{{ reporte.aliasUsuarioReporta }}</div>
                <div class="text-[10px] text-slate-500">{{ reporte.emailUsuarioReporta }}</div>
              </td>
              <td>
                <p-tag [value]="obtenerTipoContenido(reporte)" [severity]="obtenerSeverityTipo(reporte)"></p-tag>
              </td>
              <td class="font-mono text-xs text-slate-500">
                {{ obtenerIdContenido(reporte) }}
              </td>
              <td>
                <div class="font-semibold text-sm">{{ reporte.motivo }}</div>
                <div class="text-slate-500 text-xs mt-1 italic max-w-[280px] truncate" [title]="reporte.detalle">{{ reporte.detalle || 'Sin detalles' }}</div>
              </td>
              <td>
                <p-tag [value]="reporte.estadoRevision" [severity]="obtenerSeverityEstado(reporte.estadoRevision)"></p-tag>
              </td>
              <td>
                <div class="flex gap-2" *ngIf="reporte.estadoRevision === 'PENDI_PENDIENTE' || reporte.estadoRevision === 'PENDIENTE'">
                  <button 
                    pButton 
                    size="small" 
                    severity="danger" 
                    icon="pi pi-eye-slash" 
                    label="Aprobar (Ocultar)" 
                    (click)="resolver(reporte, 'APROBADO')"
                  ></button>
                  <button 
                    pButton 
                    size="small" 
                    severity="secondary" 
                    outlined 
                    icon="pi pi-check" 
                    label="Rechazar" 
                    (click)="resolver(reporte, 'RECHAZADO')"
                  ></button>
                </div>
                <div class="text-slate-400 text-xs italic" *ngIf="reporte.estadoRevision !== 'PENDI_PENDIENTE' && reporte.estadoRevision !== 'PENDIENTE'">
                  Procesado
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class ReportesContenidoPageComponent implements OnInit {
  readonly reportes = signal<AdminReporteContenido[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly rows = 20;
  private currentOffset = 0;

  filterEstado = 'PENDIENTE';

  estadosOptions = [
    { label: 'Todos', value: '' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Aprobados (Ocultados)', value: 'APROBADO' },
    { label: 'Rechazados (Descartados)', value: 'RECHAZADO' },
  ];

  constructor(
    private readonly reportesService: ReportesModeracionService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchReportes();
  }

  loadReportes(event: TableLazyLoadEvent) {
    this.currentOffset = event.first ?? 0;
    this.fetchReportes();
  }

  applyFilters() {
    this.currentOffset = 0;
    this.fetchReportes();
  }

  clearFilters() {
    this.filterEstado = 'PENDIENTE';
    this.currentOffset = 0;
    this.fetchReportes();
  }

  fetchReportes() {
    this.loading.set(true);
    this.reportesService.list({
      estadoRevision: this.filterEstado || undefined,
      limit: this.rows,
      offset: this.currentOffset,
    }).subscribe({
      next: (response) => {
        this.reportes.set(response.data);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los reportes de contenido' });
        this.loading.set(false);
      }
    });
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
    if (val.includes('APROB')) return 'danger';
    if (val.includes('RECH')) return 'success';
    return 'secondary';
  }

  resolver(reporte: AdminReporteContenido, resolucion: 'APROBADO' | 'RECHAZADO') {
    this.reportesService.resolve(reporte.idReporteContenido, resolucion).subscribe({
      next: () => {
        reporte.estadoRevision = resolucion;
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Reporte Procesado', 
          detail: `Se ha marcado la denuncia como ${resolucion} con éxito.` 
        });
        // Si el filtro es pendientes, removerlo de la lista local
        if (this.filterEstado === 'PENDIENTE') {
          this.reportes.set(this.reportes().filter(r => r.idReporteContenido !== reporte.idReporteContenido));
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
