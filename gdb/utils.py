import json
import asyncio
import random
import re
from math import ceil, floor
from urllib.parse import unquote
from pyrogram import Client
from pyrogram.raw.functions.messages import RequestAppWebView
from pyrogram.raw.types import InputBotAppShortName, InputUser, StarGift
from constants import MARKETPLACES_DICT, TONNEL_API_URL, IMPERSONATE_LIST, LEN_OF_MARKET_GIFTS_DATA_BATCH, MARKETPLACES_IDS, MRKT_API_URL, PORTALS_API_URL, TONNEL_HEADERS, BATCH_SIZE, OWNER_FIELDS, PORTALS_GIFTS_IDS_DATA
from curl_cffi import AsyncSession
from datetime import datetime, UTC
from fake_useragent import UserAgent


async def get_sessions_data(): # для корректной работы с сессиями
    global SESSIONS
    import os
    SESSIONS = {}
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_dir = os.path.join(script_dir, 'sessions')
    dir_list = os.listdir(source_dir)
    for f in dir_list:
        file_name = f.split('.')[0]
        if file_name.isdigit():
            continue
        api_hash = None
        api_id = None
        if f'{file_name}.json' in dir_list or f'{file_name.replace('_pyrogram', '')}.json' in dir_list:
            try:
                json_path = f'{file_name.replace('_pyrogram','')}.json' if '_pyrogram' in file_name else f'{file_name}.json'
                with open(os.path.join(source_dir, json_path), 'r') as f:
                    js = json.load(f)
            except: 
                js = {}
            api_id = js.get('app_id')
            api_hash = js.get('app_hash')

        SESSIONS[file_name] = {'id': api_id, 'hash': api_hash}
    del os


asyncio.get_event_loop().run_until_complete(get_sessions_data())


async def get_gift_names(pool): # берет текущие подарки
    try:
        async with AsyncSession() as s:
            r = await s.get('https://cdn.changes.tg/gifts/id-to-name.json', verify=1, headers={"cache-control": "no-cache"}, impersonate='chrome')
        rj = r.json()
        if rj:
            lst = [rgnv3(v) for v in rj.values()]
        else:
            raise
        
        return lst
    except Exception as e:
        if 'curl: (35)' in str(e):
            async with AsyncSession() as s:
                r = await s.get('https://api.changes.tg/ids', verify=False, headers={"cache-control": "no-cache"}, impersonate='chrome')
            rj = r.json()
            if rj:
                lst = [rgnv3(v) for v in rj.values()]
            else:
                raise
            
            return lst
            
        if 'curl: (28)' in str(e):
            try:
                async with AsyncSession() as s:
                    r = await s.get('https://api.changes.tg/ids', headers={"cache-control": "no-cache"}, impersonate='chrome')
                rj = r.json()
                if rj:
                    lst = [rgnv3(v) for v in rj.values()]
                else:
                    raise
                print('d ffaafs', lst, len(lst))
                
                return lst
            except Exception as _e:
                print('get_gift_names: ',e)
    
    if not lst:
        async with pool.acquire() as conn:
            rows = await conn.fetch('SELECT name FROM gifts_names')
            return {"names": [row['name'] for row in rows]}
    return lst


async def _get_upgraded_gift(client: Client, name, i=1) -> StarGift:
    try:
        link = f"t.me/nft/{rgn(name)}-{i}"
        g = await client.get_upgraded_gift(link)
        return g
    except Exception as e:
        if 'STARGIFT_SLUG_INVALID' in str(e):
            return await _get_upgraded_gift(client, name, i=i+1)
        print(f'Ошибка для {link}: {e}')


