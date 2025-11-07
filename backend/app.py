from __future__ import annotations

import io
from typing import List

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.schemas import AnalyzeRequest, AnalyzeResponse
from backend.services.analyzer import AddressAnalyzer


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title="Web3 Scam Radar API",
        description=(
            "REST API phục vụ cho ứng dụng Web3 Scam Radar. "
            "API nhận các giao dịch NFT/Token và trả về điểm rủi ro phishing."
        ),
        version="0.1.0",
    )

    # Allow local frontends during development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    analyzer = AddressAnalyzer()

    @app.get("/api/health")
    async def health_check() -> dict[str, str]:
        """Lightweight endpoint to verify that the API is alive."""

        return {"status": "ok"}

    @app.post("/api/analyze/address", response_model=AnalyzeResponse)
    async def analyze_address(payload: AnalyzeRequest) -> AnalyzeResponse:
        """Analyze an address based on the in-request transactions."""

        try:
            result = analyzer.analyze_payload(payload)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return result

    @app.post("/api/analyze/upload", response_model=AnalyzeResponse)
    async def analyze_uploaded_csv(
        address: str = Form(...),
        file: UploadFile = File(...),
    ) -> AnalyzeResponse:
        """Analyze an address using a CSV file uploaded by the user."""

        if not file.filename or not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Vui lòng tải lên tệp CSV hợp lệ.")

        try:
            raw_bytes = await file.read()
            df = pd.read_csv(io.BytesIO(raw_bytes))
        except Exception as exc:  # pragma: no cover - pandas errors raised directly
            raise HTTPException(
                status_code=400,
                detail="Không thể đọc tệp CSV. Kiểm tra lại định dạng dữ liệu.",
            ) from exc

        try:
            result = analyzer.analyze_from_dataframe(address=address, df=df)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        return result

    return app


app = create_app()


__all__: List[str] = ["app", "create_app"]

