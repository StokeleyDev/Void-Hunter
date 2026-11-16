# Changelog

All notable changes to this project are documented in this file.

## [1.1.0] — 2026-11-16

### Security
- **Leaderboard can no longer be spoofed.** The bot no longer accepts `__score__uid|name|score|wave` text messages
  (anyone could post one and overwrite any player's record). Scores now arrive only as `web_app_data` via
  `Telegram.WebApp.sendData()`; the player id and name are taken from `message.from_user`, which Telegram sets.
  Score values themselves are still client-reported (range-checked only).
- Removed the `__get_leaderboard__` command, which exposed every player's Telegram user id.
- Writes to `leaderboard.json` are now guarded by a lock (the bot handles updates on several threads).

### Added
- "🏆 Submit to leaderboard" button on the run-summary screen, shown when the game was opened from the bot's
  reply-keyboard **🏆 Ranked run** button (the only Telegram launch mode where `sendData` is available; it closes the Mini App).
- Bot: `/top` command and the **🏆 Ranked run** reply-keyboard button in private chats.
- `CHANGELOG.md`.

### Changed
- Removed unused dependencies left over from the AI Studio template: `@google/genai`, `express`, `dotenv`, `tsx`,
  `motion`, `lucide-react`, `autoprefixer`, `@types/express`. Build tooling moved to `devDependencies`.
- `npm run clean` now works on Windows.
- CI: Node 22, and `npm run lint` (type check) runs before the build.
- `vite.config.ts` and `.env.example`: removed AI Studio leftovers (`DISABLE_HMR`, `GEMINI_API_KEY`).
- The bot's game-card callback no longer appends unused `uid`/`cid`/`name` query parameters to the game URL.
- Glow (`shadowBlur`) is now also disabled on desktop when the particles setting is **Low** (still always off on mobile).
- UI: upgrade cards show their rarity as a full thin outline (the previous left stripe was overridden by `.vh-panel`
  CSS and did not render); flat colours instead of gradients on the synergy progress bar and end-of-run buttons;
  UI font changed from Space Grotesk/Inter to **Exo 2**, which has Cyrillic glyphs (Russian text previously fell back to Inter).

### Performance
- Per-frame entity cleanup (enemies, bullets, particles, gems, beams…) compacts arrays in place instead of allocating
  new arrays with `.filter()` every frame.
- Mobile-device detection runs once at startup instead of a regex test every frame.

### Fixed
- Chain-lightning target selection used a biased `sort(() => Math.random() - 0.5)` shuffle; it now uses an
  unbiased partial Fisher–Yates sample.

### Refactoring
- Frame rendering (~1100 lines) moved out of `GameCanvas.tsx` into `src/game/renderFrame.ts`
  (`GameCanvas.tsx`: 4142 → ~3050 lines). New helpers: `src/utils/array.ts`, `src/utils/device.ts`, `src/utils/telegram.ts`.
