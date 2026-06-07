export interface ArchivoMultimedia {
  idMultimedia: string;
  idIncidencia: string | null;
  idConfirmacion: string | null;
  idUsuarioSubida: string;
  tipoArchivo: string;
  bucket: string;
  storagePath: string;
  downloadUrl: string;
  contentType: string;
  sizeBytes: number;
  nombreArchivo: string | null;
  ordenVisualizacion: number | null;
  esPrincipal: boolean;
  subidoEn: string;
}

export interface ComentarioIncidencia {
  idComentario: string;
  idIncidencia: string;
  idUsuario: string;
  aliasUsuario: string | null;
  contenido: string;
  creadoEn: string;
  editadoEn: string | null;
}

export interface HistorialEstadoIncidencia {
  idHistorial: string;
  idIncidencia: string;
  idEstadoAnterior: string | null;
  codigoEstadoAnterior: string | null;
  nombreEstadoAnterior: string | null;
  idEstadoNuevo: string;
  codigoEstadoNuevo: string;
  nombreEstadoNuevo: string;
  idUsuarioAccion: string | null;
  aliasUsuarioAccion: string | null;
  observacion: string | null;
  origenCambio: string | null;
  cambiadoEn: string;
}

export interface VotoIncidencia {
  idVoto: string;
  idIncidencia: string;
  idUsuario: string;
  aliasUsuario: string | null;
  tipoVoto: string;
  observacion: string | null;
  creadoEn: string;
}

export interface ResumenVotosIncidencia {
  conteosPorTipo: Record<string, number>;
  usuarioYaVoto: boolean;
  votoUsuario: VotoIncidencia | null;
}

export interface SeguimientoIncidencia {
  siguiendo: boolean;
  seguimiento: unknown | null;
}

export interface ResumenConfirmacionesCompletado {
  totalConfirmaciones: number;
  usuarioYaConfirmo: boolean;
  confirmacionUsuario: unknown | null;
}

export interface ConfirmacionCompletadoDetalle {
  idConfirmacion: string;
  idIncidencia: string;
  idUsuario: string;
  aliasUsuario: string | null;
  observacion: string | null;
  latitud: number | null;
  longitud: number | null;
  valida: boolean;
  creadoEn: string;
  multimedia: ArchivoMultimedia[];
}

export interface ConfirmacionCompletado {
  idConfirmacion: string;
  idIncidencia: string;
  idUsuario: string;
  observacion: string | null;
  latitud: number | null;
  longitud: number | null;
  valida: boolean;
  creadoEn: string;
}
