import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

import { environment } from '../../../environments/environment';

const app = getApps().length
  ? getApps()[0]
  : initializeApp(environment.firebase);

export const firebaseApp = app;
export const firebaseAuth = getAuth(app);
export const firebaseStorage = getStorage(app);

export async function getFirebaseMessaging() {
  const supported = await isSupported();

  if (!supported) {
    return null;
  }

  return getMessaging(app);
}
