import { readFile } from "node:fs/promises";

import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, describe, it } from "vitest";

const projectId = "melyia-rules-test";
let environment: RulesTestEnvironment;

describe.runIf(Boolean(process.env.FIRESTORE_EMULATOR_HOST))(
  "deny-by-default Firebase rules",
  () => {
    beforeAll(async () => {
      const [firestoreRules, storageRules] = await Promise.all([
        readFile(new URL("../../../firestore.rules", import.meta.url), "utf8"),
        readFile(new URL("../../../storage.rules", import.meta.url), "utf8"),
      ]);
      environment = await initializeTestEnvironment({
        projectId,
        firestore: { host: "127.0.0.1", port: 8080, rules: firestoreRules },
        storage: { host: "127.0.0.1", port: 9199, rules: storageRules },
      });
    });

    afterAll(async () => environment.cleanup());

  it("denies unauthenticated Firestore reads", async () => {
    const database = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(database, "products", "tualang-raw-honey")));
  });

  it("denies customers from writing their own role", async () => {
    const database = environment
      .authenticatedContext("customer-uid", { email: "customer@example.my" })
      .firestore();
    await assertFails(
      setDoc(doc(database, "users", "customer-uid"), {
        role: "admin",
        isActive: true,
      }),
    );
  });

  it("denies direct administrator writes because the API is mandatory", async () => {
    const database = environment
      .authenticatedContext("admin-uid", { email: "admin@melyia.my" })
      .firestore();
    await assertFails(deleteDoc(doc(database, "orders", "example-order")));
  });

  it("denies unauthenticated Storage downloads", async () => {
    const storage = environment.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(storage, "products/example.webp")));
  });

  it("denies direct Storage uploads even for authenticated users", async () => {
    const storage = environment
      .authenticatedContext("admin-uid", { email: "admin@melyia.my" })
      .storage();
    await assertFails(
      uploadBytes(ref(storage, "products/example.webp"), new Uint8Array([1, 2, 3])),
    );
  });
  },
);
