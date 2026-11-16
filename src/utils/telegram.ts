/**
 * Telegram Mini App helpers.
 *
 * Scores are delivered to the bot via Telegram.WebApp.sendData(). Telegram attaches the
 * sender's real user id to the resulting `web_app_data` service message, so the bot never
 * has to trust a client-supplied uid. sendData() is only available when the app was opened
 * from a reply-keyboard button (no query_id in initData) and it closes the Mini App.
 */

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { query_id?: string; user?: { id: number } };
  platform?: string;
  sendData(data: string): void;
}

function getWebApp(): TelegramWebApp | null {
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  return tg && tg.platform && tg.platform !== 'unknown' ? tg : null;
}

/** True when the app runs inside Telegram from a keyboard button, i.e. sendData() works. */
export function canSubmitScore(): boolean {
  const tg = getWebApp();
  return !!tg && !tg.initDataUnsafe?.query_id && typeof tg.sendData === 'function';
}

export function submitScore(score: number, wave: number): boolean {
  const tg = getWebApp();
  if (!tg || !canSubmitScore()) return false;
  try {
    tg.sendData(JSON.stringify({ v: 1, score: Math.floor(score), wave: Math.floor(wave) }));
    return true;
  } catch (e) {
    console.warn('Score submit failed:', e);
    return false;
  }
}
