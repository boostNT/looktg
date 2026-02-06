import asyncio
import httpx
from httpx import AsyncClient
from aiogram.types import Message
from aiogram.filters import CommandStart, Command, CommandObject
from datetime import datetime, timezone, timedelta
from utils.db import *
from utils.other import *
from bot.constants import *
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.enums import ParseMode
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, LabeledPrice, BotCommand, PreCheckoutQuery, ContentType, WebAppInfo
from time import time


class GiftSearch(StatesGroup):
    viewing = State()


bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot=bot, storage=MemoryStorage())


@dp.message(CommandStart())
async def message_handler(message: Message, command: CommandObject):
    await bot.set_my_commands(commands=[
        BotCommand(command='start', description='start'),
        BotCommand(command='pay', description='Приобрести подписку'),
    ])
    uid = message.from_user.id
    unm = message.from_user.full_name
    utg = message.from_user.username
    fmt = datetime.now(timezone(timedelta(hours=3))).strftime('%Y-%m-%d %H:%M:%S')

    if command.args == 'subscription':
        r = httpx.get('https://fragment.com/stars/buy', headers=FRAGMENT_HEADERS)
        rj = r.json()
        ton_rate = rj.get('s').get('tonRate')
        stars_price = int(round((ton_rate * 10 / 1.5), 2)*100)

        prices = [LabeledPrice(label="XTR", amount=stars_price)]
        t=str(time())
        pay_url = await bot.create_invoice_link('Подписка на 30 дней', t, t, 'XTR', prices)

        pay_for_sub_kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text='Оплатить подписку',url=pay_url)]
            ])
        await message.answer(text=f'Длительность подписки: 30 дней\nСтоимость: {stars_price} ⭐️ (10 TON)\n\nНа сайте вы можете приобрести ее напрямую в тонах', reply_markup=pay_for_sub_kb)
        return


    if not await check_user_in_db(uid):
        await add_user_to_db(uid, unm, utg, fmt)


    web_app_kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text='🔍 Поиск подарков', web_app=WebAppInfo(url=f"{WEB_APP_DOMAIN}/searchnft?t={int(time())}"))]
        ])
    await message.answer('Привет! Отправь ссылку на NFT-подарок, чтобы получить информацию, или воспользуйся поиском на сайте.', reply_markup=web_app_kb)


@dp.message(Command('pay'))
async def pay_handler(message: Message):
    sub_exists, sub_until = await check_subscription(message.from_user.id)
    if sub_exists:
        await message.answer(f"У вас уже есть активная подписка, которая истечет *{sub_until[:-7]}*", reply_markup=None, parse_mode='Markdown')
        return

    uid = message.from_user.id
    r = httpx.get('https://fragment.com/stars/buy', headers=FRAGMENT_HEADERS)
    rj = r.json()
    ton_rate = rj.get('s').get('tonRate')
    stars_price = int(round((ton_rate * 10 / 1.5), 2)*100)

    prices = [LabeledPrice(label="XTR", amount=stars_price)]
    t=str(time())
    pay_url = await bot.create_invoice_link('Подписка на 30 дней', t, t, 'XTR', prices)

    pay_for_sub_kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='Оплатить подписку',url=pay_url)]
        ])
    await message.answer(text=f'Длительность подписки: 30 дней\nСтоимость: {stars_price} ⭐️ (10 TON)\n\nНа сайте вы можете приобрести ее напрямую в тонах', reply_markup=pay_for_sub_kb)


