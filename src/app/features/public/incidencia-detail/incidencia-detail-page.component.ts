import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import * as L from 'leaflet';
import {
  ArchivoMultimedia,
  ComentarioIncidencia,
  ConfirmacionCompletadoDetalle,
  HistorialEstadoIncidencia,
  ResumenConfirmacionesCompletado,
  ResumenVotosIncidencia,
  SeguimientoIncidencia,
  VotoIncidencia,
} from '../../../core/models/incidencia-detail.model';
import { Incidencia, IncidenciaRelacionada } from '../../../core/models/incidencia.model';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { EstadoIncidencia } from '../../../core/models/catalogo.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { IncidenciasService } from '../../../core/services/incidencias.service';
import { citizenStatusOptions, isFinalCitizenIncident } from '../../../shared/utils/citizen-status-options';

@Component({
  selector: 'app-incidencia-detail-page',
  standalone: true,
  imports: [RouterLink, FormsModule, ButtonModule, CardModule, DialogModule, SelectModule, TagModule, TextareaModule, DatePipe],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <a routerLink="/incidencias" pButton severity="secondary" outlined icon="pi pi-arrow-left" label="Volver al listado"></a>
        @if (incidencia(); as item) {
          <a routerLink="/mapa" pButton severity="secondary" text icon="pi pi-map" label="Ver en mapa"></a>
        }
      </div>

      @if (incidencia(); as item) {
        <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <!-- COLUMNA PRINCIPAL (Izquierda) -->
          <div class="space-y-6">
            <!-- Incidencia principal -->
            <article class="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
              @if (principalImage(); as image) {
                <div class="group relative h-72 cursor-zoom-in bg-slate-100 sm:h-96" (click)="openImageViewer(galleryImages(), galleryIndex(image))">
                  <img [src]="image.downloadUrl" [alt]="image.nombreArchivo || item.titulo" class="h-full w-full object-cover" />
                  <div class="absolute inset-0 grid place-items-center bg-slate-950/0 transition group-hover:bg-slate-950/25">
                    <span class="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--ca-navy)] opacity-0 shadow-lg transition group-hover:opacity-100">
                      <i class="pi pi-search-plus mr-2"></i>Ver foto
                    </span>
                  </div>
                </div>
              } @else {
                <div class="grid h-64 place-items-center bg-[linear-gradient(135deg,#0F172A,#155E75)] px-8 text-center text-white sm:h-80">
                  <div>
                    <i class="pi pi-map-marker text-4xl text-[var(--ca-gold)]"></i>
                    <p class="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">{{ item.nombreCategoria }}</p>
                    <h1 class="mt-2 max-w-3xl text-3xl font-semibold sm:text-4xl">{{ item.titulo }}</h1>
                  </div>
                </div>
              }

              <div class="p-6 sm:p-8">
                <!-- Banner de revisión de imágenes (solo dueño de incidencia) -->
                @if (isOwner(item) && reviewNotice(); as notice) {
                  <div class="mb-6 flex gap-4 rounded-2xl border p-4.5" [class]="notice.class">
                    <span class="flex-shrink-0 text-xl" [class]="notice.iconColor">
                      <i [class]="notice.icon"></i>
                    </span>
                    <div>
                      <h4 class="font-bold text-slate-800 text-sm leading-snug">{{ notice.title }}</h4>
                      <p class="mt-1 text-slate-500 text-xs leading-normal">{{ notice.message }}</p>
                    </div>
                  </div>
                }

                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ca-teal)]">{{ item.nombreCategoria }}</p>
                    <h1 class="mt-2 text-3xl font-semibold leading-tight">{{ item.titulo }}</h1>
                    <p class="mt-3 text-sm text-slate-500">
                      Reportado el {{ item.fechaReporte | date: 'mediumDate' }} · {{ item.nombreSector || item.direccionReferencial || 'Cuenca' }}
                    </p>
                  </div>
                  <p-tag [value]="item.nombreEstado" [severity]="tagSeverity(item.codigoEstado)"></p-tag>
                </div>

                <p class="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">{{ item.descripcion }}</p>

                <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div class="ca-soft-stat">
                    <span>Validaciones</span>
                    <strong>{{ item.cantidadValidaciones }}</strong>
                  </div>
                  <div class="ca-soft-stat">
                    <span>Comentarios</span>
                    <strong>{{ item.cantidadComentarios }}</strong>
                  </div>
                  <div class="ca-soft-stat">
                    <span>Seguidores</span>
                    <strong>{{ item.cantidadSeguidores }}</strong>
                  </div>
                  <div class="ca-soft-stat">
                    <span>Confirmaciones</span>
                    <strong>{{ item.cantidadConfirmaciones }}</strong>
                  </div>
                </div>
              </div>
            </article>

            <!-- Ubicación Map Card -->
            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="text-lg font-semibold">Ubicación geográfica</h2>
                  <p class="mt-1 text-sm text-slate-500">{{ item.direccionReferencial || item.nombreSector || 'Cuenca' }}</p>
                </div>
              </ng-template>
              <div id="incident-detail-map" class="h-64 overflow-hidden rounded-2xl border border-slate-150"></div>
            </p-card>

            <!-- Galería de imágenes (si hay más de 1) -->
            @if (galleryImages().length > 1) {
              <p-card styleClass="border-0 shadow-sm">
                <ng-template pTemplate="header">
                  <div class="border-b border-slate-100 px-5 py-4">
                    <h2 class="text-lg font-semibold">Fotos del reporte</h2>
                    <p class="mt-1 text-sm text-slate-500">Abre una imagen para verla en pantalla completa.</p>
                  </div>
                </ng-template>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  @for (image of galleryImages(); track image.idMultimedia) {
                    <div class="group relative cursor-zoom-in overflow-hidden rounded-2xl bg-slate-100" (click)="openImageViewer(galleryImages(), galleryIndex(image))">
                      <img [src]="image.downloadUrl" [alt]="image.nombreArchivo || item.titulo" class="h-44 w-full object-cover" />
                      <div class="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                        <span class="min-w-0 truncate text-sm font-semibold text-white">{{ image.nombreArchivo || 'Foto del reporte' }}</span>
                        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/90 text-[var(--ca-navy)]">
                          <i class="pi pi-search-plus"></i>
                        </span>
                      </div>
                      <button
                        pButton
                        size="small"
                        severity="danger"
                        text
                        icon="pi pi-flag"
                        class="absolute right-2 top-2 bg-white/90"
                        (click)="openReportDialog(image.idMultimedia, 'MULTIMEDIA'); $event.stopPropagation()"
                      ></button>
                    </div>
                  }
                </div>
              </p-card>
            }

            <!-- Confirmaciones de solución -->
            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="text-lg font-semibold">Confirmaciones de solución</h2>
                  <p class="mt-1 text-sm text-slate-500">Aportes de ciudadanos que indican que el problema fue atendido.</p>
                </div>
              </ng-template>
              <div class="space-y-3">
                @for (confirmacion of confirmacionesRecientes(); track confirmacion.idConfirmacion) {
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold">{{ confirmacion.aliasUsuario || 'Ciudadano' }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ confirmacion.creadoEn | date: 'medium' }}</p>
                      </div>
                      <button pButton size="small" severity="danger" text icon="pi pi-flag" (click)="openReportDialog(confirmacion.idConfirmacion, 'CONFIRMACION')"></button>
                    </div>
                    @if (confirmacion.observacion) {
                      <p class="mt-3 text-sm leading-6 text-slate-600">{{ confirmacion.observacion }}</p>
                    }
                    @if (confirmacion.latitud !== null && confirmacion.longitud !== null) {
                      <div class="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        <i class="pi pi-map-marker text-[var(--ca-teal)]"></i>
                        Evidencia con ubicación
                      </div>
                    }
                    @if (confirmationImages(confirmacion).length) {
                      <div class="mt-4">
                        <div class="mb-2 flex items-center justify-between gap-3">
                          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Evidencia fotográfica</p>
                          <span class="text-xs font-semibold text-slate-400">{{ confirmationImages(confirmacion).length }} foto(s)</span>
                        </div>
                        <div class="flex gap-2 overflow-x-auto pb-1">
                          @for (media of confirmationImages(confirmacion); track media.idMultimedia) {
                            <button
                              type="button"
                              class="group relative h-24 w-28 shrink-0 cursor-zoom-in overflow-hidden rounded-2xl bg-slate-200 text-left"
                              (click)="openImageViewer(confirmationImages(confirmacion), galleryIndex(media, confirmationImages(confirmacion)))"
                            >
                              <img [src]="media.downloadUrl" [alt]="media.nombreArchivo || 'Evidencia'" class="h-full w-full object-cover" />
                              <span class="absolute inset-0 grid place-items-center bg-slate-950/0 text-white transition group-hover:bg-slate-950/35">
                                <i class="pi pi-search-plus opacity-0 transition group-hover:opacity-100"></i>
                              </span>
                            </button>
                          }
                        </div>
                        <div class="mt-2 flex flex-wrap gap-2">
                          @for (media of confirmationImages(confirmacion); track media.idMultimedia) {
                            <button pButton size="small" severity="danger" text icon="pi pi-flag" label="Denunciar evidencia" (click)="openReportDialog(media.idMultimedia, 'MULTIMEDIA')"></button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @empty {
                  <p class="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aún no hay confirmaciones recientes.</p>
                }
              </div>
            </p-card>

            <!-- Comentarios recientes -->
            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="text-lg font-semibold">Conversación ciudadana</h2>
                  <p class="mt-1 text-sm text-slate-500">Comentarios y aportes de la comunidad.</p>
                </div>
              </ng-template>
              @if (isLoggedIn()) {
                <div class="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <textarea pTextarea class="w-full border-0 bg-transparent resize-none outline-none focus:ring-0 text-sm" rows="3" [(ngModel)]="nuevoComentario" placeholder="Aporta información útil para otros ciudadanos..."></textarea>
                  <div class="mt-3 flex justify-end">
                    <button pButton size="small" icon="pi pi-send" label="Comentar" [disabled]="!nuevoComentario.trim()" (click)="createComment(item)"></button>
                  </div>
                </div>
              } @else {
                <div class="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Inicia sesión para comentar o seguir este reporte.
                  <a routerLink="/login" class="ml-1 font-semibold text-[var(--ca-teal)] hover:underline">Ingresar</a>
                </div>
              }
              <div class="space-y-4">
                @for (comentario of comentarios(); track comentario.idComentario) {
                  <div class="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-slate-800">{{ comentario.aliasUsuario || 'Ciudadano' }}</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">{{ comentario.creadoEn | date: 'medium' }}</p>
                      </div>
                      <button pButton size="small" severity="danger" text icon="pi pi-flag" (click)="openReportDialog(comentario.idComentario, 'COMENTARIO')"></button>
                    </div>
                    <p class="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-line">{{ comentario.contenido }}</p>
                  </div>
                } @empty {
                  <p class="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Todavía no hay comentarios visibles.</p>
                }
              </div>
            </p-card>
          </div>

          <!-- COLUMNA LATERAL (Derecha - Sidebar) -->
          <aside class="space-y-6">
            <!-- Gestionar Estado (Propietario) -->
            @if (isOwner(item)) {
              <p-card styleClass="border-0 bg-amber-50 shadow-sm ring-1 ring-amber-100">
                <div class="flex gap-4">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--ca-gold)]/20 text-[var(--ca-gold)]">
                    <i class="pi pi-sync"></i>
                  </span>
                  <div class="min-w-0 flex-1">
                    <h2 class="text-lg font-semibold text-[var(--ca-navy)]">Gestionar estado</h2>
                    <p class="mt-2 text-sm leading-6 text-slate-600">Como propietario puedes actualizar el avance de tu reporte.</p>
                    <button
                      pButton
                      class="mt-4 w-full justify-center"
                      severity="secondary"
                      outlined
                      icon="pi pi-flag"
                      label="Cambiar estado"
                      [disabled]="isFinal(item) || availableStatusOptions(item).length === 0"
                      (click)="openStatusDialog(item)"
                    ></button>
                  </div>
                </div>
              </p-card>
            }

            <!-- Participar -->
            <p-card styleClass="border-0 shadow-sm">
              <h2 class="text-lg font-semibold">Participar</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">Ayuda a mantener actualizada la información de este reporte.</p>

              <div class="mt-4 grid gap-2">
                <button
                  pButton
                  [outlined]="!seguimiento()?.siguiendo"
                  severity="secondary"
                  icon="pi pi-bell"
                  [label]="seguimiento()?.siguiendo ? 'Siguiendo' : 'Seguir reporte'"
                  (click)="toggleFollow(item)"
                ></button>
                <button
                  pButton
                  outlined
                  severity="secondary"
                  icon="pi pi-check-circle"
                  [label]="confirmaciones()?.usuarioYaConfirmo ? 'Ya notificaste completado' : 'Notificar como completado'"
                  [disabled]="confirmaciones()?.usuarioYaConfirmo === true"
                  (click)="openCompletionDialog()"
                ></button>
                <button pButton text severity="danger" icon="pi pi-flag" label="Denunciar contenido" (click)="openReportDialog(item.idIncidencia, 'INCIDENCIA')"></button>
              </div>
              @if (confirmaciones(); as resumenConfirmaciones) {
                <div class="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <span class="font-semibold text-[var(--ca-navy)]">{{ resumenConfirmaciones.totalConfirmaciones }}</span> confirmaciones de solución
                </div>
              }
            </p-card>

            <!-- Validación comunitaria -->
            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="text-lg font-semibold">Validación comunitaria</h2>
                  <p class="mt-1 text-sm text-slate-500">Indica si este reporte existe, no corresponde o necesita prioridad.</p>
                </div>
              </ng-template>

              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-2xl bg-emerald-50 p-3 text-center">
                  <i class="pi pi-check-circle text-emerald-600"></i>
                  <strong class="mt-1 block text-lg">{{ voteCount('CONFIRMA_EXISTENCIA') }}</strong>
                  <span class="text-xs text-slate-500">Existe</span>
                </div>
                <div class="rounded-2xl bg-rose-50 p-3 text-center">
                  <i class="pi pi-times-circle text-rose-600"></i>
                  <strong class="mt-1 block text-lg">{{ voteCount('NO_EXISTE') }}</strong>
                  <span class="text-xs text-slate-500">No corresponde</span>
                </div>
                <div class="rounded-2xl bg-amber-50 p-3 text-center">
                  <i class="pi pi-exclamation-circle text-amber-600"></i>
                  <strong class="mt-1 block text-lg">{{ voteCount('IMPORTANTE') }}</strong>
                  <span class="text-xs text-slate-500">Importante</span>
                </div>
              </div>

              @if (votos()?.usuarioYaVoto && votos()?.votoUsuario; as userVote) {
                <div class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p class="font-semibold text-emerald-900">Ya validaste este reporte</p>
                  <p class="mt-1 text-sm text-emerald-800">{{ voteRegisteredLabel(userVote.tipoVoto) }}</p>
                  @if (userVote.observacion) {
                    <p class="mt-2 text-sm text-slate-650">{{ userVote.observacion }}</p>
                  }
                </div>
	              } @else if (isLoggedIn()) {
	                <div class="mt-4 space-y-3">
	                  <div class="grid gap-2" role="radiogroup" aria-label="Tipo de validación comunitaria">
	                    <button
	                      type="button"
	                      role="radio"
	                      [attr.aria-checked]="isVoteTypeSelected('CONFIRMA_EXISTENCIA')"
	                      class="ca-vote-option"
	                      [class.ca-vote-option-selected]="isVoteTypeSelected('CONFIRMA_EXISTENCIA')"
	                      (click)="selectVoteType('CONFIRMA_EXISTENCIA')"
	                    >
	                      <i class="pi pi-check-circle text-emerald-600"></i>
	                      <span>Confirmo que existe</span>
	                    </button>
	                    <button
	                      type="button"
	                      role="radio"
	                      [attr.aria-checked]="isVoteTypeSelected('NO_EXISTE')"
	                      class="ca-vote-option"
	                      [class.ca-vote-option-selected]="isVoteTypeSelected('NO_EXISTE')"
	                      (click)="selectVoteType('NO_EXISTE')"
	                    >
	                      <i class="pi pi-times-circle text-rose-600"></i>
	                      <span>No corresponde</span>
	                    </button>
	                    <button
	                      type="button"
	                      role="radio"
	                      [attr.aria-checked]="isVoteTypeSelected('IMPORTANTE')"
	                      class="ca-vote-option"
	                      [class.ca-vote-option-selected]="isVoteTypeSelected('IMPORTANTE')"
	                      (click)="selectVoteType('IMPORTANTE')"
	                    >
	                      <i class="pi pi-exclamation-circle text-amber-600"></i>
	                      <span>Es importante</span>
	                    </button>
	                  </div>
                  <textarea pTextarea class="w-full" rows="3" [(ngModel)]="voteObservation" placeholder="Observación opcional"></textarea>
                  <button pButton class="w-full justify-center" icon="pi pi-send" label="Enviar validación" (click)="submitVote(item)"></button>
                </div>
              } @else {
                <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Inicia sesión para validar este reporte.
                  <a routerLink="/login" class="ml-1 font-semibold text-[var(--ca-teal)]">Ingresar</a>
                </div>
              }

              @if (votosRecientes().length) {
                <div class="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <p class="text-sm font-semibold">Validaciones recientes</p>
                  @for (voto of votosRecientes().slice(0, 4); track voto.idVoto) {
                    <div class="rounded-xl bg-slate-50 p-3 border border-slate-100/50">
                      <p class="text-xs font-semibold text-slate-800">{{ voto.aliasUsuario || 'Ciudadano' }} · {{ voteShortLabel(voto.tipoVoto) }}</p>
                      @if (voto.observacion) {
                        <p class="mt-1 text-xs text-slate-650">{{ voto.observacion }}</p>
                      }
                    </div>
                  }
                </div>
              }
            </p-card>

            <!-- Seguimiento (Historial de estados) -->
            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="text-lg font-semibold">Historial de cambios</h2>
                  <p class="mt-1 text-sm text-slate-500">Seguimiento de estados del reporte.</p>
                </div>
              </ng-template>
              <div class="space-y-4">
                @for (itemHistorial of historial(); track itemHistorial.idHistorial) {
                  <div class="flex gap-3">
                    <span class="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--ca-teal)] ring-4 ring-teal-50 shrink-0"></span>
                    <div class="flex-1 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                      <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <p class="font-bold text-xs text-slate-800">{{ itemHistorial.nombreEstadoNuevo }}</p>
                        <span class="text-[10px] font-semibold text-slate-400">{{ itemHistorial.cambiadoEn | date: 'shortDate' }}</span>
                      </div>
                      @if (itemHistorial.observacion) {
                        <p class="mt-1.5 text-xs leading-relaxed text-slate-655">{{ itemHistorial.observacion }}</p>
                      }
                    </div>
                  </div>
                } @empty {
                  <p class="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aún no hay historial para mostrar.</p>
                }
              </div>
            </p-card>

            <!-- Relacionadas -->
            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="text-lg font-semibold">Incidencias relacionadas</h2>
                </div>
              </ng-template>
              <div class="space-y-3">
                @for (relacionada of relacionadas(); track relacionada.idRelacion) {
                  <a [routerLink]="['/incidencias', relacionada.idIncidenciaRelacionada]" class="block rounded-2xl border border-slate-200 p-4 transition hover:border-[var(--ca-teal)] hover:bg-slate-50">
                    <span class="block font-semibold text-sm text-slate-800">{{ relacionada.titulo }}</span>
                    <span class="mt-1 block text-xs text-slate-500">{{ relacionada.nombreEstado }}</span>
                  </a>
                } @empty {
                  <p class="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No hay reportes relacionados.</p>
                }
              </div>
            </p-card>
          </aside>
        </section>
      }

      <p-dialog header="Denunciar contenido" [(visible)]="reportDialogVisible" [modal]="true" [style]="{ width: 'min(520px, 94vw)' }">
        <div class="space-y-4">
          <p class="text-sm leading-6 text-slate-600">Cuéntanos por qué este contenido necesita revisión.</p>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold">Motivo</span>
            <textarea pTextarea class="w-full" rows="2" [(ngModel)]="reporteMotivo"></textarea>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold">Detalle opcional</span>
            <textarea pTextarea class="w-full" rows="4" [(ngModel)]="reporteDetalle"></textarea>
          </label>
          <div class="flex justify-end gap-2">
            <button pButton severity="secondary" outlined label="Cancelar" (click)="reportDialogVisible = false"></button>
            <button pButton label="Enviar denuncia" [disabled]="!reporteMotivo.trim()" (click)="submitReport()"></button>
          </div>
        </div>
      </p-dialog>

      <p-dialog header="Notificar como completado" [(visible)]="completionDialogVisible" [modal]="true" [style]="{ width: 'min(520px, 94vw)' }">
        <div class="space-y-4">
          <p class="text-sm leading-6 text-slate-600">Indica si observaste que esta incidencia ya fue atendida o solucionada.</p>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold">Observación opcional</span>
            <textarea pTextarea class="w-full" rows="4" [(ngModel)]="completionObservation" placeholder="Ej. Ya retiraron los escombros de la vía"></textarea>
          </label>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold">Ubicación como evidencia</p>
                <p class="mt-1 text-xs text-slate-500">
                  @if (completionLat !== null && completionLng !== null) {
                    {{ completionLat.toFixed(6) }}, {{ completionLng.toFixed(6) }}
                  } @else {
                    Opcional, puedes adjuntar tu ubicación actual.
                  }
                </p>
              </div>
              @if (completionLat !== null && completionLng !== null) {
                <button pButton size="small" severity="secondary" outlined label="Quitar" (click)="clearCompletionLocation()"></button>
              } @else {
                <button pButton size="small" severity="secondary" outlined icon="pi pi-map-marker" [label]="locatingCompletion ? 'Ubicando...' : 'Usar ubicación'" [disabled]="locatingCompletion" (click)="useCompletionLocation()"></button>
              }
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold">Foto de evidencia</p>
            <p class="mt-1 text-xs text-slate-500">Opcional. JPG, PNG o WEBP, máximo 5 MB.</p>
            @if (completionImagePreview) {
              <div class="mt-3 overflow-hidden rounded-2xl">
                <img [src]="completionImagePreview" alt="Evidencia seleccionada" class="h-44 w-full object-cover" />
              </div>
            }
            <div class="mt-3 flex flex-wrap gap-2">
              <label class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <i class="pi pi-image mr-2"></i>
                Seleccionar imagen
                <input type="file" class="hidden" accept="image/jpeg,image/png,image/webp" (change)="onCompletionImageSelected($event)" />
              </label>
              @if (completionImage) {
                <button pButton size="small" severity="secondary" outlined label="Quitar imagen" (click)="clearCompletionImage()"></button>
              }
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button pButton severity="secondary" outlined label="Cancelar" (click)="completionDialogVisible = false"></button>
            <button pButton icon="pi pi-check" [label]="completionSubmitting ? 'Enviando...' : 'Enviar confirmación'" [disabled]="completionSubmitting" (click)="submitCompletion()"></button>
          </div>
        </div>
      </p-dialog>

      <p-dialog
        header="Cambiar estado"
        [(visible)]="statusDialogVisible"
        [modal]="true"
        [style]="{ width: 'min(520px, 94vw)' }"
        [draggable]="false"
      >
        @if (incidencia(); as item) {
          <div class="grid gap-4">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Reporte</p>
              <p class="mt-1 font-semibold">{{ item.titulo }}</p>
              <p class="mt-2 text-sm text-slate-500">Estado actual: {{ item.nombreEstado }}</p>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Nuevo estado</span>
              <p-select class="w-full" [(ngModel)]="newStatusCode" [options]="availableStatusOptions(item)" optionLabel="nombre" optionValue="codigo" placeholder="Selecciona un estado"></p-select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Observación opcional</span>
              <textarea pTextarea class="w-full" rows="4" maxlength="500" [(ngModel)]="statusObservation" placeholder="Ej. Ya fue atendido parcialmente"></textarea>
              <small class="mt-2 block text-slate-500">{{ statusObservation.length }}/500</small>
            </label>
          </div>

          <ng-template pTemplate="footer">
            <button pButton severity="secondary" outlined label="Cancelar" (click)="statusDialogVisible = false"></button>
            <button pButton icon="pi pi-check" label="Guardar estado" [loading]="statusChanging" [disabled]="!newStatusCode" (click)="changeStatus()"></button>
          </ng-template>
        }
      </p-dialog>

      <p-dialog
        [(visible)]="imageViewerVisible"
        [modal]="true"
        [closable]="false"
        [dismissableMask]="true"
        [showHeader]="false"
        styleClass="ca-image-viewer-dialog"
        [contentStyle]="{ padding: '0', background: '#020617' }"
      >
        @if (viewerImage(); as image) {
          <div class="relative grid h-[100dvh] w-[100vw] grid-rows-[auto_1fr_auto] bg-slate-950 text-white">
            <header class="z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ image.nombreArchivo || viewerTitle() }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ imageViewerIndex() + 1 }} de {{ imageViewerImages().length }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button pButton size="small" severity="secondary" outlined icon="pi pi-search-minus" [disabled]="imageZoom() <= 1" (click)="zoomOut()"></button>
                <button pButton size="small" severity="secondary" outlined icon="pi pi-search-plus" [disabled]="imageZoom() >= 3" (click)="zoomIn()"></button>
                <button pButton size="small" severity="secondary" outlined icon="pi pi-times" (click)="closeImageViewer()"></button>
              </div>
            </header>

            <section class="relative min-h-0 overflow-auto">
              <div class="grid min-h-full place-items-center p-4">
                <img
                  [src]="image.downloadUrl"
                  [alt]="image.nombreArchivo || viewerTitle()"
                  class="max-h-[calc(100dvh-9rem)] max-w-full select-none object-contain transition-transform"
                  [style.transform]="'scale(' + imageZoom() + ')'"
                />
              </div>

              @if (imageViewerImages().length > 1) {
                <button
                  pButton
                  class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 text-[var(--ca-navy)]"
                  severity="secondary"
                  icon="pi pi-chevron-left"
                  (click)="previousImage()"
                ></button>
                <button
                  pButton
                  class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 text-[var(--ca-navy)]"
                  severity="secondary"
                  icon="pi pi-chevron-right"
                  (click)="nextImage()"
                ></button>
              }
            </section>

            <footer class="z-10 flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-slate-400">
              <span>Usa los controles para ampliar o cambiar de imagen.</span>
              <button pButton size="small" severity="danger" text icon="pi pi-flag" label="Denunciar" (click)="openReportDialog(image.idMultimedia, 'MULTIMEDIA')"></button>
            </footer>
          </div>
        }
      </p-dialog>
    </main>
  `,
  styles: [
    `
      .ca-vote-option {
        align-items: center;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        color: #334155;
        display: flex;
        font-weight: 700;
        gap: 0.65rem;
        justify-content: flex-start;
        min-height: 2.75rem;
        padding: 0.75rem 0.9rem;
        text-align: left;
        transition:
          background 0.15s ease,
          border-color 0.15s ease,
          box-shadow 0.15s ease,
          color 0.15s ease;
        width: 100%;
      }

      .ca-vote-option:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .ca-vote-option-selected {
        background: #f0fdfa;
        border-color: var(--ca-teal);
        box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.16);
        color: #0f766e;
      }
    `,
  ],
})
export class IncidenciaDetailPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly incidencia = signal<Incidencia | null>(null);
  readonly relacionadas = signal<IncidenciaRelacionada[]>([]);
  readonly multimedia = signal<ArchivoMultimedia[]>([]);
  private pollingTimer: any = null;
  private pollingTicks = 0;

  readonly reviewNotice = computed(() => {
    const media = this.multimedia();
    if (media.length === 0) return null;

    const hasRejected = media.some((m) => m.estadoRevision === 'RECHAZADO');
    const hasError = media.some((m) => m.estadoRevision === 'ERROR_REVISION');
    const hasManual = media.some((m) => m.estadoRevision === 'REVISION_MANUAL');
    const hasPending = media.some((m) => m.estadoRevision === 'PENDIENTE' || m.estadoRevision === 'PENDIENTE_REVISION');

    if (hasRejected) {
      return {
        title: 'Algunas imágenes no fueron publicadas',
        message: 'Una o más imágenes no se visualizarán porque el sistema detectó contenido que no cumple con las políticas de publicación.',
        icon: 'pi pi-times-circle',
        class: 'bg-red-50/50 border-red-200/60',
        iconColor: 'text-red-600',
      };
    } else if (hasError) {
      return {
        title: 'No se pudo revisar la imagen',
        message: 'Hubo un problema técnico al revisar una o más imágenes. El sistema intentará procesarlas nuevamente.',
        icon: 'pi pi-exclamation-triangle',
        class: 'bg-red-50/50 border-red-200/60',
        iconColor: 'text-red-600',
      };
    } else if (hasManual) {
      return {
        title: 'Revisión manual pendiente',
        message: 'Tus imágenes necesitan una revisión adicional antes de mostrarse públicamente. Esto puede pasar si el sistema no pudo confirmar completamente el contexto de la imagen.',
        icon: 'pi pi-eye-slash',
        class: 'bg-amber-50/50 border-amber-200/60',
        iconColor: 'text-amber-600',
      };
    } else if (hasPending) {
      return {
        title: 'Imágenes en revisión',
        message: 'Tus imágenes se están revisando automáticamente. En unos minutos se visualizarán si no contienen contenido sensible.',
        icon: 'pi pi-clock',
        class: 'bg-teal-50/50 border-teal-200/60',
        iconColor: 'text-teal-600',
      };
    }

    return null;
  });
  readonly comentarios = signal<ComentarioIncidencia[]>([]);
  readonly historial = signal<HistorialEstadoIncidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);
  readonly votos = signal<ResumenVotosIncidencia | null>(null);
  readonly votosRecientes = signal<VotoIncidencia[]>([]);
  readonly seguimiento = signal<SeguimientoIncidencia | null>(null);
  readonly confirmaciones = signal<ResumenConfirmacionesCompletado | null>(null);
  readonly confirmacionesRecientes = signal<ConfirmacionCompletadoDetalle[]>([]);
  nuevoComentario = '';
  selectedVoteType = 'CONFIRMA_EXISTENCIA';
  voteObservation = '';
  reportDialogVisible = false;
  completionDialogVisible = false;
  completionSubmitting = false;
  locatingCompletion = false;
  reporteMotivo = 'Información incorrecta';
  reporteDetalle = '';
  completionObservation = '';
  completionLat: number | null = null;
  completionLng: number | null = null;
  completionImage: File | null = null;
  completionImagePreview: string | null = null;
  statusDialogVisible = false;
  statusChanging = false;
  newStatusCode: string | null = null;
  statusObservation = '';
  readonly imageViewerImages = signal<ArchivoMultimedia[]>([]);
  readonly imageViewerIndex = signal(0);
  readonly imageZoom = signal(1);
  imageViewerVisible = false;
  readonly viewerImage = signal<ArchivoMultimedia | null>(null);
  readonly viewerTitle = signal('Imagen');
  private reporteEntidad: { id: string; tipo: string } | null = null;
  private map: L.Map | null = null;
  private mapMarker: L.Marker | null = null;
  private mapRenderFrame: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly session: AuthSessionService,
    private readonly incidenciasService: IncidenciasService,
    private readonly catalogosService: CatalogosService,
    private readonly messages: MessageService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.incidenciasService.getById(id).subscribe((item) => {
      this.incidencia.set(item);
      this.scheduleMapRender();
    });
    this.incidenciasService.getRelacionadas(id).subscribe((items) => this.relacionadas.set(items));
    this.incidenciasService.getMultimedia(id).subscribe((items) => {
      this.multimedia.set(items);
      this.checkAndStartPolling();
    });
    this.incidenciasService.getComentarios(id).subscribe((items) => this.comentarios.set(items));
    this.incidenciasService.getHistorialEstados(id).subscribe((items) => this.historial.set(items));
    this.catalogosService.estados$.subscribe((items) => this.estados.set(items));
    this.incidenciasService.getConfirmaciones(id).subscribe((items) => this.confirmacionesRecientes.set(items));
    this.incidenciasService.getVotos(id).subscribe((items) => this.votosRecientes.set(items));
    if (this.isLoggedIn()) {
      this.loadCitizenState(id);
    }
  }

  ngAfterViewInit() {
    this.scheduleMapRender();
  }

  ngOnDestroy() {
    if (this.mapRenderFrame !== null) {
      cancelAnimationFrame(this.mapRenderFrame);
      this.mapRenderFrame = null;
    }
    this.map?.remove();
    this.clearCompletionImage();
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  checkAndStartPolling() {
    const item = this.incidencia();
    const isOwner = item ? this.isOwner(item) : false;
    const media = this.multimedia();
    const hasPending = media.some((m) => m.estadoRevision === 'PENDIENTE' || m.estadoRevision === 'PENDIENTE_REVISION');

    if (isOwner && hasPending) {
      if (!this.pollingTimer) {
        this.pollingTicks = 0;
        this.pollingTimer = setInterval(() => {
          this.pollingTicks++;
          if (this.pollingTicks >= 4) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
          }
          const id = this.incidencia()?.idIncidencia || this.route.snapshot.paramMap.get('id');
          if (id) {
            this.incidenciasService.getMultimedia(id).subscribe((items) => {
              this.multimedia.set(items);
              this.checkAndStartPolling();
            });
          }
        }, 15000);
      }
    } else {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    }
  }

  principalImage(): ArchivoMultimedia | null {
    return this.galleryImages().find((image) => image.esPrincipal) ?? this.galleryImages()[0] ?? null;
  }

  galleryImages(): ArchivoMultimedia[] {
    return this.multimedia().filter((item) => item.downloadUrl && item.contentType?.startsWith('image/') && item.visiblePublicamente);
  }

  confirmationImages(confirmacion: ConfirmacionCompletadoDetalle): ArchivoMultimedia[] {
    return confirmacion.multimedia.filter((item) => item.downloadUrl && item.contentType?.startsWith('image/') && item.visiblePublicamente);
  }

  galleryIndex(image: ArchivoMultimedia, images = this.galleryImages()): number {
    return Math.max(
      0,
      images.findIndex((item) => item.idMultimedia === image.idMultimedia),
    );
  }

  openImageViewer(images: ArchivoMultimedia[], index = 0, title = 'Imagen') {
    const validImages = images.filter((item) => item.downloadUrl);
    if (!validImages.length) {
      return;
    }
    const safeIndex = Math.max(0, Math.min(index, validImages.length - 1));
    this.imageViewerImages.set(validImages);
    this.imageViewerIndex.set(safeIndex);
    this.viewerImage.set(validImages[safeIndex]);
    this.viewerTitle.set(title);
    this.imageZoom.set(1);
    this.imageViewerVisible = true;
  }

  closeImageViewer() {
    this.imageViewerVisible = false;
    this.imageZoom.set(1);
  }

  nextImage() {
    const images = this.imageViewerImages();
    if (!images.length) {
      return;
    }
    const nextIndex = (this.imageViewerIndex() + 1) % images.length;
    this.imageViewerIndex.set(nextIndex);
    this.viewerImage.set(images[nextIndex]);
    this.imageZoom.set(1);
  }

  previousImage() {
    const images = this.imageViewerImages();
    if (!images.length) {
      return;
    }
    const nextIndex = (this.imageViewerIndex() - 1 + images.length) % images.length;
    this.imageViewerIndex.set(nextIndex);
    this.viewerImage.set(images[nextIndex]);
    this.imageZoom.set(1);
  }

  zoomIn() {
    this.imageZoom.update((value) => Math.min(3, Number((value + 0.25).toFixed(2))));
  }

  zoomOut() {
    this.imageZoom.update((value) => Math.max(1, Number((value - 0.25).toFixed(2))));
  }

  isLoggedIn(): boolean {
    return this.session.isAuthenticated();
  }

  isOwner(item: Incidencia): boolean {
    return this.session.user()?.idUsuario === item.idUsuarioReporta;
  }

  isFinal(item: Incidencia): boolean {
    return isFinalCitizenIncident(item);
  }

  availableStatusOptions(item: Incidencia): EstadoIncidencia[] {
    return citizenStatusOptions(this.estados(), item);
  }

  openStatusDialog(item: Incidencia) {
    if (!this.ensureLoggedIn() || !this.isOwner(item)) {
      return;
    }
    const options = this.availableStatusOptions(item);
    this.newStatusCode = options[0]?.codigo ?? null;
    this.statusObservation = '';
    this.statusDialogVisible = true;
  }

  changeStatus() {
    const item = this.incidencia();
    if (!item || !this.newStatusCode) {
      return;
    }

    this.statusChanging = true;
    this.incidenciasService.changeStatus(item.idIncidencia, this.newStatusCode, this.statusObservation, 'CIUDADANO').subscribe({
      next: (updated) => {
        this.incidencia.set(updated);
        this.statusDialogVisible = false;
        this.messages.add({ severity: 'success', summary: 'Estado actualizado' });
        this.incidenciasService.getHistorialEstados(updated.idIncidencia).subscribe((items) => this.historial.set(items));
      },
      error: (error) => {
        this.statusChanging = false;
        this.messages.add({ severity: 'error', summary: 'No se pudo cambiar el estado', detail: this.errorText(error) });
      },
      complete: () => {
        this.statusChanging = false;
      },
    });
  }

  voteCount(tipo: string): number {
    return this.votos()?.conteosPorTipo?.[tipo] ?? 0;
  }

  selectVoteType(type: 'CONFIRMA_EXISTENCIA' | 'NO_EXISTE' | 'IMPORTANTE') {
    this.selectedVoteType = type;
  }

  isVoteTypeSelected(type: string): boolean {
    return this.selectedVoteType === type;
  }

  toggleFollow(item: Incidencia) {
    if (!this.ensureLoggedIn()) {
      return;
    }
    const request = this.seguimiento()?.siguiendo
      ? this.incidenciasService.unfollow(item.idIncidencia)
      : this.incidenciasService.follow(item.idIncidencia);
    request.subscribe((estado) => {
      this.seguimiento.set(estado);
      this.messages.add({
        severity: 'success',
        summary: estado.siguiendo ? 'Ahora sigues este reporte' : 'Dejaste de seguir este reporte',
      });
    });
  }

  submitVote(item: Incidencia) {
    if (!this.ensureLoggedIn()) {
      return;
    }
    this.incidenciasService.createVoto(item.idIncidencia, this.selectedVoteType, this.voteObservation).subscribe(() => {
      this.messages.add({ severity: 'success', summary: 'Tu aporte fue registrado' });
      this.voteObservation = '';
      this.incidenciasService.getResumenVotos(item.idIncidencia).subscribe((resumen) => this.votos.set(resumen));
      this.incidenciasService.getVotos(item.idIncidencia).subscribe((items) => this.votosRecientes.set(items));
    });
  }

  voteShortLabel(type: string): string {
    return type === 'CONFIRMA_EXISTENCIA' ? 'Existe' : type === 'NO_EXISTE' ? 'No corresponde' : type === 'IMPORTANTE' ? 'Importante' : 'Validación';
  }

  voteRegisteredLabel(type: string): string {
    return type === 'CONFIRMA_EXISTENCIA'
      ? 'Confirmaste que la incidencia existe.'
      : type === 'NO_EXISTE'
        ? 'Indicaste que no corresponde o no existe.'
        : type === 'IMPORTANTE'
          ? 'Marcaste esta incidencia como importante.'
          : 'Validación registrada.';
  }

  createComment(item: Incidencia) {
    const contenido = this.nuevoComentario.trim();
    if (!contenido || !this.ensureLoggedIn()) {
      return;
    }
    this.incidenciasService.createComentario(item.idIncidencia, contenido).subscribe((comentario) => {
      this.comentarios.set([comentario, ...this.comentarios()]);
      this.nuevoComentario = '';
      this.messages.add({ severity: 'success', summary: 'Comentario publicado' });
    });
  }

  openReportDialog(idEntidad: string, tipoEntidad: string) {
    if (!this.ensureLoggedIn()) {
      return;
    }
    this.reporteEntidad = { id: idEntidad, tipo: tipoEntidad };
    this.reporteMotivo = 'Información incorrecta';
    this.reporteDetalle = '';
    this.reportDialogVisible = true;
  }

  openCompletionDialog() {
    if (!this.ensureLoggedIn()) {
      return;
    }
    this.completionObservation = '';
    this.clearCompletionLocation();
    this.clearCompletionImage();
    this.completionDialogVisible = true;
  }

  async submitCompletion() {
    const item = this.incidencia();
    if (!item || !this.ensureLoggedIn()) {
      return;
    }
    this.completionSubmitting = true;
    this.incidenciasService
      .createConfirmacion(item.idIncidencia, this.completionObservation, this.completionLat ?? undefined, this.completionLng ?? undefined)
      .subscribe({
        next: async (confirmacion) => {
          try {
            if (this.completionImage) {
              await this.incidenciasService.uploadConfirmationEvidence(confirmacion.idConfirmacion, this.completionImage);
            }
            this.completionDialogVisible = false;
            this.messages.add({ severity: 'success', summary: 'Confirmación registrada' });
            this.incidenciasService.getResumenConfirmaciones(item.idIncidencia).subscribe((resumen) => this.confirmaciones.set(resumen));
            this.incidenciasService.getConfirmaciones(item.idIncidencia).subscribe((items) => this.confirmacionesRecientes.set(items));
	          } catch (error) {
	            this.completionDialogVisible = false;
	            this.messages.add({
	              severity: 'warn',
	              summary: 'Confirmación creada sin imagen',
	              detail: `Tu confirmación fue registrada, pero no pudimos adjuntar la imagen: ${this.errorText(error)}`,
	            });
	            this.incidenciasService.getResumenConfirmaciones(item.idIncidencia).subscribe((resumen) => this.confirmaciones.set(resumen));
	            this.incidenciasService.getConfirmaciones(item.idIncidencia).subscribe((items) => this.confirmacionesRecientes.set(items));
	          } finally {
            this.completionSubmitting = false;
          }
        },
        error: (error) => {
          this.completionSubmitting = false;
          this.messages.add({ severity: 'error', summary: 'No se pudo confirmar', detail: this.errorText(error) });
        },
      });
  }

  useCompletionLocation() {
    if (!navigator.geolocation) {
      this.messages.add({ severity: 'warn', summary: 'Ubicación no disponible en este navegador' });
      return;
    }
    this.locatingCompletion = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.completionLat = position.coords.latitude;
        this.completionLng = position.coords.longitude;
        this.locatingCompletion = false;
      },
      () => {
        this.locatingCompletion = false;
        this.messages.add({ severity: 'warn', summary: 'No se pudo obtener tu ubicación' });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  clearCompletionLocation() {
    this.completionLat = null;
    this.completionLng = null;
  }

  onCompletionImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) {
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.messages.add({ severity: 'warn', summary: 'Solo se permiten imágenes JPG, PNG o WEBP' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.messages.add({ severity: 'warn', summary: 'La imagen no debe superar 5 MB' });
      return;
    }
    this.clearCompletionImage();
    this.completionImage = file;
    this.completionImagePreview = URL.createObjectURL(file);
  }

  clearCompletionImage() {
    if (this.completionImagePreview) {
      URL.revokeObjectURL(this.completionImagePreview);
    }
    this.completionImage = null;
    this.completionImagePreview = null;
  }

  submitReport() {
    const target = this.reporteEntidad;
    if (!target) {
      return;
    }
    this.incidenciasService.reportContent(target.tipo, target.id, this.reporteMotivo.trim(), this.reporteDetalle).subscribe(() => {
      this.reportDialogVisible = false;
      this.messages.add({ severity: 'success', summary: 'Denuncia enviada para revisión' });
    });
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

  private renderMap() {
    const item = this.incidencia();
    const container = document.getElementById('incident-detail-map');
    const latitud = Number(item?.latitud);
    const longitud = Number(item?.longitud);

    if (!item || !container || !Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      return;
    }

    const position: L.LatLngExpression = [latitud, longitud];

    if (!this.map) {
      this.map = L.map(container).setView(position, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(this.map);
    } else {
      this.map.setView(position, 15);
    }

    this.mapMarker?.remove();
    this.mapMarker = L.marker(position, { icon: this.getDetailMarkerIcon(item.codigoEstado) }).addTo(this.map).bindPopup(item.titulo);

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private scheduleMapRender() {
    if (this.mapRenderFrame !== null) {
      cancelAnimationFrame(this.mapRenderFrame);
    }

    this.mapRenderFrame = requestAnimationFrame(() => {
      this.mapRenderFrame = null;
      this.renderMap();
    });
  }

  private getDetailMarkerIcon(codigoEstado: string): L.DivIcon {
    const status = (codigoEstado || '').toUpperCase();
    let color = '#64748B'; // slate
    if (status.includes('PEND') || status.includes('REPORT') || status.includes('NUEV')) {
      color = '#D4A937'; // gold
    } else if (status.includes('PROC') || status.includes('ATENC')) {
      color = '#14B8A6'; // teal
    } else if (status.includes('CERR') || status.includes('RESUEL') || status.includes('COMPL')) {
      color = '#10B981'; // green
    } else if (status.includes('RECH') || status.includes('CANC')) {
      color = '#EF4444'; // red
    }

    const svg = `
      <div class="relative flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-9 h-9 filter drop-shadow-md">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
        <span class="absolute top-[9px] w-2.5 h-2.5 bg-white rounded-full"></span>
      </div>
    `;
    return L.divIcon({
      html: svg,
      className: 'detail-status-pin',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  }

  private loadCitizenState(id: string) {
    this.incidenciasService.getResumenVotos(id).subscribe((resumen) => this.votos.set(resumen));
    this.incidenciasService.getSeguimiento(id).subscribe((estado) => this.seguimiento.set(estado));
    this.incidenciasService.getResumenConfirmaciones(id).subscribe((resumen) => this.confirmaciones.set(resumen));
  }

  private ensureLoggedIn(): boolean {
    if (this.isLoggedIn()) {
      return true;
    }
    this.messages.add({ severity: 'info', summary: 'Inicia sesión para participar' });
    const currentUrl = this.router.url;
    void this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
    return false;
  }

  private errorText(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = (error as { error?: { message?: string } }).error;
      return body?.message || 'Ocurrió un problema inesperado.';
    }
    return 'Ocurrió un problema inesperado.';
  }
}
