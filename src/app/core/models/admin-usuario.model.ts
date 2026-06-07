export interface AdminUsuario {
  idUsuario: string;
  nombres: string;
  apellidos: string;
  aliasPublico: string;
  email: string;
  telefono: string | null;
  fotoPerfilUrl: string | null;
  estadoCuenta: string;
  puntosTotales: number;
  roles: string[];
  fechaRegistro: string;
}
