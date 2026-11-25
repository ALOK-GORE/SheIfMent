# SheIfMent

An online inventory management REST API and interactive web showcase backed by **PostgreSQL** (Cloud SQL), **Drizzle ORM**, **Express**, **Firebase Authentication**, and **React**.

Originally designed in Python (FastAPI + SQLAlchemy + Alembic), this deployment runs the same relational inventory domain, validation constraints, filtering, pagination, and protected write endpoints online so reviewers and interviewers can explore the project directly in the browser.

## Features

- **Live Inventory Catalog**: Browse seeded products with search, category filter, max-price filter, and `skip`/`limit` pagination.
- **Relational Data Model**: One-to-many `categories -> products` (with `ON DELETE RESTRICT` returning `409 Conflict` when non-empty) and many-to-many `products <-> tags` via a composite-key `product_tags` join table.
- **Protected Write Authentication**: Public read endpoints for browsing; all create, update, delete, and tag-assignment routes verify Firebase ID Bearer tokens and synchronize users in PostgreSQL.
- **Interactive API Explorer**: Test live REST endpoints directly from the UI and inspect real HTTP status codes and JSON payloads.
- **Dark & Light Themes**: Dark theme by default with a persistent light/dark theme switch.

## Main Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Service health check |
| `GET` | `/api/auth/me` | Bearer token | Current authenticated user profile |
| `GET` | `/api/products` | Public | List products (`skip`, `limit`, `category_id`, `max_price`, `search`) |
| `GET` | `/api/products/:id` | Public | Retrieve one product with category and tags |
| `POST` | `/api/products` | Bearer token | Create a product |
| `PUT` | `/api/products/:id` | Bearer token | Update a product |
| `DELETE` | `/api/products/:id` | Bearer token | Delete a product |
| `POST` | `/api/products/:id/tags/:tagId` | Bearer token | Attach a tag to a product |
| `DELETE` | `/api/products/:id/tags/:tagId` | Bearer token | Detach a tag from a product |
| `GET` | `/api/categories` | Public | List categories with linked products |
| `POST` | `/api/categories` | Bearer token | Create a category |
| `PUT` | `/api/categories/:id` | Bearer token | Rename a category |
| `DELETE` | `/api/categories/:id` | Bearer token | Delete an unused category |
| `GET` | `/api/tags` | Public | List tags with linked products |
| `POST` | `/api/tags` | Bearer token | Create a tag |
| `DELETE` | `/api/tags/:id` | Bearer token | Delete a tag |

## Scripts

- `npm run dev` — Start the Express API + Vite dev server on port 3000
- `npm run build` — Build the production React bundle
- `npm run start` — Serve the built app and API in production mode
- `npm run lint` — Run TypeScript typecheck and ESLint
- `npm test` — Run unit tests for validation, pagination parsing, and inventory metrics
