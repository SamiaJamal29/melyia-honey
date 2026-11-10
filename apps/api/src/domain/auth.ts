import { z } from "zod";

export const roles = ["customer", "admin", "reseller"] as const;
export const roleSchema = z.enum(roles);
export type Role = z.infer<typeof roleSchema>;

export const authenticationProfileSchema = z
  .object({
    email: z.email(),
    role: roleSchema,
    isActive: z.boolean(),
  })
  .passthrough();

export interface AuthenticatedPrincipal {
  readonly uid: string;
  readonly email: string;
  readonly role: Role;
  readonly isActive: true;
  readonly secondFactor?: string;
}
