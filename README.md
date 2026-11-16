<div align="center">

<img src="static/img/emblem.png" alt="eFootball Arena" width="120" />

# eFootball Arena

**A full-featured eFootball tournament platform: registration, standings, playoffs, deadlines and an admin panel.**

[![Live](https://img.shields.io/badge/live-efootballarena.uz-7c3aed?style=for-the-badge)](https://efootballarena.uz)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-SPA-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![No dependencies](https://img.shields.io/badge/dependencies-0-success?style=for-the-badge)

</div>

<p align="center">
  <a href="https://efootballarena.uz"><img src="docs/screenshots/home.png" alt="eFootball Arena home page" width="900" /></a>
</p>

> The site's interface is in Uzbek.

## Features

| | |
|---|---|
| 🏆 **4 tournament formats** | New UEFA format (league phase + knockout play-off for places 9–24), World Cup (groups + knockout), League (single or double round-robin), Cup |
| ⚽ **100 teams** | 50 clubs with real crests and 50 national teams. Each team can be picked by only one player per tournament |
| 👥 **Unlimited participants** | "No-crest" tournaments handle 10,000+ players with pagination, search and caching |
| 📸 **Results with proof** | Players submit the score with a screenshot and can edit it up to 3 times. The opponent can report a wrong score |
| ⏱ **Deadlines** | Rounds unlock one after another. No result by the deadline means an automatic 0:0; in knockouts both players are eliminated |
| 🟨🟥 **Disciplinary cards** | Two yellows make a red. A red card means a 0:3 forfeit in the next match |
| 🛡 **Admin permissions** | The main admin can toggle 11 separate permissions for every other admin |
| 🌗 **Design** | Dark and light themes, animations, responsive on phones, tablets and large screens |

## Tech Stack

- **Backend:** Python standard library only (`http.server`, `ThreadingHTTPServer`), no external packages
- **Database:** JSON file storage with atomic writes, background flushing and a versioned cache
- **Security:** PBKDF2 password hashing, HttpOnly/SameSite cookie sessions, role and permission system
- **Frontend:** Vanilla JavaScript SPA (hash routing), CSS custom properties for theming
- **Deployment:** Ubuntu VPS, systemd, Caddy (automatic HTTPS), daily backups

## Getting Started

All you need is **Python 3.9+**.

```bash
git clone https://github.com/alisherboltaev/efootball-arena.git
cd efootball-arena
python server.py
```

Then open http://localhost:8000 in your browser. On Windows you can also just double-click `start.bat`.

### Main admin

- Admin panel: the **Admin** button on the site (`#/admin/login`)
- Login: `admin`
- The password is generated randomly on first launch and printed once in the server console (`Asosiy admin yaratildi: ...`).

To start with your own credentials, set the `ADMIN_LOGIN` and `ADMIN_PASSWORD` environment variables before the first launch. After signing in, change the password under **Admin panel → Settings**.

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `0.0.0.0` | Address the server listens on |
| `PORT` | `8000` | Port |
| `ADMIN_LOGIN` | `admin` | Login of the first main admin |
| `ADMIN_PASSWORD` | random | Password of the first main admin |

## Tournament Rules

- **UEFA (new format):** everyone plays in a single table, and the number of matches per team is configurable (8 by default). Places 1–8 go straight to the round of 16. Places 9–24 play a two-legged play-off in random pairs. Places 25 and below are eliminated.
- **World Cup:** group stage followed by a knockout bracket.
- **League:** single or double round-robin (for example, 20 players over 2 legs means 38 rounds).
- **Cup:** knockout only.

## Project Structure

```
server.py          # the entire backend: API, tournament logic, sessions
teams.py           # 50 clubs and 50 national teams
static/
  index.html       # SPA shell
  app.js           # all pages and UI
  style.css        # themes and responsive layout
  logos/           # club crests
  img/             # logo and stadium photos
deploy/            # Caddyfile and systemd service
DEPLOY.md          # VPS deployment guide
```

The `data/` folder (database and uploaded images) is not part of the repository.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full guide: Ubuntu VPS, domain, HTTPS with Caddy, the systemd service and daily backups.

## Image Credits

Stadium and football photos come from Openverse and are CC0 / public domain (rawpixel, StockSnap).

---

<div align="center">

Made by **Alisher Boltaev** · [Telegram](https://t.me/Alisher_Boltaev) · [Instagram](https://www.instagram.com/alisherboltaev_/)

</div>
