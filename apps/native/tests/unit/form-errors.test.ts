import { extractErrorMessage, getFieldError, mapAuthErrorMessage } from "@/lib/form-errors";

describe("form-errors", () => {
  it("extracts string messages", () => {
    expect(extractErrorMessage("error directo")).toBe("error directo");
  });

  it("extracts nested object messages", () => {
    expect(extractErrorMessage({ error: { message: "nested" } })).toBe("nested");
  });

  it("extracts from arrays", () => {
    expect(extractErrorMessage([{ foo: "bar" }, { message: "array-msg" }])).toBe("array-msg");
  });

  it("returns field error from errors array", () => {
    expect(getFieldError([{ message: "campo requerido" }])).toBe("campo requerido");
  });

  it("maps credential errors", () => {
    expect(mapAuthErrorMessage({ message: "Invalid credentials" }, "fallback")).toBe(
      "Correo o contraseña incorrectos.",
    );
  });

  it("maps duplicate account errors", () => {
    expect(mapAuthErrorMessage({ message: "Email already exists" }, "fallback")).toBe(
      "Este correo ya está registrado.",
    );
  });

  it("maps network errors", () => {
    expect(mapAuthErrorMessage({ message: "Failed to fetch" }, "fallback")).toBe(
      "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.",
    );
  });
});
