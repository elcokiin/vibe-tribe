export function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    for (const issue of error) {
      const message = extractErrorMessage(issue);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      error?: unknown;
      errors?: unknown;
    };

    const nested = extractErrorMessage(maybeError.error);
    if (nested) {
      return nested;
    }

    const nestedErrors = extractErrorMessage(maybeError.errors);
    if (nestedErrors) {
      return nestedErrors;
    }

    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
  }

  return null;
}

export function getFieldError(errors: unknown[] | undefined): string | null {
  if (!errors?.length) {
    return null;
  }

  return extractErrorMessage(errors) ?? null;
}

export function mapAuthErrorMessage(error: unknown, fallbackMessage: string): string {
  const rawMessage = extractErrorMessage(error);
  if (!rawMessage) {
    return fallbackMessage;
  }

  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("invalid") ||
    normalized.includes("cred") ||
    normalized.includes("password") ||
    normalized.includes("unauthorized")
  ) {
    return "Correo o contraseña incorrectos.";
  }

  if (
    normalized.includes("already") ||
    normalized.includes("exist") ||
    normalized.includes("duplicate") ||
    normalized.includes("taken")
  ) {
    return "Este correo ya esta registrado.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("timeout") ||
    normalized.includes("failed to fetch")
  ) {
    return "No pudimos conectarnos. Revisa tu conexion e intenta de nuevo.";
  }

  return rawMessage;
}