async def get_max_numbers(pool, client: Client, parse_from_first = False): # обновляет инфу о подарках (максимальное число до которого их сминтили)
    gift_names = await get_gift_names(pool)
    ret = {}
    minnum = None
    async with pool.acquire() as conn, client:
        try:
            rows = await conn.fetch("""SELECT
        name,
        MAX(number) AS max
    FROM gifts
    GROUP BY name;""")
        except Exception as e:
            print(e)
        for row in rows:
            minnum = row['max']
            if parse_from_first:
                minnum = 0
            
            try:
                g = await _get_upgraded_gift(client, row['name'])
                maxnum = g.max_upgraded_count or g.available_amount or g.number 
                if maxnum < minnum:
                    maxnum = minnum
                ret[row['name']] = (minnum, maxnum)
            except Exception as e:
                print(f'Ошибка для {name}: {e}')

        for name in ({n for n in gift_names} - set(ret.keys())):
            try:
                minnum = 0
                target_gift = [x for x in (await client.get_available_gifts()) if x.title == name][0]
                if target_gift.raw.auction != False and target_gift.raw.availability_remains == target_gift.raw.availability_total:
                    continue
                g = await _get_upgraded_gift(client, name)
                maxnum = g.max_upgraded_count or g.available_amount or g.number 
                if maxnum < minnum:
                    maxnum = minnum
                ret[name] = (minnum, maxnum+2)
            except Exception as e:
                print(f"⚠️ Ошибка для {name}: {e}")
    return ret 


async def update_market_gifts_selling_info(pool, tokens): # запускает и распределяет парсинг подарков на маркетах
    print('Маркеты начали парситься')
    while True:
        async with pool.acquire() as conn:

            goal_marketplace_id = random.sample(sorted(MARKETPLACES_IDS), 1)[0]
            goal_marketplace_name = MARKETPLACES_DICT[goal_marketplace_id]['name']

            tasks = []
            gifts_slatt_data_batch = {}

            try:
                if goal_marketplace_name == 'Fragment':
                    gifts = await conn.fetch("""
                        SELECT id, name, number, model, bg, pattern
                        FROM gifts
                        WHERE owner_sale_status_1 = FALSE
                        AND owner_sale_place_1 = 'Fragment'
                        LIMIT $1
                        FOR UPDATE SKIP LOCKED;
                    """, BATCH_SIZE)
                else:
                    gifts = await conn.fetch("""
                        SELECT id, name, number, model, bg, pattern
                        FROM gifts
                        WHERE owner_sale_status_1 = FALSE
                        AND owner_id_1 = $1
                        LIMIT $2
                        FOR UPDATE SKIP LOCKED;
                    """, goal_marketplace_id, BATCH_SIZE)
            except Exception as e:
                print(e)

            ids = [gift['id'] for gift in gifts]

            await conn.execute("""
                UPDATE gifts
                SET owner_sale_status_1 = TRUE
                WHERE id = ANY($1::bigint[])
            """, ids)

            for gift in gifts:
                gift_name = rgnv2(gift['name'])
                gift_data = {
                    'model': rgnv2(gift['model']),
                    'backdrop': gift['bg'],
                    'symbol': rgnv2(gift['pattern']),
                    'number': gift['number'],
                    'id': gift['id']
                }
                if gift_name not in gifts_slatt_data_batch:
                    gifts_slatt_data_batch[gift_name] = []
                gifts_slatt_data_batch[gift_name].append(gift_data)
                if len(gifts_slatt_data_batch[gift_name]) >= LEN_OF_MARKET_GIFTS_DATA_BATCH:
                    tasks.append(
                        process_selling_gift_data_batch(
                            pool, 
                            gifts_slatt_data_batch[gift_name], 
                            name=gift_name, 
                            market=goal_marketplace_name,
                            tokens=tokens
                        )
                    )
                    gifts_slatt_data_batch[gift_name] = [] 
            if not gifts:
                await asyncio.sleep(3)
                continue
            if tasks:
                print(f'{goal_marketplace_name} started')
                await asyncio.gather(*tasks, return_exceptions=True)
                await asyncio.sleep(10)


