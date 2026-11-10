"use client";

import type { ReactNode } from "react";

import { useAuth, type UserRole } from "./auth-provider";

export function RoleGate({
  allow,
  children,
  fallback,
}: {
  readonly allow: readonly UserRole[];
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}) {
  const { isLoading, profile } = useAuth();
  if (isLoading) {
    return <div className="mx-auto my-16 h-24 w-[min(90%,32rem)] animate-pulse rounded-2xl bg-ink/5" />;
  }
  if (!profile || !allow.includes(profile.role)) {
    return (
      fallback ?? (
        <div className="mx-auto my-16 max-w-lg rounded-2xl border border-line bg-surface p-8 text-center">
          <h1 className="font-display text-3xl">This area is private.</h1>
          <p className="mt-3 text-muted">Sign in with the correct Melyia account to continue.</p>
        </div>
      )
    );
  }
  return children;
}
