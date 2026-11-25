import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { ProductResponse, TagResponse } from '../types/inventory.ts';

interface ProductTagsModalProps {
  product: ProductResponse | null;
  allTags: TagResponse[];
  isAuthenticated: boolean;
  onSignIn: () => Promise<void>;
  onClose: () => void;
  onAttachTag: (productId: number, tagId: number) => Promise<void>;
  onDetachTag: (productId: number, tagId: number) => Promise<void>;
}

export function ProductTagsModal({
  product,
  allTags,
  isAuthenticated,
  onSignIn,
  onClose,
  onAttachTag,
  onDetachTag,
}: ProductTagsModalProps) {
  const [busyTagId, setBusyTagId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const attachedIds = new Set(product.tags.map((t) => t.id));

  const handleToggle = async (tagId: number) => {
    if (!isAuthenticated) {
      setError('Sign in to modify product tags.');
      return;
    }
    setError(null);
    setBusyTagId(tagId);
    try {
      if (attachedIds.has(tagId)) {
        await onDetachTag(product.id, tagId);
      } else {
        await onAttachTag(product.id, tagId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag assignment.');
    } finally {
      setBusyTagId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tags-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="tags-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Tags for {product.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Many-to-many join via <code className="font-mono">product_tags</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tags dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!isAuthenticated && (
            <div className="rounded-lg border border-amber-300/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
              <span>Sign in to attach or remove tags.</span>
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

          {allTags.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tags created yet. Add tags in the Categories &amp; Tags tab first.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              {allTags.map((tag) => {
                const isAttached = attachedIds.has(tag.id);
                const isBusy = busyTagId === tag.id;
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between px-3.5 py-2.5 text-sm"
                  >
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                      {tag.name}
                    </span>
                    <button
                      type="button"
                      disabled={isBusy || !isAuthenticated}
                      onClick={() => handleToggle(tag.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 ${
                        isAttached
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isAttached ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Attached</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Attach</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
