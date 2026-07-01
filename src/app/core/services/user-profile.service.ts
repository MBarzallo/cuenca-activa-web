import { Injectable } from '@angular/core';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Observable } from 'rxjs';
import { firebaseAuth, firebaseStorage } from '../firebase/firebase.client';
import { AuthUser } from '../models/auth-user.model';
import { PointsMovement } from '../models/points-movement.model';
import { AdminUsuario } from '../models/admin-usuario.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { ApiService } from './api.service';

export interface UpdateProfileRequest {
  nombres: string;
  apellidos: string;
  aliasPublico: string;
  telefono?: string | null;
  fotoPerfilUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly maxAvatarSizeBytes = 3 * 1024 * 1024;
  private readonly allowedAvatarContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  constructor(private readonly api: ApiService) {}

  updateProfile(request: UpdateProfileRequest): Observable<AuthUser> {
    return this.api.put<AuthUser>('/api/usuarios/me/perfil', {
      nombres: request.nombres.trim(),
      apellidos: request.apellidos.trim(),
      aliasPublico: request.aliasPublico.trim(),
      telefono: request.telefono?.trim() || null,
      fotoPerfilUrl: request.fotoPerfilUrl?.trim() || null,
    });
  }

  listPointsMovements(limit = 20, offset = 0): Observable<PointsMovement[]> {
    return this.api.get<PointsMovement[]>('/api/usuarios/me/movimientos-puntos', { limit, offset });
  }

  checkPhoneAvailability(telefono: string): Observable<void> {
    return this.api.get<void>('/api/auth/phone/check', { telefono });
  }

  syncPhone(): Observable<AuthUser> {
    return this.api.post<AuthUser>('/api/auth/phone/sync', {});
  }

  async uploadProfilePhoto(file: File): Promise<string> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Inicia sesión para actualizar tu foto.');
    }

    this.validateAvatar(file);

    const contentType = file.type || 'application/octet-stream';
    const fileName = this.buildSafeAvatarFileName(file.name, contentType);
    const storagePath = `perfiles/${user.uid}/avatar/${fileName}`;
    const storageRef = ref(firebaseStorage, storagePath);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType,
      customMetadata: {
        firebaseUid: user.uid,
        tipo: 'fotoPerfil',
      },
    });

    return getDownloadURL(uploadResult.ref);
  }

  validateAvatar(file: File): void {
    if (file.size <= 0) {
      throw new Error('La imagen seleccionada está vacía.');
    }

    if (file.size > this.maxAvatarSizeBytes) {
      throw new Error('La foto de perfil no debe superar 3 MB.');
    }

    const contentType = file.type || 'application/octet-stream';
    if (!this.allowedAvatarContentTypes.has(contentType)) {
      throw new Error('Solo se permiten imágenes JPG, PNG o WEBP.');
    }
  }

  private buildSafeAvatarFileName(originalName: string, contentType: string): string {
    const extension = contentType === 'image/png' ? '.png' : contentType === 'image/webp' ? '.webp' : '.jpg';
    const baseName = originalName
      .replace(/\.[^/.]+$/, '')
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `${Date.now()}_${baseName || 'perfil'}${extension}`;
  }

  listUsersAdmin(filters: {
    aliasPublico?: string;
    email?: string;
    estadoCuenta?: string;
    limit?: number;
    offset?: number;
  } = {}): Observable<PaginatedResponse<AdminUsuario>> {
    const params: any = {};
    if (filters.aliasPublico) params.aliasPublico = filters.aliasPublico;
    if (filters.email) params.email = filters.email;
    if (filters.estadoCuenta) params.estadoCuenta = filters.estadoCuenta;
    params.limit = filters.limit ?? 20;
    params.offset = filters.offset ?? 0;

    return this.api.get<PaginatedResponse<AdminUsuario>>('/api/admin/usuarios', params);
  }

  changeUserStatus(idUsuario: string, estadoCuenta: string): Observable<void> {
    return this.api.patch<void>(`/api/admin/usuarios/${idUsuario}/estado`, { estadoCuenta });
  }

  changeUserRoles(idUsuario: string, roles: string[]): Observable<void> {
    return this.api.patch<void>(`/api/admin/usuarios/${idUsuario}/roles`, { roles });
  }
}
