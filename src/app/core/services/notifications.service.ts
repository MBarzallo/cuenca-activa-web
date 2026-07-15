import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AdminPushNotificationRequest,
  AdminPushNotificationResponse,
  AppNotification,
  NotificationPreference,
  UnreadNotificationCount,
} from '../models/notification.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly unreadCount = signal(0);

  constructor(private readonly api: ApiService) {}

  list(limit = 30, offset = 0): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('/api/notificaciones', { limit, offset });
  }

  countUnread(): Observable<UnreadNotificationCount> {
    return this.api
      .get<UnreadNotificationCount>('/api/notificaciones/no-leidas/count')
      .pipe(tap((response) => this.unreadCount.set(response.total ?? 0)));
  }

  markAsRead(idNotificacion: string): Observable<AppNotification> {
    return this.api.put<AppNotification>(`/api/notificaciones/${idNotificacion}/leida`).pipe(
      tap(() => {
        this.unreadCount.update((value) => Math.max(0, value - 1));
      }),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.api.put<void>('/api/notificaciones/leidas').pipe(tap(() => this.unreadCount.set(0)));
  }

  listPreferences(): Observable<NotificationPreference[]> {
    return this.api.get<NotificationPreference[]>('/api/notificaciones/preferencias');
  }

  updatePreference(codigoTipo: string, habilitada: boolean, radioCercaniaKm?: number | null): Observable<NotificationPreference> {
    return this.api.put<NotificationPreference>(`/api/notificaciones/preferencias/${codigoTipo}`, {
      habilitada,
      radioCercaniaKm: radioCercaniaKm ?? null,
    });
  }

  sendAdminPush(request: AdminPushNotificationRequest): Observable<AdminPushNotificationResponse> {
    return this.api.post<AdminPushNotificationResponse>('/api/admin/notificaciones/push', request);
  }
}