@dp.message(~CommandStart(), ~Command('pay'), ~Command('ref'), lambda msg: msg.text )
async def message_handler_all(message: Message, state: FSMContext):
    match = GIFT_SLUG_RE.search(message.text)
    web_app_kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text='🔍 Поиск подарков', web_app=WebAppInfo(url=f"{WEB_APP_DOMAIN}/searchnft?t={int(time())}"))]
        ])
    if not match:
        await message.answer("Отправьте мне ссылку на NFT-подарок, чтобы получить информацию, или воспользуйтесь поиском на сайте.", reply_markup=web_app_kb)
        return


    gift_name_slug, gift_number = match.groups()
    normalized_slug = gift_name_slug

    async with AsyncClient() as client:
        try:

            subscription_exists, _ = await check_subscription(message.from_user.id)
            if not subscription_exists:
                go_to_pay_kb = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text='Купить подписку', callback_data='go_to_pay')]
                ])
                await message.answer("Бесплатные запросы (10) закончились. Оплати подписку, или подожди сутки", reply_markup=go_to_pay_kb)
                return
            headers = {API_KEY_NAME: BOT_API_KEY}
            response = await client.get(f"{WEB_APP_DOMAIN}/api/getnftgifts?page=1&limit=10&name={normalized_slug}&number={gift_number}", headers=headers)
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])


            if not results:
                await message.answer("😕 Подарок с такой ссылкой не найден.")
                return

            if data and data.get("results"):
                gift = data["results"][0]
                gift_name = gift['name']
                gift_number = gift['number']
                gift_link = get_nft_link(gift_name, gift_number)

                owner_lines = []

                owner_info = gift.get("owner_info", [])

                for owner in owner_info:
                    if owner.get("username"):
                        owner_lines.append(f'<a href="https://t.me/{owner["username"]}">{owner.get("full_name", owner["username"])}</a>')
                    elif owner.get("ton_address"):
                        addr = owner["ton_address"]
                        short_addr = f"{addr[:5]}...{addr[-8:]}" if ".ton" not in addr else addr
                        owner_lines.append(f'<a href="https://tonviewer.com/{addr}">{short_addr}</a>')
                    elif owner.get("full_name"):
                        owner_lines.append(owner["full_name"])
                

                
                if len(owner_lines) == 2:
                    owner_info_str = owner_lines[0]
                    old_owner_info_str = owner_lines[1]
                else:
                    old_owner_info_str = ''
                    owner_info_str = owner_lines[0] if owner_lines else "Неизвестен"


                selling_lines = []
                for owner in owner_info:
                    selling_info = owner.get("selling_info")
                    if selling_info and selling_info.get("place"):
                        place, price, currency, s_id = selling_info.get("place"), selling_info.get("price"), selling_info.get("currency", "TON"), selling_info.get("id")
                        price_str = f"{convert_price(price)} {currency or 'TON'}".strip() if price is not None else "не продаётся"
                        if place in {'Fragment', 'TG Market'}:
                            if place == 'Fragment': 
                                link = f'https://fragment.com/gift/{rgn(gift_name)}-{gift_number}'
                            else:
                                link = gift_link

                        else:
                            link = {"Tonnel": f"https://market.tonnel.network/?giftDrawerId={s_id}", "MRKT": f"https://t.me/mrkt/app?startapp={s_id}", "Portals": f"https://t.me/portals/market?startapp=gift_{s_id}"}.get(place, "#")
                        selling_lines.append(f'<a href="{link}">{place} ({price_str})</a>')
                selling_info_str = (selling_lines[0]) if selling_lines else "Не выставлен на продажу"

                text = (
                    f"🎁 <a href='{gift_link}'><b>{gift['name']} #{gift['number']}</b></a>\n\n"
                    f"<b>Модель:</b> {gift.get('model', 'N/A')} ({gift.get('model_rarity', 0) / 10}%)\n"
                    f"<b>Фон:</b> {gift.get('bg', 'N/A')} ({gift.get('bg_rarity', 0) / 10}%)\n"
                    f"<b>Узор:</b> {gift.get('pattern', 'N/A')} ({gift.get('pattern_rarity', 0) / 10}%)\n\n"
                    f"👤 <b>Текущий владелец:</b> {owner_info_str}\n"
                    f'{f'👤 <b>Предыдущий владелец:</b> {old_owner_info_str}' if old_owner_info_str != '' else ""}\n\n'
                    f"🛒 <b>Маркетплейс:</b>\n{selling_info_str}"
                )
                await message.answer(text, parse_mode=ParseMode.HTML, disable_web_page_preview=True)
            else:
                await message.answer("😕 Подарок с такой ссылкой не найден в базе.")
        except Exception as e:
            print(f"API request failed: {e}")
            await message.answer("Произошла ошибка при запросе информации о подарке. Попробуйте позже.")


