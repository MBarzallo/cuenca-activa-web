export interface AppNotification {
  idNotificacion: string;
  idUsuario: string;
  codigoTipo: string;
  nombreTipo: string;
  idIncidencia: string | null;
  titulo: string;
  mensaje: string;
  data: string | null;
  estadoEnvio: string;
  leida: boolean;
  creadaEn: string | null;
  leidaEn: string | null;
  enviadaEn: string | null;
}

export interface NotificationPreference {
  idPreferencia: string | null;
  idTipoNotificacion: string;
  codigoTipo: string;
  nombreTipo: string;
  habilitada: boolean;
  radioCercaniaKm: number | null;
  actualizadoEn: string | null;
}

export interface UnreadNotificationCount {
  total: number;
}

export type AdminPushDestination = 'TODOS' | 'USUARIOS';

export interface AdminPushNotificationRequest {
  destino: AdminPushDestination;
  idUsuarios?: string[];
  titulo: string;
  mensaje: string;
  categoria?: string | null;
}

export interface AdminPushNotificationResponse {
  destinatarios: number;
  notificacionesCreadas: number;
  pushesEnviados: number;
  sinDispositivos: number;
  errores: number;
}
