import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseServices } from "../config/firebase-admin.js";
import { buildAdminUserDocument } from "./admin-user-document.js";

const readRequiredEnvironmentValue = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const bootstrapAdmin = async (): Promise<void> => {
  const uid = readRequiredEnvironmentValue("ADMIN_UID");
  const email = readRequiredEnvironmentValue("ADMIN_EMAIL").toLowerCase();
  const { auth, db } = getFirebaseServices();
  const user = await auth.getUser(uid);

  if (user.email?.toLowerCase() !== email) {
    throw new Error("ADMIN_EMAIL does not match the Firebase Auth user.");
  }

  const now = FieldValue.serverTimestamp();
  await db.collection("users").doc(uid).set(
    buildAdminUserDocument(email, user, now),
    { merge: false },
  );

  console.info(`Bootstrapped administrator ${uid}.`);
};

void bootstrapAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  console.error(message);
  process.exitCode = 1;
});
