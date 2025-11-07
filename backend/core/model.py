from __future__ import annotations

import math
from typing import Dict, List, Tuple


NORMALIZATION_CONSTANTS = {
    "txn_velocity": 50.0,
    "nft_dump_ratio": 8.0,
    "turnover_ratio": 10.0,
    "avg_floor_price_out": 2.0,
    "avg_floor_price_in": 2.0,
    "mint_txn_count": 25.0,
    "out_neighbors": 50.0,
    "suspicious_func_count": 20.0,
    "approval_func_count": 10.0,
    "transfer_func_count": 30.0,
    "total_txn": 200.0,
}


class RiskModel:
    """Light-weight scoring model based on heuristics from the notebook."""

    def __init__(self) -> None:
        self.bias = -1.15
        self.weights: Dict[str, float] = {
            "suspicious_density": 2.2,
            "approval_density": 1.6,
            "gift_ratio": 1.3,
            "nft_dump_ratio": 1.1,
            "txn_velocity": 1.0,
            "turnover_ratio": 0.9,
            "zero_value_ratio": 1.1,
            "mint_intensity": 0.6,
            "neighbor_spread": 0.7,
            "value_delta": 0.8,
        }

    def predict(self, feature_snapshot: Dict[str, float]) -> Tuple[float, List[Tuple[str, float]]]:
        """Return probability score and per-feature contributions."""

        transformed = self._transform(feature_snapshot)
        linear_score = self.bias
        contributions = []

        for name, value in transformed.items():
            weight = self.weights.get(name, 0.0)
            contrib = weight * value
            contributions.append((name, contrib))
            linear_score += contrib

        probability = 1 / (1 + math.exp(-linear_score))

        contributions.sort(key=lambda item: abs(item[1]), reverse=True)
        return probability, contributions

    def _transform(self, snapshot: Dict[str, float]) -> Dict[str, float]:
        total_txn = snapshot.get("total_txn", 0.0)

        suspicious_density = snapshot.get("suspicious_func_count", 0.0) / max(total_txn, 1.0)
        approval_density = snapshot.get("approval_func_count", 0.0) / max(total_txn, 1.0)
        transfer_density = snapshot.get("transfer_func_count", 0.0) / max(total_txn, 1.0)

        gift_ratio = min(1.0, (snapshot.get("gift_in_ratio", 0.0) + snapshot.get("gift_out_ratio", 0.0)) / 2)

        nft_dump_ratio = min(1.0, snapshot.get("nft_dump_ratio", 0.0) / NORMALIZATION_CONSTANTS["nft_dump_ratio"])
        txn_velocity_norm = min(1.0, snapshot.get("txn_velocity", 0.0) / NORMALIZATION_CONSTANTS["txn_velocity"])
        turnover_ratio_norm = min(1.0, snapshot.get("turnover_ratio", 0.0) / NORMALIZATION_CONSTANTS["turnover_ratio"])

        zero_value_ratio = min(1.0, snapshot.get("zero_value_ratio", 0.0))
        mint_intensity = min(1.0, snapshot.get("mint_txn_count", 0.0) / NORMALIZATION_CONSTANTS["mint_txn_count"])

        neighbor_spread = min(
            1.0,
            (snapshot.get("out_neighbors", 0.0) + snapshot.get("in_neighbors", 0.0))
            / (2 * NORMALIZATION_CONSTANTS["out_neighbors"]),
        )

        avg_in = snapshot.get("avg_floor_price_in", 0.0) / NORMALIZATION_CONSTANTS["avg_floor_price_in"]
        avg_out = snapshot.get("avg_floor_price_out", 0.0) / NORMALIZATION_CONSTANTS["avg_floor_price_out"]
        value_delta = avg_out - avg_in

        return {
            "suspicious_density": suspicious_density,
            "approval_density": approval_density,
            "gift_ratio": gift_ratio,
            "nft_dump_ratio": nft_dump_ratio,
            "txn_velocity": txn_velocity_norm,
            "turnover_ratio": turnover_ratio_norm,
            "zero_value_ratio": zero_value_ratio,
            "mint_intensity": mint_intensity,
            "neighbor_spread": neighbor_spread,
            "value_delta": value_delta,
            # Provide additional context although without weight (useful for UI)
            "transfer_density": transfer_density,
        }


