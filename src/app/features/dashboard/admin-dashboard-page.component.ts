import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Incidencia } from '../../core/models/incidencia.model';
import { IncidenciasService } from '../../core/services/incidencias.service';

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
  imports: [RouterLink, ButtonModule, CardModule, TableModule, TagModule],
  template: `
    <div class="space-y-6">
      <section class="rounded-[28px] bg-[var(--ca-navy)] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <div class="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Resumen operativo</p>
            <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Dashboard administrativo</h2>
            <p class="mt-3 max-w-3xl leading-7 text-slate-300">
              Monitorea incidencias ciudadanas, actividad reciente y estados de atención en un solo panel.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a routerLink="/admin/incidencias" pButton icon="pi pi-map-marker" label="Gestionar incidencias"></a>
            <a routerLink="/admin/reportes-contenido" pButton severity="secondary" outlined icon="pi pi-flag" label="Reportes"></a>
          </div>
        </div>
      </section>

      @if (summary(); as data) {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <p-card styleClass="ca-metric-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">Incidencias recientes</p>
                <strong class="mt-1 block text-3xl">{{ data.totalIncidencias }}</strong>
                <span class="mt-2 block text-xs text-slate-500">Últimos registros disponibles</span>
              </div>
              <span class="ca-metric-icon bg-[var(--ca-navy)] text-white"><i class="pi pi-database"></i></span>
            </div>
          </p-card>
          <p-card styleClass="ca-metric-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">Pendientes</p>
                <strong class="mt-1 block text-3xl text-[var(--ca-gold)]">{{ data.pendientes }}</strong>
                <span class="mt-2 block text-xs text-slate-500">Requieren seguimiento</span>
              </div>
              <span class="ca-metric-icon bg-[var(--ca-gold)] text-[var(--ca-navy)]"><i class="pi pi-clock"></i></span>
            </div>
          </p-card>
          <p-card styleClass="ca-metric-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">Cerradas</p>
                <strong class="mt-1 block text-3xl text-[var(--ca-teal)]">{{ data.cerradas }}</strong>
                <span class="mt-2 block text-xs text-slate-500">Con fecha de cierre</span>
              </div>
              <span class="ca-metric-icon bg-[var(--ca-teal)] text-white"><i class="pi pi-check-circle"></i></span>
            </div>
          </p-card>
          <p-card styleClass="ca-metric-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">Reportes pendientes</p>
                <strong class="mt-1 block text-3xl text-slate-400">--</strong>
                <span class="mt-2 block text-xs text-slate-500">Endpoint admin pendiente</span>
              </div>
              <span class="ca-metric-icon bg-slate-200 text-[var(--ca-navy)]"><i class="pi pi-flag"></i></span>
            </div>
          </p-card>
        </section>

        <section class="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <p-card styleClass="border-0 shadow-sm">
            <ng-template pTemplate="header">
              <div class="border-b border-slate-100 px-5 py-4">
                <h3 class="text-lg font-semibold">Distribución por estado</h3>
                <p class="mt-1 text-sm text-slate-500">Conteo de incidencias cargadas.</p>
              </div>
            </ng-template>
            <div class="px-2 pb-2">
              <canvas #statesChart height="280"></canvas>
            </div>
          </p-card>

          <p-card styleClass="overflow-hidden border-0 shadow-sm">
            <ng-template pTemplate="header">
              <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 class="text-lg font-semibold">Incidencias recientes</h3>
                  <p class="mt-1 text-sm text-slate-500">Últimas incidencias públicas disponibles.</p>
                </div>
                <a routerLink="/admin/incidencias" pButton size="small" severity="secondary" outlined icon="pi pi-arrow-right" label="Ver todas"></a>
              </div>
            </ng-template>
            <p-table [value]="data.recientes" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Incidencia</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Actividad</th>
                  <th></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-incidencia>
                <tr>
                  <td>
                    <div class="font-semibold">{{ incidencia.titulo }}</div>
                    <div class="mt-1 text-sm text-slate-500">{{ incidencia.nombreCategoria }}</div>
                  </td>
                  <td><p-tag [value]="incidencia.nombreEstado" [severity]="tagSeverity(incidencia.codigoEstado)"></p-tag></td>
                  <td>{{ incidencia.prioridadCalculada }}</td>
                  <td class="text-sm text-slate-600">{{ incidencia.cantidadComentarios }} comentarios</td>
                  <td class="text-right">
                    <a routerLink="/admin/incidencias" pButton size="small" severity="secondary" text icon="pi pi-pencil"></a>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </section>

        <section class="grid gap-6 xl:grid-cols-3">
          <p-card styleClass="border-0 shadow-sm xl:col-span-2">
            <ng-template pTemplate="header">
              <div class="border-b border-slate-100 px-5 py-4">
                <h3 class="text-lg font-semibold">Resumen por sector</h3>
                <p class="mt-1 text-sm text-slate-500">Sectores detectados en el lote actual.</p>
              </div>
            </ng-template>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              @for (sector of topSectores(data.recientes); track sector.nombre) {
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="truncate text-sm font-semibold">{{ sector.nombre }}</p>
                  <p class="mt-2 text-2xl font-bold text-[var(--ca-navy)]">{{ sector.total }}</p>
                </div>
              } @empty {
                <p class="text-sm text-slate-500">No hay sectores disponibles.</p>
              }
            </div>
          </p-card>

          <p-card styleClass="border-0 shadow-sm">
            <ng-template pTemplate="header">
              <div class="border-b border-slate-100 px-5 py-4">
                <h3 class="text-lg font-semibold">Reportes de contenido</h3>
                <p class="mt-1 text-sm text-slate-500">Moderación pendiente de endpoint admin.</p>
              </div>
            </ng-template>
            <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p class="font-semibold">Sin datos administrativos todavía</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                El módulo de revisión administrativa está preparado para conectarse cuando esté disponible.
              </p>
              <a routerLink="/admin/reportes-contenido" class="mt-4 inline-flex" pButton size="small" severity="secondary" outlined label="Ver módulo"></a>
            </div>
          </p-card>
        </section>
      }
    </div>
  `,
})
export class AdminDashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statesChart') statesChart?: ElementRef<HTMLCanvasElement>;
  readonly summary = signal<DashboardSummary | null>(null);
  private chart: Chart | null = null;

  constructor(private readonly incidenciasService: IncidenciasService) {}

  ngOnInit() {
    this.incidenciasService.getDashboardSummary().subscribe((summary) => {
      this.summary.set(summary);
      this.renderChart();
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
}
