import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { CategoryResponse, TagResponse } from '../types/inventory.ts';
import { validateCategoryName, validateTagName } from '../lib/validation.ts';

interface CategoriesTagsViewProps {
  categories: CategoryResponse[];
  tags: TagResponse[];
  isAuthenticated: boolean;
  onSignIn: () => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: number, name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
  onCreateTag: (name: string) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
}

export function CategoriesTagsView({
  categories,
  tags,
  isAuthenticated,
  onSignIn,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateTag,
  onDeleteTag,
}: CategoriesTagsViewProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [creatingTag, setCreatingTag] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!isAuthenticated) {
      setCategoryError('Sign in to create categories.');
      return;
    }
    const validated = validateCategoryName(newCategoryName);
    if (!validated.ok) {
      setCategoryError(validated.error);
      return;
    }
    setCreatingCategory(true);
    try {
      await onCreateCategory(validated.data);
      setNewCategoryName('');
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSaveCategory = async (categoryId: number) => {
    setCategoryError(null);
    if (!isAuthenticated) {
      setCategoryError('Sign in to rename categories.');
      return;
    }
    const validated = validateCategoryName(editingCategoryName);
    if (!validated.ok) {
      setCategoryError(validated.error);
      return;
    }
    try {
      await onUpdateCategory(categoryId, validated.data);
      setEditingCategoryId(null);
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to rename category.');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setCategoryError(null);
    if (!isAuthenticated) {
      setCategoryError('Sign in to delete categories.');
      return;
    }
    try {
      await onDeleteCategory(categoryId);
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to delete category.');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagError(null);
    if (!isAuthenticated) {
      setTagError('Sign in to create tags.');
      return;
    }
    const validated = validateTagName(newTagName);
    if (!validated.ok) {
      setTagError(validated.error);
      return;
    }
    setCreatingTag(true);
    try {
      await onCreateTag(validated.data);
      setNewTagName('');
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to create tag.');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    setTagError(null);
    if (!isAuthenticated) {
      setTagError('Sign in to delete tags.');
      return;
    }
    try {
      await onDeleteTag(tagId);
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to delete tag.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            Categories &amp; Tags
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Categories enforce one-to-many foreign keys (non-empty categories return HTTP 409 on delete); tags link via a many-to-many join table.
          </p>
        </div>

        {!isAuthenticated && (
          <button
            type="button"
            onClick={onSignIn}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Sign in to edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Categories Panel */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Categories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unique names · Restricted delete when products exist
              </p>
            </div>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {categories.length} total
            </span>
          </div>

          <div className="p-5 space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <label htmlFor="new-category-input" className="sr-only">
                New category name
              </label>
              <input
                id="new-category-input"
                type="text"
                maxLength={30}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={creatingCategory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {categoryError && (
              <div
                role="alert"
                className="rounded-lg border border-red-300/70 dark:border-red-500/30 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-red-800 dark:text-red-300"
              >
                {categoryError}
              </div>
            )}

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
              {categories.length === 0 ? (
                <p className="py-6 text-sm text-center text-slate-500 dark:text-slate-400">
                  No categories yet.
                </p>
              ) : (
                categories.map((cat) => {
                  const isEditing = editingCategoryId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <label htmlFor={`edit-cat-${cat.id}`} className="sr-only">
                            Rename category {cat.name}
                          </label>
                          <input
                            id={`edit-cat-${cat.id}`}
                            type="text"
                            maxLength={30}
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCategory(cat.id)}
                            aria-label={`Save name for '${cat.name}'`}
                            className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(null)}
                            aria-label="Cancel rename"
                            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {cat.name}
                            </div>
                            <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              ID {cat.id} · {cat.products.length}{' '}
                              {cat.products.length === 1 ? 'product' : 'products'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryId(cat.id);
                                setEditingCategoryName(cat.name);
                                setCategoryError(null);
                              }}
                              aria-label={`Rename category '${cat.name}'`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              aria-label={`Delete category '${cat.name}'`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Tags Panel */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Tags
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unique labels · Attached to products via composite primary key
              </p>
            </div>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {tags.length} total
            </span>
          </div>

          <div className="p-5 space-y-4">
            <form onSubmit={handleAddTag} className="flex gap-2">
              <label htmlFor="new-tag-input" className="sr-only">
                New tag name
              </label>
              <input
                id="new-tag-input"
                type="text"
                maxLength={50}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name (e.g. flagship)..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={creatingTag}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {tagError && (
              <div
                role="alert"
                className="rounded-lg border border-red-300/70 dark:border-red-500/30 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-red-800 dark:text-red-300"
              >
                {tagError}
              </div>
            )}

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
              {tags.length === 0 ? (
                <p className="py-6 text-sm text-center text-slate-500 dark:text-slate-400">
                  No tags yet.
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-slate-900 dark:text-slate-100 truncate">
                        {tag.name}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        ID {tag.id} · {tag.products.length}{' '}
                        {tag.products.length === 1 ? 'product' : 'products'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id)}
                      aria-label={`Delete tag '${tag.name}'`}
                      className="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
