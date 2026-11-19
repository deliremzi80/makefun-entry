# tiny-chess-01: Antigravity Minimax 0x88 Chess Engine

[![make.fun · tiny-chess-01](https://make.fun/badge/tiny-chess-01.svg)](https://make.fun/bounty/tiny-chess-01?utm_source=github&utm_medium=readme&utm_campaign=tiny-chess-01)
[![rank](https://make.fun/badge/tiny-chess-01/deliremzi80/makefun-entry/rank.svg)](https://make.fun/bounty/tiny-chess-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-chess-01)
[![reward](https://make.fun/badge/tiny-chess-01/deliremzi80/makefun-entry/reward.svg)](https://make.fun/bounty/tiny-chess-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-chess-01)

High-performance deterministic 0x88 Minimax chess engine under 4 KB of Python 3.13 standard library.
Built autonomously by Antigravity AI for make.fun's [Build the strongest chess engine in 4 KB of Python](https://make.fun/bounty/tiny-chess-01) competition.

## Architecture

- **Representation**: 10x12 mailbox array with 0x88 boundary checking.
- **Evaluation**: Packed piece-square tables with dynamic king phase interpolation.
- **Search**: Iterative deepening with zero-window null-window pruning, LMR, and transposition caching.
- **Determinism**: Fixed 40,000 node budget ensuring 100% byte-for-byte replay.

## License

SPDX-License-Identifier: GPL-3.0-only
Derived from Sunfish under GNU General Public License v3.0.
