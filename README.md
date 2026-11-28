# SheIfMent

A REST API for inventory management built with **FastAPI**, **SQLAlchemy**, **Alembic**, and **PostgreSQL** (compatible with **Neon**), paired with a clean **React + Tailwind CSS** web interface for interactive showcase and interview walkthroughs.

## Backend Features (FastAPI)

- User registration and login with Argon2 password hashing (`app/auth.py`, `app/routers/auth.py`)
- JWT bearer-token authentication for protected write operations (`app/dependencies.py`)
- Product create, read, update, and delete endpoints (`app/routers/products.py`)
- Category and tag management, including many-to-many product tagging (`app/routers/categories.py`, `app/routers/tags.py`)
- Product filtering by category and maximum price, plus pagination with `skip` and `limit`
- Pydantic request validation and consistent HTTP error responses (`404`, `409`, `422`)
- Database schema migrations with Alembic (`alembic/`)
- Automated API tests using FastAPI's `TestClient` (`tests/`)

## Running the FastAPI Backend (Local or Neon Postgres)

1. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. Install Python dependencies:

   ```bash
   python -m pip install -r requirements.txt
   ```

3. Create a `.env` file with your PostgreSQL or **Neon** connection string and JWT settings:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@YOUR-NEON-HOST.neon.tech/neondb?sslmode=require
   JWT_SECRET_KEY=replace-with-a-long-random-secret
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

   `app/database.py` and `alembic/env.py` automatically normalize standard `postgresql://` / `postgres://` Neon URLs to `postgresql+psycopg://` for `psycopg` v3.

4. Apply Alembic migrations:

   ```bash
   alembic upgrade head
   ```

5. Start the FastAPI server:

   ```bash
   uvicorn app.main:app --reload
   ```

   - Swagger UI: `http://127.0.0.1:8000/docs`
   - ReDoc: `http://127.0.0.1:8000/redoc`
   - Health check: `http://127.0.0.1:8000/health`

6. Run backend tests:

   ```bash
   python -m pytest -v
   ```

## Running the Frontend UI

```bash
npm install
npm run dev
```

- By default in AI Studio (a Node.js-only container without `pip3`), `server.ts` serves the React UI together with a PostgreSQL-backed preview mirror of the SheIfMent API so the live online demo works in the browser.
- To connect the React frontend directly to your FastAPI server, set `VITE_API_BASE_URL=http://127.0.0.1:8000` (or your hosted FastAPI URL).
