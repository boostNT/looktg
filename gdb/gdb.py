import asyncio
import sys
from pyrogram import Client
from pyrogram.errors import FloodWait
from pyrogram.types import Gift
from os import execv, name as os_name
from traceback import print_exc
from random import shuffle
from datetime import datetime as _datetime, UTC
from constants import ST, MARKETPLACES_IDS, MARKETPLACES_DICT, BATCH_SIZE, OWNER_FIELDS
from utils import rgn, get_max_numbers, convert_nano_to_normal, SESSIONS, update_market_gifts_selling_info, get_auth_tokens_for_markets, flatten_owner_info, update_portals_gifts_ids_data
from db import *


global_max_numbers = {} 
sem = asyncio.Semaphore(8)
# CLIENT_LOCKS = {}


class RestartRequired(Exception):
    def __init__(self, reason):
        self.reason = reason
        super().__init__(f"Restart required: {reason}")


async def update_max_numbers(pool, client_session_name, extra_name): # проверяет, не вышли ли новые подарки
    client = Client(f"sessions/{client_session_name}", fetch_stickers=0, fetch_topics=0, fetch_stories=0, fetch_replies=0, skip_updates=1, no_updates=1, sleep_threshold=60, max_concurrent_transmissions=8,)
    while True:
        try:
            new_max_numbers = await get_max_numbers(pool, client, parse_from_first=False)
            global global_max_numbers
            global_max_numbers = new_max_numbers

            if new_max_numbers is not None and len(new_max_numbers) != len(global_max_numbers):
                new_gifts = {name: data for name, data in new_max_numbers.items() if name not in global_max_numbers}
                if new_gifts:
                    print(f'[ NEW GIFTS ]: {new_gifts}')
                    tasks = [collect_gifts_for_session(extra_name, [n for n in new_gifts.keys()], pool)]
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    await update_portals_gifts_ids_data()
                    for result in results:
                        if isinstance(result, RestartRequired):
                            raise result
                    python = sys.executable
                    execv(python, [python] + sys.argv)

            print(f'✅ global_max_numbers обновлен: {len(global_max_numbers)} ({len(new_max_numbers)} подарков')
        except Exception as e:
            print(f'💥 ошибка при обновлении global_max_numbers: {e}')
        await asyncio.sleep(900)
    

