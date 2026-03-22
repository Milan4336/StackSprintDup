from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2, log2
from typing import Dict, List, Tuple

LOCATION_MAP: Dict[str, Tuple[float, float]] = {
    "NY": (40.7128, -74.0060),
    "CA": (36.7783, -119.4179),
    "TX": (31.9686, -99.9018),
    "FL": (27.6648, -81.5158),
    "WA": (47.7511, -120.7401),
}


class UserState:
    def __init__(self) -> None:
        self.amounts: List[float] = []
        self.timestamps: List[datetime] = []
        self.locations: List[str] = []
        self.devices: List[str] = []


class FeatureEngineer:
    def __init__(self) -> None:
        self.state = defaultdict(UserState)

    @staticmethod
    def _zscore(amount: float, history: List[float]) -> float:
        if len(history) < 2:
            return 0.0
        mean = sum(history) / len(history)
        variance = sum((x - mean) ** 2 for x in history) / len(history)
        std = variance ** 0.5
        if std == 0:
            return 0.0
        return (amount - mean) / std

    @staticmethod
    def _haversine_km(a: str, b: str) -> float:
        if a not in LOCATION_MAP or b not in LOCATION_MAP:
            return 0.0
        lat1, lon1 = LOCATION_MAP[a]
        lat2, lon2 = LOCATION_MAP[b]
        r = 6371.0
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        x = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(x), sqrt(1 - x))
        return r * c

    @staticmethod
    def _entropy(devices: List[str]) -> float:
        if not devices:
            return 0.0
        counts = {}
        for d in devices:
            counts[d] = counts.get(d, 0) + 1
        total = len(devices)
        entropy = 0.0
        for count in counts.values():
            p = count / total
            entropy -= p * log2(p)
        return entropy

    def build(self, user_id: str, amount: float, location: str, device_id: str, timestamp: datetime) -> List[float]:
        user = self.state[user_id]

        amount_z = self._zscore(amount, user.amounts)
        one_hour_ago = timestamp - timedelta(hours=1)
        tx_freq = sum(1 for t in user.timestamps if t >= one_hour_ago)

        geo_delta = self._haversine_km(user.locations[-1], location) if user.locations else 0.0
        device_entropy = self._entropy(user.devices)

        user.amounts.append(amount)
        user.timestamps.append(timestamp)
        user.locations.append(location)
        user.devices.append(device_id)

        return [amount, amount_z, float(tx_freq), geo_delta, device_entropy]
