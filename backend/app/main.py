from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.routers import auth, farms, machines, fields, finances, storage, animals, biogas, todos

app = FastAPI(
    title="LS Management API",
    description="Landwirtschaftliche Verwaltung für LS22/25",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    create_tables()


app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(machines.router)
app.include_router(fields.router)
app.include_router(finances.router)
app.include_router(storage.router)
app.include_router(animals.router)
app.include_router(biogas.router)
app.include_router(todos.router)


@app.get("/")
def root():
    return {"message": "LS Management API v1.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
