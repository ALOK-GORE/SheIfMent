import { and, asc, count, eq, ilike, lte, or } from 'drizzle-orm';
import { db } from './index.ts';
import { categories, products, productTags, tags } from './schema.ts';
import type {
  CategoryResponse,
  PaginatedProductsResponse,
  ProductFilterParams,
  ProductPayload,
  ProductResponse,
  TagResponse,
} from '../types/inventory.ts';

export class ConflictError extends Error {
  status = 409;
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  status = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

function getPgErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const errObj = error as { code?: string; cause?: { code?: string } };
  return errObj.code ?? errObj.cause?.code;
}

type ProductQueryRow = {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: number;
  category: { id: number; name: string };
  productTags: Array<{ tag: { id: number; name: string } }>;
};

function mapProductRow(row: ProductQueryRow): ProductResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    quantity: row.quantity,
    category_id: row.categoryId,
    category: {
      id: row.category.id,
      name: row.category.name,
    },
    tags: row.productTags
      .map((pt) => ({ id: pt.tag.id, name: pt.tag.name }))
      .sort((a, b) => a.id - b.id),
  };
}

export async function listProducts(
  params: ProductFilterParams
): Promise<PaginatedProductsResponse> {
  try {
    const conditions = [];
    if (params.category_id !== undefined) {
      conditions.push(eq(products.categoryId, params.category_id));
    }
    if (params.max_price !== undefined) {
      conditions.push(lte(products.price, params.max_price));
    }
    if (params.search) {
      const pattern = `%${params.search}%`;
      conditions.push(or(ilike(products.name, pattern), ilike(products.description, pattern)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(products)
      .where(whereClause);

    const rows = await db.query.products.findMany({
      where: whereClause,
      orderBy: [asc(products.id)],
      offset: params.skip,
      limit: params.limit,
      with: {
        category: true,
        productTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return {
      items: rows.map(mapProductRow),
      total: Number(total),
      skip: params.skip,
      limit: params.limit,
    };
  } catch (error) {
    console.error('Failed to list products:', error);
    throw new Error('Failed to load products from database.', { cause: error });
  }
}

export async function getProductById(productId: number): Promise<ProductResponse | null> {
  try {
    const row = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        category: true,
        productTags: {
          with: {
            tag: true,
          },
        },
      },
    });
    return row ? mapProductRow(row) : null;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw new Error('Failed to fetch product.', { cause: error });
  }
}

export async function createProduct(payload: ProductPayload): Promise<ProductResponse> {
  try {
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, payload.category_id),
    });
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    const [inserted] = await db
      .insert(products)
      .values({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        quantity: payload.quantity,
        categoryId: payload.category_id,
      })
      .returning({ id: products.id });

    const created = await getProductById(inserted.id);
    if (!created) {
      throw new Error('Product was created but could not be reloaded.');
    }
    return created;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    const pgCode = getPgErrorCode(error);
    if (pgCode === '23503' || pgCode === '23505') {
      throw new ConflictError('Product conflicts with a database constraint.', error);
    }
    console.error('Failed to create product:', error);
    throw new Error('Failed to create product.', { cause: error });
  }
}

export async function updateProduct(
  productId: number,
  payload: ProductPayload
): Promise<ProductResponse> {
  try {
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, payload.category_id),
    });
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    const updated = await db
      .update(products)
      .set({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        quantity: payload.quantity,
        categoryId: payload.category_id,
      })
      .where(eq(products.id, productId))
      .returning({ id: products.id });

    if (updated.length === 0) {
      throw new NotFoundError('Product not found');
    }

    const reloaded = await getProductById(productId);
    if (!reloaded) {
      throw new NotFoundError('Product not found');
    }
    return reloaded;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    const pgCode = getPgErrorCode(error);
    if (pgCode === '23503' || pgCode === '23505') {
      throw new ConflictError('Product conflicts with a database constraint.', error);
    }
    console.error('Failed to update product:', error);
    throw new Error('Failed to update product.', { cause: error });
  }
}

