import type { ProductFilterParams, ProductPayload, ProductResponse } from '../types/inventory.ts';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function parsePositiveInt(value: unknown, fieldName: string): ValidationResult<number> {
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return { ok: false, error: `${fieldName} must be a positive integer.` };
  }
  return { ok: true, data: num };
}

export function validateProductPayload(input: unknown): ValidationResult<ProductPayload> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const raw = input as Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name.length < 1 || name.length > 30) {
    return { ok: false, error: 'Product name must be between 1 and 30 characters.' };
  }

  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  if (description.length < 1 || description.length > 100) {
    return { ok: false, error: 'Description must be between 1 and 100 characters.' };
  }

  const price = typeof raw.price === 'string' ? Number(raw.price) : raw.price;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'Price must be a finite number greater than 0.' };
  }

  const quantity = typeof raw.quantity === 'string' ? Number(raw.quantity) : raw.quantity;
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    return { ok: false, error: 'Quantity must be an integer greater than or equal to 0.' };
  }

  const categoryRes = parsePositiveInt(raw.category_id, 'category_id');
  if (!categoryRes.ok) {
    return { ok: false, error: 'Please select a valid category.' };
  }

  return {
    ok: true,
    data: {
      name,
      description,
      price: Math.round(price * 100) / 100,
      quantity,
      category_id: categoryRes.data,
    },
  };
}

export function validateCategoryName(input: unknown): ValidationResult<string> {
  const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>).name : input;
  const name = typeof raw === 'string' ? raw.trim() : '';
  if (name.length < 1 || name.length > 30) {
    return { ok: false, error: 'Category name must be between 1 and 30 characters.' };
  }
  return { ok: true, data: name };
}

export function validateTagName(input: unknown): ValidationResult<string> {
  const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>).name : input;
  const name = typeof raw === 'string' ? raw.trim() : '';
  if (name.length < 1 || name.length > 50) {
    return { ok: false, error: 'Tag name must be between 1 and 50 characters.' };
  }
  return { ok: true, data: name };
}

export function parseProductQuery(query: Record<string, unknown>): ValidationResult<ProductFilterParams> {
  let skip = 0;
  if (query.skip !== undefined && query.skip !== '') {
    const parsedSkip = Number(query.skip);
    if (!Number.isInteger(parsedSkip) || parsedSkip < 0) {
      return { ok: false, error: 'skip must be an integer >= 0.' };
    }
    skip = parsedSkip;
  }

  let limit = 20;
  if (query.limit !== undefined && query.limit !== '') {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return { ok: false, error: 'limit must be an integer between 1 and 100.' };
    }
    limit = parsedLimit;
  }

  let category_id: number | undefined;
  if (query.category_id !== undefined && query.category_id !== '') {
    const parsedCat = Number(query.category_id);
    if (!Number.isInteger(parsedCat) || parsedCat <= 0) {
      return { ok: false, error: 'category_id must be a positive integer.' };
    }
    category_id = parsedCat;
  }

  let max_price: number | undefined;
  if (query.max_price !== undefined && query.max_price !== '') {
    const parsedPrice = Number(query.max_price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return { ok: false, error: 'max_price must be a number greater than 0.' };
    }
    max_price = parsedPrice;
  }

  const search =
    typeof query.search === 'string' && query.search.trim().length > 0
      ? query.search.trim().slice(0, 60)
      : undefined;

  return {
    ok: true,
    data: { skip, limit, category_id, max_price, search },
  };
}

export interface InventoryMetrics {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
}

export function computeInventoryMetrics(products: ProductResponse[]): InventoryMetrics {
  let totalUnits = 0;
  let totalValue = 0;
  let lowStockCount = 0;

  for (const product of products) {
    totalUnits += product.quantity;
    totalValue += product.price * product.quantity;
    if (product.quantity <= 5) {
      lowStockCount += 1;
    }
  }

  return {
    totalProducts: products.length,
    totalUnits,
    totalValue: Math.round(totalValue * 100) / 100,
    lowStockCount,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
