from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import create_tables, engine
from app.routers import auth, farms, machines, fields, finances, storage, animals, biogas, todos, invoices, support, admin, crop_plans

app = FastAPI(
    title="LS Management API",
    description="Landwirtschaftliche Verwaltung für LS22/25",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_config_from_db():
    from app.database import SessionLocal
    from app.models.system_config import SystemConfig
    from app.core.config import settings
    db = SessionLocal()
    try:
        for key in ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from", "operator_email"]:
            row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
            if row and row.value:
                attr = key.upper()
                setattr(settings, attr, int(row.value) if attr == "SMTP_PORT" else row.value)
    except Exception as e:
        print(f"[CONFIG] DB load skipped: {e}")
    finally:
        db.close()


def _migrate_columns():
    """Add new columns to existing tables without dropping data."""
    migrations = [
        ("machines", "license_plate",     "VARCHAR(20)"),
        ("machines", "purchase_date",     "DATETIME"),
        ("machines", "lent_to_farm_id",   "INTEGER"),
        ("machines", "is_sold",           "BOOLEAN DEFAULT 0"),
        ("machines", "sale_price",        "FLOAT DEFAULT 0"),
        ("machines", "sold_at",           "DATETIME"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in migrations:
            try:
                rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                existing = [r[1] for r in rows]
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                    conn.commit()
                    print(f"[MIGRATE] Added {table}.{col}")
            except Exception as e:
                print(f"[MIGRATE] Skipped {table}.{col}: {e}")


@app.on_event("startup")
def startup():
    create_tables()
    _migrate_columns()
    _load_config_from_db()


app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(machines.router)
app.include_router(fields.router)
app.include_router(finances.router)
app.include_router(storage.router)
app.include_router(animals.router)
app.include_router(biogas.router)
app.include_router(todos.router)
app.include_router(invoices.router)
app.include_router(support.router)
app.include_router(admin.router)
app.include_router(crop_plans.router)


@app.get("/")
def root():
    return {"message": "LS Management API v1.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
