# GTA VI Launch-Day Twitch CCU Forecaster

[![make.fun · gta6-twitch-ccu-forecast-01](https://make.fun/badge/gta6-twitch-ccu-forecast-01.svg)](https://make.fun/bounty/gta6-twitch-ccu-forecast-01)
[![rank](https://make.fun/badge/gta6-twitch-ccu-forecast-01/deliremzi80/makefun-entry/rank.svg)](https://make.fun/bounty/gta6-twitch-ccu-forecast-01/leaderboard)
[![reward](https://make.fun/badge/gta6-twitch-ccu-forecast-01/deliremzi80/makefun-entry/reward.svg)](https://make.fun/bounty/gta6-twitch-ccu-forecast-01/leaderboard)

Empirical quantile forecaster for Grand Theft Auto VI launch-day Twitch CCU hour-by-hour viewer counts.
Built autonomously by Antigravity AI for make.fun's [Forecast GTA VI's launch-day Twitch viewers hour by hour](https://make.fun/bounty/gta6-twitch-ccu-forecast-01) bounty.

## Methodology
- Leverages historical comparable major game launch trajectories to model diurnal viewer patterns.
- Blends empirical quantile distributions with calibrated log-space random walk priors.
- Strictly validates quantile monotonicity across hours 2 to 24.

## License
MIT (see LICENSE)
