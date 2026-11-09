// A API roda no mesmo domínio do site, então os caminhos são sempre relativos.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: "same-origin",
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
  } catch {
    throw new ApiError("Sem conexão com o servidor. Verifique sua internet.", 0);
  }
  if (!res.ok) {
    let msg = `Erro no servidor (HTTP ${res.status})`;
    try {
      const data = await res.json();
      msg =
        (typeof data.message === "string" && data.message) ||
        (typeof data.statusMessage === "string" && data.statusMessage) ||
        (typeof data.error === "string" && data.error) ||
        msg;
    } catch {}
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

export interface Participant {
  id: string;
  name: string;
  /** Documento (CPF/RG). */
  registration_id: string;
  email?: string;
  created_at: string;
  consent_at?: string;
}

export type AccessResult = "autorizado" | "negado" | "duplicado" | "manual";

export interface AccessRecord {
  id: string;
  student_id: string | null;
  name: string | null;
  timestamp: string;
  date: string;
  result: AccessResult;
  similarity?: number;
  removed?: boolean;
}

export interface EntryRecord {
  id?: string;
  student_id: string;
  name: string;
  timestamp: string;
  date?: string;
}

export type RecognizeResponse =
  | { result: "autorizado"; name: string; time: string; similarity: number; message: string }
  | { result: "duplicado"; name: string; first_time: string | null; message: string }
  | { result: "negado"; message: string };

export const api = {
  health: () => request<{ status: string; version: string }>("/api/health"),

  // ---- Portaria (público) ----
  recognize: (descriptor: number[]) =>
    request<RecognizeResponse>("/api/access/recognize", {
      method: "POST",
      body: JSON.stringify({ descriptor }),
    }),

  enroll: (payload: {
    name: string;
    document: string;
    email?: string;
    consent: boolean;
    face_descriptor: number[];
  }) =>
    request<{ success: boolean; student_id: string; message: string }>("/api/enrollment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ---- Administrador ----
  login: (email: string, password: string) =>
    request<{ success: boolean; email: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ success: boolean }>("/api/auth/logout", { method: "POST", body: "{}" }),
  me: () => request<{ email: string }>("/api/auth/me"),

  listParticipants: () => request<{ students: Participant[]; total: number }>("/api/students"),
  deleteParticipant: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/students/${id}`, { method: "DELETE" }),
  manualEntry: (studentId: string) =>
    request<{ success: boolean; already_registered: boolean; message: string }>("/api/attendance/register", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId }),
    }),

  accessByDate: (date: string) =>
    request<{ date: string; records: AccessRecord[]; participants_total: number }>(`/api/access/date/${date}`),
  entriesFor: (studentId: string) => request<{ records: EntryRecord[] }>(`/api/attendance/${studentId}`),
};
