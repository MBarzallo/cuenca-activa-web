export interface CategoriaIncidencia {
  idCategoria: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  colorHex: string | null;
  requiereFoto: boolean;
}

export interface EstadoIncidencia {
  idEstado: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  ordenFlujo: number;
  esEstadoFinal: boolean;
}

