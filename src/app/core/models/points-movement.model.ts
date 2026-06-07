export interface PointsMovement {
  idMovimiento: string;
  idUsuario: string;
  idAccion: string;
  codigoAccion: string;
  nombreAccion: string;
  idIncidencia: string | null;
  tituloIncidencia: string | null;
  puntos: number;
  motivo: string | null;
  creadoEn: string | null;
}