async def process_selling_gift_data_batch(pool, gift_data, name=None, market=None, tokens=None): # процесс парсинга подарков на маркетах
    if not gift_data:
        return
    try:
        gift_data_len = len(gift_data)

        if market == 'Tonnel':
            gift_data_numbers = [g['number'] for g in gift_data]
            sort_data = {
                'message_post_time': -1,
                'gift_id': -1
            }
            models_regex_list = {"$regex":f"^({'|'.join([m for m in {gift_data[i]['model'] for i in range(gift_data_len)}])})", "$options": "i"}
            bgs_regex_list = {"$regex":f"^({'|'.join([b for b in {gift_data[i]['backdrop'] for i in range(gift_data_len)}])})", "$options": "i"}
            symbols_regex_list = {"$regex":f"^({'|'.join([s for s in {gift_data[i]['symbol'] for i in range(gift_data_len)}])})", "$options": "i"}
            filter_data = {
                'gift_name': name,
                'model': models_regex_list,
                'backdrop': bgs_regex_list,
                'symbol': symbols_regex_list,
                }


            json_data = {
                'limit':30,
                'page':1,
                'ref': 0,
                'sort': json.dumps(sort_data),
                'filter': json.dumps(filter_data),
                'price_range': None,
                'user_auth':''
            }

            for attempt in range(4):
                try:
                    async with AsyncSession() as s:
                        r=await s.post(TONNEL_API_URL, json=json_data, impersonate=random.choice(IMPERSONATE_LIST,), headers=TONNEL_HEADERS)
                    if r.status_code == 429:
                        await asyncio.sleep(60)
                        continue
                    rj=r.json()

                    if not rj:
                        return []

                    rj = filter_tonnel_gifts(rj, gift_data_numbers) if len(rj) > LEN_OF_MARKET_GIFTS_DATA_BATCH else rj
                    selling_infos = []
                    for market_gift in rj:
                        price = market_gift.get('price', None)
                        if price != None: price *= 1.06
                        price = convert_price(price)
                        selling_info = {
                            'place': 'Tonnel',
                            'price': price,
                            'currency': market_gift['asset'],
                            'id': str(market_gift["gift_id"]) if market_gift['gift_id'] else None,
                            'on_sale': bool(price)
                        }
                        selling_infos.append((name, market_gift['gift_num'], selling_info))

                    if selling_infos:
                        await asyncio.gather(*(insert_gift_sale_info(info, pool, name=name, number=num) for name, num, info in selling_infos))
                        break

                except Exception as e:
                    print('tonnel fuckup', e)
                    await asyncio.sleep(60)
                    if attempt == 3:
                        print('^-^')
                        return []
                    continue
                break

        if market == 'Portals': 
            gift_data_ids = {g['number'] for g in gift_data}
            modelNames = [rgnv3(m.replace(' ','+')) for m in {gift_data[i]['model'] for i in range(gift_data_len)}]
            symbolNames = [rgnv3(s.replace(' ','+')) for s in {gift_data[i]['symbol'] for i in range(gift_data_len)}]
            backdropNames = [b.replace(' ','+') for b in {gift_data[i]['backdrop'] for i in range(gift_data_len)}]

            # headers = {'Authorization': random.choice(tokens[market])}
            headers=None

            # collection_ids = await get_portals_gift_id(name, headers)
            # if not collection_ids:
                # return []

            collection_ids = PORTALS_GIFTS_IDS_DATA[name]
            params = f'&collection_ids={collection_ids}&filter_by_backdrops={','.join([b for b in backdropNames])}&filter_by_models={','.join([m for m in modelNames])}&filter_by_symbols={','.join([s for s in symbolNames])}'
            for attempt in range(4):
                try:
                    link = f'{PORTALS_API_URL}/nfts/search?offset=0&limit=50{params}'
                    async with AsyncSession() as s:
                        r=await s.get(link, headers=headers, impersonate='chrome')
                    if r.status_code in {429, 503}:
                        await asyncio.sleep(80)
                        continue
                    rj=r.json()
                    if not rj or rj.get('results', None) is None:
                        await asyncio.sleep(80)
                        continue

                    if rj:
                        selling_infos = []
                        if rj.get('results'):
                            rj = filter_portals_gifts(rj['results'], gift_data_ids)

                            if not rj:
                                return []


                            for market_gift in rj:
                                price = market_gift.get('price', None)
                                price = convert_price(price)
                                selling_info = {
                                    'place': 'Portals',
                                    'price': price,
                                    'id': market_gift["id"],
                                    'on_sale': True if market_gift['status'] == 'listed' else False,
                                    'currency': 'TON'
                                }
                                selling_infos.append((name, market_gift['external_collection_number'], selling_info)) 

                            if selling_infos:
                                await asyncio.gather(*(insert_gift_sale_info(info, pool, name=name, number=num) for name, num, info in selling_infos))
                                break

                    else:
                        print('Portals2')
                except Exception as e:
                    if 'Failed to perform, curl: (6) Could not resolve host: portals-market.com. See https://curl.se/libcurl/c/libcurl-errors.html first for more details.' in str(e):
                        print('portals fuckup dnss')
                        return []
                    print(f'portals fuckup {e, r.json(), gift_data} ')
                    await asyncio.sleep(80)
                    if attempt == 4:
                        print('^-^')
                        return []
                    continue


        if market == 'MRKT':
            headers = {'Authorization': random.choice(tokens[market])}
            
            gift_data_ids = [g['id'] for g in gift_data]
            modelNames = [m for m in {gift_data[i]['model'] for i in range(gift_data_len)}]
            symbolNames = [s for s in {gift_data[i]['symbol'] for i in range(gift_data_len)}]
            backdropNames = [b for b in {gift_data[i]['backdrop'] for i in range(gift_data_len)}]
            
        
            json_data = {
                "backdropNames": [],
                "collectionNames": [name],
                "count": 20,
                "cursor":'',
                "isListed": False,
                "lowToHigh": True,
                "maxPrice": None,
                "minPrice": None,
                "mintable": None,
                "modelNames": modelNames,
                "symbolNames": symbolNames,
                "backdropNames": backdropNames,
                "number": None,
                "offset": 0,
                "ordering": "Price",
                "promotedFirst": False,
                "query": None,
            }

            for attempt in range(4):
                try:
                    async with AsyncSession() as s:
                        r = await s.post(f'{MRKT_API_URL}/gifts/saling', json=json_data, headers=headers, impersonate=random.choice(IMPERSONATE_LIST))
                    rj = r.json()
                    if rj:

                        selling_infos = []

                        for market_gift in rj['gifts']:
                            if market_gift['giftId'] not in gift_data_ids:
                                selling_info = {
                                    'place': 'MRKT',
                                    'on_sale': False,
                                }
                                selling_infos.append((market_gift['giftId'], selling_info))
                                continue


                            
                            market_gift_id = market_gift['id'].replace('-', '')
                            # gift_id = market_gift['giftId']
                            price = convert_price(convert_nano_to_normal(market_gift['salePrice']))
                            on_sale = market_gift['isOnSale']

                            selling_info = {
                                'place': 'MRKT',
                                'price': price,
                                'id': market_gift_id,
                                'on_sale': on_sale,
                            }
                            selling_infos.append((market_gift['giftId'], selling_info))
                        if not rj['gifts']:
                            for market_gift in gift_data:
                                selling_info = {
                                    'place': 'MRKT',
                                    'on_sale': False,
                                }
                                selling_infos.append((market_gift['id'], selling_info))
                                continue
                        await asyncio.gather(*(insert_gift_sale_info(info, pool, id=id) for id, info in selling_infos))
                        break


                except Exception as e:
                    print(f'mrkt fuckup {e} ')
                    await asyncio.sleep(150)
                    if attempt == 4:
                        print('^-^')
                        return []
                    continue


        if market == 'Fragment':
            ua = UserAgent().random
            headers = {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "referer": "https://fragment.com/gifts",
                "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "user-agent": ua,
                "x-aj-referer": "https://fragment.com/gifts",
                "x-kl-kfa-ajax-request": "Ajax_Request",
                "x-requested-with": "XMLHttpRequest"
            }
            selling_infos = []
            for gift in gift_data:
                price = None
                status = None
                link = f'https://fragment.com/gift/{rgnv4(name)}-{gift['number']}?collection=all'
                try:
                    async with AsyncSession() as s:
                        r = await s.get(link, headers=headers, impersonate=random.choice(IMPERSONATE_LIST))
                    rj = r.json()
                    if rj:
                        html = rj['h']
                        
                        find_status = re.findall(r'tm-section-header-status tm-status-[A-Za-z]+\">([A-Za-z]+)</span>', html)
                        if find_status:
                            status = find_status[0]

                        find_price = re.findall(r'before icon-ton\">([\d,]+)</div>', html)
                        if find_price and status != 'Sold':
                            price = int(find_price[0].replace(',', ''))
                        
                        if not find_price and status == 'Sold':
                            price = None
                        
                        price = convert_price(price)
                        selling_info = {
                            'place': 'Fragment',
                            'price': price,
                            'on_sale': True if status != 'Sold' else False,
                        }
                        selling_infos.append((name, gift['number'], selling_info))
                except Exception as e:
                    print(f'fragment111 {e}')
                    await asyncio.sleep(60)
                    continue

            

            if selling_infos:
                await asyncio.gather(*(insert_gift_sale_info(info, pool, name=name, number=number) for name, number, info in selling_infos))
            else:
                print('fragment2')



    except Exception as e:
        print(f'process_selling_gift_data_batch {e, market}')