async def save_to_db_batch(conn, gift_data_batch): # сохраняет батч из подарков в бд
    try:
        async with conn.transaction():
            updates = []
            inserts = []
            gift_ids = [gift[0] for gift in gift_data_batch]
            query = f"SELECT id, {', '.join(f'owner_{f}_1' for f in OWNER_FIELDS)}, {', '.join(f'owner_{f}_2' for f in OWNER_FIELDS)} FROM gifts WHERE id = ANY($1::bigint[])"
            existing_gifts = await conn.fetch(query, gift_ids)
            existing_map = {g['id']: {f: g[f'owner_{f}_1'] for f in OWNER_FIELDS} for g in existing_gifts}
            
            for gift_data in gift_data_batch:
                gift_id = gift_data[0]
                new_owner_info = gift_data[10]
                if not isinstance(new_owner_info, dict):
                    continue
                    
                flat_new_owner_info = flatten_owner_info(new_owner_info)
                
                if 'error' in new_owner_info:
                    inserts.append((
                        gift_data[0], gift_data[1], gift_data[2], gift_data[3], gift_data[4],
                        gift_data[5], gift_data[6], gift_data[7], gift_data[8], gift_data[9],
                        *[flat_new_owner_info.get(f) for f in OWNER_FIELDS]
                    ))
                    continue
                    
                if gift_id in existing_map:
                    current_owner = existing_map[gift_id]
                    
                    is_new_owner = any(
                        current_owner.get(f) != flat_new_owner_info.get(f) 
                        for f in OWNER_FIELDS 
                        if f != 'updated_at'
                    )

                    owner_values_1 = [flat_new_owner_info.get(f) for f in OWNER_FIELDS]
                    owner_values_2 = [current_owner.get(f) for f in OWNER_FIELDS]
                    
                    if not current_owner or is_new_owner:
                        updates.append((*owner_values_1, *owner_values_2, gift_id))
                        # print(f'🔄 OWNER CHANGED: {gift_data[1]}-{gift_data[2]}')
                    else:
                        updated_owner_values = list(current_owner.values())
                        updated_at_index = OWNER_FIELDS.index('updated_at')
                        updated_owner_values[updated_at_index] = flat_new_owner_info.get('updated_at')


                        existing_map2 = {g['id']: {f: g[f'owner_{f}_2'] for f in OWNER_FIELDS} for g in existing_gifts}
                        owner_values_2 = [existing_map2[gift_id].get(f) for f in OWNER_FIELDS]

                        updates.append((*updated_owner_values, *owner_values_2, gift_id))
                else:
                    inserts.append((
                        gift_data[0], gift_data[1], gift_data[2], gift_data[3], gift_data[4],
                        gift_data[5], gift_data[6], gift_data[7], gift_data[8], gift_data[9],
                        *[flat_new_owner_info.get(f) for f in OWNER_FIELDS]
                    ))
                    
            if inserts:
                await conn.executemany(
                    f"""
                    INSERT INTO gifts (
                        id, name, number, model, bg, pattern, model_rarity, bg_rarity, pattern_rarity, fetched_at,
                        {', '.join(f'owner_{f}_1' for f in OWNER_FIELDS)}
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, {', '.join(f'${i}' for i in range(11, 11 + len(OWNER_FIELDS)))})
                    ON CONFLICT (name, number) DO UPDATE SET
                        id = EXCLUDED.id,
                        fetched_at = EXCLUDED.fetched_at,
                        {', '.join(f'owner_{f}_1 = EXCLUDED.owner_{f}_1' for f in OWNER_FIELDS)}
                    """,
                    inserts
                )
                # print(f'[ INSERTS ] {inserts[0][1]}: {inserts[0][2]}-{inserts[-1][2]} (count: {len(inserts)})')
                
            if updates:
                await conn.executemany(
                    f"UPDATE gifts SET {', '.join(f'owner_{f}_1 = ${i}' for i, f in enumerate(OWNER_FIELDS, 1))}, {', '.join(f'owner_{f}_2 = ${i}' for i, f in enumerate(OWNER_FIELDS, len(OWNER_FIELDS) + 1))} WHERE id = ${2 * len(OWNER_FIELDS) + 1}",
                    updates
                )
                # print(f'[ UPDATES ] {len(updates)} records updated')
                
    except Exception as e:
        print(f"💥 Ошибка при сохранении: {e}")
        print_exc()


