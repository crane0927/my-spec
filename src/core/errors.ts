export class MyspecError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MyspecError";
  }
}

export function formatUserError(error: unknown): string {
  if (error instanceof MyspecError) {
    return `error: [${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    return `error: ${error.message}`;
  }

  return "error: unknown failure";
}
