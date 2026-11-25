import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ActiveTab, Header } from './components/Header.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { CategoriesTagsView } from './components/CategoriesTagsView.tsx';
import { OverviewApiView } from './components/OverviewApiView.tsx';
import { ProductModal } from './components/ProductModal.tsx';
import { ProductTagsModal } from './components/ProductTagsModal.tsx';
import { api } from './lib/api.ts';
import type {
  CategoryResponse,
  ProductPayload,
  ProductResponse,
  TagResponse,
} from './types/inventory.ts';

function SheIfMentShell() {
  const { user, authError, signIn, getToken, clearAuthError } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  // Data state
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter & pagination state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [taggingProductId, setTaggingProductId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setSkip(0);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchTaxonomy = useCallback(async () => {
    try {
      const [cats, allTags] = await Promise.all([api.getCategories(), api.getTags()]);
      setCategories(cats);
      setTags(allTags);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load categories and tags.');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const parsedCategory = selectedCategoryId ? Number(selectedCategoryId) : undefined;
      const parsedMaxPrice =
        maxPrice.trim() !== '' && Number(maxPrice) > 0 ? Number(maxPrice) : undefined;

      const data = await api.getProducts({
        skip,
        limit,
        category_id: parsedCategory,
        max_price: parsedMaxPrice,
        search: debouncedSearch.trim() || undefined,
      });
      setProducts(data.items);
      setTotalProducts(data.total);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [skip, limit, selectedCategoryId, maxPrice, debouncedSearch]);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchTaxonomy()]);
  }, [fetchProducts, fetchTaxonomy]);

  const handleSaveProduct = async (payload: ProductPayload, productId?: number) => {
    const token = await getToken();
    if (productModalMode === 'edit' && productId !== undefined) {
      await api.updateProduct(productId, payload, token);
    } else {
      await api.createProduct(payload, token);
    }
    await refreshAll();
  };

  const handleDeleteProduct = async (product: ProductResponse) => {
    const token = await getToken();
    await api.deleteProduct(product.id, token);
    if (products.length === 1 && skip > 0) {
      setSkip(Math.max(0, skip - limit));
    } else {
      await refreshAll();
    }
  };

  const handleAttachTag = async (productId: number, tagId: number) => {
    const token = await getToken();
    await api.attachTag(productId, tagId, token);
    await refreshAll();
  };

  const handleDetachTag = async (productId: number, tagId: number) => {
    const token = await getToken();
    await api.detachTag(productId, tagId, token);
    await refreshAll();
  };

  const handleCreateCategory = async (name: string) => {
    const token = await getToken();
    await api.createCategory(name, token);
    await fetchTaxonomy();
  };

  const handleUpdateCategory = async (id: number, name: string) => {
    const token = await getToken();
    await api.updateCategory(id, name, token);
    await refreshAll();
  };

  const handleDeleteCategory = async (id: number) => {
    const token = await getToken();
    await api.deleteCategory(id, token);
    if (selectedCategoryId === String(id)) {
      setSelectedCategoryId('');
    }
    await refreshAll();
  };

  const handleCreateTag = async (name: string) => {
    const token = await getToken();
    await api.createTag(name, token);
    await fetchTaxonomy();
  };

  const handleDeleteTag = async (id: number) => {
    const token = await getToken();
    await api.deleteTag(id, token);
    await refreshAll();
  };

  const taggingProduct =
    taggingProductId !== null ? products.find((p) => p.id === taggingProductId) ?? null : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {authError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4"
          >
            <span>{authError}</span>
            <button
              type="button"
              onClick={clearAuthError}
              className="underline font-medium shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            total={totalProducts}
            skip={skip}
            limit={limit}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            maxPrice={maxPrice}
            search={search}
            loading={loading}
            error={loadError}
            isAuthenticated={Boolean(user)}
            onSearchChange={setSearch}
            onCategoryChange={(val) => {
              setSelectedCategoryId(val);
              setSkip(0);
            }}
            onMaxPriceChange={(val) => {
              setMaxPrice(val);
              setSkip(0);
            }}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setSkip(0);
            }}
            onPageChange={setSkip}
            onResetFilters={() => {
              setSearch('');
              setDebouncedSearch('');
              setSelectedCategoryId('');
              setMaxPrice('');
              setSkip(0);
            }}
            onOpenCreate={() => {
              setProductModalMode('create');
              setEditingProduct(null);
              setProductModalOpen(true);
            }}
            onOpenEdit={(product) => {
              setProductModalMode('edit');
              setEditingProduct(product);
              setProductModalOpen(true);
            }}
            onOpenTags={(product) => setTaggingProductId(product.id)}
            onDeleteProduct={handleDeleteProduct}
            onSignIn={signIn}
          />
        )}

        {activeTab === 'taxonomy' && (
          <CategoriesTagsView
            categories={categories}
            tags={tags}
            isAuthenticated={Boolean(user)}
            onSignIn={signIn}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onCreateTag={handleCreateTag}
            onDeleteTag={handleDeleteTag}
          />
        )}

        {activeTab === 'api' && <OverviewApiView />}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>SheIfMent · Inventory Management API Showcase</span>
          <span>PostgreSQL · Drizzle ORM · REST API</span>
        </div>
      </footer>

      <ProductModal
        isOpen={productModalOpen}
        mode={productModalMode}
        initialProduct={editingProduct}
        categories={categories}
        isAuthenticated={Boolean(user)}
        onSignIn={signIn}
        onClose={() => setProductModalOpen(false)}
        onSubmit={handleSaveProduct}
      />

      <ProductTagsModal
        product={taggingProduct}
        allTags={tags}
        isAuthenticated={Boolean(user)}
        onSignIn={signIn}
        onClose={() => setTaggingProductId(null)}
        onAttachTag={handleAttachTag}
        onDetachTag={handleDetachTag}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SheIfMentShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
