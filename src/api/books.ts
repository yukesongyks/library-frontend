import client from './client';
import type { Book, BookRequest, ApiResponse, PageResponse } from '../types/book';

export async function getBooks(page: number, size: number): Promise<ApiResponse<PageResponse<Book>>> {
  const response = await client.get('/books', { params: { page, size } });
  return response.data;
}

export async function getBook(id: number): Promise<ApiResponse<Book>> {
  const response = await client.get(`/books/${id}`);
  return response.data;
}

export async function createBook(data: BookRequest): Promise<ApiResponse<Book>> {
  const response = await client.post('/books', data);
  return response.data;
}

export async function updateBook(id: number, data: BookRequest): Promise<ApiResponse<Book>> {
  const response = await client.put(`/books/${id}`, data);
  return response.data;
}

export async function deleteBook(id: number): Promise<ApiResponse<void>> {
  const response = await client.delete(`/books/${id}`);
  return response.data;
}