async def insert_gift_sale_info(selling_info, pool, name=None, number=None, id=None): # вставляет в бд инфу о подарке уже с инфой из маркета
    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                if not id:
                    name = rgnv3(name)
                    result = await conn.fetchrow(
                        f"SELECT id, {', '.join(f'owner_{f}_1' for f in OWNER_FIELDS)} FROM gifts WHERE name = $1 AND number = $2",
                        name, number
                    )
                    if not result:
                        print(f'insert_gift_sale_info {name}#{number} not found {selling_info}')
                        return
                    id = result['id']
                    current_owner = {f: result[f'owner_{f}_1'] for f in OWNER_FIELDS}
                else:
                    result = await conn.fetchrow(
                        f"SELECT name, number, {', '.join(f'owner_{f}_1' for f in OWNER_FIELDS)}, {', '.join(f'owner_{f}_2' for f in OWNER_FIELDS)} FROM gifts WHERE id = $1",
                        id
                    )
                    if not result:
                        return
                    name, number = result['name'], result['number']
                    current_owner = {f: result[f'owner_{f}_1'] for f in OWNER_FIELDS}

                selling_info['status'] = True


                new_owner = current_owner | {'updated_at': int(datetime.now(UTC).timestamp())} | {f'sale_{k}': v for k,v in selling_info.items()}

                owner_values_1 = [new_owner.get(f) for f in OWNER_FIELDS]



                owner_values_2 = [result[f'owner_{f}_1'] for f in OWNER_FIELDS]

                await conn.execute(
                    f"UPDATE gifts SET {', '.join(f'owner_{f}_1 = ${i}' for i, f in enumerate(OWNER_FIELDS, 1))}, {', '.join(f'owner_{f}_2 = ${i}' for i, f in enumerate(OWNER_FIELDS, len(OWNER_FIELDS) + 1))} WHERE id = ${2 * len(OWNER_FIELDS) + 1}",
                    *owner_values_1, *owner_values_2, id
                )

                # print(f'🔄 SALE_INFO_UPDATE [{t}] | {selling_info['place']} | https://t.me/nft/{rgn(name)}-{number} | {selling_info} | [{id}]')
    except Exception as e:
        print(f'💥 Ошибка в insert_gift_sale_info для {name}#{number}: {e, selling_info, id}')


