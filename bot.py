import json
import os
import re
import urllib.parse
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
                result[uid] = {"uid": uid, "name": str(entry.get("name", "Игрок"))[:40], "score": score, "wave": wave}
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
            f.write(line + "\\n")
    except OSError:
        pass

@bot.message_handler(commands=['start', 'game'], chat_types=['private', 'group', 'supergroup'])
def send_game(message):
    log_event(f"Получена команда {message.text} в чате {message.chat.id} (тип: {message.chat.type})")
    
    # В личных сообщениях: настраиваем меню-кнопку и отправляем меню запуска
    if message.chat.type == 'private':
        try:
            bot.set_chat_menu_button(
                message.chat.id,
                types.MenuButtonWebApp(type="web_app", text="🎮 Играть", web_app=types.WebAppInfo(url=GAME_URL))
            )
        except Exception as e:
            log_event(f"Menu button warning: {e}")

        try:
            markup = types.InlineKeyboardMarkup(row_width=1)
            btn_webapp = types.InlineKeyboardButton("🚀 Играть прямо в Telegram", web_app=types.WebAppInfo(url=GAME_URL))
            btn_browser = types.InlineKeyboardButton("🌐 Открыть в браузере", url=GAME_URL)
            btn_top = types.InlineKeyboardButton("🏆 Таблица рекордов", callback_data="show_top")
            markup.add(btn_webapp, btn_browser, btn_top)
            bot.send_message(
                message.chat.id,
                "🌌 **VOID HUNTER** — Космический roguelite-шутер!\n\n"
                "Нажмите кнопку ниже, чтобы начать экспедицию по секторам Галактики:",
                reply_markup=markup,
                parse_mode="Markdown"
            )
        except Exception as e:
            log_event(f"send_message error: {e}")

    # И в группах, и в ЛС отправляем официальную карточку игры Telegram Game
    # В группе игра запускается прямо поверх группы по кнопке 'Play Void Hunter'!
    try:
        bot.send_game(message.chat.id, GAME_SHORT_NAME)
        log_event(f"Карточка игры успешно отправлена в {message.chat.id}")
    except Exception as e:
        log_event(f"send_game error: {e}")

@bot.callback_query_handler(func=lambda c: True)
def launch_game(call):
    log_event(f"Callback received: id={call.id}, game={getattr(call, 'game_short_name', None)}, data={call.data}")
    try:
        if call.data == "show_top":
            show_top_callback(call)
            return

        user_id = call.from_user.id
        chat_id = call.message.chat.id if call.message else user_id
        name = urllib.parse.quote(call.from_user.first_name or 'Игрок')
        url = f"{GAME_URL}?uid={user_id}&cid={chat_id}&name={name}"
        res = bot.answer_callback_query(call.id, url=url)
        log_event(f"🎮 answer_callback_query result={res}, user={call.from_user.first_name} (id: {user_id}), url={url}")
    except Exception as e:
        log_event(f"❌ Ошибка launch_game callback: {e}")
        try:
            bot.answer_callback_query(call.id, url=GAME_URL)
        except Exception as e2:
            log_event(f"❌ Ошибка повторного answer_callback_query: {e2}")

def show_top_callback(call):
    if not leaderboard:
        bot.answer_callback_query(call.id, "📊 Пока никто не играл!", show_alert=True)
        return
    sorted_lb = sorted(leaderboard.values(), key=lambda x: (x['wave'], x['score']), reverse=True)
    text = "🏆 Таблица рекордов:\n\n"
    medals = ["🥇", "🥈", "🥉"]
    for i, entry in enumerate(sorted_lb[:10]):
        medal = medals[i] if i < 3 else f"{i+1}."
        text += f"{medal} {entry['name']} — {entry['score']} очков (волна {entry['wave']})\n"
    bot.send_message(call.message.chat.id, text)
    bot.answer_callback_query(call.id)

@bot.message_handler(func=lambda message: message.text and message.text.startswith('__'))
def handle_game_messages(message):
    text = message.text

    # Обработка результата игры
    if text.startswith('__score__'):
        try:
            # Формат: __score__uid|name|score|wave
            parts = text.replace('__score__', '').split('|')
            uid = int(parts[0])
            name = re.sub(r"[\\x00-\\x1f|]", "", urllib.parse.unquote(parts[1]))[:40].strip() or "Игрок"
            score = int(parts[2])
            wave = int(parts[3])
            if uid <= 0 or not 0 <= score <= MAX_SCORE or not 0 <= wave <= MAX_WAVE:
                raise ValueError("Результат вне допустимого диапазона")

            # Client-submitted results are validated for format/range, not cryptographically verified.
            if uid not in leaderboard or wave > leaderboard[uid]['wave'] or (wave == leaderboard[uid]['wave'] and score > leaderboard[uid]['score']):
                leaderboard[uid] = {
                    'uid': uid,
                    'name': name,
                    'score': score,
                    'wave': wave
                }
                save_leaderboard()
                print(f"Результат сохранён: волна {wave}, {score} очков")
        except Exception as e:
            print(f"❌ Ошибка обработки результата: {e}")

    # Запрос таблицы лидеров
    elif text.startswith('__get_leaderboard__'):
        try:
            # Извлечь uid запрашивающего
            requesting_uid = None
            if len(text) > len('__get_leaderboard__'):
                try:
                    requesting_uid = int(text.replace('__get_leaderboard__', ''))
                except:
                    pass

            # Подготовить данные таблицы
            leaderboard_data = []
            for entry in leaderboard.values():
                leaderboard_data.append({
                    'uid': entry['uid'],
                    'name': entry['name'],
                    'wave': entry['wave'],
                    'score': entry['score']
                })

            # Отправить JSON с таблицей
            response_text = f"__leaderboard__{json.dumps(leaderboard_data)}"
            bot.send_message(message.chat.id, response_text)
            print(f"📊 Отправлена таблица лидеров ({len(leaderboard_data)} игроков)")
        except Exception as e:
            print(f"❌ Ошибка отправки таблицы: {e}")

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
    log_event("✅ Бот запущен с расширенным слушателем событий...")
    bot.infinity_polling(allowed_updates=['message', 'callback_query', 'inline_query', 'chosen_inline_result'])