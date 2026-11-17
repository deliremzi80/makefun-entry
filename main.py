import json
import math
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

INPUT_DIR = Path(os.environ.get("MAKEFUN_INPUT_DIR", "/input"))
OUTPUT_DIR = Path(os.environ.get("MAKEFUN_OUTPUT_DIR", "/output"))

LEVELS = [0.05, 0.25, 0.5, 0.75, 0.95]
Z = [-1.645, -0.674, 0.0, 0.674, 1.645]
SIGMA = 0.15

def round2(x: float) -> float | int:
    scaled = x * 100.0
    whole = math.floor(scaled)
    if scaled - whole >= 0.5:
        whole += 1.0
    val = whole / 100.0
    return int(val) if val.is_integer() else val

def calc_quantile(arr: list[float], q: float) -> float:
    s = sorted(arr)
    pos = q * (len(s) - 1)
    base = int(pos)
    rest = pos - base
    if base + 1 < len(s):
        return s[base] + rest * (s[base + 1] - s[base])
    return s[base]

def forecast_case(case: dict) -> dict:
    first = next((k for k in case["known"] if k["hour"] == 1), None)
    p1 = max(1.0, float(first["viewers"])) if first else 1.0

    comps = case.get("comparables", [])
    hourly_ratios: dict[int, list[float]] = {h: [] for h in range(2, 25)}
    for c in comps:
        h_data = c.get("hourly", [])
        if len(h_data) >= 24 and h_data[0].get("viewers", 0) > 0:
            base_v = float(h_data[0]["viewers"])
            for row in h_data[1:24]:
                h_num = row.get("hour")
                if h_num is None:
                    continue
                v = float(row.get("viewers", 0))
                if v > 0:
                    hourly_ratios[h_num].append(v / base_v)

    hours_out = []
    for row in case.get("forecast", []):
        h = row["hour"]
        r_list = hourly_ratios.get(h, [])
        q_vals = []
        for i, q_level in enumerate(LEVELS):
            prior_q = p1 * math.exp(Z[i] * SIGMA * math.sqrt(h - 1))
            if len(r_list) >= 5:
                emp_q = p1 * calc_quantile(r_list, q_level)
                combined = 0.75 * emp_q + 0.25 * prior_q
            else:
                combined = prior_q
            q_vals.append(max(1.0, combined))

        q_vals.sort()
        rounded = [round2(v) for v in q_vals]
        hours_out.append({"hour": h, "q": rounded})

    return {"hours": hours_out}

def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for path in sorted(INPUT_DIR.glob("*.in")):
        case = json.loads(path.read_text(encoding="utf-8"))
        forecast = forecast_case(case)
        out_path = OUTPUT_DIR / f"{path.stem}.out"
        out_path.write_text(json.dumps(forecast, separators=(",", ":")) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
