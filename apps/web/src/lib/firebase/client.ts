import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

interface FirebaseClient {
  readonly app: FirebaseApp;
  readonly auth: Auth;
}

let client: FirebaseClient | undefined;
let appCheckInitialized = false;
let authEmulatorConnected = false;

const getRequiredValue = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

export const getFirebaseClient = (): FirebaseClient => {
  if (client) return client;

  const app = getApps()[0] ??
    initializeApp({
      apiKey: getRequiredValue(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      ),
      authDomain: getRequiredValue(
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      ),
      projectId: getRequiredValue(
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      ),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: getRequiredValue(
        "NEXT_PUBLIC_FIREBASE_APP_ID",
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      ),
    });

  const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
  if (appCheckSiteKey && !appCheckInitialized && typeof window !== "undefined") {
    initializeAppCheck(getApp(app.name), {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
  }

  const auth = getAuth(app);
  const authEmulatorUrl = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (
    authEmulatorUrl &&
    !authEmulatorConnected &&
    typeof window !== "undefined"
  ) {
    connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    authEmulatorConnected = true;
  }

  client = { app, auth };
  return client;
};
