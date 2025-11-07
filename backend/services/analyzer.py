from __future__ import annotations

from typing import Dict, Iterable, List, Tuple

import pandas as pd

from backend.core.features import AddressFeatureResult, FeatureExtractor
from backend.core.model import RiskModel
from backend.schemas import (
    AddressVerdict,
    AnalyzeRequest,
    AnalyzeResponse,
    FeatureContribution,
    TransactionPayload,
)


class AddressAnalyzer:
    """Orchestrates feature extraction and risk scoring."""

    def __init__(self) -> None:
        self.extractor = FeatureExtractor()
        self.model = RiskModel()

    def analyze_payload(self, payload: AnalyzeRequest) -> AnalyzeResponse:
        df = self._payload_to_dataframe(payload.transactions)
        return self.analyze_from_dataframe(address=payload.address, df=df)

    def analyze_from_dataframe(self, address: str, df: pd.DataFrame) -> AnalyzeResponse:
        feature_result = self.extractor.compute_address_features(address, df)
        probability, contributions = self.model.predict(feature_result.features)

        label = "phishing" if probability >= 0.5 else "benign"
        if probability >= 0.75:
            risk_level = "high"
        elif probability >= 0.5:
            risk_level = "medium"
        else:
            risk_level = "low"

        summary = self._build_summary(label, risk_level, probability)

        feature_contributions = [
            FeatureContribution(
                feature=name,
                contribution=float(value),
                description=self._describe_feature(name),
            )
            for name, value in contributions[:5]
        ]

        verdict = AddressVerdict(
            address=feature_result.address,
            label=label,
            score=float(probability),
            risk_level=risk_level,
            summary=summary,
            key_signals=feature_contributions,
            feature_snapshot={k: float(v) for k, v in feature_result.features.items()},
        )

        return AnalyzeResponse(verdict=verdict)

    @staticmethod
    def _payload_to_dataframe(transactions: Iterable[TransactionPayload]) -> pd.DataFrame:
        if not transactions:
            raise ValueError("Danh sách giao dịch trống.")

        records: List[Dict[str, object]] = []
        for item in transactions:
            data = item.dict(by_alias=True)
            # Ensure columns match expected dataframe names
            mapped = {
                "timestamp": data.get("timestamp"),
                "transaction_hash": data.get("transactionHash"),
                "from_address": data.get("from"),
                "to_address": data.get("to"),
                "value": data.get("value"),
                "gas_used": data.get("gasUsed"),
                "gas_price": data.get("gasPrice"),
                "token_value": data.get("tokenValue"),
                "token_decimal": data.get("tokenDecimal"),
                "contract_address": data.get("contractAddress"),
                "function_call": data.get("functionCall"),
                "tx_type": data.get("txType"),
                "nft_floor_price": data.get("nftFloorPrice"),
                "nft_average_price": data.get("nftAveragePrice"),
                "nft_total_volume": data.get("nftTotalVolume"),
                "nft_total_sales": data.get("nftTotalSales"),
                "nft_num_owners": data.get("nftNumOwners"),
                "nft_market_cap": data.get("nftMarketCap"),
                "nft_7day_volume": data.get("nft7DayVolume"),
                "nft_7day_sales": data.get("nft7DaySales"),
                "nft_7day_avg_price": data.get("nft7DayAvgPrice"),
            }
            records.append(mapped)

        return pd.DataFrame.from_records(records)

    @staticmethod
    def _build_summary(label: str, risk_level: str, probability: float) -> str:
        pct = round(probability * 100, 2)
        if label == "phishing":
            if risk_level == "high":
                return (
                    f"Ví có rủi ro phishing rất cao (điểm {pct}%). Đề xuất khóa tương tác "
                    "và liên hệ đội an ninh để điều tra sâu hơn."
                )
            return (
                f"Ví có dấu hiệu phishing (điểm {pct}%). Nên gắn cờ cảnh báo, kiểm tra thủ công "
                "và giới hạn quyền truy cập."
            )

        return (
            f"Ví được đánh giá an toàn (điểm {pct}%). Tiếp tục giám sát giao dịch định kỳ "
            "để phát hiện bất thường kịp thời."
        )

    @staticmethod
    def _describe_feature(name: str) -> str:
        mapping = {
            "suspicious_density": "Tỉ lệ function đáng ngờ trên tổng số giao dịch",
            "approval_density": "Số giao dịch approve/permit bất thường",
            "gift_ratio": "Tần suất nhận/gửi NFT miễn phí",
            "nft_dump_ratio": "Mức độ xả NFT so với lượng nhận",
            "txn_velocity": "Tốc độ giao dịch trong khoảng thời gian hoạt động",
            "turnover_ratio": "Tỉ lệ giá trị chuyển ra so với nhận vào",
            "zero_value_ratio": "Tỉ lệ giao dịch 0 ETH nhưng có token đi kèm",
            "mint_intensity": "Số lần mint trực tiếp từ contract",
            "neighbor_spread": "Độ đa dạng địa chỉ đối tác giao dịch",
            "value_delta": "Chênh lệch giá floor trước và sau giao dịch",
            "transfer_density": "Tỉ lệ function transfer",
        }
        return mapping.get(name, name)


