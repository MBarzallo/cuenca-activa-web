import { Injectable, signal } from '@angular/core';
import {
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firebaseAuth } from '../firebase/firebase.client';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly auth = firebaseAuth;
  readonly firebaseUser = signal<User | null>(this.auth.currentUser);
  readonly authReady = signal(false);

  constructor() {
    void setPersistence(this.auth, browserLocalPersistence);
    onAuthStateChanged(this.auth, (user) => {
      this.firebaseUser.set(user);
      this.authReady.set(true);
    });
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.auth, email.trim(), password);
    this.firebaseUser.set(credential.user);
    return credential.user;
  }

  async createUserWithEmail(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(this.auth, email.trim(), password);
    this.firebaseUser.set(credential.user);
    return credential.user;
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email.trim());
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    await this.waitForAuthReady();
    const user = this.auth.currentUser;
    if (!user) {
      return null;
    }
    return user.getIdToken(forceRefresh);
  }

  async waitForAuthReady(): Promise<void> {
    if (this.authReady()) {
      return;
    }

    await new Promise<void>((resolve) => {
      const stop = onAuthStateChanged(this.auth, () => {
        stop();
        resolve();
      });
    });
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.firebaseUser.set(null);
  }
}
