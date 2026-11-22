import { z } from "zod";

/**
 * Contracts for the CURRENT API surface only. Phase 1 uses these for types
 * (`z.infer`) and leaves runtime validation in the Express controllers so that
 * no error message changes. Phase 4 moves validation onto these same schemas.
 */

const requiredString = z.string().min(1);

export const registerSchema = z.strictObject({
  name: requiredString,
  email: requiredString,
  password: z.string().min(6),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.strictObject({
  email: requiredString,
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["user", "admin"]),
  })
  .passthrough();
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const meResponseSchema = z.object({ user: userSchema });
export type MeResponse = z.infer<typeof meResponseSchema>;

export const exampleSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    code: z.string(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();
export type Example = z.infer<typeof exampleSchema>;

export const examplesListSchema = z.object({
  examples: z.array(exampleSchema),
});
export type ExamplesListResponse = z.infer<typeof examplesListSchema>;

export const usersListSchema = z.object({ users: z.array(userSchema) });
export type UsersListResponse = z.infer<typeof usersListSchema>;

export const errorEnvelopeSchema = z.object({ message: z.string() });
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
