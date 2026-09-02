export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export const initialAuthFormState: AuthFormState = { status: "idle" };
