import os, sys, json, urllib.request, urllib.error

ENV_URL = os.environ.get("MAKEFUN_ENV_URL") or sys.exit("MAKEFUN_ENV_URL is not set")

VAL = {"p": 100, "n": 320, "b": 330, "r": 500, "q": 900, "k": 20000}
OFF = {"n": (14, 18, 31, 33, -14, -18, -31, -33), "b": (15, 17, -15, -17), "r": (1, 16, -1, -16), "q": (1, 16, -1, -16, 15, 17, -15, -17), "k": (1, 16, -1, -16, 15, 17, -15, -17)}

def post(path, body):
    req = urllib.request.Request(ENV_URL + path, json.dumps(body).encode(), {"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req) as res: return json.load(res)
    except urllib.error.HTTPError as e: sys.exit(f"{path}: {e}")

def fen_to_0x88(fen):
    b = [None] * 128
    for r, row in enumerate(fen.split()[0].split("/")):
        f = 0
        for ch in row:
            if ch.isdigit():
                f += int(ch)
            else:
                b[(7 - r) * 16 + f], f = ch, f + 1
    return b

sq = lambda s: (int(s[1]) - 1) * 16 + ord(s[0]) - 97

def evaluate(b):
    sc = 0
    for sq in range(128):
        if sq & 0x88 or not b[sq]: continue
        p, lp = b[sq], b[sq].lower()
        r, f, w = sq >> 4, sq & 7, p.isupper()
        v, pos = VAL.get(lp, 0), 0
        if lp == "p": pos = (r if w else 7 - r) * 8 + (15 if f in (3, 4) else 0)
        elif lp in ("n", "b"): pos = int((4 - abs(3.5 - r) - abs(3.5 - f)) * 8)
        elif lp == "r" and (r == 6 if w else r == 1): pos = 25
        elif lp == "k": pos = int(abs(3.5 - f) * 5)
        sc += (v + pos) if w else -(v + pos)
    return sc

def gen_moves(b, w):
    mv = []
    for sq in range(128):
        if sq & 0x88 or not b[sq] or (b[sq].isupper() != w): continue
        lp = b[sq].lower()
        if lp == "p":
            st = 16 if w else -16
            if not ((sq + st) & 0x88) and not b[sq + st]:
                mv.append((sq, sq + st))
                if (sq >> 4) == (1 if w else 6) and not b[sq + 2 * st]: mv.append((sq, sq + 2 * st))
            for cap in (st - 1, st + 1):
                t = sq + cap
                if not (t & 0x88) and b[t] and (b[t].isupper() != w): mv.append((sq, t))
        else:
            slide = lp in "brq"
            for d in OFF[lp]:
                t = sq + d
                while not (t & 0x88):
                    if not b[t]:
                        mv.append((sq, t))
                        if not slide: break
                        t += d
                    else:
                        if b[t].isupper() != w: mv.append((sq, t))
                        break
    return mv

def make_move(b, src, dst, promo=None):
    nb = list(b)
    p = promo.upper() if promo and nb[src].isupper() else (promo.lower() if promo else nb[src])
    nb[src], nb[dst] = None, p
    if p.lower() == "k" and abs(src - dst) == 2:
        if dst > src: nb[src + 1], nb[src + 3] = nb[src + 3], None
        else: nb[src - 1], nb[src - 4] = nb[src - 4], None
    return nb

def choose(fen, legal_moves):
    b, w = fen_to_0x88(fen), fen.split()[1] == "w"
    best_m, best_sc = legal_moves[0], -999999 if w else 999999
    for uci in legal_moves:
        s, d = sq(uci[:2]), sq(uci[2:4])
        b1 = make_move(b, s, d, uci[4] if len(uci) == 5 else None)
        opp = gen_moves(b1, not w)
        if not opp: sc = 50000 if w else -50000
        elif any(b1[od] == ("K" if w else "k") for _, od in opp): sc = -100000 if w else 100000
        else:
            scores = [evaluate(make_move(b1, os, od)) for os, od in opp]
            sc = min(scores) if w else max(scores)
        if (w and sc > best_sc) or (not w and sc < best_sc): best_sc, best_m = sc, uci
    return best_m

def main():
    while True:
        g = post("/game", {})
        if g.get("status") == "done": break
        while g.get("status") == "your_move":
            g = post("/move", {"game": g["game"], "move": choose(g["fen"], g["legal_moves"])})
    print(f"done: {g.get('wins', 0)}W {g.get('losses', 0)}L", file=sys.stderr)

if __name__ == "__main__":
    main()

