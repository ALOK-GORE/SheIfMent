import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CategoryResponse, ProductPayload, ProductResponse } from '../types/inventory.ts';
import { validateProductPayload } from '../lib/validation.ts';

interface ProductModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialProduct: ProductResponse | null;
  categories: CategoryResponse[];
  isAuthenticated: boolean;
  onSignIn: () => Promise<void>;
  onClose: () => void;
  onSubmit: (payload: ProductPayload, productId?: number) => Promise<void>;
}

export function ProductModal({
  isOpen,
  mode,
  initialProduct,
  categories,
  isAuthenticated,
  onSignIn,
  onClose,
  onSubmit,
}: ProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (mode === 'edit' && initialProduct) {
      setName(initialProduct.name);
      setDescription(initialProduct.description);
      setPrice(String(initialProduct.price));
      setQuantity(String(initialProduct.quantity));
      setCategoryId(String(initialProduct.category_id));
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('0');
      setCategoryId(categories[0] ? String(categories[0].id) : '');
    }
  }, [isOpen, mode, initialProduct, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      setError('Sign in to create or edit inventory items.');
      return;
    }

    const validated = validateProductPayload({
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      category_id: Number(categoryId),
    });

    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(validated.data, initialProduct?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="product-modal-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {mode === 'create' ? 'New Product' : `Edit ${initialProduct?.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isAuthenticated && (
            <div className="rounded-lg border border-amber-300/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
              <span>Write endpoints require Bearer token authentication.</span>
              <button
                type="button"
                onClick={onSignIn}
                className="px-2.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium whitespace-nowrap shrink-0"
              >
                Sign in
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-300/70 dark:border-red-500/30 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-red-800 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="product-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Name <span className="text-slate-400 font-normal">(max 30 chars)</span>
            </label>
            <input
              id="product-name"
              type="text"
              maxLength={30}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Studio Condenser Mic"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="product-description"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Description <span className="text-slate-400 font-normal">(max 100 chars)</span>
            </label>
            <textarea
              id="product-description"
              maxLength={100}
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product summary"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="product-price"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Price (USD)
              </label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="149.00"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="product-quantity"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Quantity
              </label>
              <input
                id="product-quantity"
                type="number"
                step="1"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="product-category"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Category
            </label>
            <select
              id="product-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isAuthenticated}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