def flatten_owner_info(nested_info):
    flat_info = {}
    for field in OWNER_FIELDS:
        if field.startswith('from_user_'):
            key = field.replace('from_user_', '')
            flat_info[field] = nested_info.get('from_user', {}).get(key) if nested_info.get('from_user') else None
        elif field.startswith('to_user_'):
            key = field.replace('to_user_', '')
            flat_info[field] = nested_info.get('to_user', {}).get(key) if nested_info.get('to_user') else None
        elif field.startswith('sale_'):
            key = field.replace('sale_', '')
            flat_info[field] = nested_info.get('selling_info', {}).get(key) if nested_info.get('selling_info') else None
        else:
            flat_info[field] = nested_info.get(field)
    return flat_info


def filter_tonnel_gifts(gifts, gift_nums):
    gift_nums_set = set(gift_nums)
    best_gifts = {}
    
    for gift in gifts:
        num = gift['gift_num']
        if num in gift_nums_set:
            current = best_gifts.get(num)
            has_price = 'price' in gift and gift['price'] is not None
            if not current or (has_price and ('price' not in current or current['price'] is None)):
                best_gifts[num] = gift
    
    return list(best_gifts.values())


def filter_portals_gifts(gifts, gift_nums: set):
    best_gifts = {}
    
    for gift in gifts:
        num = int(gift['external_collection_number'])
        if num in gift_nums:
            current = best_gifts.get(num)
            has_price = 'price' in gift and gift['price'] is not None
            if not current or (has_price and ('price' not in current or current['price'] is None)):
                best_gifts[num] = gift
    
    return list(best_gifts.values())


