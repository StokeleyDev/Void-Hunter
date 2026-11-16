/** Evaluated once at startup; used to cap particles and disable glow on mobile / Telegram. */
export const IS_MOBILE_DEVICE = typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|Telegram/i.test(navigator.userAgent));
