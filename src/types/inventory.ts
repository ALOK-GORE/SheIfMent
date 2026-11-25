export interface CategorySummary {
  id: number;
  name: string;
}

export interface TagSummary {
  id: number;
  name: string;
}

export interface ProductInRelation {
  id: number;
  name: string;
  price: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category_id: number;
  category: CategorySummary;
  tags: TagSummary[];
}

export interface PaginatedProductsResponse {
  items: ProductResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
  products: ProductInRelation[];
}

export interface TagResponse {
  id: number;
  name: string;
  products: ProductInRelation[];
}

export interface UserProfile {
  id: number;
  uid: string;
  username: string;
  email: string;
  is_active: boolean;
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category_id: number;
}

export interface ProductFilterParams {
  skip: number;
  limit: number;
  category_id?: number;
  max_price?: number;
  search?: string;
}
