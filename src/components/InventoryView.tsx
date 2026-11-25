import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import type { CategoryResponse, ProductResponse } from '../types/inventory.ts';
import { computeInventoryMetrics, formatCurrency } from '../lib/validation.ts';

interface InventoryViewProps {
  products: ProductResponse[];
  total: number;
  skip: number;
  limit: number;
  categories: CategoryResponse[];
  selectedCategoryId: string;
  maxPrice: string;
  search: string;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onLimitChange: (limit: number) => void;
  onPageChange: (nextSkip: number) => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (product: ProductResponse) => void;
  onOpenTags: (product: ProductResponse) => void;
  onDeleteProduct: (product: ProductResponse) => Promise<void>;
  onSignIn: () => Promise<void>;
}

export function InventoryView({
  products,
  total,
  skip,
  limit,
  categories,
  selectedCategoryId,
  maxPrice,
  search,
  loading,
  error,
  isAuthenticated,
  onSearchChange,
  onCategoryChange,
  onMaxPriceChange,
  onLimitChange,
  onPageChange,
  onResetFilters,
  onOpenCreate,
  onOpenEdit,
  onOpenTags,
  onDeleteProduct,
  onSignIn,
}: InventoryViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const metrics = useMemo(() => computeInventoryMetrics(products), [products]);
  const hasFilters = Boolean(selectedCategoryId || maxPrice || search.trim());
  const showingStart = total === 0 ? 0 : skip + 1;
  const showingEnd = Math.min(skip + products.length, total);
  const hasPrev = skip > 0;
  const hasNext = skip + limit < total;

  const handleConfirmDelete = async (product: ProductResponse) => {
    setActionError(null);
    if (!isAuthenticated) {
      setActionError('Sign in to delete products.');
      setConfirmDeleteId(null);
      return;
    }
    setDeletingId(product.id);
    try {
      await onDeleteProduct(product);
      setConfirmDeleteId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Intro & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            Inventory Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Filter products by category or maximum price, paginate results, and manage tags.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B0F17]"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Flat Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-white dark:bg-[#111827]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Matching Products</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {total}
          </div>
        </div>
        <div className="px-5 py-4 bg-white dark:bg-[#111827]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Units on Page</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {metrics.totalUnits}
          </div>
        </div>
        <div className="px-5 py-4 bg-white dark:bg-[#111827]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Page Stock Value</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(metrics.totalValue)}
          </div>
        </div>
        <div className="px-5 py-4 bg-white dark:bg-[#111827]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Categories</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {categories.length}
          </div>
        </div>
      </div>

      {/* Filter & Pagination Toolbar */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
        <div className="col-span-2 sm:flex-1 sm:min-w-[200px]">
          <label
            htmlFor="filter-search"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
          >
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="filter-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name or description..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="col-span-2 sm:w-44">
          <label
            htmlFor="filter-category"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1 sm:w-36">
          <label
            htmlFor="filter-max-price"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
          >
            Max Price ($)
          </label>
          <input
            id="filter-max-price"
            type="number"
            min="1"
            step="1"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-1 sm:w-28">
          <label
            htmlFor="filter-limit"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
          >
            Page Size
          </label>
          <select
            id="filter-limit"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Feedback banners */}
      {(error || actionError) && (
        <div
          role="alert"
          className="rounded-xl border border-red-300/70 dark:border-red-500/30 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{error || actionError}</span>
          {!isAuthenticated && actionError && (
            <button
              type="button"
              onClick={onSignIn}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white whitespace-nowrap shrink-0"
            >
              Sign in
            </button>
          )}
        </div>
      )}

      {/* High-Density Inventory Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 w-14 font-mono">ID</th>
                <th className="py-3 px-4 min-w-[220px]">Product</th>
                <th className="py-3 px-4 w-32">Category</th>
                <th className="py-3 px-4 w-44">Tags</th>
                <th className="py-3 px-4 text-right w-28">Price</th>
                <th className="py-3 px-4 text-right w-24">Stock</th>
                <th className="py-3 px-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-7 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-800/70 mt-1.5" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-16 ml-auto rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-10 ml-auto rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-20 ml-auto rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      No matching products found
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {hasFilters
                        ? 'Try broadening your category, search, or max price filters.'
                        : 'Create your first inventory item to populate the catalog.'}
                    </p>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.quantity <= 5;
                  const isConfirming = confirmDeleteId === product.id;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {product.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {product.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {product.category.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {product.tags.length > 0
                          ? product.tags.map((t) => t.name).join(' · ')
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-sm tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isLowStock
                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {product.quantity}
                        </span>
                        {isLowStock && (
                          <span className="ml-1.5 text-[11px] font-sans text-amber-600 dark:text-amber-400">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={deletingId === product.id}
                              onClick={() => handleConfirmDelete(product)}
                              className="px-2 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-700 text-white"
                            >
                              {deletingId === product.id ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenTags(product)}
                              aria-label={`Manage tags for '${product.name}'`}
                              title="Manage tags"
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(product)}
                              aria-label={`Edit '${product.name}'`}
                              title="Edit product"
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(product.id)}
                              aria-label={`Delete '${product.name}'`}
                              title="Delete product"
                              className="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-600 dark:text-slate-400">
          <div className="font-mono tabular-nums">
            Showing {showingStart}–{showingEnd} of {total}
            <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
            skip={skip}, limit={limit}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrev || loading}
              onClick={() => onPageChange(Math.max(0, skip - limit))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => onPageChange(skip + limit)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