@dp.callback_query(lambda c: c is not None)
async def paginate_gifts(callback: CallbackQuery, state: FSMContext):
    c = callback.data
    if c == 'go_to_pay':
        uid = callback.message.from_user.id
        r = httpx.get('https://fragment.com/stars/buy', headers=FRAGMENT_HEADERS)
        rj = r.json()
        ton_rate = rj.get('s').get('tonRate')
        stars_price = int(round((ton_rate * 10 / 1.5), 2)*100)

        prices = [LabeledPrice(label="XTR", amount=stars_price)]
        t=str(time())
        pay_url = await bot.create_invoice_link('Подписка на 30 дней', t, t, 'XTR', prices)

        pay_for_sub_kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text='Оплатить подписку',url=pay_url)]
            ])

        await callback.message.edit_text(text=f'Длительность подписки: 30 дней\nСтоимость: {stars_price} ⭐️ (10 TON)\n\nНа сайте вы можете приобрести ее напрямую в тонах', reply_markup=pay_for_sub_kb)


@dp.pre_checkout_query()
async def pre_checkout_query(q: PreCheckoutQuery):
    await q.answer(ok=True)


@dp.message(lambda msg: msg.content_type == ContentType.SUCCESSFUL_PAYMENT)
async def handle_successful_payment(message: Message):
    uid=message.from_user.id
    check = message.successful_payment
    date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    
    trid = check.telegram_payment_charge_id

    await add_new_sub_to_db(uid, check.total_amount, trid)

    await message.answer(f'*Оплата прошла успешно!*\nПодписка действует до *{date}*', reply_markup=None, parse_mode='Markdown')


@dp.message(Command('ref'))
async def dep(message: Message):
    if message.from_user.id not in ADMINS:
        return
    try:
        check_id = message.text.replace('/ref ', '')
        await bot.refund_star_payment(user_id=message.from_user.id, telegram_payment_charge_id=check_id)
        await message.answer('Звезды бекнуты')
    except Exception as e:
        if 'CHARGE_ID_EMPTY' in str(e):
            await message.answer('Неверный айди транзакции.')


# async def start_sniff_new_subs():
#     old_users = []
#     pool = await asyncpg.create_pool(
#         host=DB_HOST,
#         port=DB_PORT,
#         user=DB_USER,
#         password=DB_PASS,
#         database=DB_NAME,
#         max_inactive_connection_lifetime=30,
#         max_size=20
#     )
#     async with pool.acquire() as conn:
#         while 1:
#             rows = await conn.fetch('SELECT id, utg, ufn FROM site_users')
#             now_users = []

#             for row in rows:
#                 uid, utg, ufn = row
#                 now_user = {}
#                 now_user['uid'], now_user['utg'], now_user['ufn'] = uid, utg, ufn
#                 now_users.append(now_user)


#             if now_users != old_users:
#                 old_users = now_users
#                 # new_users = [x for x in now_users if x not in old_users]
#                 new_users = [x for x in now_users if x in old_users]

#                 text = ''
#                 for user in new_users:

#                     utg_text = f'<b>@{user['utg']}</b>' if user['utg'] else '-'
#                     uid_text = f'<code>{user['uid']}</code>' if user['uid'] else '-'
#                     ufn_text = f'<b>{user['ufn']}</b>' if user['ufn'] else '-'
#                     text += f'ℹ️ <b>Новый юзер</b> ℹ️\n\n{utg_text}\n{uid_text}\n{ufn_text}\n\n'
#                 await bot.send_message(chat_id=NEW_USERS_GROUP_ID, text=text, parse_mode='HTML')
#             await asyncio.sleep(5)
            
                

async def main():
    print('\nBot started')
    await init_db()
    # asyncio.create_task(start_sniff_new_subs())
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())
