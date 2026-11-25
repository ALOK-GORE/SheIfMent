import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';
import {
  attachTagToProduct,
  ConflictError,
  createCategory,
  createProduct,
  createTag,
  deleteCategory,
  deleteProduct,
  deleteTag,
  detachTagFromProduct,
  getCategoryById,
  getProductById,
  getTagById,
  listCategories,
  listProducts,
  listTags,
  NotFoundError,
  updateCategory,
  updateProduct,
} from './src/db/inventory.ts';
import {
  parsePositiveInt,
  parseProductQuery,
  validateCategoryName,
  validateProductPayload,
  validateTagName,
} from './src/lib/validation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

function handleRouteError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof NotFoundError) {
    return res.status(404).json({ detail: error.message });
  }
  if (error instanceof ConflictError) {
    return res.status(409).json({ detail: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ detail: fallbackMessage });
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'SheIfMent Inventory API' });
});

// Current authenticated user
app.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.dbUser) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  return res.json({
    id: req.dbUser.id,
    uid: req.dbUser.uid,
    username: req.dbUser.username,
    email: req.dbUser.email,
    is_active: req.dbUser.isActive,
  });
});

// Products
app.get('/api/products', async (req: Request, res: Response) => {
  const parsed = parseProductQuery(req.query as Record<string, unknown>);
  if (!parsed.ok) {
    return res.status(422).json({ detail: parsed.error });
  }
  try {
    const data = await listProducts(parsed.data);
    return res.json(data);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch products.');
  }
});

app.get('/api/products/:productId', async (req: Request, res: Response) => {
  const idRes = parsePositiveInt(req.params.productId, 'product_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  try {
    const product = await getProductById(idRes.data);
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch product.');
  }
});

app.post('/api/products', requireAuth, async (req: AuthRequest, res: Response) => {
  const validated = validateProductPayload(req.body);
  if (!validated.ok) {
    return res.status(422).json({ detail: validated.error });
  }
  try {
    const created = await createProduct(validated.data);
    return res.status(201).json(created);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to create product.');
  }
});

app.put('/api/products/:productId', requireAuth, async (req: AuthRequest, res: Response) => {
  const idRes = parsePositiveInt(req.params.productId, 'product_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  const validated = validateProductPayload(req.body);
  if (!validated.ok) {
    return res.status(422).json({ detail: validated.error });
  }
  try {
    const updated = await updateProduct(idRes.data, validated.data);
    return res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to update product.');
  }
});

app.delete('/api/products/:productId', requireAuth, async (req: AuthRequest, res: Response) => {
  const idRes = parsePositiveInt(req.params.productId, 'product_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  try {
    await deleteProduct(idRes.data);
    return res.status(204).send();
  } catch (error) {
    return handleRouteError(res, error, 'Failed to delete product.');
  }
});

app.post(
  '/api/products/:productId/tags/:tagId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const productIdRes = parsePositiveInt(req.params.productId, 'product_id');
    const tagIdRes = parsePositiveInt(req.params.tagId, 'tag_id');
    if (!productIdRes.ok) {
      return res.status(422).json({ detail: productIdRes.error });
    }
    if (!tagIdRes.ok) {
      return res.status(422).json({ detail: tagIdRes.error });
    }
    try {
      const updated = await attachTagToProduct(productIdRes.data, tagIdRes.data);
      return res.json(updated);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to attach tag to product.');
    }
  }
);

app.delete(
  '/api/products/:productId/tags/:tagId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const productIdRes = parsePositiveInt(req.params.productId, 'product_id');
    const tagIdRes = parsePositiveInt(req.params.tagId, 'tag_id');
    if (!productIdRes.ok) {
      return res.status(422).json({ detail: productIdRes.error });
    }
    if (!tagIdRes.ok) {
      return res.status(422).json({ detail: tagIdRes.error });
    }
    try {
      const updated = await detachTagFromProduct(productIdRes.data, tagIdRes.data);
      return res.json(updated);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to remove tag from product.');
    }
  }
);

// Categories
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const items = await listCategories();
    return res.json(items);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch categories.');
  }
});

app.get('/api/categories/:categoryId', async (req: Request, res: Response) => {
  const idRes = parsePositiveInt(req.params.categoryId, 'category_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  try {
    const category = await getCategoryById(idRes.data);
    if (!category) {
      return res.status(404).json({ detail: 'Category not found' });
    }
    return res.json(category);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch category.');
  }
});

app.post('/api/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  const validated = validateCategoryName(req.body);
  if (!validated.ok) {
    return res.status(422).json({ detail: validated.error });
  }
  try {
    const created = await createCategory(validated.data);
    return res.status(201).json(created);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to create category.');
  }
});

app.put('/api/categories/:categoryId', requireAuth, async (req: AuthRequest, res: Response) => {
  const idRes = parsePositiveInt(req.params.categoryId, 'category_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  const validated = validateCategoryName(req.body);
  if (!validated.ok) {
    return res.status(422).json({ detail: validated.error });
  }
  try {
    const updated = await updateCategory(idRes.data, validated.data);
    return res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to update category.');
  }
});

app.delete('/api/categories/:categoryId', requireAuth, async (req: AuthRequest, res: Response) => {
  const idRes = parsePositiveInt(req.params.categoryId, 'category_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  try {
    await deleteCategory(idRes.data);
    return res.status(204).send();
  } catch (error) {
    return handleRouteError(res, error, 'Failed to delete category.');
  }
});

// Tags
app.get('/api/tags', async (_req: Request, res: Response) => {
  try {
    const items = await listTags();
    return res.json(items);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch tags.');
  }
});

app.get('/api/tags/:tagId', async (req: Request, res: Response) => {
  const idRes = parsePositiveInt(req.params.tagId, 'tag_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  try {
    const tag = await getTagById(idRes.data);
    if (!tag) {
      return res.status(404).json({ detail: 'Tag not found' });
    }
    return res.json(tag);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch tag.');
  }
});

app.post('/api/tags', requireAuth, async (req: AuthRequest, res: Response) => {
  const validated = validateTagName(req.body);
  if (!validated.ok) {
    return res.status(422).json({ detail: validated.error });
  }
  try {
    const created = await createTag(validated.data);
    return res.status(201).json(created);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to create tag.');
  }
});

app.delete('/api/tags/:tagId', requireAuth, async (req: AuthRequest, res: Response) => {
  const idRes = parsePositiveInt(req.params.tagId, 'tag_id');
  if (!idRes.ok) {
    return res.status(422).json({ detail: idRes.error });
  }
  try {
    await deleteTag(idRes.data);
    return res.status(204).send();
  } catch (error) {
    return handleRouteError(res, error, 'Failed to delete tag.');
  }
});

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const NO_WS_VITE_CLIENT_SHIM = `
const sheetsMap = new Map();
if ('document' in globalThis) {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay extends HTMLElement {}
`;

async function startServer() {
  if (!isProduction) {
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(NO_WS_VITE_CLIENT_SHIM);
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SheIfMent server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