async def update_portals_gifts_ids_data():
    global PORTALS_GIFTS_IDS_DATA
    try:
        async with AsyncSession() as s:
            r=await s.get('https://cdn.changes.tg/gifts/id-to-name.json')
            gift_names=[v for k,v in r.json().items()]
            for gift in gift_names:
                r=await s.get(f'https://portal-market.com/api/collections?search={rgnv2(gift)}&limit=10', headers=None, impersonate='chrome')
                rj=r.json()
                PORTALS_GIFTS_IDS_DATA[gift] = rj['collections'][0]['id']
                await asyncio.sleep(1)
    except Exception as e:
        print('get_portals_gift_id', e)
    return None


async def get_auth_tokens_for_markets(id): # берет auth (tma) токены для корректного парсинга маркетов
    l1=[]
    l2=[]
    for name in SESSIONS.keys():
        client = Client(f"sessions/{name}")
        async with client:

            market_name = MARKETPLACES_DICT[id]['name']
            market_bot_tag = MARKETPLACES_DICT[id]['bot_tag']
            short_name = MARKETPLACES_DICT[id]['short_name']

            bot_entity = await client.get_users(market_bot_tag)
            bot = InputUser(user_id=bot_entity.id, access_hash=bot_entity.raw.access_hash)
            bot_app = InputBotAppShortName(bot_id=bot, short_name=short_name)
            peer = await client.resolve_peer(market_bot_tag)
            
            web_view = await client.invoke(
                RequestAppWebView(
                    peer=peer,
                    app=bot_app,
                    platform="android",
                )
            )

            init_data = unquote(web_view.url.split('tgWebAppData=', 1)[1].split('&tgWebAppVersion', 1)[0])

            if market_name == 'Portals':
                l1.append(f'tma {init_data}')
                continue
        

            headers = {
                "accept": "*/*",
                "accept-encoding": "gzip, deflate, br, zstd",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json",
                "origin": "https://cdn.tgmrkt.io",
                "referer": "https://cdn.tgmrkt.io/",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0"
            }

            jsondata = {"data": init_data}
        
            try:
                async with AsyncSession() as s:
                    r = await s.post("https://api.tgmrkt.io/api/v1/auth", json=jsondata, headers=headers)
                rj = r.json()
                if rj:
                    l2.append(rj.get("token", None))
                    continue
            except Exception as e:
                print(f'get_auth_token_for_mrkt: {e}')
                return None
    return l1 or l2


def convert_price(price):
    if price is None:
        return None
    if isinstance(price, str):
        try:
            return int(price)
        except ValueError:
            return round(float(price), 3)
    if isinstance(price, int):
        return price
    if isinstance(price, float):
        return round(price, 3)


def rgnv3(name):
    return name.replace("'","’")

def rgnv2(name):
    return name.replace("'", ' ').replace("’","'")

def rgn(name):
    return name.replace(' ', '').replace("'", '').replace('-', '').replace("’",'')

def rgnv4(name):
    return name.replace(' ', '').replace("'", '').replace('-', '').replace("’",'').lower()


def convert_nano_to_normal(nano_value: str, round_down: bool = False) -> str:
    decimal_value = float(nano_value) / 1e7
    
    rounded = round(decimal_value, 10)
    
    final_value = (floor(rounded) if round_down else ceil(rounded)) / 100
    
    return "{:.2f}".format(final_value)


def convert_normal_to_nano(normal_value: str, round_down: bool = False) -> str:
    nano_decimal = float(normal_value) * 1e9
    final_nano = floor(nano_decimal) if round_down else ceil(nano_decimal)
    
    return str(int(final_nano))


# def log_owner_update(name: str, index: int, old_owner: dict, new_owner: dict):
#     timestamp = _datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")
#     link = f"https://t.me/nft/{rgn(name)}-{index}"
    
#     changes = []
    
#     fields_to_check = ['id', 'username', 'full_name', 'ton_address', 'gift_address', 'hidden']
#     for field in fields_to_check:
#         old_val = old_owner.get(field)
#         new_val = new_owner.get(field)
#         if old_val != new_val:
#             changes.append(f"{field}: {old_val} -> {new_val}")
    
#     old_selling = old_owner.get('selling_info')
#     new_selling = new_owner.get('selling_info')
#     if old_selling != new_selling:
#         changes.append(f"selling_info: {old_selling} -> {new_selling}")
    
#     changes_str = " | ".join(changes) if changes else "unknown changes"
    
#     log_message = f'🔄 OWNER_UPDATE [{timestamp}] {link} | Changes: {changes_str}'
    
#     print(log_message)