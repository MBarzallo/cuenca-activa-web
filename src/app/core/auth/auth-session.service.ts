import { computed, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ADMIN_ROLES, AppRole, AuthUser } from '../models/auth-user.model';
import { ApiService } from '../services/api.service';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly user = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly isAuthenticated = computed(() => !!this.user());
  readonly isAdmin = computed(() => this.hasAnyRole(ADMIN_ROLES));

  constructor(
    private readonly api: ApiService,
    private readonly firebaseAuth: FirebaseAuthService,
  ) {}

  async loadCurrentUser(): Promise<AuthUser | null> {
    await this.firebaseAuth.waitForAuthReady();

    if (!this.firebaseAuth.firebaseUser()) {
      this.user.set(null);
      return null;
    }

    this.loading.set(true);
    try {
      const currentUser = await firstValueFrom(this.api.get<AuthUser>('/api/auth/me'));
      this.user.set(currentUser);
      return currentUser;
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    await this.firebaseAuth.signInWithEmail(email, password);
    const user = await this.loadCurrentUser();
    if (!user) {
      throw new Error('No se pudo cargar el usuario interno.');
    }
    return user;
  }

  async register(request: {
    email: string;
    password: string;
    nombres: string;
    apellidos: string;
    aliasPublico: string;
    telefono: string;
  }): Promise<AuthUser> {
    await this.firebaseAuth.createUserWithEmail(request.email, request.password);
    return this.completeInternalProfile(request);
  }

  async completeInternalProfile(request: {
    nombres: string;
    apellidos: string;
    aliasPublico: string;
    telefono: string;
  }): Promise<AuthUser> {
    const currentUser = await firstValueFrom(
      this.api.post<AuthUser>('/api/auth/register', {
        nombres: request.nombres.trim(),
        apellidos: request.apellidos.trim(),
        aliasPublico: request.aliasPublico.trim(),
        telefono: request.telefono.trim() || null,
      }),
    );
    this.user.set(currentUser);
    return currentUser;
  }

  async hasFirebaseSession(): Promise<boolean> {
    await this.firebaseAuth.waitForAuthReady();
    return !!this.firebaseAuth.firebaseUser();
  }

  async sendPasswordReset(email: string): Promise<void> {
    await this.firebaseAuth.sendPasswordReset(email);
  }

  async logout(): Promise<void> {
    await this.firebaseAuth.logout();
    this.user.set(null);
  }

  hasAnyRole(roles: readonly AppRole[]): boolean {
    const currentRoles = this.user()?.roles ?? [];
    return roles.some((role) => currentRoles.includes(role));
  }

  isMissingProfileError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }
    const body = error.error as { code?: string } | null;
    return body?.code === 'PERFIL_NO_REGISTRADO';
  }
}
