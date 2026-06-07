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
