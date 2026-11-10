import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAppCheck, type AppCheck } from "firebase-admin/app-check";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

export interface FirebaseServices {
  readonly app: App;
  readonly appCheck: AppCheck;
  readonly auth: Auth;
  readonly db: Firestore;
  readonly storage: Storage;
}

let services: FirebaseServices | undefined;

const createFirebaseApp = (): App => {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is required.");
  }

  const isUsingEmulators = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ?? process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );

  return initializeApp({
    projectId,
    ...(isUsingEmulators ? {} : { credential: applicationDefault() }),
  });
};

export const getFirebaseServices = (): FirebaseServices => {
  if (services) return services;

  const app = createFirebaseApp();
  services = {
    app,
    appCheck: getAppCheck(app),
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return services;
};
