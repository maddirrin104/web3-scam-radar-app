from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, validator


class TransactionPayload(BaseModel):
    """Schema đại diện một giao dịch on-chain."""

    timestamp: Optional[datetime] = None
    transaction_hash: Optional[str] = Field(None, alias="transactionHash")
    from_address: str = Field(..., alias="from")
    to_address: Optional[str] = Field(None, alias="to")
    value: Optional[float] = 0.0
    gas_used: Optional[float] = Field(0.0, alias="gasUsed")
    gas_price: Optional[float] = Field(0.0, alias="gasPrice")
    token_value: Optional[float] = Field(0.0, alias="tokenValue")
    token_decimal: Optional[float] = Field(0.0, alias="tokenDecimal")
    contract_address: Optional[str] = Field(None, alias="contractAddress")
    function_call: Optional[str] = Field(None, alias="functionCall")
    tx_type: Optional[str] = Field(None, alias="txType")
    nft_floor_price: Optional[float] = Field(0.0, alias="nftFloorPrice")
    nft_average_price: Optional[float] = Field(0.0, alias="nftAveragePrice")
    nft_total_volume: Optional[float] = Field(0.0, alias="nftTotalVolume")
    nft_total_sales: Optional[float] = Field(0.0, alias="nftTotalSales")
    nft_num_owners: Optional[float] = Field(0.0, alias="nftNumOwners")
    nft_market_cap: Optional[float] = Field(0.0, alias="nftMarketCap")
    nft_7day_volume: Optional[float] = Field(0.0, alias="nft7DayVolume")
    nft_7day_sales: Optional[float] = Field(0.0, alias="nft7DaySales")
    nft_7day_avg_price: Optional[float] = Field(0.0, alias="nft7DayAvgPrice")

    class Config:
        allow_population_by_field_name = True

    @validator("from_address", "to_address", "contract_address", pre=True, always=True)
    def normalize_address(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return str(value).lower()


class AnalyzeRequest(BaseModel):
    """Payload cho endpoint phân tích."""

    address: str = Field(..., description="Địa chỉ ví cần phân tích")
    transactions: List[TransactionPayload] = Field(
        ..., description="Danh sách giao dịch liên quan tới địa chỉ"
    )

    @validator("address", pre=True, always=True)
    def normalize_address(cls, value: str) -> str:
        return str(value).lower()


class FeatureContribution(BaseModel):
    feature: str
    contribution: float
    description: str


class AddressVerdict(BaseModel):
    address: str
    label: Literal["benign", "phishing"]
    score: float = Field(..., ge=0.0, le=1.0)
    risk_level: Literal["low", "medium", "high"]
    summary: str
    key_signals: List[FeatureContribution]
    feature_snapshot: Dict[str, float]


class AnalyzeResponse(BaseModel):
    """Kết quả trả về cuối cùng."""

    verdict: AddressVerdict


