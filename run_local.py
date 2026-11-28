"""One-command local launcher for SheIfMent (FastAPI backend + React UI).

Usage (inside your activated Python virtual environment):
    python run_local.py
"""

from pathlib import Path
import os
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def main() -> int:
    env_file = ROOT / ".env"
    if not env_file.exists():
        print("Missing .env file in project root.")
        print("Create .env with DATABASE_URL (your Neon or local Postgres URL) and JWT_SECRET_KEY, then re-run.")
        return 1

    npm_cmd = shutil.which("npm.cmd") or shutil.which("npm")
    if not npm_cmd:
        print("Node.js / npm was not found in PATH. Install Node.js 22+ to run the frontend UI.")
        return 1

    print("1/2 Applying Alembic database migrations...")
    migrate = subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=ROOT)
    if migrate.returncode != 0:
        print("Alembic migration failed. Check DATABASE_URL in .env.")
        return migrate.returncode

    ui_env = os.environ.copy()
    ui_env.setdefault("VITE_API_BASE_URL", "http://127.0.0.1:8000")

    print("2/2 Starting FastAPI (http://127.0.0.1:8000) and Frontend UI (http://localhost:3000)...")
    backend = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
        cwd=ROOT,
    )
    frontend = subprocess.Popen([npm_cmd, "run", "ui"], cwd=ROOT, env=ui_env)

    try:
        backend.wait()
    except KeyboardInterrupt:
        print("\nStopping SheIfMent...")
    finally:
        for proc in (frontend, backend):
            if proc.poll() is None:
                proc.terminate()
        for proc in (frontend, backend):
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
