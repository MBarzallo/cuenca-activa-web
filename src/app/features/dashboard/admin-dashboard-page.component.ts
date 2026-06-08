import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { Incidencia } from '../../core/models/incidencia.model';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { ReportesModeracionService } from '../../core/services/reportes-moderacion.service';
import { AdminReporteContenido } from '../../core/models/admin-reporte-contenido.model';
import { UserProfileService } from '../../core/services/user-profile.service';

interface DashboardSummary {
  totalIncidencias: number;
  pendientes: number;
  cerradas: number;
  porEstado: Record<string, number>;
  recientes: Incidencia[];
}

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, TableModule, TagModule],
  template: `
    <div class="space-y-6">
      <!-- PAGE HEADER: Light, dense and operational -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Resumen operativo</span>
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">Dashboard administrativo</h1>
          <p class="mt-1 text-sm text-slate-500">Supervisión en tiempo real de incidencias ciudadanas, solicitudes y alertas de moderación.</p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0 sm:self-end">
          <a routerLink="/admin/incidencias" pButton icon="pi pi-map-marker" label="Gestionar incidencias" class="p-button-sm"></a>
          <a routerLink="/admin/reportes-contenido" pButton severity="secondary" outlined icon="pi pi-flag" label="Moderación" class="p-button-sm hover:bg-slate-50"></a>
        </div>
      </header>

      @if (summary(); as data) {
        <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <!-- Metric 1 -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Incidencias recientes</span>
              <strong class="mt-1 block text-3xl font-extrabold text-slate-800">{{ data.totalIncidencias }}</strong>
              <span class="mt-1 block text-[11px] text-slate-400">Últimos registros</span>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500"><i class="pi pi-database text-lg"></i></span>
          </div>

          <!-- Metric 2 -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendientes</span>
              <strong class="mt-1 block text-3xl font-extrabold text-[var(--ca-gold)]">{{ data.pendientes }}</strong>
              <span class="mt-1 block text-[11px] text-slate-400">Requieren atención</span>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-[var(--ca-gold)]/10 text-[var(--ca-gold)]"><i class="pi pi-clock text-lg"></i></span>
          </div>

          <!-- Metric 3 -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cerradas</span>
              <strong class="mt-1 block text-3xl font-extrabold text-[var(--ca-teal)]">{{ data.cerradas }}</strong>
              <span class="mt-1 block text-[11px] text-slate-400">Atendidas y cerradas</span>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-[var(--ca-teal)]/10 text-[var(--ca-teal)]"><i class="pi pi-check-circle text-lg"></i></span>
          </div>

          <!-- Metric 4 -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moderaciones</span>
              <strong class="mt-1 block text-3xl font-extrabold text-red-500">{{ reportesPendientesCount() }}</strong>
              <span class="mt-1 block text-[11px] text-slate-400">Pendientes de revisión</span>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-red-500"><i class="pi pi-flag text-lg"></i></span>
          </div>

          <!-- Metric 5 -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuarios</span>
              <strong class="mt-1 block text-3xl font-extrabold text-indigo-650">{{ totalUsuarios() }}</strong>
              <span class="mt-1 block text-[11px] text-slate-400">Registrados en la app</span>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><i class="pi pi-users text-lg"></i></span>
          </div>
        </section>

        <section class="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="border-b border-slate-100 pb-3 mb-4">
              <h3 class="text-sm font-bold text-slate-800">Distribución por estado</h3>
              <p class="text-[11px] text-slate-400">Conteo por estado de la incidencia.</p>
            </div>
            <div class="flex justify-center items-center pb-2">
              <canvas #statesChart height="280"></canvas>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Incidencias recientes</h3>
                <p class="text-[11px] text-slate-400">Últimas incidencias públicas reportadas por ciudadanos.</p>
              </div>
              <a routerLink="/admin/incidencias" pButton size="small" severity="secondary" outlined icon="pi pi-arrow-right" label="Ver todas" class="p-button-xs hover:bg-slate-50 transition-colors"></a>
            </div>
            
            <div class="p-3">
              <p-table [value]="data.recientes" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table border-0">
                <ng-template pTemplate="header">
                  <tr class="hidden lg:table-row">
                    <th class="font-bold text-xs text-slate-500">Incidencia</th>
                    <th class="font-bold text-xs text-slate-500">Estado</th>
                    <th class="font-bold text-xs text-slate-500">Prioridad</th>
                    <th class="font-bold text-xs text-slate-500">Actividad</th>
                    <th class="w-[50px]"></th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-incidencia>
                  <tr class="hover:bg-slate-50/50 border-b border-slate-100/60 transition-colors">
                    <td class="py-3">
                      <div class="font-semibold text-sm text-slate-800">{{ incidencia.titulo }}</div>
                      <div class="text-xs text-slate-400 mt-0.5">{{ incidencia.nombreCategoria }}</div>
                    </td>
                    <td class="py-3"><p-tag [value]="incidencia.nombreEstado" [severity]="tagSeverity(incidencia.codigoEstado)"></p-tag></td>
                    <td class="py-3 text-xs font-semibold text-slate-600">{{ incidencia.prioridadCalculada || 'Baja' }}</td>
                    <td class="py-3 text-xs text-slate-500">{{ incidencia.cantidadComentarios }} com. / {{ incidencia.cantidadConfirmaciones }} val.</td>
                    <td class="py-3 text-right">
                      <a routerLink="/admin/incidencias" pButton size="small" severity="secondary" text icon="pi pi-pencil" class="hover:bg-slate-100 rounded-lg"></a>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        </section>

        <section class="grid gap-6 xl:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div class="border-b border-slate-100 pb-3 mb-4">
              <h3 class="text-sm font-bold text-slate-800">Resumen por sector</h3>
              <p class="text-[11px] text-slate-400">Sectores con mayor reporte de incidencias.</p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              @for (sector of topSectores(data.recientes); track sector.nombre) {
                <div class="rounded-xl border border-slate-150 bg-slate-50 p-4">
                  <p class="truncate text-xs font-bold text-slate-500 uppercase tracking-wider">{{ sector.nombre }}</p>
                  <p class="mt-2 text-2xl font-black text-slate-800">{{ sector.total }}</p>
                </div>
              } @empty {
                <p class="text-xs text-slate-400 font-medium py-4">No hay sectores registrados.</p>
              }
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Reportes de moderación</h3>
                <p class="text-[11px] text-slate-400">Alertas de contenido inapropiado.</p>
              </div>
              <a routerLink="/admin/reportes-contenido" pButton size="small" severity="secondary" outlined icon="pi pi-arrow-right" label="Ver todos" class="p-button-xs hover:bg-slate-50 transition-colors"></a>
            </div>
            
            <div *ngIf="reportesPendientes().length > 0; else noReportes" class="space-y-3">
              <div *ngFor="let reporte of reportesPendientes()" class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div class="min-w-0">
                  <span class="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wider">
                    {{ obtenerTipoContenido(reporte) }}
                  </span>
                  <div class="text-xs text-slate-700 font-bold mt-1.5 truncate max-w-[200px]" [title]="reporte.motivo">{{ reporte.motivo }}</div>
                </div>
                <a routerLink="/admin/reportes-contenido" pButton size="small" severity="danger" text icon="pi pi-flag" class="hover:bg-red-50/50 rounded-lg"></a>
              </div>
            </div>
            <ng-template #noReportes>
              <div class="rounded-xl border border-dashed border-slate-350 bg-slate-50 p-6 text-center">
                <i class="pi pi-shield text-[var(--ca-teal)] text-2xl mb-2 block animate-pulse"></i>
                <p class="font-bold text-xs text-slate-700">Plataforma limpia</p>
                <p class="mt-0.5 text-[11px] text-slate-400">No hay contenido pendiente de moderación.</p>
              </div>
            </ng-template>
          </div>
        </section>
      }
    </div>
  `,
})
export class AdminDashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statesChart') statesChart?: ElementRef<HTMLCanvasElement>;
  readonly summary = signal<DashboardSummary | null>(null);
  readonly reportesPendientesCount = signal<number>(0);
  readonly reportesPendientes = signal<AdminReporteContenido[]>([]);
  readonly totalUsuarios = signal<number>(0);
  private chart: Chart | null = null;

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly reportesService: ReportesModeracionService,
    private readonly userService: UserProfileService
  ) {}

  ngOnInit() {
    this.userService.listUsersAdmin({ limit: 1 }).subscribe((resp) => {
      this.totalUsuarios.set(resp.total);
    });
    this.incidenciasService.getDashboardSummary().subscribe((summary) => {
      this.summary.set(summary);
      this.renderChart();
    });

    this.reportesService.list({ estadoRevision: 'PENDIENTE', limit: 5 }).subscribe((resp) => {
      this.reportesPendientesCount.set(resp.total);
      this.reportesPendientes.set(resp.data);
    });
  }

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnDestroy() {
    this.chart?.destroy();
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

  topSectores(items: Incidencia[]): Array<{ nombre: string; total: number }> {
    const counts = items.reduce<Record<string, number>>((acc, item) => {
      const key = item.nombreSector || item.direccionReferencial || 'Sin sector';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }

  private renderChart() {
    const canvas = this.statesChart?.nativeElement;
    const data = this.summary();
    if (!canvas || !data) {
      return;
    }
    this.chart?.destroy();
    const labels = Object.keys(data.porEstado);
    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: labels.map((label) => data.porEstado[label]),
            backgroundColor: ['#14B8A6', '#D4A937', '#0F172A', '#94A3B8', '#22C55E'],
            borderColor: '#FFFFFF',
            borderWidth: 4,
          },
        ],
      },
      options: {
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  obtenerTipoContenido(reporte: AdminReporteContenido): string {
    if (reporte.idIncidencia) return 'Incidencia';
    if (reporte.idComentario) return 'Comentario';
    if (reporte.idMultimedia) return 'Imagen';
    if (reporte.idConfirmacion) return 'Confirmación';
    return 'Contenido';
  }
}
