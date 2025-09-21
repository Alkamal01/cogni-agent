// Lightweight client for the external Python backend.
// Centralize all HTTP calls so we can swap environments easily.

const PY_BACKEND_URL: string = (import.meta as any).env?.VITE_PY_BACKEND_URL ||
  (typeof process !== 'undefined' ? (process as any).env?.VITE_PY_BACKEND_URL : '') ||
  '';

function readCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = (typeof document !== 'undefined' ? document.cookie.split(';') : []);
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  } catch {}
  return null;
}

function getAuthHeaders(): Record<string, string> {
  try {
    const lsAuth = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const ckAuth = readCookie('token') || readCookie('auth_token') || readCookie('access_token');
    const token = lsAuth || ckAuth || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function requestJson<T = any>(endpoint: string, method: string, body?: any): Promise<T> {
  if (!PY_BACKEND_URL) {
    throw new Error('Python backend URL is not configured. Set VITE_PY_BACKEND_URL');
  }

  const res = await fetch(`${PY_BACKEND_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Python backend error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

async function requestForm<T = any>(endpoint: string, formData: FormData): Promise<T> {
  if (!PY_BACKEND_URL) {
    throw new Error('Python backend URL is not configured. Set VITE_PY_BACKEND_URL');
  }

  const res = await fetch(`${PY_BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      // NOTE: Do not set Content-Type for FormData; browser will set boundary
    } as any,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Python backend error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const pythonBackend = {
  // Tutor topic suggestions (existing backend route)
  suggestTopics: (tutorPublicId: string) =>
    requestJson(`/api/tutors/${encodeURIComponent(tutorPublicId)}/suggest-topics`, 'GET'),

  // Validate topic for a specific tutor (existing backend route)
  validateTutorTopic: (tutorPublicId: string, topic: string) =>
    requestJson(`/api/tutors/${encodeURIComponent(tutorPublicId)}/validate-topic`, 'POST', { topic }),

  // Optional future endpoints (only if/when added on backend):
  // generateCourseOutline: (topic: string, expertise: string[]) =>
  //   requestJson('/api/ai/generate-course-outline', 'POST', { topic, expertise }),
  // generateTopicSuggestions: (expertise: string[], teaching_style: string, personality: string) =>
  //   requestJson('/api/ai/generate-topic-suggestions', 'POST', { expertise, teaching_style, personality }),
  // tutorChat: (message: string, tutor_expertise: string[], teaching_style: string, personality: string, context?: string) =>
  //   requestJson('/api/ai/tutor-chat', 'POST', { message, tutor_expertise, teaching_style, personality, context }),
  // ragSearch: (tutor_id: string, query: string, top_k: number = 3) =>
  //   requestJson('/api/ai/rag-search', 'POST', { tutor_id, query, top_k }),

  // Knowledge base uploads (multipart form)
  uploadKnowledgeBaseFiles: (tutorPublicId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return requestForm(`/api/tutors/${encodeURIComponent(tutorPublicId)}/knowledge-base/upload`, fd);
  },

  // Knowledge base search & info
  kbSearch: (tutorPublicId: string, query: string, topK: number = 5) =>
    requestJson(`/api/tutors/${encodeURIComponent(tutorPublicId)}/knowledge-base/search`, 'POST', { query, top_k: topK }),

  getKnowledgeBaseInfo: (tutorPublicId: string) =>
    requestJson(`/api/tutors/${encodeURIComponent(tutorPublicId)}/knowledge-base`, 'GET'),

  // Session creation on Python (generates course outline server-side)
  createTutorSession: (tutorPublicId: string, topic: string) =>
    requestJson(`/api/tutors/${encodeURIComponent(tutorPublicId)}/sessions`, 'POST', { topic }),
};

export default pythonBackend;


