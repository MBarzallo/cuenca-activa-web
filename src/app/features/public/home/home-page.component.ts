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
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- HERO SECTION: Premium design with deep gradients and blurred glass ambient details -->
      <section class="relative overflow-hidden rounded-[38px] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white shadow-2xl shadow-teal-950/20">
        <!-- Ambient lighting glow effects -->
        <div class="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[var(--ca-teal)]/15 blur-[100px] pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-[var(--ca-gold)]/10 blur-[120px] pointer-events-none"></div>
        
        <div class="relative z-10 grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_420px] lg:p-16">
          <div class="flex flex-col justify-center max-w-3xl">
            <span class="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--ca-gold)] w-fit backdrop-blur-sm">
              <span class="h-2 w-2 rounded-full bg-[var(--ca-gold)] animate-pulse"></span>
              CuencaActiva
            </span>
            <h1 class="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl tracking-tight">
              Mira qué pasa en tu ciudad y <span class="bg-gradient-to-r from-teal-400 to-[var(--ca-gold)] bg-clip-text text-transparent">participa activamente</span>.
            </h1>
            <p class="mt-6 text-lg leading-relaxed text-slate-300">
              Consulta reportes ciudadanos, revisa su avance en tiempo real en el mapa interactivo y crea nuevos reportes para mejorar los espacios públicos de Cuenca.
            </p>
            <div class="mt-10 flex flex-wrap gap-4">
              <a routerLink="/mapa" pButton icon="pi pi-map" label="Explorar mapa" class="p-button-lg shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"></a>
              <a routerLink="/reportar" pButton severity="secondary" outlined icon="pi pi-plus-circle" label="Crear reporte" class="p-button-lg hover:bg-white/10 hover:border-white transition-all"></a>
              <a routerLink="/incidencias" pButton severity="secondary" text icon="pi pi-list" label="Ver listado" class="p-button-lg hover:text-white transition-all"></a>
            </div>
          </div>

          <!-- Glassmorphic Feature Cards -->
          <div class="grid content-center gap-4">
            <div class="group rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/15 hover:scale-[1.02]">
              <div class="flex gap-4">
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--ca-teal)]/20 text-[var(--ca-teal)] group-hover:scale-110 transition-transform"><i class="pi pi-search text-xl"></i></span>
                <div>
                  <h2 class="text-base font-semibold tracking-wide">Consulta incidencias</h2>
                  <p class="mt-1.5 text-sm leading-relaxed text-slate-300">Explora reportes ciudadanos abiertos y su estado de atención en tiempo real.</p>
                </div>
              </div>
            </div>
            <div class="group rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/15 hover:scale-[1.02]">
              <div class="flex gap-4">
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--ca-gold)]/20 text-[var(--ca-gold)] group-hover:scale-110 transition-transform"><i class="pi pi-map-marker text-xl"></i></span>
                <div>
                  <h2 class="text-base font-semibold tracking-wide">Ubicación exacta</h2>
                  <p class="mt-1.5 text-sm leading-relaxed text-slate-300">Visualiza en el mapa los sectores con incidencias reportadas en tu zona.</p>
                </div>
              </div>
            </div>
            <div class="group rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/15 hover:scale-[1.02]">
              <div class="flex gap-4">
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white group-hover:scale-110 transition-transform"><i class="pi pi-check-circle text-xl"></i></span>
                <div>
                  <h2 class="text-base font-semibold tracking-wide">Participación directa</h2>
                  <p class="mt-1.5 text-sm leading-relaxed text-slate-300">Comenta, aporta detalles y valida cuando un problema urbano ha sido solucionado.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STEPS SECTION: Interactive layout showing clean pathways -->
      <section class="mt-10 rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-slate-200/60 sm:p-10">
        <div class="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-center">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-[var(--ca-teal)]">Cómo funciona</p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 leading-tight">Participar toma muy pocos pasos</h2>
            <p class="mt-3 text-sm leading-relaxed text-slate-500">Forma parte activa del cambio en tu comunidad reportando y dando seguimiento.</p>
          </div>
          <div class="grid gap-5 md:grid-cols-3">
            <div class="group rounded-3xl bg-slate-50 border border-slate-100 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-100 hover:border-slate-200">
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 font-extrabold text-[var(--ca-teal)] text-lg shadow-sm group-hover:scale-110 transition-transform">1</span>
              <h3 class="mt-5 font-bold text-slate-800 text-base">Busca o explora</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-500">Revisa si la incidencia ya ha sido reportada por otro ciudadano en el mapa.</p>
            </div>
            <div class="group rounded-3xl bg-slate-50 border border-slate-100 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-100 hover:border-slate-200">
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 font-extrabold text-[var(--ca-gold)] text-lg shadow-sm group-hover:scale-110 transition-transform">2</span>
              <h3 class="mt-5 font-bold text-slate-800 text-base">Crea un reporte</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-500">Completa una descripción corta del problema, marca el punto y adjunta una foto.</p>
            </div>
            <div class="group rounded-3xl bg-slate-50 border border-slate-100 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-100 hover:border-slate-200">
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-slate-200/60 font-extrabold text-[var(--ca-navy)] text-lg shadow-sm group-hover:scale-110 transition-transform">3</span>
              <h3 class="mt-5 font-bold text-slate-800 text-base">Da seguimiento</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-500">Sigue el avance del reporte, interactúa en comentarios y ayuda a cerrarlo.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT SPLIT: Recent activity & CTA banner -->
      <section class="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
        <p-card styleClass="border-0 shadow-sm overflow-hidden">
          <ng-template pTemplate="header">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 class="text-xl font-bold tracking-tight text-slate-800">Incidencias recientes</h2>
                <p class="mt-1 text-sm text-slate-500">Últimos reportes registrados por la ciudadanía.</p>
              </div>
              <a routerLink="/incidencias" pButton size="small" severity="secondary" outlined icon="pi pi-arrow-right" label="Ver todas" class="transition-all hover:translate-x-0.5"></a>
            </div>
          </ng-template>
          
          <div class="grid gap-3.5">
            @for (incidencia of incidencias().slice(0, 5); track incidencia.idIncidencia) {
              <a [routerLink]="['/incidencias', incidencia.idIncidencia]" class="group flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 transition-all duration-300 hover:border-teal-500/30 hover:bg-teal-50/10 hover:shadow-md hover:shadow-teal-900/5 sm:flex-row sm:items-center sm:justify-between">
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
              <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <i class="pi pi-inbox text-3xl text-slate-400"></i>
                <p class="mt-3 font-semibold text-slate-700">Aún no hay incidencias disponibles</p>
                <p class="mt-1 text-sm text-slate-400">Los reportes se mostrarán aquí una vez que sean registrados.</p>
              </div>
            }
          </div>
        </p-card>

        <!-- Dynamic CTA Card with deep brand gradient -->
        <div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-[var(--ca-navy)] p-8 text-white shadow-xl flex flex-col justify-between min-h-[360px]">
          <!-- Decorative light highlight -->
          <div class="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-[var(--ca-gold)]/10 blur-[80px] pointer-events-none"></div>
          
          <div>
            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ca-gold)]/15 text-[var(--ca-gold)] shadow-md"><i class="pi pi-sparkles text-xl"></i></span>
            <h2 class="mt-6 text-2xl font-extrabold tracking-tight leading-snug">Empieza con tu cuenta ciudadana</h2>
            <p class="mt-4 leading-relaxed text-slate-300 text-sm">
              Regístrate para guardar tus reportes, interactuar con otros ciudadanos, acumular puntos de participación y dar seguimiento a los problemas de tu vecindario.
            </p>
          </div>
          <div class="mt-8 flex flex-col gap-2.5 relative z-10">
            <a routerLink="/reportar" pButton icon="pi pi-plus-circle" label="Crear reporte" class="w-full justify-center p-button-raised hover:scale-[1.02] transition-transform"></a>
            <a routerLink="/registro" pButton severity="secondary" outlined icon="pi pi-user-plus" label="Crear cuenta" class="w-full justify-center hover:bg-white/5 hover:border-white transition-all"></a>
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
