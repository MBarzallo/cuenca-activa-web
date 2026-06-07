export interface Incidencia {
  idIncidencia: string;
  idUsuarioReporta: string;
  aliasUsuarioReporta: string | null;
  idCategoria: string;
  codigoCategoria: string;
  nombreCategoria: string;
  idEstadoActual: string;
  codigoEstado: string;
  nombreEstado: string;
  titulo: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  direccionReferencial: string | null;
  prioridadCalculada: number;
  cantidadValidaciones: number;
  cantidadComentarios: number;
  cantidadSeguidores: number;
  cantidadConfirmaciones: number;
  idSector: string | null;
  nombreSector: string | null;
  visible: boolean;
  fechaReporte: string;
  actualizadoEn: string;
  cerradoEn: string | null;
}

export interface IncidenciaCercana extends Incidencia {
  distanciaMetros: number;
}

export interface IncidenciaRelacionada {
  idRelacion: string;
  idIncidenciaRelacionada: string;
  titulo: string;
  nombreCategoria: string;
  nombreEstado: string;
  tipoRelacion: string;
  distanciaMetros: number | null;
  creadaEn: string;
}
