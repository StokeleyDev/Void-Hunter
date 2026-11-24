# Changelog

All notable changes to this project are documented in this file.

## [1.2.0] — 2026-11-24

Graphics and game-feel update. Rendering is still plain Canvas2D, so it keeps working on mobile and inside Telegram's WebView.

### Added
- **Sharp rendering on high-DPI screens.** The canvas backing store now follows `devicePixelRatio` (capped at 2× on
  desktop with **High** particles, 1.75× otherwise, 1× on **Low**); the game still simulates in CSS pixels.
- **Bloom.** A cheap downsample-based bloom pass (1/4, 1/8, 1/16 mip chain with a soft brightness threshold, added
  back with additive blending) replaces `shadowBlur` glow. Disabled on **Low**.
- **Smooth motion on 90/120/144 Hz screens.** Entities are drawn interpolated between the last two fixed 60 Hz
  simulation steps; render-side animations (stars, asteroids, damage numbers, beams, flashes, shake) are now
  frame-rate independent.
- **Parallax star field.** Three star layers (dim far stars, mid stars, bright near streaks) that move at different
  rates as the ship moves, with twinkle; a faint sector-tinted nebula haze in each sector background.
- **Hit feedback.** Enemies flash in their own shape when hit, regular enemies get a small knockback on strong hits
  (≥6% of max HP; bosses and mini-bosses don't move), and directional sparks fly from the impact side.
- Red damage vignette when the player takes damage (follows the existing screen-flash setting).
- New particles: velocity-stretched sparks, additive glow cores and a fast white shockwave ring on explosions.
- **Boss death sequence.** Chained explosions (9 for bosses, 4 for mini-bosses) with slow motion that eases back to
  normal speed; the sector-victory screen now opens about 1.25 s after the boss dies.

### Changed
- Camera shake uses smooth layered sine motion with slight rotation instead of a random offset every frame.
  The shake-strength setting still applies.
- Lightning, lasers, bullet and player trails, sparks and rings are drawn with additive (`lighter`) blending.
- Particle cap raised from 200 to 520 on desktop and from 80 to 180 on mobile (scaled by the particles setting).
- `shadowBlur` is now always off; glow on all platforms comes from the bloom pass.
- The static part of each sector background (gradients, planet, nebulae) is painted once into an offscreen cache
  instead of every frame.

### Gameplay notes
- Knockback slightly changes balance: hit enemies are pushed away from the player.
- The boss kill counts immediately. During the short pause before the victory screen enemy bullets are cleared and
  the player cannot die.

### Internal
- New modules: `src/game/postfx.ts` (DPR sizing, bloom, background cache), `src/game/interpolation.ts`
  (render interpolation), `src/game/juice.ts` (stars, hit reactions, shake, death sequence, slow motion).
  Hit effects are detected from HP changes, so weapon code is untouched.

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
