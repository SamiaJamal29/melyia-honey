"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api-client";
import { getFirebaseClient } from "@/lib/firebase/client";

export type UserRole = "customer" | "admin" | "reseller";

export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName?: string;
  readonly phone?: string;
  readonly role: UserRole;
  readonly isActive: boolean;
}

interface AuthContextValue {
  readonly user: User | null;
  readonly profile: UserProfile | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly signIn: (email: string, password: string) => Promise<UserProfile>;
  readonly signUp: (
    email: string,
    password: string,
    displayName: string,
    phone?: string,
  ) => Promise<UserProfile>;
  readonly signOut: () => Promise<void>;
  readonly refreshProfile: () => Promise<UserProfile | null>;
}

interface DataResponse<T> {
  readonly data: T;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const fetchProfile = async (user: User): Promise<UserProfile> => {
  const token = await user.getIdToken();
  const response = await apiRequest<DataResponse<UserProfile>>("/api/users/me", {
    idToken: token,
  });
  return response.data;
};

const readableError = (error: unknown): string =>
  error instanceof Error ? error.message : "Authentication could not be completed.";

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => undefined;
    try {
      const { auth } = getFirebaseClient();
      unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setError(null);
        if (!nextUser) {
          setProfile(null);
          setIsLoading(false);
          return;
        }
        try {
          setProfile(await fetchProfile(nextUser));
        } catch {
          setProfile(null);
        } finally {
          setIsLoading(false);
        }
      });
    } catch {
      window.setTimeout(() => setIsLoading(false), 0);
    }
    return unsubscribe;
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) return null;
    const nextProfile = await fetchProfile(user);
    setProfile(nextProfile);
    return nextProfile;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      error,
      signIn: async (email, password) => {
        setError(null);
        try {
          const { auth } = getFirebaseClient();
          await setPersistence(auth, browserLocalPersistence);
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const nextProfile = await fetchProfile(credential.user);
          setUser(credential.user);
          setProfile(nextProfile);
          return nextProfile;
        } catch (caught) {
          const message = readableError(caught);
          setError(message);
          throw new Error(message);
        }
      },
      signUp: async (email, password, displayName, phone) => {
        setError(null);
        try {
          const { auth } = getFirebaseClient();
          await setPersistence(auth, browserLocalPersistence);
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          const token = await credential.user.getIdToken();
          const response = await apiRequest<DataResponse<UserProfile>>(
            "/api/users/bootstrap",
            {
              method: "POST",
              idToken: token,
              body: JSON.stringify({
                displayName,
                ...(phone ? { phone } : {}),
              }),
            },
          );
          await sendEmailVerification(credential.user);
          setUser(credential.user);
          setProfile(response.data);
          return response.data;
        } catch (caught) {
          const message = readableError(caught);
          setError(message);
          throw new Error(message);
        }
      },
      signOut: async () => {
        await firebaseSignOut(getFirebaseClient().auth);
        setUser(null);
        setProfile(null);
        router.replace("/login");
      },
      refreshProfile,
    }),
    [error, isLoading, profile, refreshProfile, router, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