async def fetch_gift(client: Client, name: str, index: int): #парсит подарок в нужном формате
    async with sem:
    #     conn = await pool.acquire()
        try:
            raw_name = rgn(name)
            link = f"https://t.me/nft/{raw_name}-{index}"
            fetched_at = _datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")


            # lock = CLIENT_LOCKS.setdefault(client.name, asyncio.Lock())
            # async with lock:
            gift: Gift = await client.get_upgraded_gift(link)

            gift_id = int(gift.id)
            comment = gift.attributes[3] if len(gift.attributes) > 3 else None
            hidden = bool(not(gift.owner))

            on_sale = True if hasattr(gift.owner, 'id') and gift.owner.id in MARKETPLACES_IDS else False
            market_id = None

            if on_sale:
                market_id = gift.owner.id
            if gift.gift_address:
                on_sale = True
                market_id = 6549302342


            if gift.raw.resell_amount:
                on_sale = True
                gift_currency = 'TON' if gift.raw.resale_ton_only else 'Stars'
                sale_price = convert_nano_to_normal(gift.raw.resell_amount[1].amount) if gift.raw.resale_ton_only else gift.raw.resell_amount[0].amount
                market_id = 42777


            owner_info = {
                "updated_at": int(_datetime.now(UTC).timestamp()),
                "id": gift.owner.id if (not hidden) else None,
                "username": gift.owner.username if (not hidden) else None,
                "full_name": (gift.owner.full_name if gift.owner else None) or gift.owner_name,
                "ton_address": gift.owner_address if getattr(gift, 'owner_address', None) else None,
                "gift_address": gift.gift_address if getattr(gift, 'owner_address', None) else None,
                "from_user": {
                    'id': comment.from_user.id if comment and comment.from_user else None,
                    'username': comment.from_user.username if comment and comment.from_user else None,
                    'full_name': comment.from_user.full_name if comment and comment.from_user else None
                } if comment and getattr(comment, 'from_user', None) else None,
                "to_user": {
                    'id': comment.to_user.id if comment and comment.to_user else None,
                    'username': comment.to_user.username if comment and comment.to_user else None,
                    'full_name': comment.to_user.full_name if comment and comment.to_user else None
                } if comment and getattr(comment, 'to_user', None) else None,
                "comment": comment.caption if comment else None,
                'channel_id': gift.raw.owner_id.channel_id if gift.raw.owner_id and gift.raw.owner_id.QUALNAME == 'types.PeerChannel' else None,
                "hidden": bool(not(gift.owner)),
                "selling_info": {'place': MARKETPLACES_DICT[market_id]['name'], 'status': False} if on_sale and market_id != 42777 else {'place': MARKETPLACES_DICT[market_id]['name'], 'price': float(sale_price), 'currency': gift_currency} if on_sale else None
            }

            return gift_id, (
                gift_id,
                gift.title,
                gift.collectible_id,
                gift.attributes[0].name,
                gift.attributes[2].name,
                gift.attributes[1].name,
                gift.attributes[0].rarity,
                gift.attributes[2].rarity,
                gift.attributes[1].rarity,
                fetched_at,
                owner_info
            )
        
        except FloodWait as e:
            await asyncio.sleep(e.value + 1)
            return await fetch_gift(client, name, index) 


        except Exception as e: # проверка на сожжёный подарок 
            if 'SLUG_INVALID' in str(e):
                try:
                    # lock = CLIENT_LOCKS.setdefault(client.name, asyncio.Lock())
                    # async with lock:
                    tg = await client.get_upgraded_gift(f"https://t.me/nft/{raw_name}-1")
                    if tg.max_upgraded_count < index:
                        return
                    try:
                        # async with lock:
                        tgg = await client.get_upgraded_gift(f"https://t.me/nft/{raw_name}-{index}")
                        if tgg:
                            return await fetch_gift(client, raw_name, index)
                    except Exception as ___exxx:
                        if 'SLUG_INVALID' in str(___exxx):
                            gd = None, (None, name, index, None, None, None, None, None, None, fetched_at, {'updated_at': int(_datetime.now(UTC).timestamp()), 'error': 'SLUG_INVALID (exists)'})
                            return gd
                except Exception as ex:
                    print(f"[SLUG_FAIL] {raw_name}-{index}")
                    gd = None, (None, name, index, None, None, None, None, None, None, fetched_at, {'updated_at': int(_datetime.now(UTC).timestamp()), 'error': 'SLUG_INVALID (exists)'})
                    return gd
            else:
                print(f'Unic error: {e}. Initiating restart...')
                raise RestartRequired(f"Unic error in fetch_gift: {e}")
        # finally:
            # await pool.release(conn)
    

