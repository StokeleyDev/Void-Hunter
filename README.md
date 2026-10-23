<p align="center"><img src="docs/void-hunter-cover.png" alt="Void Hunter — a starship approaching a blue planet through an asteroid field" width="100%" /></p>

<h1 align="center">VOID HUNTER</h1>
<p align="center"><b>Enter the sector. Build your ship. Survive the void.</b><br /><sub>A space survival game by Stokeley.</sub></p>

<p align="center"><a href="#03--run-locally"><b>RUN LOCALLY</b></a> · <a href="https://github.com/StokeleyDev">CREATOR</a></p>

---

### 01 / Mission Briefing

Take your ship into hostile sectors, survive enemy waves, and shape your build through upgrades and synergies. Earn credits, customize your ship and rockets, and push for a better run.

### 02 / On Board

| System | What to expect |
| :--- | :--- |
| Sector progression | Unlock sectors and track your victories |
| Build variety | Upgrade choices, rerolls, and discoverable synergies |
| Hangar | Unlockable ship and rocket appearances |
| Endless mode | Keep pushing your survival run |
| Local progress | Credits, records, unlocks, and run history saved in your browser |
| Presentation settings | Music and sound controls, screen shake, flashes, and particles |

### 03 / Run Locally

Install **Node.js 20 or newer** and npm, then run:

```bash
git clone https://github.com/StokeleyDev/Void-Hunter.git
cd Void-Hunter
npm ci
npm run dev
```

Open **http://localhost:3000** in your browser.

```bash
npm run build     # Create a production web build in dist/
npm run preview   # Preview the production build locally
npm run lint      # Check TypeScript types
```

### 04 / Controls

| Input | Action |
| :--- | :--- |
| WASD / Arrow keys | Move your ship |
| Esc / P | Pause the game |
| Touchscreen | On-screen movement controls |

### 05 / Development

Built with **TypeScript · React · Vite · HTML Canvas**.

Progress is stored in browser local storage. Clearing site data can reset your save.

### 06 / Telegram Companion

The game supports Telegram Web Apps. The optional Python bot runs separately from the browser game.

Install Python and `pyTelegramBotAPI`, set `BOT_TOKEN` in your environment, then run `python bot.py` or `start_bot.bat` on Windows. Optional settings: `GAME_URL`, `GAME_SHORT_NAME`, and `LEADERBOARD_FILE`. See [.env.example](.env.example) for example values. Keep real tokens out of source control.

The bot stores leaderboard data separately in a JSON file. Submitted scores are checked for format and range, but are not server-verified runs.

Development notes: [perk analysis](perks_analysis.md).

---

<p align="center"><b>Developed &amp; designed by <a href="https://github.com/StokeleyDev">Stokeley</a></b><br /><sub>MISSION READY · SAVE YOUR PROGRESS · RETURN TO THE VOID</sub></p>
