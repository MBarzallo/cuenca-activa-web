import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Incidencia } from '../../../core/models/incidencia.model';
import { IncidenciasService } from '../../../core/services/incidencias.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  template: `
    <main class="ca-page-shell">
      <section class="relative overflow-hidden rounded-[var(--ca-radius-xl)] bg-[var(--ca-navy)] text-white shadow-[0_24px_70px_rgba(17,24,39,0.16)]">
        <div class="absolute inset-x-0 top-0 h-px bg-white/20"></div>
        <div class="relative z-10 grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-12">
          <div class="flex flex-col justify-center max-w-3xl">
            <span class="ca-kicker text-[var(--ca-gold)]">CuencaActiva</span>
            <h1 class="mt-5 text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Reporta problemas urbanos y sigue su avance.
            </h1>
            <p class="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Consulta incidencias, ubícalas en el mapa y aporta información útil para mejorar los espacios públicos de Cuenca.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a routerLink="/mapa" pButton icon="pi pi-map" label="Explorar mapa" class="p-button-lg"></a>
              <a routerLink="/reportar" pButton severity="secondary" outlined icon="pi pi-plus-circle" label="Crear reporte" class="p-button-lg"></a>
            </div>
          </div>

          <div class="grid content-center gap-3">
            <div class="rounded-[var(--ca-radius-lg)] border border-white/10 bg-white/[0.06] p-5">
              <div class="flex gap-4">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ca-radius)] bg-white/10 text-[var(--ca-teal)]"><i class="pi pi-search text-lg"></i></span>
                <div>
                  <h2 class="text-base font-semibold">Consulta incidencias</h2>
                  <p class="mt-1.5 text-sm leading-relaxed text-slate-300">Explora reportes ciudadanos abiertos y su estado de atención en tiempo real.</p>
                </div>
              </div>
            </div>
            <div class="rounded-[var(--ca-radius-lg)] border border-white/10 bg-white/[0.06] p-5">
              <div class="flex gap-4">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ca-radius)] bg-white/10 text-[var(--ca-gold)]"><i class="pi pi-map-marker text-lg"></i></span>
                <div>
                  <h2 class="text-base font-semibold">Ubicación exacta</h2>
                  <p class="mt-1.5 text-sm leading-relaxed text-slate-300">Visualiza en el mapa los sectores con incidencias reportadas en tu zona.</p>
                </div>
              </div>
            </div>
            <div class="rounded-[var(--ca-radius-lg)] border border-white/10 bg-white/[0.06] p-5">
              <div class="flex gap-4">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ca-radius)] bg-white/10 text-white"><i class="pi pi-check-circle text-lg"></i></span>
                <div>
                  <h2 class="text-base font-semibold">Participación directa</h2>
                  <p class="mt-1.5 text-sm leading-relaxed text-slate-300">Comenta, aporta detalles y valida cuando un problema urbano ha sido solucionado.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="ca-panel mt-8 p-6 sm:p-8">
        <div class="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-center">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Participar toma pocos pasos</h2>
            <p class="mt-3 text-sm leading-relaxed text-slate-500">Forma parte activa del cambio en tu comunidad reportando y dando seguimiento.</p>
          </div>
          <div class="grid gap-5 md:grid-cols-3">
            <div class="rounded-[var(--ca-radius-lg)] bg-slate-50 border border-slate-100 p-5 transition hover:border-slate-200 hover:bg-white">
              <span class="grid h-10 w-10 place-items-center rounded-[var(--ca-radius)] bg-teal-50 font-extrabold text-[var(--ca-teal)] text-base shadow-sm">1</span>
              <h3 class="mt-5 font-bold text-slate-800 text-base">Busca o explora</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-500">Revisa si la incidencia ya ha sido reportada por otro ciudadano en el mapa.</p>
            </div>
            <div class="rounded-[var(--ca-radius-lg)] bg-slate-50 border border-slate-100 p-5 transition hover:border-slate-200 hover:bg-white">
              <span class="grid h-10 w-10 place-items-center rounded-[var(--ca-radius)] bg-amber-50 font-extrabold text-[var(--ca-gold)] text-base shadow-sm">2</span>
              <h3 class="mt-5 font-bold text-slate-800 text-base">Crea un reporte</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-500">Completa una descripción corta del problema, marca el punto y adjunta una foto.</p>
            </div>
            <div class="rounded-[var(--ca-radius-lg)] bg-slate-50 border border-slate-100 p-5 transition hover:border-slate-200 hover:bg-white">
              <span class="grid h-10 w-10 place-items-center rounded-[var(--ca-radius)] bg-slate-200/60 font-extrabold text-[var(--ca-navy)] text-base shadow-sm">3</span>
              <h3 class="mt-5 font-bold text-slate-800 text-base">Da seguimiento</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-500">Sigue el avance del reporte, interactúa en comentarios y ayuda a cerrarlo.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
        <p-card styleClass="overflow-hidden">
          <ng-template pTemplate="header">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 class="text-xl font-bold tracking-tight text-slate-800">Incidencias recientes</h2>
                <p class="mt-1 text-sm text-slate-500">Últimos reportes registrados por la ciudadanía.</p>
              </div>
              <a routerLink="/incidencias" pButton size="small" severity="secondary" outlined icon="pi pi-arrow-right" label="Ver todas"></a>
            </div>
          </ng-template>
          
          <div class="grid gap-3.5">
            @for (incidencia of incidencias().slice(0, 5); track incidencia.idIncidencia) {
              <a [routerLink]="['/incidencias', incidencia.idIncidencia]" class="group flex flex-col gap-4 rounded-[var(--ca-radius)] border border-slate-200 p-5 transition hover:border-teal-500/30 hover:bg-teal-50/40 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <span class="block font-bold text-slate-800 group-hover:text-[var(--ca-teal)] transition-colors truncate">{{ incidencia.titulo }}</span>
                  <span class="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <i class="pi pi-map-marker text-xs shrink-0"></i>
                    <span class="truncate">{{ incidencia.nombreSector || incidencia.direccionReferencial || 'Cuenca' }}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between gap-4 shrink-0 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                  <p-tag [value]="incidencia.nombreEstado" [severity]="tagSeverity(incidencia.codigoEstado)"></p-tag>
                  <i class="pi pi-chevron-right text-slate-300 group-hover:translate-x-1 group-hover:text-[var(--ca-teal)] transition-all"></i>
                </div>
              </a>
            } @empty {
              <div class="ca-empty-state">
                <i class="pi pi-inbox text-3xl text-slate-400"></i>
                <p class="mt-3 font-semibold text-slate-700">Aún no hay incidencias disponibles</p>
                <p class="mt-1 text-sm text-slate-400">Los reportes se mostrarán aquí una vez que sean registrados.</p>
              </div>
            }
          </div>
        </p-card>

        <div class="relative overflow-hidden rounded-[var(--ca-radius-xl)] bg-[var(--ca-navy)] p-7 text-white shadow-[0_20px_55px_rgba(17,24,39,0.14)] flex flex-col justify-between min-h-[340px]">
          <div>
            <span class="grid h-11 w-11 place-items-center rounded-[var(--ca-radius)] bg-[var(--ca-gold)]/15 text-[var(--ca-gold)]"><i class="pi pi-user-plus text-lg"></i></span>
            <h2 class="mt-6 text-2xl font-extrabold tracking-tight leading-snug">Empieza con tu cuenta ciudadana</h2>
            <p class="mt-4 leading-relaxed text-slate-300 text-sm">
              Regístrate para guardar tus reportes, interactuar con otros ciudadanos, acumular puntos de participación y dar seguimiento a los problemas de tu vecindario.
            </p>
          </div>
          <div class="mt-8 flex flex-col gap-2.5 relative z-10">
            <a routerLink="/reportar" pButton icon="pi pi-plus-circle" label="Crear reporte" class="w-full justify-center p-button-raised"></a>
            <a routerLink="/registro" pButton severity="secondary" outlined icon="pi pi-user-plus" label="Crear cuenta" class="w-full justify-center"></a>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class HomePageComponent implements OnInit {
  readonly incidencias = signal<Incidencia[]>([]);

  constructor(private readonly incidenciasService: IncidenciasService) {}

  ngOnInit() {
    this.incidenciasService.list({ limit: 8, offset: 0 }).subscribe((items) => this.incidencias.set(items));
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
}
