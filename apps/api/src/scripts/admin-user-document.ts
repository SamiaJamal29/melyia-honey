interface AdminAuthUser {
  readonly displayName?: string;
  readonly phoneNumber?: string;
}

export const buildAdminUserDocument = (
  email: string,
  user: AdminAuthUser,
  timestamp: unknown,
) => ({
  email,
  displayName: user.displayName ?? "Melyia Admin",
  ...(user.phoneNumber ? { phone: user.phoneNumber } : {}),
  role: "admin" as const,
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp,
});