async def collect_gifts_for_session(session_name, gift_names: list, pool): # бесконечно парсит подарки на одной сессии
    client = Client(
        f"sessions/{session_name}",
        api_id=SESSIONS[session_name]['id'],
        api_hash=SESSIONS[session_name]['hash'],
        fetch_stickers=0, fetch_topics=0, fetch_stories=0, fetch_replies=0,
        skip_updates=1, no_updates=1, sleep_threshold=60,
        max_concurrent_transmissions=8
    ) if session_name in SESSIONS else Client(
        f"sessions/{session_name}",
        fetch_stickers=0, fetch_topics=0, fetch_stories=0, fetch_replies=0,
        skip_updates=1, no_updates=1, sleep_threshold=60,
        max_concurrent_transmissions=8
    )
    conn = await pool.acquire()
    try:
        async with client:
            while True: 
                try:
                    for name in gift_names:
                        try:
                            name = name.replace("'", "’")
                            if name not in global_max_numbers:
                                continue

                            start_number, max_number = global_max_numbers[name][0] + 1, global_max_numbers[name][1]
                            numbers_to_check = []

                            if max_number <= start_number + 50:
                                old_gifts = await conn.fetch(
                                    "SELECT number FROM gifts WHERE name = $1 AND model IS NOT NULL ORDER BY owner_updated_at_1 ASC NULLS LAST LIMIT $2",
                                    name, max_number + 1
                                )
                                numbers_to_check = [g['number'] for g in old_gifts]
                                print(f'Обновляю старые: {name} {start_number}→{max_number} ({len(numbers_to_check)} шт')
                            else:
                                print(f'Собираю новые: {name} {start_number}→{max_number} ({max_number - start_number + 1} шт)')
                                numbers_to_check = list(range(start_number, max_number + 1))

                            # print(f'[ COLLECTING ] {session_name} : {name} — {len(numbers_to_check)} шт')

                            tasks = []
                            gift_data_batch = []

                            for i in numbers_to_check:
                                tasks.append(fetch_gift(client, name, i))
                                if len(tasks) >= BATCH_SIZE:
                                    results = await asyncio.gather(*tasks, return_exceptions=True)
                                    tasks.clear()

                                    for res in results:
                                        if isinstance(res, tuple) and res[0]:
                                            gift_data_batch.append(res[1])
                                        elif isinstance(res, RestartRequired):
                                            if gift_data_batch:
                                                await save_to_db_batch(conn, gift_data_batch)
                                            raise res
                                        elif isinstance(res, Exception):
                                            print(f'Ошибка: {res}')

                                    if len(gift_data_batch) >= BATCH_SIZE:
                                        await save_to_db_batch(conn, gift_data_batch)
                                        gift_data_batch.clear()

                                    await asyncio.sleep(ST)

                            if tasks:
                                results = await asyncio.gather(*tasks, return_exceptions=True)
                                for res in results:
                                    if isinstance(res, tuple) and res[0]:
                                        gift_data_batch.append(res[1])
                                    elif isinstance(res, RestartRequired):
                                        if gift_data_batch:
                                            await save_to_db_batch(conn, gift_data_batch)
                                        raise res

                                if gift_data_batch:
                                    await save_to_db_batch(conn, gift_data_batch)

                            await asyncio.sleep(ST)

                        except RestartRequired:
                            raise
                        except Exception as e:
                            print(f'Ошибка в name {name}: {e}')
                        # finally:
                        #     await pool.release(conn)

                    print(f'Круг завершён для {session_name}. Жду {ST} сек и снова...')
                    await asyncio.sleep(ST * 2) 

                except RestartRequired as e:
                    print(f'Рестарт: {e.reason}')
                    raise
                except Exception as e:
                    print(f'Критическая ошибка в сессии {session_name}: {e}')
                    await asyncio.sleep(10)
    finally:
        await pool.release(conn)  


async def collect_all_gifts(pool): # запускает и распределяет парсинг подарков по сессиям
    packed_gifts_dict = distribute_dict_into_packs(global_max_numbers, len(SESSIONS))

    session_tasks = []

    for i, (session_name, _) in enumerate(SESSIONS.items()):
        session_gift_names = packed_gifts_dict[i]

        task = collect_gifts_for_session(
            session_name,
            session_gift_names,
            pool
        )
        session_tasks.append(task)

    
    results = await asyncio.gather(*session_tasks, return_exceptions=True)
    for result in results:
        if isinstance(result, RestartRequired):
            raise result


