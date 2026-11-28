import { useState } from 'react';
import { Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface EndpointSpec {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  testPath: string;
  access: 'Public' | 'Bearer Token';
  purpose: string;
  sampleBody?: Record<string, unknown>;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

const ENDPOINTS: EndpointSpec[] = [
  {
    id: 'health',
    method: 'GET',
    path: `${API_BASE}/health`,
    testPath: `${API_BASE}/health`,
    access: 'Public',
    purpose: 'Service health check',
  },
  {
    id: 'auth-me',
    method: 'GET',
    path: `${API_BASE}/auth/me`,
    testPath: `${API_BASE}/auth/me`,
    access: 'Bearer Token',
    purpose: 'Inspect the authenticated user profile',
  },
  {
    id: 'products-list',
    method: 'GET',
    path: `${API_BASE}/products?skip=0&limit=5`,
    testPath: `${API_BASE}/products?skip=0&limit=5`,
    access: 'Public',
    purpose: 'List products with pagination, category_id, max_price, and search filters',
  },
  {
    id: 'products-one',
    method: 'GET',
    path: `${API_BASE}/products/{id}`,
    testPath: `${API_BASE}/products/1`,
    access: 'Public',
    purpose: 'Retrieve a single product with joined category and tags',
  },
  {
    id: 'products-create',
    method: 'POST',
    path: `${API_BASE}/products`,
    testPath: `${API_BASE}/products`,
    access: 'Bearer Token',
    purpose: 'Create a validated product (returns 401 when signed out)',
    sampleBody: {
      name: 'Demo Desk Mat',
      description: 'Stitched wool desk pad for workspace organization',
      price: 45,
      quantity: 12,
      category_id: 2,
    },
  },
  {
    id: 'products-tag',
    method: 'POST',
    path: `${API_BASE}/products/{id}/tags/{tag_id}`,
    testPath: `${API_BASE}/products/1/tags/1`,
    access: 'Bearer Token',
    purpose: 'Attach a tag to a product (idempotent composite key insert)',
  },
  {
    id: 'categories-list',
    method: 'GET',
    path: `${API_BASE}/categories`,
    testPath: `${API_BASE}/categories`,
    access: 'Public',
    purpose: 'List categories with their associated products',
  },
  {
    id: 'tags-list',
    method: 'GET',
    path: `${API_BASE}/tags`,
    testPath: `${API_BASE}/tags`,
    access: 'Public',
    purpose: 'List all tags with linked products',
  },
];

const SCHEMA_TABLES = [
  {
    table: 'products',
    columns: 'id (PK), name, description, price, quantity, category_id (FK -> categories.id)',
    rule: 'ON DELETE RESTRICT on category_id prevents orphaned products',
  },
  {
    table: 'categories',
    columns: 'id (PK), name (UNIQUE)',
    rule: 'Duplicate names return HTTP 409; deleting used category returns HTTP 409',
  },
  {
    table: 'tags',
    columns: 'id (PK), name (UNIQUE)',
    rule: 'Reusable labels shared across products',
  },
  {
    table: 'product_tags',
    columns: 'product_id (FK -> products.id), tag_id (FK -> tags.id)',
    rule: 'Composite primary key (product_id, tag_id) with cascading deletes',
  },
  {
    table: 'users',
    columns: 'id (PK), uid (UNIQUE), username, email (UNIQUE), is_active, created_at',
    rule: 'Synced on authenticated requests via idempotent upsert',
  },
];

const METHOD_COLORS: Record<EndpointSpec['method'], string> = {
  GET: 'text-emerald-700 dark:text-emerald-400',
  POST: 'text-blue-700 dark:text-blue-400',
  PUT: 'text-amber-700 dark:text-amber-400',
  DELETE: 'text-red-700 dark:text-red-400',
};

interface TestResult {
  endpointId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  body: string;
}

export function OverviewApiView() {
  const { getToken } = useAuth();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  const runEndpointTest = async (endpoint: EndpointSpec) => {
    setTestingId(endpoint.id);
    const started = performance.now();
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (endpoint.sampleBody) {
        headers['Content-Type'] = 'application/json';
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(endpoint.testPath, {
        method: endpoint.method,
        headers,
        body: endpoint.sampleBody ? JSON.stringify(endpoint.sampleBody) : undefined,
      });

      const durationMs = Math.round(performance.now() - started);
      let formattedBody = '';
      if (res.status === 204) {
        formattedBody = '(204 No Content)';
      } else {
        const text = await res.text();
        try {
          formattedBody = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          formattedBody = text || '(Empty response)';
        }
      }

      setResult({
        endpointId: endpoint.id,
        method: endpoint.method,
        path: endpoint.testPath,
        status: res.status,
        durationMs,
        body: formattedBody,
      });
    } catch (err) {
      setResult({
        endpointId: endpoint.id,
        method: endpoint.method,
        path: endpoint.testPath,
        status: 0,
        durationMs: Math.round(performance.now() - started),
        body: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Project Brief */}
      <section className="space-y-4">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            SheIfMent — Backend Architecture &amp; Live API
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            SheIfMent is an inventory management REST API backed by a live relational PostgreSQL database. Originally designed with FastAPI, SQLAlchemy, and Alembic, this online showcase runs the same relational model, validation rules, filtering, pagination, and protected write authentication live in the browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Relational Modeling
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              One-to-many category ownership plus many-to-many product tagging with composite keys.
            </p>
          </div>
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Strict Validation
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Enforces length bounds, positive prices, non-negative stock, and consistent 404/409/422 errors.
            </p>
          </div>
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Query &amp; Pagination
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Server-side filtering by category, max price, and search combined with skip/limit pagination.
            </p>
          </div>
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Protected Writes
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Public read access for browsing; all create, update, and delete routes require a verified Bearer token.
            </p>
          </div>
        </div>
      </section>

      {/* Relational Schema Overview */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Relational Schema
        </h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 w-36">Table</th>
                  <th className="py-3 px-4">Columns &amp; Keys</th>
                  <th className="py-3 px-4">Constraint Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                {SCHEMA_TABLES.map((row) => (
                  <tr key={row.table}>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {row.table}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {row.columns}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {row.rule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Interactive Live Endpoints */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Live Endpoint Explorer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Run any endpoint directly against the live server. Testing a protected route while signed out returns a real HTTP 401 response.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {ENDPOINTS.map((ep) => {
                const isSelected = result?.endpointId === ep.id;
                return (
                  <div
                    key={ep.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-xs transition-colors ${
                      isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`font-semibold w-12 shrink-0 ${METHOD_COLORS[ep.method]}`}>
                          {ep.method}
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 truncate">
                          {ep.path}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>{ep.access}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{ep.purpose}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={testingId === ep.id}
                      onClick={() => runEndpointTest(ep)}
                      aria-label={`Test ${ep.method} ${ep.path}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      <span>{testingId === ep.id ? 'Running...' : 'Test'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Response Inspector */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                Response Output
              </span>
              {result && (
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    HTTP{' '}
                    <span
                      className={
                        result.status >= 200 && result.status < 300
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-amber-600 dark:text-amber-400 font-semibold'
                      }
                    >
                      {result.status}
                    </span>{' '}
                    · {result.durationMs}ms
                  </span>
                </div>
              )}
            </div>

            {result ? (
              <div className="p-4 space-y-2">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                  {result.method} {result.path}
                </div>
                <pre className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words max-h-[380px] overflow-y-auto leading-relaxed">
                  {result.body}
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Click <span className="font-medium text-slate-700 dark:text-slate-200">Test</span>{' '}
                on any endpoint to inspect the live HTTP status and JSON payload.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
