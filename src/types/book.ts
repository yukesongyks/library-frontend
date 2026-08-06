export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publisher: string | null;
  category: string | null;
  stock: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookRequest {
  title: string;
  author: string;
  isbn: string;
  publisher?: string;
  category?: string;
  totalStock: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface LoginResponse {
  token: string;
  role: string;
  username: string;
}
