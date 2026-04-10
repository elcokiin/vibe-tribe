import { expo } from "@better-auth/expo";
import { db } from "@vibetribe/db";
import * as schema from "@vibetribe/db/schema/auth";
import { env } from "@vibetribe/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins/email-otp";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      body?: string;
    };

type SendOtpParams = {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

async function sendEmailWithResend({ to, subject, html, text }: SendEmailParams): Promise<SendEmailResult> {
  if (env.NODE_ENV === "development") {
    console.log("[auth:email:dev] skipping Resend send", {
      to,
      subject,
      text,
    });
    return { ok: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        ok: false,
        error: "Resend API responded with non-OK status",
        status: response.status,
        body: errorBody,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

async function sendOtpWithResend({ email, otp, type }: SendOtpParams) {
  const otpTypeLabel =
    type === "forget-password"
      ? "recuperar tu contraseña"
      : type === "change-email"
        ? "cambiar tu correo"
      : type === "email-verification"
        ? "verificar tu correo"
        : "iniciar sesión";

  const subject = "Código de verificación de VibeTribe";
  const text = `Tu código para ${otpTypeLabel} es: ${otp}\n\nEste código expira en unos minutos. Si no solicitaste este código, ignora este mensaje.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 12px;">Código de verificación</h2>
      <p style="margin: 0 0 12px;">Usa este código para ${otpTypeLabel}:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em; margin: 0 0 16px;">${otp}</p>
      <p style="margin: 0; font-size: 14px; color: #475569;">Este código expira en unos minutos. Si no solicitaste este código, ignora este mensaje.</p>
    </div>
  `;

  const sendResult = await sendEmailWithResend({
    to: email,
    subject,
    text,
    html,
  });

  if (!sendResult.ok) {
    console.error("Failed to send OTP email with Resend", {
      to: email,
      subject,
      from: env.RESEND_FROM_EMAIL,
      error: sendResult.error,
      status: sendResult.status,
      body: sendResult.body,
      otpType: type,
    });
  }

  if (env.NODE_ENV === "development") {
    console.log("[auth:otp:dev]", {
      email,
      otp,
      type,
    });
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),
  trustedOrigins: [
    env.CORS_ORIGIN,
    "vibetribe://",
    ...(env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**", "http://localhost:8081"]
      : []),
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [
    expo(),
    emailOTP({
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpWithResend({ email, otp, type });
      },
    }),
  ],
});