export async function deleteProduct(productId: number): Promise<void> {
  try {
    const deleted = await db
      .delete(products)
      .where(eq(products.id, productId))
      .returning({ id: products.id });

    if (deleted.length === 0) {
      throw new NotFoundError('Product not found');
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Failed to delete product:', error);
    throw new Error('Failed to delete product.', { cause: error });
  }
}

export async function attachTagToProduct(
  productId: number,
  tagId: number
): Promise<ProductResponse> {
  try {
    const [existingProduct, existingTag] = await Promise.all([
      db.query.products.findFirst({ where: eq(products.id, productId) }),
      db.query.tags.findFirst({ where: eq(tags.id, tagId) }),
    ]);

    if (!existingTag) {
      throw new NotFoundError('Tag not found');
    }
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    await db
      .insert(productTags)
      .values({ productId, tagId })
      .onConflictDoNothing();

    const reloaded = await getProductById(productId);
    if (!reloaded) {
      throw new NotFoundError('Product not found');
    }
    return reloaded;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Failed to attach tag to product:', error);
    throw new Error('Failed to attach tag to product.', { cause: error });
  }
}

export async function detachTagFromProduct(
  productId: number,
  tagId: number
): Promise<ProductResponse> {
  try {
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    await db
      .delete(productTags)
      .where(and(eq(productTags.productId, productId), eq(productTags.tagId, tagId)));

    const reloaded = await getProductById(productId);
    if (!reloaded) {
      throw new NotFoundError('Product not found');
    }
    return reloaded;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Failed to detach tag from product:', error);
    throw new Error('Failed to detach tag from product.', { cause: error });
  }
}

export async function listCategories(): Promise<CategoryResponse[]> {
  try {
    const rows = await db.query.categories.findMany({
      orderBy: [asc(categories.id)],
      with: {
        products: {
          orderBy: [asc(products.id)],
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      products: row.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
      })),
    }));
  } catch (error) {
    console.error('Failed to list categories:', error);
    throw new Error('Failed to load categories.', { cause: error });
  }
}

export async function getCategoryById(categoryId: number): Promise<CategoryResponse | null> {
  try {
    const row = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: {
        products: {
          orderBy: [asc(products.id)],
        },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      products: row.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch category:', error);
    throw new Error('Failed to fetch category.', { cause: error });
  }
}

export async function createCategory(name: string): Promise<CategoryResponse> {
  try {
    const [inserted] = await db
      .insert(categories)
      .values({ name })
      .returning();

    return {
      id: inserted.id,
      name: inserted.name,
      products: [],
    };
  } catch (error) {
    if (getPgErrorCode(error) === '23505') {
      throw new ConflictError('Category name already exists', error);
    }
    console.error('Failed to create category:', error);
    throw new Error('Failed to create category.', { cause: error });
  }
}

export async function updateCategory(
  categoryId: number,
  name: string
): Promise<CategoryResponse> {
  try {
    const updated = await db
      .update(categories)
      .set({ name })
      .where(eq(categories.id, categoryId))
      .returning({ id: categories.id });

    if (updated.length === 0) {
      throw new NotFoundError('Category not found');
    }

    const reloaded = await getCategoryById(categoryId);
    if (!reloaded) {
      throw new NotFoundError('Category not found');
    }
    return reloaded;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    if (getPgErrorCode(error) === '23505') {
      throw new ConflictError('Category name already exists', error);
    }
    console.error('Failed to update category:', error);
    throw new Error('Failed to update category.', { cause: error });
  }
}

export async function deleteCategory(categoryId: number): Promise<void> {
  try {
    const deleted = await db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning({ id: categories.id });

    if (deleted.length === 0) {
      throw new NotFoundError('Category not found');
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    if (getPgErrorCode(error) === '23503') {
      throw new ConflictError('Cannot delete a category that still has products', error);
    }
    console.error('Failed to delete category:', error);
    throw new Error('Failed to delete category.', { cause: error });
  }
}

export async function listTags(): Promise<TagResponse[]> {
  try {
    const rows = await db.query.tags.findMany({
      orderBy: [asc(tags.id)],
      with: {
        productTags: {
          with: {
            product: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      products: row.productTags
        .map((pt) => ({
          id: pt.product.id,
          name: pt.product.name,
          price: pt.product.price,
        }))
        .sort((a, b) => a.id - b.id),
    }));
  } catch (error) {
    console.error('Failed to list tags:', error);
    throw new Error('Failed to load tags.', { cause: error });
  }
}

export async function getTagById(tagId: number): Promise<TagResponse | null> {
  try {
    const row = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
      with: {
        productTags: {
          with: {
            product: true,
          },
        },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      products: row.productTags
        .map((pt) => ({
          id: pt.product.id,
          name: pt.product.name,
          price: pt.product.price,
        }))
        .sort((a, b) => a.id - b.id),
    };
  } catch (error) {
    console.error('Failed to fetch tag:', error);
    throw new Error('Failed to fetch tag.', { cause: error });
  }
}

export async function createTag(name: string): Promise<TagResponse> {
  try {
    const [inserted] = await db.insert(tags).values({ name }).returning();
    return {
      id: inserted.id,
      name: inserted.name,
      products: [],
    };
  } catch (error) {
    if (getPgErrorCode(error) === '23505') {
      throw new ConflictError('Tag name already exists', error);
    }
    console.error('Failed to create tag:', error);
    throw new Error('Failed to create tag.', { cause: error });
  }
}

export async function deleteTag(tagId: number): Promise<void> {
  try {
    const deleted = await db
      .delete(tags)
      .where(eq(tags.id, tagId))
      .returning({ id: tags.id });

    if (deleted.length === 0) {
      throw new NotFoundError('Tag not found');
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Failed to delete tag:', error);
    throw new Error('Failed to delete tag.', { cause: error });
  }
}
