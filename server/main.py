from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
from routers import maps

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(maps.router, prefix="/api/maps")

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "hello"}
