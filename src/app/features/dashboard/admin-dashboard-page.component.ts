import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Chart } from 'chart.js/auto';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AdminDashboardAnalyticsResponse } from '../../core/models/admin-dashboard-analytics.model';
import { CategoriaIncidencia, EstadoIncidencia } from '../../core/models/catalogo.model';
import { AdminAnalyticsService } from '../../core/services/admin-analytics.service';
import { CatalogosService } from '../../core/services/catalogos.service';

type SelectOption = { label: string; value: string | null };
type PeriodOption = '7d' | '30d' | 'month' | 'custom';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CardModule, SelectModule, TableModule, TagModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col gap-4 border-b border-slate-100 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Analítica administrativa</span>
          <h1 class="mt-0.5 text-3xl font-extrabold tracking-tight text-slate-900">Dashboard analítico</h1>
          <p class="mt-1 text-sm text-slate-500">Indicadores y tendencias de incidencias ciudadanas para supervisión operativa.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/admin/incidencias" pButton icon="pi pi-map-marker" label="Gestionar incidencias" class="p-button-sm"></a>
          <a routerLink="/admin/moderacion" pButton severity="secondary" outlined icon="pi pi-shield" label="Moderación" class="p-button-sm"></a>
        </div>
      </header>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label class="space-y-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Periodo</span>
            <p-select class="w-full" [(ngModel)]="periodo" [options]="periodOptions" optionLabel="label" optionValue="value" (onChange)="onPeriodoChange()"></p-select>
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Estado</span>
            <p-select class="w-full" [(ngModel)]="estado" [options]="estadoOptions()" optionLabel="label" optionValue="value" [showClear]="true" placeholder="Todos" (onChange)="loadDashboard()"></p-select>
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</span>
            <p-select class="w-full" [(ngModel)]="categoriaId" [options]="categoriaOptions()" optionLabel="label" optionValue="value" [showClear]="true" placeholder="Todas" (onChange)="loadDashboard()"></p-select>
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Sector</span>
            <p-select class="w-full" [(ngModel)]="sectorId" [options]="sectorOptions()" optionLabel="label" optionValue="value" [showClear]="true" placeholder="Todos" (onChange)="loadDashboard()"></p-select>
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Prioridad</span>
            <p-select class="w-full" [(ngModel)]="prioridad" [options]="prioridadOptions" optionLabel="label" optionValue="value" [showClear]="true" placeholder="Todas" (onChange)="loadDashboard()"></p-select>
          </label>
          <div class="flex items-end">
            <button pButton icon="pi pi-refresh" label="Actualizar" class="w-full p-button-sm" [loading]="loading()" (click)="loadDashboard()"></button>
          </div>
        </div>

        @if (periodo === 'custom') {
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <label class="space-y-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Desde</span>
              <input type="datetime-local" class="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[var(--ca-teal)]" [(ngModel)]="fechaDesdeLocal" (change)="loadDashboard()" />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Hasta</span>
              <input type="datetime-local" class="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[var(--ca-teal)]" [(ngModel)]="fechaHastaLocal" (change)="loadDashboard()" />
            </label>
          </div>
        }
      </section>

      @if (errorMessage()) {
        <div class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {{ errorMessage() }}
        </div>
      }

      @if (loading() && !dashboard()) {
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (item of skeletonCards; track item) {
            <div class="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm">
              <div class="m-5 h-4 w-28 rounded bg-slate-100"></div>
              <div class="mx-5 h-8 w-20 rounded bg-slate-150"></div>
            </div>
          }
        </section>
      }

      @if (dashboard(); as data) {
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ng-container *ngFor="let kpi of kpis(data)">
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ kpi.label }}</span>
                  <strong class="mt-1 block text-3xl font-extrabold" [ngClass]="kpi.color">{{ kpi.value }}</strong>
                  <span class="mt-1 block text-[11px] text-slate-400">{{ kpi.hint }}</span>
                </div>
                <span class="grid h-10 w-10 place-items-center rounded-lg" [ngClass]="kpi.iconBg"><i class="pi text-lg" [ngClass]="kpi.icon"></i></span>
              </div>
            </div>
          </ng-container>
        </section>

        <section class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 border-b border-slate-100 pb-3">
              <h2 class="text-sm font-bold text-slate-850">Tendencia de reportes</h2>
              <p class="text-xs text-slate-400">Incidencias creadas agrupadas por día.</p>
            </div>
            <div class="h-[320px]"><canvas #trendChart></canvas></div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 border-b border-slate-100 pb-3">
              <h2 class="text-sm font-bold text-slate-850">Distribución por estado</h2>
              <p class="text-xs text-slate-400">Conteo real por estado actual.</p>
            </div>
            <div class="h-[320px]"><canvas #statusChart></canvas></div>
          </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2">
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 border-b border-slate-100 pb-3">
              <h2 class="text-sm font-bold text-slate-850">Categorías más reportadas</h2>
              <p class="text-xs text-slate-400">Top categorías del periodo filtrado.</p>
            </div>
            <div class="h-[300px]"><canvas #categoryChart></canvas></div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 border-b border-slate-100 pb-3">
              <h2 class="text-sm font-bold text-slate-850">Sectores con mayor actividad</h2>
              <p class="text-xs text-slate-400">Sectores o parroquias con más incidencias.</p>
            </div>
            <div class="h-[300px]"><canvas #sectorChart></canvas></div>
          </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 class="text-sm font-bold text-slate-850">Actividad comunitaria</h2>
                <p class="text-xs text-slate-400">Incidencias con más votos, comentarios y validaciones.</p>
              </div>
              <a routerLink="/admin/incidencias" pButton size="small" severity="secondary" outlined icon="pi pi-arrow-right" label="Ver incidencias"></a>
            </div>
            <div class="p-3">
              <p-table [value]="data.communityActivity" responsiveLayout="stack" styleClass="p-datatable-sm ca-clean-table">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Incidencia</th>
                    <th>Estado</th>
                    <th class="text-right">Comentarios</th>
                    <th class="text-right">Votos</th>
                    <th class="text-right">Validaciones</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td>
                      <div class="font-semibold text-sm text-slate-800">{{ item.titulo }}</div>
                      <div class="text-xs text-slate-400">{{ item.categoria }}</div>
                    </td>
                    <td><p-tag [value]="item.estado" severity="info"></p-tag></td>
                    <td class="text-right text-sm font-semibold text-slate-650">{{ item.totalComentarios }}</td>
                    <td class="text-right text-sm font-semibold text-slate-650">{{ item.totalVotos }}</td>
                    <td class="text-right text-sm font-semibold text-slate-650">{{ item.totalValidaciones }}</td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="5" class="py-8 text-center text-sm text-slate-400">No hay actividad comunitaria en el periodo.</td></tr>
                </ng-template>
              </p-table>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 border-b border-slate-100 pb-3">
              <h2 class="text-sm font-bold text-slate-850">Alertas de moderación</h2>
              <p class="text-xs text-slate-400">Resumen de contenido multimedia por estado.</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                <span class="text-sm font-bold text-amber-800">Pendientes</span>
                <strong class="text-xl text-amber-700">{{ data.moderation.pendientes }}</strong>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
                <span class="text-sm font-bold text-sky-800">Revisión manual</span>
                <strong class="text-xl text-sky-700">{{ data.moderation.revisionManual }}</strong>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <span class="text-sm font-bold text-red-800">Rechazadas</span>
                <strong class="text-xl text-red-700">{{ data.moderation.rechazadas }}</strong>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                <span class="text-sm font-bold text-emerald-800">Aprobadas</span>
                <strong class="text-xl text-emerald-700">{{ data.moderation.aprobadas }}</strong>
              </div>
            </div>
            <a routerLink="/admin/moderacion" pButton class="mt-5 w-full justify-center" severity="secondary" outlined icon="pi pi-shield" label="Abrir moderación"></a>
          </article>
        </section>
      } @else if (!loading()) {
        <div class="rounded-xl border border-dashed border-slate-250 bg-white p-10 text-center">
          <i class="pi pi-chart-line text-3xl text-slate-300"></i>
          <p class="mt-3 text-sm font-bold text-slate-700">No hay datos para los filtros seleccionados.</p>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trendChart') trendChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sectorChart') sectorChart?: ElementRef<HTMLCanvasElement>;

  readonly dashboard = signal<AdminDashboardAnalyticsResponse | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly categorias = signal<CategoriaIncidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  readonly sectorOptions = signal<SelectOption[]>([{ label: 'Todos', value: null }]);
  readonly skeletonCards = [1, 2, 3, 4, 5, 6, 7, 8];

  periodo: PeriodOption = '30d';
  estado: string | null = null;
  categoriaId: string | null = null;
  sectorId: string | null = null;
  prioridad: string | null = null;
  fechaDesdeLocal = '';
  fechaHastaLocal = '';

  readonly periodOptions: Array<{ label: string; value: PeriodOption }> = [
    { label: 'Últimos 7 días', value: '7d' },
    { label: 'Últimos 30 días', value: '30d' },
    { label: 'Este mes', value: 'month' },
    { label: 'Personalizado', value: 'custom' },
  ];

  readonly prioridadOptions: SelectOption[] = [
    { label: 'Baja', value: 'BAJA' },
    { label: 'Media', value: 'MEDIA' },
    { label: 'Alta', value: 'ALTA' },
  ];

  private charts: Chart[] = [];
  private viewReady = false;

  constructor(
    private readonly analyticsService: AdminAnalyticsService,
    private readonly catalogosService: CatalogosService
  ) {}

  ngOnInit() {
    forkJoin({
      categorias: this.catalogosService.categorias$,
      estados: this.catalogosService.estados$,
    }).subscribe(({ categorias, estados }) => {
      this.categorias.set(categorias);
      this.estados.set(estados);
    });
    this.applyPresetDates();
    this.loadDashboard();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  estadoOptions(): SelectOption[] {
    return this.estados().map((estado) => ({ label: estado.nombre, value: estado.codigo }));
  }

  categoriaOptions(): SelectOption[] {
    return this.categorias().map((categoria) => ({ label: categoria.nombre, value: categoria.idCategoria }));
  }

  onPeriodoChange() {
    if (this.periodo !== 'custom') {
      this.applyPresetDates();
    }
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.analyticsService
      .getDashboard({
        fechaDesde: this.toIso(this.fechaDesdeLocal),
        fechaHasta: this.toIso(this.fechaHastaLocal),
        estado: this.estado,
        categoriaId: this.categoriaId,
        sectorId: this.sectorId,
        prioridad: this.prioridad,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.updateSectorOptions(data);
          setTimeout(() => this.renderCharts());
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'No se pudieron cargar las métricas del dashboard.');
        },
      });
  }

  kpis(data: AdminDashboardAnalyticsResponse) {
    const summary = data.summary;
    return [
      { label: 'Total incidencias', value: summary.totalIncidencias, hint: 'Reportes en el periodo', color: 'text-slate-850', icon: 'pi-database text-slate-500', iconBg: 'bg-slate-100 text-slate-500' },
      { label: 'Pendientes', value: summary.pendientes, hint: 'Aún sin cierre', color: 'text-amber-600', icon: 'pi-clock text-amber-600', iconBg: 'bg-amber-50 text-amber-600' },
      { label: 'Validadas', value: summary.validadas, hint: 'Con validación comunitaria', color: 'text-sky-600', icon: 'pi-thumbs-up text-sky-600', iconBg: 'bg-sky-50 text-sky-600' },
      { label: 'Cerradas', value: summary.cerradas, hint: 'Resueltas o finalizadas', color: 'text-emerald-600', icon: 'pi-check-circle text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600' },
      { label: 'En moderación', value: summary.enModeracion, hint: 'Con multimedia pendiente', color: 'text-red-500', icon: 'pi-shield text-red-500', iconBg: 'bg-red-50 text-red-500' },
      { label: 'Usuarios activos', value: summary.usuariosActivos, hint: 'Reportaron en el periodo', color: 'text-indigo-600', icon: 'pi-users text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600' },
      { label: 'Tasa de cierre', value: `${summary.tasaCierre}%`, hint: 'Cerradas sobre total', color: 'text-[var(--ca-teal)]', icon: 'pi-chart-pie text-[var(--ca-teal)]', iconBg: 'bg-[var(--ca-teal)]/10 text-[var(--ca-teal)]' },
      { label: 'Promedio diario', value: summary.promedioDiario, hint: 'Incidencias por día', color: 'text-[var(--ca-gold)]', icon: 'pi-calendar text-[var(--ca-gold)]', iconBg: 'bg-[var(--ca-gold)]/10 text-[var(--ca-gold)]' },
    ];
  }

  private renderCharts() {
    const data = this.dashboard();
    if (!this.viewReady || !data) {
      return;
    }

    this.destroyCharts();
    this.createBarChart(this.trendChart, 'bar', data.incidentsByDay.map((item) => this.shortDate(item.date)), data.incidentsByDay.map((item) => item.total), '#14B8A6');
    this.createDoughnutChart(this.statusChart, data.incidentsByStatus.map((item) => item.status), data.incidentsByStatus.map((item) => item.total));
    this.createBarChart(this.categoryChart, 'bar', data.incidentsByCategory.map((item) => item.category), data.incidentsByCategory.map((item) => item.total), '#D4A937');
    this.createBarChart(this.sectorChart, 'bar', data.incidentsBySector.map((item) => item.sector), data.incidentsBySector.map((item) => item.total), '#0F766E', true);
  }

  private createBarChart(ref: ElementRef<HTMLCanvasElement> | undefined, type: 'bar', labels: string[], values: number[], color: string, horizontal = false) {
    const canvas = ref?.nativeElement;
    if (!canvas) return;
    this.charts.push(new Chart(canvas, {
      type,
      data: { labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 6, maxBarThickness: 34 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748B' } },
          y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { precision: 0, color: '#64748B' } },
        },
      },
    }));
  }

  private createDoughnutChart(ref: ElementRef<HTMLCanvasElement> | undefined, labels: string[], values: number[]) {
    const canvas = ref?.nativeElement;
    if (!canvas) return;
    this.charts.push(new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: ['#14B8A6', '#D4A937', '#0F172A', '#60A5FA', '#F97316', '#EF4444'], borderColor: '#FFFFFF', borderWidth: 4 }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } } },
    }));
  }

  private destroyCharts() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  private applyPresetDates() {
    const now = new Date();
    const start = new Date(now);
    if (this.periodo === '7d') {
      start.setDate(now.getDate() - 6);
    } else if (this.periodo === '30d') {
      start.setDate(now.getDate() - 29);
    } else if (this.periodo === 'month') {
      start.setDate(1);
    }
    start.setHours(0, 0, 0, 0);
    now.setHours(23, 59, 59, 999);
    this.fechaDesdeLocal = this.toLocalInputValue(start);
    this.fechaHastaLocal = this.toLocalInputValue(now);
  }

  private updateSectorOptions(data: AdminDashboardAnalyticsResponse) {
    const options = data.incidentsBySector
      .filter((item) => !!item.sectorId)
      .map((item) => ({ label: item.sector, value: item.sectorId }));
    this.sectorOptions.set(options);
  }

  private toIso(value: string): string | undefined {
    return value ? new Date(value).toISOString() : undefined;
  }

  private toLocalInputValue(date: Date): string {
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  private shortDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('es-EC', { month: 'short', day: '2-digit' }).format(new Date(year, month - 1, day));
  }
}
