import { HttpErrorResponse } from '@angular/common/http';

const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'Ingresa un correo electrónico válido.',
  'auth/email-already-in-use': 'Ese correo ya está registrado.',
  'auth/weak-password': 'Usa una contraseña de al menos 6 caracteres.',
  'auth/missing-password': 'Ingresa tu contraseña.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Espera unos minutos e inténtalo otra vez.',
  'auth/network-request-failed': 'No pudimos conectar con el servicio de acceso. Revisa tu conexión.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de acceso antes de completar el proceso.',
};

export function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { code?: string; message?: string } | null;
    if (body?.code === 'PERFIL_NO_REGISTRADO') {
      return 'Completa tu perfil ciudadano para continuar.';
    }
    return body?.message || fallback;
  }

  const code = readErrorCode(error);
  if (code && FIREBASE_AUTH_MESSAGES[code]) {
    return FIREBASE_AUTH_MESSAGES[code];
  }

  if (error instanceof Error && error.message && !error.message.includes('Firebase')) {
    return error.message;
  }

  return fallback;
}

function readErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}
