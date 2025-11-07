from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

import json
import pandas as pd


SUSPICIOUS_PATTERNS = [
    "setApprovalForAll",
    "approve",
    "transferFrom",
    "safeTransferFrom",
    "batchTransfer",
    "multiTransfer",
    "permit",
    "delegateCall",
]


@dataclass
class AddressFeatureResult:
    address: str
    features: Dict[str, float]


class FeatureExtractor:
    """Feature engineering utilities inspired by the Kaggle notebook."""

    def __init__(self) -> None:
        self.numeric_columns = [
            "value",
            "gas_used",
            "gas_price",
            "token_value",
            "token_decimal",
            "nft_floor_price",
            "nft_average_price",
            "nft_total_volume",
            "nft_total_sales",
            "nft_num_owners",
            "nft_market_cap",
            "nft_7day_volume",
            "nft_7day_sales",
            "nft_7day_avg_price",
        ]

    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean columns so feature calculations behave similarly to the notebook."""

        working_df = df.copy()

        for col in ["from_address", "to_address", "contract_address"]:
            if col in working_df.columns:
                working_df[col] = working_df[col].astype(str).str.lower()

        for col in self.numeric_columns:
            if col in working_df.columns:
                working_df[col] = pd.to_numeric(working_df[col], errors="coerce").fillna(0.0)

        if "timestamp" in working_df.columns:
            working_df["timestamp"] = pd.to_datetime(working_df["timestamp"], errors="coerce")

        if "function_call" in working_df.columns:
            working_df["function_list"] = working_df["function_call"].apply(self._parse_function_call)
        else:
            working_df["function_list"] = [[] for _ in range(len(working_df))]

        return working_df

    def compute_address_features(self, address: str, df: pd.DataFrame) -> AddressFeatureResult:
        """Compute address-level features mirroring the Kaggle pipeline."""

        addr = address.lower()
        prepared_df = self.preprocess(df)

        out_txns = prepared_df[prepared_df["from_address"] == addr]
        in_txns = prepared_df[prepared_df["to_address"] == addr]
        all_txns = pd.concat([out_txns, in_txns])

        if all_txns.empty:
            raise ValueError("Không tìm thấy giao dịch nào cho địa chỉ đã cung cấp.")

        # Remove duplicated hashes if available
        if "transaction_hash" in all_txns.columns:
            all_txns = all_txns.drop_duplicates("transaction_hash")

        features: Dict[str, float] = {}
        features.update(self._basic_transaction_features(out_txns, in_txns, all_txns))
        features.update(self._nft_features(out_txns, in_txns, all_txns))
        features.update(self._function_features(all_txns))
        features.update(self._time_features(all_txns))
        features.update(self._value_features(out_txns, in_txns, all_txns))

        zero_value_ratio = 0.0
        zero_value_token_ratio = 0.0
        if not all_txns.empty:
            if "value" in all_txns.columns:
                zero_mask = all_txns["value"] == 0
                zero_value_ratio = float(zero_mask.mean())
                if "token_value" in all_txns.columns:
                    zero_value_token_ratio = float((zero_mask & (all_txns["token_value"] > 0)).mean())

        features["zero_value_ratio"] = zero_value_ratio
        features["zero_value_token_ratio"] = zero_value_token_ratio

        return AddressFeatureResult(address=addr, features=features)

    def _basic_transaction_features(
        self, out_txns: pd.DataFrame, in_txns: pd.DataFrame, all_txns: pd.DataFrame
    ) -> Dict[str, float]:
        out_txn_count = len(out_txns)
        in_txn_count = len(in_txns)
        total_txn_count = len(all_txns)

        out_neighbors = (
            out_txns["to_address"].nunique() if not out_txns.empty and "to_address" in out_txns else 0
        )
        in_neighbors = (
            in_txns["from_address"].nunique() if not in_txns.empty and "from_address" in in_txns else 0
        )

        mint_txn_count = 0
        if not in_txns.empty and {"from_address", "contract_address"}.issubset(in_txns.columns):
            mint_txn_count = (
                (in_txns["from_address"] == in_txns["contract_address"])
                | in_txns["from_address"].str.startswith("0x0000000000000000000000000000000000000000")
            ).sum()

        gift_in_ratio = 0.0
        if not in_txns.empty and {"value", "token_value"}.issubset(in_txns.columns):
            gift_in_ratio = float(((in_txns["value"] == 0) & (in_txns["token_value"] > 0)).mean())

        gift_out_ratio = 0.0
        if not out_txns.empty and {"value", "token_value"}.issubset(out_txns.columns):
            gift_out_ratio = float(((out_txns["value"] == 0) & (out_txns["token_value"] > 0)).mean())

        return {
            "out_txn": float(out_txn_count),
            "in_txn": float(in_txn_count),
            "total_txn": float(total_txn_count),
            "out_neighbors": float(out_neighbors),
            "in_neighbors": float(in_neighbors),
            "mint_txn_count": float(mint_txn_count),
            "gift_in_ratio": gift_in_ratio,
            "gift_out_ratio": gift_out_ratio,
        }

    def _nft_features(
        self, out_txns: pd.DataFrame, in_txns: pd.DataFrame, all_txns: pd.DataFrame
    ) -> Dict[str, float]:
        in_collections = (
            in_txns["contract_address"].nunique()
            if not in_txns.empty and "contract_address" in in_txns
            else 0
        )
        out_collections = (
            out_txns["contract_address"].nunique()
            if not out_txns.empty and "contract_address" in out_txns
            else 0
        )

        in_nft_value = float(in_txns["token_value"].sum()) if not in_txns.empty and "token_value" in in_txns else 0.0
        out_nft_value = (
            float(out_txns["token_value"].sum()) if not out_txns.empty and "token_value" in out_txns else 0.0
        )

        avg_floor_price_in = (
            float(in_txns["nft_floor_price"].mean())
            if not in_txns.empty and "nft_floor_price" in in_txns
            else 0.0
        )
        avg_floor_price_out = (
            float(out_txns["nft_floor_price"].mean())
            if not out_txns.empty and "nft_floor_price" in out_txns
            else 0.0
        )

        total_volume = (
            float(all_txns["nft_total_volume"].sum())
            if not all_txns.empty and "nft_total_volume" in all_txns
            else 0.0
        )

        nft_dump_ratio = (out_nft_value / in_nft_value) if in_nft_value > 0 else 0.0

        return {
            "in_collections": float(in_collections),
            "out_collections": float(out_collections),
            "in_nft_value": in_nft_value,
            "out_nft_value": out_nft_value,
            "avg_floor_price_in": avg_floor_price_in,
            "avg_floor_price_out": avg_floor_price_out,
            "total_volume": total_volume,
            "nft_dump_ratio": float(nft_dump_ratio),
        }

    def _function_features(self, all_txns: pd.DataFrame) -> Dict[str, float]:
        if all_txns.empty:
            return {
                "suspicious_func_count": 0.0,
                "transfer_func_count": 0.0,
                "approval_func_count": 0.0,
                "unique_functions": 0.0,
            }

        function_series = all_txns.get("function_list")
        flatten_functions: List[str] = []
        if function_series is not None:
            for funcs in function_series:
                if not funcs:
                    continue
                flatten_functions.extend([str(func).lower() for func in funcs if isinstance(func, str)])

        suspicious_func_count = sum(
            1 for func in flatten_functions for pattern in SUSPICIOUS_PATTERNS if pattern.lower() in func
        )
        transfer_func_count = sum(1 for func in flatten_functions if "transfer" in func)
        approval_func_count = sum(1 for func in flatten_functions if "approv" in func or "permit" in func)
        unique_functions = len(set(flatten_functions))

        return {
            "suspicious_func_count": float(suspicious_func_count),
            "transfer_func_count": float(transfer_func_count),
            "approval_func_count": float(approval_func_count),
            "unique_functions": float(unique_functions),
        }

    def _time_features(self, all_txns: pd.DataFrame) -> Dict[str, float]:
        if all_txns.empty or "timestamp" not in all_txns:
            return {
                "avg_time_between_txn": 0.0,
                "std_time_between_txn": 0.0,
                "activity_duration_days": 0.0,
                "txn_velocity": 0.0,
            }

        ordered = all_txns.sort_values("timestamp")
        diffs = ordered["timestamp"].diff().dt.total_seconds().dropna()
        avg = float(diffs.mean()) if not diffs.empty else 0.0
        std = float(diffs.std()) if not diffs.empty else 0.0

        if not ordered["timestamp"].isna().all():
            first = ordered["timestamp"].min()
            last = ordered["timestamp"].max()
            duration_days = (
                float((last - first).total_seconds() / 86400.0) if isinstance(first, datetime) else 0.0
            )
        else:
            duration_days = 0.0

        txn_velocity = float(len(ordered) / max(duration_days, 1.0)) if duration_days else float(len(ordered))

        return {
            "avg_time_between_txn": avg,
            "std_time_between_txn": std,
            "activity_duration_days": duration_days,
            "txn_velocity": txn_velocity,
        }

    def _value_features(
        self, out_txns: pd.DataFrame, in_txns: pd.DataFrame, all_txns: pd.DataFrame
    ) -> Dict[str, float]:
        total_value_in = float(in_txns["value"].sum()) if not in_txns.empty and "value" in in_txns else 0.0
        total_value_out = (
            float(out_txns["value"].sum()) if not out_txns.empty and "value" in out_txns else 0.0
        )

        avg_value_in = (
            float(in_txns["value"].mean()) if not in_txns.empty and "value" in in_txns else 0.0
        )
        avg_value_out = (
            float(out_txns["value"].mean()) if not out_txns.empty and "value" in out_txns else 0.0
        )

        turnover_ratio = total_value_out / total_value_in if total_value_in > 0 else 0.0

        return {
            "total_value_in": total_value_in,
            "total_value_out": total_value_out,
            "avg_value_in": avg_value_in,
            "avg_value_out": avg_value_out,
            "turnover_ratio": float(turnover_ratio),
        }

    @staticmethod
    def _parse_function_call(raw: Optional[str]) -> List[str]:
        if not raw or raw in ("[]", "{}"):
            return []

        if isinstance(raw, list):
            return [str(item) for item in raw]

        raw_str = str(raw)

        try:
            parsed = json.loads(raw_str)
        except Exception:
            try:
                parsed = json.loads(raw_str.replace("'", '"'))
            except Exception:
                return []

        if isinstance(parsed, list):
            return [str(item) for item in parsed]

        return []


