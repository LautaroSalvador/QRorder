export class ApiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = "No pudimos completar la operación.";

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = payload.error?.message ?? message;
    } catch {
      // Si no hay JSON válido, dejamos el mensaje por defecto.
    }

    throw new ApiRequestError(message);
  }

  const data = (await response.json()) as T;

  return data;
}
