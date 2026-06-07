import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { getDownloadURL, getMetadata, ref, uploadBytes } from 'firebase/storage';
import { firebaseAuth, firebaseStorage } from '../firebase/firebase.client';
import {
  ArchivoMultimedia,
  ComentarioIncidencia,
  ConfirmacionCompletado,
  ConfirmacionCompletadoDetalle,
  HistorialEstadoIncidencia,
  ResumenConfirmacionesCompletado,
  ResumenVotosIncidencia,
  SeguimientoIncidencia,
  VotoIncidencia,
} from '../models/incidencia-detail.model';
import { Incidencia, IncidenciaCercana, IncidenciaRelacionada } from '../models/incidencia.model';
import { ApiService } from './api.service';

export interface IncidenciaFilters {
  limit?: number;
  offset?: number;
}

export interface CrearIncidenciaRequest {
  idCategoria: string;
  titulo: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  direccionReferencial?: string | null;
}

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private readonly storageBucket = 'cuenca-activa.firebasestorage.app';
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;
  private readonly allowedContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  constructor(private readonly api: ApiService) {}

  list(filters: IncidenciaFilters = {}): Observable<Incidencia[]> {
    return this.api.get<Incidencia[]>('/api/incidencias', {
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    });
  }

  getById(id: string): Observable<Incidencia> {
    return this.api.get<Incidencia>(`/api/incidencias/${id}`);
  }

  listMine(filters: IncidenciaFilters = {}): Observable<Incidencia[]> {
    return this.api.get<Incidencia[]>('/api/incidencias/mis-reportes', {
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    });
  }

  listNearby(latitud: number, longitud: number, radioMetros = 1000, limit = 50, offset = 0): Observable<IncidenciaCercana[]> {
    return this.api.get<IncidenciaCercana[]>('/api/incidencias/cercanas', {
      latitud,
      longitud,
      radioMetros,
      limit,
      offset,
    });
  }

  listPreferredNearby(latitud: number, longitud: number, limit = 50, offset = 0): Observable<IncidenciaCercana[]> {
    return this.api.get<IncidenciaCercana[]>('/api/incidencias/cercanas/preferidas', {
      latitud,
      longitud,
      limit,
      offset,
    });
  }

  create(request: CrearIncidenciaRequest): Observable<Incidencia> {
    return this.api.post<Incidencia>('/api/incidencias', {
      idCategoria: request.idCategoria,
      titulo: request.titulo.trim(),
      descripcion: request.descripcion.trim(),
      latitud: request.latitud,
      longitud: request.longitud,
      direccionReferencial: request.direccionReferencial?.trim() || null,
    });
  }

  getRelacionadas(id: string): Observable<IncidenciaRelacionada[]> {
    return this.api.get<IncidenciaRelacionada[]>(`/api/incidencias/${id}/relacionadas`);
  }

  getMultimedia(id: string): Observable<ArchivoMultimedia[]> {
    return this.api.get<ArchivoMultimedia[]>(`/api/incidencias/${id}/multimedia`);
  }

  getComentarios(id: string, limit = 20, offset = 0): Observable<ComentarioIncidencia[]> {
    return this.api.get<ComentarioIncidencia[]>(`/api/incidencias/${id}/comentarios`, { limit, offset });
  }

  getHistorialEstados(id: string): Observable<HistorialEstadoIncidencia[]> {
    return this.api.get<HistorialEstadoIncidencia[]>(`/api/incidencias/${id}/historial-estados`);
  }

  createComentario(id: string, contenido: string): Observable<ComentarioIncidencia> {
    return this.api.post<ComentarioIncidencia>(`/api/incidencias/${id}/comentarios`, { contenido });
  }

  getResumenVotos(id: string): Observable<ResumenVotosIncidencia> {
    return this.api.get<ResumenVotosIncidencia>(`/api/incidencias/${id}/votos/resumen`);
  }

  getVotos(id: string, limit = 10): Observable<VotoIncidencia[]> {
    return this.api.get<VotoIncidencia[]>(`/api/incidencias/${id}/votos`, { limit });
  }

  createVoto(id: string, tipoVoto: string, observacion?: string): Observable<VotoIncidencia> {
    return this.api.post<VotoIncidencia>(`/api/incidencias/${id}/votos`, {
      tipoVoto,
      observacion: observacion?.trim() || null,
    });
  }

  getSeguimiento(id: string): Observable<SeguimientoIncidencia> {
    return this.api.get<SeguimientoIncidencia>(`/api/incidencias/${id}/seguimiento/me`);
  }

  follow(id: string): Observable<SeguimientoIncidencia> {
    return this.api.post<SeguimientoIncidencia>(`/api/incidencias/${id}/seguimiento`);
  }

  unfollow(id: string): Observable<SeguimientoIncidencia> {
    return this.api.delete<SeguimientoIncidencia>(`/api/incidencias/${id}/seguimiento/me`);
  }

  getResumenConfirmaciones(id: string): Observable<ResumenConfirmacionesCompletado> {
    return this.api.get<ResumenConfirmacionesCompletado>(`/api/incidencias/${id}/confirmaciones/resumen`);
  }

  getConfirmaciones(id: string, limit = 10): Observable<ConfirmacionCompletadoDetalle[]> {
    return this.api.get<ConfirmacionCompletadoDetalle[]>(`/api/incidencias/${id}/confirmaciones`, { limit });
  }

  createConfirmacion(id: string, observacion?: string, latitud?: number, longitud?: number): Observable<ConfirmacionCompletado> {
    return this.api.post<ConfirmacionCompletado>(`/api/incidencias/${id}/confirmaciones`, {
      observacion: observacion?.trim() || null,
      latitud: latitud ?? null,
      longitud: longitud ?? null,
    });
  }

  async uploadConfirmationEvidence(idConfirmacion: string, file: File): Promise<ArchivoMultimedia> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Inicia sesión para subir evidencia.');
    }

    if (file.size <= 0) {
      throw new Error('La imagen seleccionada está vacía.');
    }

    if (file.size > this.maxImageSizeBytes) {
      throw new Error('La imagen no debe superar 5 MB.');
    }

    const contentType = file.type || 'application/octet-stream';
    if (!this.allowedContentTypes.has(contentType)) {
      throw new Error('Solo se permiten imágenes JPG, PNG o WEBP.');
    }

    const fileName = this.buildSafeFileName(file.name, contentType);
    const storagePath = `confirmaciones/${idConfirmacion}/${user.uid}/${fileName}`;
    const storageRef = ref(firebaseStorage, storagePath);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType,
      customMetadata: {
        idConfirmacion,
        firebaseUid: user.uid,
      },
    });
    const [metadata, downloadUrl] = await Promise.all([
      getMetadata(uploadResult.ref),
      getDownloadURL(uploadResult.ref),
    ]);

    return await new Promise<ArchivoMultimedia>((resolve, reject) => {
      this.api
        .post<ArchivoMultimedia>(`/api/confirmaciones/${idConfirmacion}/multimedia`, {
          bucket: this.storageBucket,
          storagePath,
          downloadUrl,
          contentType: metadata.contentType || contentType,
          sizeBytes: metadata.size || file.size,
          nombreArchivo: fileName,
          ordenVisualizacion: 0,
          esPrincipal: true,
        })
        .subscribe({ next: resolve, error: reject });
    });
  }

  async uploadIncidentEvidence(idIncidencia: string, file: File): Promise<ArchivoMultimedia> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Inicia sesión para subir la imagen.');
    }

    this.validateImage(file);

    const contentType = file.type || 'application/octet-stream';
    const fileName = this.buildSafeFileName(file.name, contentType, 'incidencia');
    const storagePath = `incidencias/${idIncidencia}/${user.uid}/${fileName}`;
    const storageRef = ref(firebaseStorage, storagePath);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType,
      customMetadata: {
        idIncidencia,
        firebaseUid: user.uid,
      },
    });
    const [metadata, downloadUrl] = await Promise.all([
      getMetadata(uploadResult.ref),
      getDownloadURL(uploadResult.ref),
    ]);

    return await new Promise<ArchivoMultimedia>((resolve, reject) => {
      this.api
        .post<ArchivoMultimedia>(`/api/incidencias/${idIncidencia}/multimedia`, {
          bucket: this.storageBucket,
          storagePath,
          downloadUrl,
          contentType: metadata.contentType || contentType,
          sizeBytes: metadata.size || file.size,
          nombreArchivo: fileName,
          ordenVisualizacion: 0,
          esPrincipal: true,
        })
        .subscribe({ next: resolve, error: reject });
    });
  }

  reportContent(tipoEntidad: string, idEntidad: string, motivo: string, detalle?: string) {
    return this.api.post('/api/reportes-contenido', {
      tipoEntidad,
      idEntidad,
      motivo,
      detalle: detalle?.trim() || null,
    });
  }

  validateImage(file: File): void {
    if (file.size <= 0) {
      throw new Error('La imagen seleccionada está vacía.');
    }

    if (file.size > this.maxImageSizeBytes) {
      throw new Error('La imagen no debe superar 5 MB.');
    }

    const contentType = file.type || 'application/octet-stream';
    if (!this.allowedContentTypes.has(contentType)) {
      throw new Error('Solo se permiten imágenes JPG, PNG o WEBP.');
    }
  }

  private buildSafeFileName(originalName: string, contentType: string, fallback = 'confirmacion'): string {
    const extension = contentType === 'image/png' ? '.png' : contentType === 'image/webp' ? '.webp' : '.jpg';
    const baseName = originalName
      .replace(/\.[^/.]+$/, '')
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `${Date.now()}_${baseName || fallback}${extension}`;
  }

  changeStatus(id: string, codigoEstado: string, observacion?: string, origenCambio = 'WEB_ADMIN'): Observable<Incidencia> {
    return this.api.patch<Incidencia>(`/api/incidencias/${id}/estado`, {
      codigoEstado,
      observacion: observacion?.trim() || null,
      origenCambio,
    });
  }

  relate(id: string, idIncidenciaRelacionada: string, tipoRelacion = 'RELACIONADA') {
    return this.api.post<void>(`/api/incidencias/${id}/relacionadas`, {
      idIncidenciaRelacionada,
      tipoRelacion,
    });
  }

  getDashboardSummary() {
    return forkJoin({
      recientes: this.list({ limit: 100, offset: 0 }),
    }).pipe(
      map(({ recientes }) => {
        const porEstado = recientes.reduce<Record<string, number>>((acc, incidencia) => {
          acc[incidencia.nombreEstado] = (acc[incidencia.nombreEstado] ?? 0) + 1;
          return acc;
        }, {});

        return {
          totalIncidencias: recientes.length,
          pendientes: recientes.filter((incidencia) =>
            ['PENDIENTE', 'REPORTADA', 'NUEVA'].includes(incidencia.codigoEstado),
          ).length,
          cerradas: recientes.filter((incidencia) => !!incidencia.cerradoEn).length,
          porEstado,
          recientes: recientes.slice(0, 8),
        };
      }),
    );
  }
}
