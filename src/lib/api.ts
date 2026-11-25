import type {
  CategoryResponse,
  PaginatedProductsResponse,
  ProductPayload,
  ProductResponse,
  TagResponse,
} from '../types/inventory.ts';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  }

  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && 'detail' in data && typeof (data as { detail: unknown }).detail === 'string'
        ? (data as { detail: string }).detail
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, detail);
  }

  return data as T;
}

export const api = {
  getProducts(params: {
    skip?: number;
    limit?: number;
    category_id?: number;
    max_price?: number;
    search?: string;
  }): Promise<PaginatedProductsResponse> {
    const searchParams = new URLSearchParams();
    if (params.skip !== undefined) searchParams.set('skip', String(params.skip));
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.category_id !== undefined) searchParams.set('category_id', String(params.category_id));
    if (params.max_price !== undefined) searchParams.set('max_price', String(params.max_price));
    if (params.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return request<PaginatedProductsResponse>(`/api/products${qs ? `?${qs}` : ''}`);
  },

  createProduct(payload: ProductPayload, token: string | null): Promise<ProductResponse> {
    return request<ProductResponse>(
      '/api/products',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    );
  },

  updateProduct(
    productId: number,
    payload: ProductPayload,
    token: string | null
  ): Promise<ProductResponse> {
    return request<ProductResponse>(
      `/api/products/${productId}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      token
    );
  },

  deleteProduct(productId: number, token: string | null): Promise<void> {
    return request<void>(`/api/products/${productId}`, { method: 'DELETE' }, token);
  },

  attachTag(productId: number, tagId: number, token: string | null): Promise<ProductResponse> {
    return request<ProductResponse>(
      `/api/products/${productId}/tags/${tagId}`,
      { method: 'POST' },
      token
    );
  },

  detachTag(productId: number, tagId: number, token: string | null): Promise<ProductResponse> {
    return request<ProductResponse>(
      `/api/products/${productId}/tags/${tagId}`,
      { method: 'DELETE' },
      token
    );
  },

  getCategories(): Promise<CategoryResponse[]> {
    return request<CategoryResponse[]>('/api/categories');
  },

  createCategory(name: string, token: string | null): Promise<CategoryResponse> {
    return request<CategoryResponse>(
      '/api/categories',
      { method: 'POST', body: JSON.stringify({ name }) },
      token
    );
  },

  updateCategory(categoryId: number, name: string, token: string | null): Promise<CategoryResponse> {
    return request<CategoryResponse>(
      `/api/categories/${categoryId}`,
      { method: 'PUT', body: JSON.stringify({ name }) },
      token
    );
  },

  deleteCategory(categoryId: number, token: string | null): Promise<void> {
    return request<void>(`/api/categories/${categoryId}`, { method: 'DELETE' }, token);
  },

  getTags(): Promise<TagResponse[]> {
    return request<TagResponse[]>('/api/tags');
  },

  createTag(name: string, token: string | null): Promise<TagResponse> {
    return request<TagResponse>(
      '/api/tags',
      { method: 'POST', body: JSON.stringify({ name }) },
      token
    );
  },

  deleteTag(tagId: number, token: string | null): Promise<void> {
    return request<void>(`/api/tags/${tagId}`, { method: 'DELETE' }, token);
  },
};