def distribute_dict_into_packs(dictionary, num_packs): # распределяет подарки между сессиями для равномерного парсинга (чтобы не было ситуации, в которой одна сессия парсит 10к подарков, а вторая 300к)

    if num_packs <= 0:
        return [[]]
    
    sorted_items = sorted(dictionary.items(), key=lambda x: (x[1][1] - x[1][0], x[1][1]))
    
    packs = [[] for _ in range(num_packs)]
    pack_loads = [0] * num_packs 
    
    for key, (min_num, max_num) in sorted_items:
        gifts_to_parse = max(0, max_num - min_num + 1)
        
        min_pack_index = pack_loads.index(min(pack_loads))
        
        packs[min_pack_index].append(key)
        pack_loads[min_pack_index] += gifts_to_parse
    for i in range(len(packs)):
        packs[i] = sorted(packs[i], key=lambda name: dictionary[name][0], reverse=False) # Логика может меняться в зависимости от обстоятельств: когда-то нужно начать собирать новые подарки, а когда-то быстрее обновлять старые
    return packs


async def init_loading(): # старт программы
    global global_max_numbers, extra_session_for_new_mints
    pool = None
    try:
        pool = await init_db()
        while True:
            try:


                if os_name == 'posix': 
                    import uvloop # type: ignore
                    uvloop.install()
                    
                if os_name == 'nt':
                    pass
                print('🚀 Запускаю сбор подарков...')
                asyncio.create_task(update_gifts_params(pool))

                global_max_numbers = {}
                
                session_keys = list(SESSIONS.keys())
                shuffle(session_keys)
                if len(session_keys) < 3:
                    print('💥 Ошибка: недостаточно сессий для работы. Требуется как минимум 3.')
                    await asyncio.sleep(60)
                    continue

                updating_session_name = session_keys[-1] # сессия для обновления информации обо всех подарках
                extra_session_for_new_mints = session_keys[-2] # сессия для экстренного сбора информации о только что вышедших подарках
                for_low_supplies_session_name = session_keys[-3] # сессия для обновления подарков с маленьким саплаем 

                SESSIONS.pop(updating_session_name)
                SESSIONS.pop(extra_session_for_new_mints)
                SESSIONS.pop(for_low_supplies_session_name)

                global_max_numbers = await get_max_numbers(pool, Client(f"sessions/{updating_session_name}", fetch_stickers=0, fetch_topics=0, fetch_stories=0, fetch_replies=0, skip_updates=1, no_updates=1, sleep_threshold=60, max_concurrent_transmissions=8), parse_from_first=False)
                asyncio.create_task(update_max_numbers(pool, updating_session_name, extra_session_for_new_mints))

                
                low_supply_gifts = {name: data for name, data in global_max_numbers.items() if data[1] < 5000}
                high_supply_gifts = {name: data for name, data in global_max_numbers.items() if data[1] >= 5000}

                
                packed_gifts_dict = distribute_dict_into_packs(high_supply_gifts, len(SESSIONS))
                pizdaaaa = distribute_dict_into_packs(low_supply_gifts, 1)
                session_tasks = []
                for i, (session_name, _) in enumerate(SESSIONS.items()):
                    session_gift_names = packed_gifts_dict[i]
                    task = collect_gifts_for_session(session_name, session_gift_names, pool)
                    session_tasks.append(task)

                low_supply_task = collect_gifts_for_session(for_low_supplies_session_name, pizdaaaa[0], pool)


                # PORTALS_TOKENS = await get_auth_tokens_for_markets(7804544881)
                MRKT_TOKENS = await get_auth_tokens_for_markets(8184312603)
                MARKET_TOKENS = {"Portals": None, "MRKT": MRKT_TOKENS} # если токен для порталса обязателен и без него не шлются запросы, то встатвьте его


                await asyncio.gather(
                    *session_tasks, low_supply_task,
                    update_market_gifts_selling_info(pool, MARKET_TOKENS),
                )
                await asyncio.sleep(120)
            except RestartRequired as e:
                raise
            except Exception as e:
                print('💥 Ошибка во время работы:')
                print_exc()
    finally:
        if pool:
            # await pool.close()
            print('Пул БД закрыт')
        print('Перезапускаю скрипт...')
        python = sys.executable
        execv(python, [python] + sys.argv)


if __name__ == "__main__":
    asyncio.run(init_loading())