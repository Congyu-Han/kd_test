export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  requestId: string;
}

export async function apiGet<T>(url: string, token?: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }

  return (await response.json()) as ApiResponse<T>;
}
