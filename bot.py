import json
import os
import re
import threading
from datetime import datetime
from pathlib import Path

import telebot
from telebot import types

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN environment variable is required")
GAME_SHORT_NAME = os.getenv("GAME_SHORT_NAME", "voidhunter")
GAME_URL = os.getenv("GAME_URL", "https://stokeleydev.github.io/Void-Hunter/")
LEADERBOARD_FILE = Path(os.getenv("LEADERBOARD_FILE", "leaderboard.json"))
MAX_SCORE = 2_000_000_000
MAX_WAVE = 100_000

bot = telebot.TeleBot(BOT_TOKEN)
leaderboard_lock = threading.Lock()


def load_leaderboard():
    try:
        raw = json.loads(LEADERBOARD_FILE.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            return {}
        result = {}
        for key, entry in raw.items():
            if not isinstance(entry, dict):
                continue
            uid, score, wave = int(entry["uid"]), int(entry["score"]), int(entry["wave"])
            if uid > 0 and 0 <= score <= MAX_SCORE and 0 <= wave <= MAX_WAVE:
                result[uid] = {"uid": uid, "name": str(entry.get("name", "Player"))[:40], "score": score, "wave": wave}
        return result
    except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError):
        return {}


leaderboard = load_leaderboard()


def save_leaderboard():
    LEADERBOARD_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = LEADERBOARD_FILE.with_suffix(".tmp")
    temp_file.write_text(json.dumps(leaderboard, ensure_ascii=False), encoding="utf-8")
    temp_file.replace(LEADERBOARD_FILE)


def log_event(msg):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open("bot_debug.log", "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


@bot.message_handler(commands=['start', 'game'], chat_types=['private', 'group', 'supergroup'])
def send_game(message):
    log_event(f"Command received: {message.text} in chat {message.chat.id} (type: {message.chat.type})")
    
    # In direct messages: configure webapp menu button and send launch card
    if message.chat.type == 'private':
        try:
            bot.set_chat_menu_button(
                message.chat.id,
                types.MenuButtonWebApp(type="web_app", text="🎮 Play", web_app=types.WebAppInfo(url=GAME_URL))
            )
        except Exception as e:
            log_event(f"Menu button warning: {e}")

        try:
            markup = types.InlineKeyboardMarkup(row_width=1)
            btn_webapp = types.InlineKeyboardButton("🚀 Play in Telegram", web_app=types.WebAppInfo(url=GAME_URL))
            btn_browser = types.InlineKeyboardButton("🌐 Open in Browser", url=GAME_URL)
            btn_top = types.InlineKeyboardButton("🏆 Leaderboard", callback_data="show_top")
            markup.add(btn_webapp, btn_browser, btn_top)
            # Reply-keyboard WebApp button: the only launch mode where Telegram.WebApp.sendData()
            # works, so scores submitted from it arrive with a Telegram-verified sender id.
            ranked_kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
            ranked_kb.add(types.KeyboardButton("🏆 Ranked run", web_app=types.WebAppInfo(url=GAME_URL)))
            bot.send_message(
                message.chat.id,
                "Use the 🏆 Ranked run button below to have your score saved to the leaderboard.",
                reply_markup=ranked_kb,
            )
            bot.send_message(
                message.chat.id,
                "🌌 **VOID HUNTER** — Space Roguelite Bullet-Heaven!\n\n"
                "Tap a button below to begin your expedition across Galaxy sectors:",
                reply_markup=markup,
                parse_mode="Markdown"
            )
        except Exception as e:
            log_event(f"send_message error: {e}")

    # Send official Telegram Game card in both groups and DMs
    try:
        bot.send_game(message.chat.id, GAME_SHORT_NAME)
        log_event(f"Game card successfully sent to {message.chat.id}")
    except Exception as e:
        log_event(f"send_game error: {e}")


@bot.callback_query_handler(func=lambda c: True)
def launch_game(call):
    log_event(f"Callback received: id={call.id}, game={getattr(call, 'game_short_name', None)}, data={call.data}")
    try:
        if call.data == "show_top":
            show_top_callback(call)
            return

        res = bot.answer_callback_query(call.id, url=GAME_URL)
        log_event(f"🎮 answer_callback_query result={res}, user id: {call.from_user.id}")
    except Exception as e:
        log_event(f"❌ launch_game callback error: {e}")
        try:
            bot.answer_callback_query(call.id, url=GAME_URL)
        except Exception as e2:
            log_event(f"❌ Secondary answer_callback_query error: {e2}")


def format_top(limit=10):
    with leaderboard_lock:
        entries = list(leaderboard.values())
    if not entries:
        return None
    entries.sort(key=lambda x: (x['wave'], x['score']), reverse=True)
    medals = ["🥇", "🥈", "🥉"]
    lines = ["🏆 Leaderboard:", ""]
    for i, entry in enumerate(entries[:limit]):
        medal = medals[i] if i < 3 else f"{i+1}."
        lines.append(f"{medal} {entry['name']} — {entry['score']} pts (wave {entry['wave']})")
    return "\n".join(lines)


def show_top_callback(call):
    text = format_top()
    if not text:
        bot.answer_callback_query(call.id, "📊 No records yet!", show_alert=True)
        return
    bot.send_message(call.message.chat.id if call.message else call.from_user.id, text)
    bot.answer_callback_query(call.id)


@bot.message_handler(commands=['top'])
def send_top(message):
    bot.send_message(message.chat.id, format_top() or "📊 No records yet!")


@bot.message_handler(content_types=['web_app_data'])
def handle_web_app_data(message):
    """Score submitted via Telegram.WebApp.sendData(). The sender id comes from Telegram, not the client."""
    try:
        payload = json.loads(message.web_app_data.data)
        if not isinstance(payload, dict):
            raise ValueError("payload must be an object")
        score, wave = int(payload["score"]), int(payload["wave"])
        if not 0 <= score <= MAX_SCORE or not 0 <= wave <= MAX_WAVE:
            raise ValueError("Score out of permitted range")
        user = message.from_user
        uid = user.id
        name = re.sub(r"[\x00-\x1f]", "", user.first_name or "")[:40].strip() or "Player"

        # Sender identity is verified by Telegram; score values are still client-reported.
        with leaderboard_lock:
            prev = leaderboard.get(uid)
            improved = prev is None or (wave, score) > (prev['wave'], prev['score'])
            if improved:
                leaderboard[uid] = {'uid': uid, 'name': name, 'score': score, 'wave': wave}
                save_leaderboard()
            elif prev['name'] != name:
                prev['name'] = name
                save_leaderboard()
        log_event(f"Score from {uid}: wave {wave}, {score} pts (new best: {improved})")
        bot.send_message(message.chat.id, f"✅ Result received: {score} pts, wave {wave}" + (" — new personal best!" if improved else ""))
    except Exception as e:
        log_event(f"❌ web_app_data error: {e}")


def on_updates(updates):
    for u in updates:
        if getattr(u, 'callback_query', None):
            cb = u.callback_query
            log_event(f"⚡ [UPDATE] CallbackQuery id={cb.id}, game={getattr(cb, 'game_short_name', None)}, data={cb.data}, from={cb.from_user.id}")


bot.set_update_listener(on_updates)


if __name__ == '__main__':
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    log_event("✅ Bot started with event listener...")
    bot.infinity_polling(allowed_updates=['message', 'callback_query', 'inline_query', 'chosen_inline_result'])
