import os, sys, json, urllib.request, urllib.error

ENV_URL = os.environ.get("MAKEFUN_ENV_URL") or sys.exit("MAKEFUN_ENV_URL is not set")

PIECE_VAL = {"p": 100, "n": 325, "b": 335, "r": 505, "q": 950, "k": 20000}

PAWN_PST = [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0]
KNIGHT_PST = [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50]
BISHOP_PST = [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20]

def post(path, body):
    req = urllib.request.Request(
        ENV_URL + path,
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        sys.exit(f"{path}: HTTP {e.code} {e.read().decode(errors='replace')}")

def parse_board(fen):
    board = {}
    parts = fen.split()
    rows = parts[0].split("/")
    for r, row in enumerate(rows):
        f = 0
        for ch in row:
            if ch.isdigit():
                f += int(ch)
            else:
                sq = "abcdefgh"[f] + str(8 - r)
                board[sq] = ch
                f += 1
    turn = parts[1] if len(parts) > 1 else "w"
    return board, turn

def sq_idx(sq):
    file = ord(sq[0]) - ord('a')
    rank = int(sq[1]) - 1
    return (7 - rank) * 8 + file

def eval_pos(board):
    score = 0
    for sq, p in board.items():
        val = PIECE_VAL.get(p.lower(), 0)
        idx = sq_idx(sq)
        pst = 0
        lp = p.lower()
        if lp == "p":
            pst = PAWN_PST[idx if p.isupper() else 63 - idx]
        elif lp == "n":
            pst = KNIGHT_PST[idx if p.isupper() else 63 - idx]
        elif lp == "b":
            pst = BISHOP_PST[idx if p.isupper() else 63 - idx]
        total = val + pst
        score += total if p.isupper() else -total
    return score

def apply_move(board, move):
    nb = dict(board)
    src, dst = move[:2], move[2:4]
    p = nb.pop(src, None)
    if not p:
        return nb
    if len(move) == 5:
        p = move[4].upper() if p.isupper() else move[4].lower()
    if p.lower() == "p" and src[0] != dst[0] and dst not in board:
        nb.pop(dst[0] + src[1], None)
    nb[dst] = p
    return nb

def order_move(move, board):
    mover = board.get(move[:2], "p").lower()
    victim = board.get(move[2:4])
    val_v = PIECE_VAL.get(victim.lower(), 0) if victim else 0
    val_m = PIECE_VAL.get(mover, 0)
    return -(val_v * 10 - val_m)

def choose(fen, legal):
    board, turn = parse_board(fen)
    is_white = (turn == "w")
    sorted_moves = sorted(legal, key=lambda m: order_move(m, board))
    best_move = sorted_moves[0]
    best_score = -999999 if is_white else 999999
    for m in sorted_moves:
        nb = apply_move(board, m)
        score = eval_pos(nb)
        if is_white:
            if score > best_score:
                best_score = score
                best_move = m
        else:
            if score < best_score:
                best_score = score
                best_move = m
    return best_move

def main():
    while True:
        g = post("/game", {})
        if g.get("status") == "done":
            break
        while g.get("status") == "your_move":
            m = choose(g["fen"], g["legal_moves"])
            g = post("/move", {"game": g["game"], "move": m})
        print(f"game {g.get('game')}: {g.get('outcome')} by {g.get('reason')}", file=sys.stderr)
    print(f"done: {g.get('wins', 0)} won, {g.get('draws', 0)} drawn, {g.get('losses', 0)} lost", file=sys.stderr)

if __name__ == "__main__":
    main()
