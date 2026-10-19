import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const INSECURE_DEFAULT_ACCESS_SECRET = "cms_default_access_secret_12345";
const INSECURE_DEFAULT_REFRESH_SECRET = "cms_default_refresh_secret_12345";

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    CLIENT_URL: z.string().default("http://localhost:5173"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required and cannot be empty"),
    DIRECT_URL: z.string().optional().default(""),
    JWT_ACCESS_SECRET: z.string().default(INSECURE_DEFAULT_ACCESS_SECRET),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_SECRET: z.string().default(INSECURE_DEFAULT_REFRESH_SECRET),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    SUPABASE_URL: z.string().optional().default(""),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
    SUPABASE_STORAGE_BUCKET: z.string().optional().default("cms-assets"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (
        !data.JWT_ACCESS_SECRET ||
        data.JWT_ACCESS_SECRET === INSECURE_DEFAULT_ACCESS_SECRET ||
        data.JWT_ACCESS_SECRET.length < 16
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_ACCESS_SECRET"],
          message:
            "JWT_ACCESS_SECRET must be explicitly set to a secure string (minimum 16 characters) in production. Insecure defaults are forbidden.",
        });
      }

      if (
        !data.JWT_REFRESH_SECRET ||
        data.JWT_REFRESH_SECRET === INSECURE_DEFAULT_REFRESH_SECRET ||
        data.JWT_REFRESH_SECRET.length < 16
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_REFRESH_SECRET"],
          message:
            "JWT_REFRESH_SECRET must be explicitly set to a secure string (minimum 16 characters) in production. Insecure defaults are forbidden.",
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ [FATAL] Environment Configuration Validation Failed:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".") || "ENV"}: ${issue.message}`);
  }
  console.error("Please verify your environment configuration matches .env.example specifications.\n");
  process.exit(1);
}

export const ENV = parsed.data;
export type EnvConfig = typeof ENV;

