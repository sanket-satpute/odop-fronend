export interface LoadingState {
  loading: boolean;
  error?: string | null;
  success?: boolean;
}

export interface DataState<T> extends LoadingState {
  data: T | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  status?: string;
  category?: string;
  [key: string]: any;
}