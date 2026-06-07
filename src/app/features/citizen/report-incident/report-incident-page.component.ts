import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import * as L from 'leaflet';
import { CategoriaIncidencia } from '../../../core/models/catalogo.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { IncidenciasService } from '../../../core/services/incidencias.service';

@Component({
  selector: 'app-report-incident-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-6">
          <section class="overflow-hidden rounded-[30px] bg-[var(--ca-navy)] text-white shadow-xl shadow-slate-900/10">
            <div class="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_240px] lg:items-end">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Nuevo reporte ciudadano</p>
                <h1 class="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Reporta una incidencia en Cuenca</h1>
                <p class="mt-3 max-w-2xl leading-7 text-slate-300">
                  Comparte una descripción clara, marca tu ubicación y, si puedes, agrega una foto para ayudar a entender mejor lo que ocurre.
                </p>
              </div>
              <div class="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <i class="pi pi-map-marker text-2xl text-[var(--ca-gold)]"></i>
                <p class="mt-3 text-sm leading-6 text-slate-200">La ubicación permite que otros ciudadanos encuentren el reporte en el mapa.</p>
              </div>
            </div>
          </section>

          <p-card styleClass="border-0 shadow-sm">
            <form [formGroup]="form" class="grid gap-5" (ngSubmit)="submit()">
              <div class="grid gap-5 md:grid-cols-2">
                <label class="block">
                  <span class="mb-2 block text-sm font-semibold text-slate-700">Categoría</span>
                  <p-select
                    class="w-full"
                    formControlName="idCategoria"
                    [options]="categorias()"
                    optionLabel="nombre"
                    optionValue="idCategoria"
                    placeholder="Selecciona una categoría"
                  ></p-select>
                  @if (controlInvalid('idCategoria')) {
                    <small class="mt-2 block text-red-600">Selecciona una categoría.</small>
                  }
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-semibold text-slate-700">Referencia del lugar</span>
                  <input pInputText class="w-full" formControlName="direccionReferencial" placeholder="Ej. Av. Solano y Remigio Crespo" />
                  <small class="mt-2 block text-slate-500">Opcional, pero ayuda a ubicar mejor el reporte.</small>
                </label>
              </div>

              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Título</span>
                <input pInputText class="w-full" formControlName="titulo" maxlength="80" placeholder="Describe el problema en pocas palabras" />
                <div class="mt-2 flex justify-between gap-3 text-xs">
                  @if (controlInvalid('titulo')) {
                    <small class="text-red-600">Escribe un título para el reporte.</small>
                  } @else {
                    <small class="text-slate-500">Máximo 80 caracteres.</small>
                  }
                  <span class="text-slate-400">{{ form.controls.titulo.value.length }}/80</span>
                </div>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Descripción</span>
                <textarea
                  pTextarea
                  class="min-h-36 w-full resize-y"
                  formControlName="descripcion"
                  maxlength="500"
                  placeholder="Cuenta qué sucede, desde cuándo ocurre y cualquier detalle que ayude."
                ></textarea>
                <div class="mt-2 flex justify-between gap-3 text-xs">
                  @if (controlInvalid('descripcion')) {
                    <small class="text-red-600">Agrega una descripción del problema.</small>
                  } @else {
                    <small class="text-slate-500">Sé concreto y evita datos personales innecesarios.</small>
                  }
                  <span class="text-slate-400">{{ form.controls.descripcion.value.length }}/500</span>
                </div>
              </label>

              <section class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div class="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-base font-semibold">Ubicación del reporte</h2>
                      @if (hasLocation()) {
                        <p-tag value="Ubicación lista" severity="success"></p-tag>
                      } @else {
                        <p-tag value="Pendiente" severity="warn"></p-tag>
                      }
                    </div>
                    <p class="mt-2 text-sm leading-6 text-slate-600">{{ locationText() }}</p>
                  </div>
                  <button
                    pButton
                    type="button"
                    severity="secondary"
                    outlined
                    icon="pi pi-crosshairs"
                    [loading]="locating()"
                    label="Usar mi ubicación"
                    (click)="useCurrentLocation()"
                  ></button>
                </div>
                <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div id="report-incident-map" class="h-72"></div>
                </div>
                <div class="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>Haz clic en el mapa o arrastra el marcador para ajustar el punto exacto.</span>
                  @if (hasLocation()) {
                    <span class="font-semibold text-slate-600">{{ latitud()!.toFixed(6) }}, {{ longitud()!.toFixed(6) }}</span>
                  }
                </div>
              </section>

              <section class="grid gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-4 md:grid-cols-[180px_1fr] md:items-center">
                <div class="grid min-h-36 place-items-center overflow-hidden rounded-2xl bg-slate-100">
                  @if (imagePreview()) {
                    <img [src]="imagePreview()" alt="Imagen seleccionada" class="h-full max-h-48 w-full object-cover" />
                  } @else {
                    <div class="px-4 text-center text-slate-500">
                      <i class="pi pi-image text-2xl"></i>
                      <p class="mt-2 text-sm font-medium">Foto opcional</p>
                    </div>
                  }
                </div>
                <div>
                  <h2 class="font-semibold">Agrega una foto si la tienes</h2>
                  <p class="mt-2 text-sm leading-6 text-slate-600">Puede ayudar a entender mejor la incidencia. Se aceptan JPG, PNG o WEBP hasta 5 MB.</p>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <label class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--ca-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                      <i class="pi pi-upload"></i>
                      Seleccionar imagen
                      <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" (change)="selectImage($event)" />
                    </label>
                    @if (selectedImage()) {
                      <button pButton type="button" size="small" severity="secondary" outlined icon="pi pi-times" label="Quitar" (click)="clearImage()"></button>
                    }
                  </div>
                  @if (selectedImage()) {
                    <p class="mt-3 truncate text-sm text-slate-500">{{ selectedImage()?.name }}</p>
                  }
                </div>
              </section>

              <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <a routerLink="/incidencias" pButton type="button" severity="secondary" outlined icon="pi pi-arrow-left" label="Cancelar"></a>
                <button pButton type="submit" icon="pi pi-send" [loading]="submitting()" label="Publicar reporte"></button>
              </div>
            </form>
          </p-card>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <p-card styleClass="border-0 shadow-sm">
            <h2 class="text-lg font-semibold">Antes de publicar</h2>
            <div class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p class="rounded-2xl bg-slate-50 p-3">Describe un problema real que pueda ubicarse en la ciudad.</p>
              <p class="rounded-2xl bg-slate-50 p-3">Evita incluir nombres, teléfonos o datos personales de terceros.</p>
              <p class="rounded-2xl bg-slate-50 p-3">Una foto clara puede ayudar, pero no es obligatoria.</p>
            </div>
          </p-card>

          <p-card styleClass="border-0 bg-[var(--ca-navy)] text-white shadow-sm">
            <i class="pi pi-shield text-2xl text-[var(--ca-gold)]"></i>
            <h2 class="mt-4 text-lg font-semibold">Reporte con seguimiento</h2>
            <p class="mt-3 text-sm leading-6 text-slate-300">Después de publicar podrás revisar el estado, comentarios y validaciones desde el detalle.</p>
          </p-card>
        </aside>
      </section>
    </main>
  `,
})
export class ReportIncidentPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly catalogosService = inject(CatalogosService);
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly categorias = signal<CategoriaIncidencia[]>([]);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly locating = signal(false);
  readonly submitting = signal(false);
  readonly latitud = signal<number | null>(null);
  readonly longitud = signal<number | null>(null);
  readonly hasLocation = computed(() => this.latitud() !== null && this.longitud() !== null);
  readonly locationText = computed(() => {
    if (this.locating()) {
      return 'Buscando tu ubicación actual...';
    }
    if (this.hasLocation()) {
      return 'Listo. Se usará tu ubicación actual para ubicar el reporte en el mapa.';
    }
    return 'Para publicar el reporte necesitamos ubicar dónde ocurre la incidencia.';
  });
  private readonly cuencaCenter: L.LatLngExpression = [-2.90055, -79.00453];
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  readonly form = this.fb.nonNullable.group({
    idCategoria: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.maxLength(500)]],
    direccionReferencial: ['', Validators.maxLength(250)],
  });

  ngOnInit() {
    this.catalogosService.categorias$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categorias) => this.categorias.set(categorias));
    this.useCurrentLocation(true);
  }

  ngAfterViewInit() {
    this.initMap();
    if (this.hasLocation()) {
      this.setReportLocation(this.latitud()!, this.longitud()!, true);
    }
  }

  ngOnDestroy() {
    this.map?.remove();
    this.revokePreview();
  }

  controlInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  useCurrentLocation(silent = false) {
    if (!navigator.geolocation) {
      if (!silent) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Ubicación no disponible',
          detail: 'Tu navegador no permite obtener la ubicación automáticamente.',
        });
      }
      return;
    }

    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setReportLocation(position.coords.latitude, position.coords.longitude, true);
        this.locating.set(false);
        if (!silent) {
          this.messageService.add({
            severity: 'success',
            summary: 'Ubicación lista',
            detail: 'Usaremos esta ubicación para publicar el reporte.',
          });
        }
      },
      () => {
        this.locating.set(false);
        if (!silent) {
          this.messageService.add({
            severity: 'warn',
            summary: 'No pudimos obtener tu ubicación',
            detail: 'Puedes marcar el punto manualmente en el mapa.',
          });
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  private initMap() {
    const container = document.getElementById('report-incident-map');
    if (!container || this.map) {
      return;
    }

    this.map = L.map(container).setView(this.cuencaCenter, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.setReportLocation(event.latlng.lat, event.latlng.lng);
    });

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private setReportLocation(latitud: number, longitud: number, centerMap = false) {
    this.latitud.set(latitud);
    this.longitud.set(longitud);

    if (!this.map) {
      return;
    }

    const position: L.LatLngExpression = [latitud, longitud];
    if (!this.marker) {
      this.marker = L.marker(position, { draggable: true, icon: this.getDragMarkerIcon() }).addTo(this.map);
      this.marker.on('dragend', () => {
        const current = this.marker?.getLatLng();
        if (current) {
          this.setReportLocation(current.lat, current.lng);
        }
      });
    } else {
      this.marker.setLatLng(position);
    }

    if (centerMap) {
      this.map.setView(position, 16);
    }
  }

  selectImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    try {
      this.incidenciasService.validateImage(file);
      this.revokePreview();
      this.selectedImage.set(file);
      this.imagePreview.set(URL.createObjectURL(file));
    } catch (error) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Imagen no válida',
        detail: error instanceof Error ? error.message : 'Selecciona otra imagen.',
      });
    }
  }

  clearImage() {
    this.revokePreview();
    this.selectedImage.set(null);
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Completa los datos',
        detail: 'Revisa los campos marcados antes de publicar.',
      });
      return;
    }

    if (!this.hasLocation()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta la ubicación',
        detail: 'Usa tu ubicación actual para ubicar el reporte en el mapa.',
      });
      this.useCurrentLocation();
      return;
    }

    this.submitting.set(true);
    try {
      const value = this.form.getRawValue();
      const incidencia = await firstValueFrom(
        this.incidenciasService.create({
          idCategoria: value.idCategoria,
          titulo: value.titulo,
          descripcion: value.descripcion,
          direccionReferencial: value.direccionReferencial,
          latitud: this.latitud()!,
          longitud: this.longitud()!,
        }),
      );

      const image = this.selectedImage();
      if (image) {
        try {
          await this.incidenciasService.uploadIncidentEvidence(incidencia.idIncidencia, image);
        } catch (error) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Reporte creado',
            detail: error instanceof Error ? error.message : 'No se pudo subir la imagen adjunta.',
          });
        }
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Reporte publicado',
        detail: 'Tu incidencia ya está disponible para seguimiento.',
      });
      await this.router.navigate(['/incidencias', incidencia.idIncidencia]);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'No se pudo publicar',
        detail: error instanceof Error ? error.message : 'Intenta nuevamente en unos minutos.',
      });
    } finally {
      this.submitting.set(false);
    }
  }

  private revokePreview() {
    const currentPreview = this.imagePreview();
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
      this.imagePreview.set(null);
    }
  }

  private getDragMarkerIcon(): L.DivIcon {
    const svg = `
      <div class="relative flex items-center justify-center animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E11D48" class="w-9 h-9 filter drop-shadow-md">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
        <span class="absolute top-[9px] w-3 h-3 bg-white rounded-full flex items-center justify-center">
          <span class="w-1.5 h-1.5 bg-[#E11D48] rounded-full"></span>
        </span>
      </div>
    `;
    return L.divIcon({
      html: svg,
      className: 'drag-incident-pin',
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });
  }
}
