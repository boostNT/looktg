import asyncpg
import httpx
import uvicorn
import json
import asyncio
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Security, HTTPException, status, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import Optional, Union
from aiocache import cached, caches
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from curl_cffi import requests 
from datetime import datetime
from time import time
from constants import *
from utils.uitls import get_bgs_colors, check_telegram_webapp_auth, convert_normal_to_nano


caches.set_config({
    'default': {
        'cache': 'aiocache.SimpleMemoryCache',
        'serializer': {
            'class': 'aiocache.serializers.PickleSerializer'
        }
    }
})


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await asyncpg.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        max_inactive_connection_lifetime=30,
        min_size=5,
        max_size=12
    )
    yield
    await app.state.db.close()
    await http_client.aclose()


app = FastAPI(docs_url=None, lifespan=lifespan)
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    expose_headers=["*"],
    allow_headers=["*", 'sigma_token'],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
http_client = httpx.AsyncClient(timeout=30.0,)
api_key_header = APIKeyHeader(name=API_KEY_NAME)


class PaymentRequest(BaseModel):
    via_tonkeeper: Optional[bool] = None
    amount: Optional[int] = None
    currency: Optional[str] = 'TON'
    text: Optional[str] = None


class ReferralRequest(BaseModel):
    referrer_id: int
    referee_id: int
    text: Optional[str] = None


async def get_api_key(api_key: str = Depends(api_key_header)):
    if api_key in {API_KEY, BOT_API_KEY}:
        return api_key
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials"
        )


@app.get("/api/ping")
async def ping(request: Request):
    return {"ip": request.client.host}


@cached(ttl=1800, key_builder=lambda *args, **kwargs: str(args))  
async def get_db_response(query: str, params: tuple):
    print(query, params)
    try:
        async with app.state.db.acquire() as conn:
            gifts = await conn.fetch(query, *params)
            
            results = []
            for gift_row in gifts:
                gift = dict(gift_row)
                all_owners_info = []

                for owner_index in [1, 2]:
                    owner_info = {}
                    nested_info = {'from_user': {}, 'to_user': {}, 'selling_info': {}}
                    has_data = False

                    for field in OWNER_FIELDS:
                        db_column = f'owner_{field}_{owner_index}'
                        value = gift.pop(db_column, None)
                        if value is not None:
                            has_data = True

                        if field.startswith('from_user_'):
                            nested_info['from_user'][field.replace('from_user_', '')] = value
                        elif field.startswith('to_user_'):
                            nested_info['to_user'][field.replace('to_user_', '')] = value
                        elif field.startswith('sale_'):
                            nested_info['selling_info'][field.replace('sale_', '')] = value
                        else:
                            owner_info[field] = value
                    
                    if has_data:
                        if any(nested_info['from_user'].values()): owner_info['from_user'] = nested_info['from_user']
                        if any(nested_info['to_user'].values()): owner_info['to_user'] = nested_info['to_user']
                        if any(nested_info['selling_info'].values()): owner_info['selling_info'] = nested_info['selling_info']
                        all_owners_info.append(owner_info)
                    elif owner_index == 1:
                        all_owners_info.append(owner_info)


                gift['owner_info'] = all_owners_info
                results.append(gift)
            return results

    except Exception as e:
        print(e)
        if 'does not exist' in str(e):
            return 'no_table_error'
        raise


@cached(ttl=900, key_builder=lambda *args, **kwargs: str(args))
async def get_db_scalar(query: str, params: tuple):
    try:
        async with app.state.db.acquire() as conn:
            value = await conn.fetchval(query, *params)
            return value
    except Exception as e:
        if 'does not exist' in str(e):
            return 'no_table_error'
        raise


@app.get("/api/getnftgifts")
@limiter.limit("300/minute")
async def find_nft_gifts(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    sort_param: str = Query('number', enum=ALLOWED_SORT_PARAMS),
    sort_type: str = Query('asc', enum=ALLOWED_SORT_TYPES),
    id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    bg: Optional[str] = Query(None),
    pattern: Optional[str] = Query(None),
    number: Optional[Union[str, int]] = Query(None),
    owner_param: Optional[str] = Query(None),
    owner_value: Optional[Union[str, int]] = Query(None),
    selling_param: Optional[str] = Query(None),
    selling_value: Optional[str] = Query(None),
    biggest_owner: Optional[bool] = Query(None),
    auth: str = Security(get_api_key)
):
    t=time()

    user_id_str = request.cookies.get('user_id')
    user = None
    if user_id_str:
        try:
            user_id = int(user_id_str)
            async with app.state.db.acquire() as conn:
                user = await conn.fetchrow('SELECT sub_exists, request_limit FROM site_users WHERE id = $1', user_id)
                if user and not user['sub_exists']:
                    if user['request_limit'] > 0 and page == 1:
                        await conn.execute('UPDATE site_users SET request_limit = request_limit - 1 WHERE id = $1', user_id)
                    elif user['request_limit'] == 0:
                        raise HTTPException(status_code=429, detail="Request limit reached.")
        except (ValueError, TypeError):
            pass

    if not user:
        is_bot_request = auth == BOT_API_KEY
        if not is_bot_request:
             raise HTTPException(status_code=401, detail="User not authenticated.")



    if limit > 100:
        raise HTTPException(status_code=400, detail="Лимит не может быть больше 100")
    if number and int(number) and -2147483648 > int(number) > 2147483647:
        raise HTTPException(status_code=400, detail="Неверный номер подарка")


    base_query_from = "FROM gifts"
    delete_ordering =False
    where_clauses = []
    params = []

    filters = {
        'id': id,
        'name': name,
        'model': model,
        'bg': bg,
        'pattern': pattern,
        'number': number,
    }


    is_complex_request = (owner_param and owner_value) or (selling_param and selling_value) or (biggest_owner and any(value is not None for value in filters.values()))
    print(is_complex_request)


    for field, value in filters.items():
        if value is not None:
            param_index = len(params) + 1
            if field in ['number', 'id']:
                where_clauses.append(f"{field} = ${param_index}")
                params.append(int(value))
            elif field == 'name':
                if ' ' not in value and '-' not in value:
                    where_clauses.append(f"REPLACE({field}, ' ', '') ILIKE ${param_index}")
                    params.append(value.replace(' ', '').replace('-', ''))
                else:
                    where_clauses.append(f"{field} = ${param_index}")
                    params.append(value)
            else:
                where_clauses.append(f"{field} = ${param_index}")
                params.append(value)


    if owner_param and owner_value:
        delete_ordering = True
        param_index = len(params) + 1
        if owner_param == 'id' and owner_value in {'42777', '6549302342'}:
            if owner_value == '42777':
                where_clauses.append(f'owner_sale_currency_1 = ${param_index}')
                params.append('Stars')
            elif owner_value == '6549302342':
                where_clauses.append(f"owner_ton_address_1 IS NOT NULL AND owner_sale_place_1 = 'Fragment'")
        else:
            where_clauses.append(f'owner_{owner_param}_1 = ${param_index}')
            params.append(int(owner_value) if owner_value.isdigit() else owner_value.lower())


    if selling_param and selling_value:
        param_index = len(params) + 1
        if owner_value is not None and owner_value == '42777':
            where_clauses.append(f'owner_sale_status_1 = ${param_index}')
        else:
            where_clauses.append(f'owner_sale_{selling_param}_1 = ${param_index}')
        if selling_value == 'true':
            params.append(True)
        elif selling_value == 'false':
            params.append(False)
        else:
            params.append(selling_value)
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

    if biggest_owner:
        marketplace_placeholders = ', '.join([f'${i+1+len(params)}' for i in range(len(MARKETPLACES_NAMES))])
        owner_count_query = f"""
            SELECT owner_full_name_1
            FROM gifts
            WHERE {where_sql}
            AND owner_full_name_1 IS NOT NULL
            AND owner_full_name_1 NOT IN ({marketplace_placeholders})
            GROUP BY owner_full_name_1
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """
        owner_count_params = tuple(params) + tuple(MARKETPLACES_NAMES)
        max_owner_name = await get_db_scalar(owner_count_query, owner_count_params)
        if not max_owner_name:
            raise HTTPException(status_code=404, detail="Нет подарков с владельцами по указанным фильтрам")
        param_index = len(params) + 1
        where_clauses.append(f"owner_full_name_1 = ${param_index}")
        params.append(max_owner_name)
        where_sql = " AND ".join(where_clauses)

    count_query = f"SELECT COUNT(*) {base_query_from} WHERE {where_sql}"
    total_results = await get_db_scalar(count_query, tuple(params))
    # total_results = 9


    offset = (page - 1) * limit
    
    allowed_sort_params ={'number', 'model_rarity', 'bg_rarity', 'pattern_rarity', 'sale_price'}
    allowed_sort_types = {'asc', 'desc'}

    if sort_param != None and sort_param == 'sale_price':
        sort_param = 'owner_sale_price_1'
    if sort_param not in allowed_sort_params and sort_param != 'owner_sale_price_1':
        sort_param = 'number'
    if sort_type.lower() not in allowed_sort_types:
        sort_type = 'asc'


    results_query = f"""
        SELECT * {base_query_from}
        WHERE {where_sql}
        ORDER BY {sort_param} {sort_type.upper()}
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
    """
    if delete_ordering:
        # pass
        results_query = results_query.replace(f'ORDER BY {sort_param} {sort_type.upper()}', '')
    results_params = tuple(params) + (limit, offset)
    paginated_results = await get_db_response(results_query, results_params)
    print(f'{time() - t} to collect gifts')


    if not paginated_results:
        raise HTTPException(status_code=404, detail="Нет подарков")
    if paginated_results == 'no_table_error':
        raise HTTPException(status_code=500, detail="Ошибка БД")
    
    return {
        'info': {
            'page': page,
            'totalFound': total_results,
            'totalPages': (total_results + limit - 1) // limit,
        },
        'results': paginated_results
    }


@app.get("/api/getnftgifts/bdata")
async def get_database_info():
    try:
        async with app.state.db.acquire() as conn:
            allCount = await conn.fetchval('SELECT COUNT(*) FROM gifts') or 0

            hiddens = await conn.fetchval("SELECT COUNT(*) FROM gifts WHERE owner_hidden_1 = true") or 0

            marketplaces_infos_list = await conn.fetch("""
                SELECT
                    owner_sale_place_1 AS place,
                    COUNT(*) AS total
                FROM gifts
                WHERE owner_sale_place_1 IS NOT NULL
                  AND owner_sale_place_1 != ''
                  AND owner_sale_on_sale_1 = true
                GROUP BY owner_sale_place_1;
            """)

            allOnSaleCount = sum(row['total'] for row in marketplaces_infos_list)

            marketplaces_infos_dict = {
                row['place']: {'allCount': row['total']}
                for row in marketplaces_infos_list if row['place']
            }
            marketplaces_infos_dict['allOnSaleCount'] = allOnSaleCount

            return {
                "allCount": allCount,
                'hiddenCount': hiddens,
                'notHiddenCount': allCount - hiddens,
                'marketplacesInfo': marketplaces_infos_dict
            }
    except Exception as e:
        if isinstance(e, asyncpg.exceptions.UndefinedTableError):
            raise HTTPException(status_code=503, detail="Ошибка базы данных: таблица не найдена.")
        print(f"Error in /api/getnftgifts/bdata: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/getnftgifts/paramsdata")
async def get_params_data():
    async with app.state.db.acquire() as conn:
        names = await conn.fetch('SELECT DISTINCT name FROM gifts')
        bgs = await conn.fetch('SELECT DISTINCT bg FROM gifts')
        patterns = await conn.fetch('SELECT DISTINCT pattern FROM gifts')

        return {
            "names": [row["name"] for row in names],
            "bgs": [row["bg"] for row in bgs],
            "patterns": [row["pattern"] for row in patterns],
            "marketplaces": MARKETPLACES
        }


@app.get("/api/getnftgifts/names")
async def get_nft_gifts():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch('SELECT name FROM gifts_names')
        return {"names": [row['name'] for row in rows]}


@cached(ttl=60*60*24, key_builder=lambda *args, **kwargs: str(args))
@app.get("/api/getnftgifts/models")
async def get_nft_models_by_name(name: str = Query(..., description="Имя подарка для получения его моделей")):
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch('SELECT DISTINCT model FROM gifts WHERE name = $1 AND model IS NOT NULL ORDER BY model ASC', name)
        return {"models": [row['model'] for row in rows]}


@cached(ttl=60*60*24, key_builder=lambda *args, **kwargs: str(args))
@app.get("/api/getnftgifts/patterns_by_name")
async def get_nft_patterns_by_name(name: str = Query(..., description="Имя подарка для получения его узоров")):
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch('SELECT DISTINCT pattern FROM gifts WHERE name = $1 AND pattern IS NOT NULL ORDER BY pattern ASC', name)
        return {"patterns": [row['pattern'] for row in rows]}


@app.get("/api/getnftgifts/bgs")
async def get_bft_bgs_colors():
    try:
        bgs_list = await get_bgs_colors()
    except Exception as e:
        bgs_list = []
    return bgs_list


@app.get("/api/getnftgifts/patterns")
async def get_nft_patterns():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM gifts_patterns')
        return {"patterns": [
                            {'pattern': row['pattern'], 
                            'gift_name': row['gift_name']
                            } for row in rows
                            ]
             }


@app.post('/api/telegram_webapp_auth')
async def telegram_webapp_auth(request: Request, response: Response):
    try:
        body = await request.json()
        init_data = body.get('initData')

        if not init_data:
            raise HTTPException(status_code=400, detail='No initData provided')

        validated_data = check_telegram_webapp_auth(init_data)
        if not validated_data:
            raise HTTPException(status_code=403, detail="Authentication failed: Invalid hash or data expired.")

        try:
            user_data = json.loads(validated_data.get('user', '{}'))
        except (json.JSONDecodeError, TypeError):
            raise HTTPException(status_code=400, detail='Invalid user data format in validated data.')

        response.set_cookie(
            key='user_id',
            value=str(user_data.get('id')),
            httponly=True,
            max_age=60*60*24*7
        )

        async with app.state.db.acquire() as conn:
            
            await conn.execute(F'''
                INSERT INTO site_users (id, utg, ufn, uln, photo_url, auth_time, sub_exists, sub_until, used_referral, request_limit, last_limit_reset)
                VALUES ($1, $2, $3, $4, $5, NOW() AT TIME ZONE 'Europe/Moscow', FALSE, NULL, FALSE, {BASE_REQUESTS_PER_DAY_COUNT}, NOW() AT TIME ZONE 'Europe/Moscow')
                ON CONFLICT (id) DO UPDATE SET
                    utg = EXCLUDED.utg,
                    ufn = EXCLUDED.ufn,
                    uln = EXCLUDED.uln,
                    photo_url = EXCLUDED.photo_url,
                    sub_exists = site_users.sub_exists,
                    sub_until = site_users.sub_until,
                    used_referral = site_users.used_referral,
                    request_limit = site_users.request_limit,
                    last_limit_reset = site_users.last_limit_reset
            ''',
            user_data.get('id'),
            user_data.get('username'),
            user_data.get('first_name'),
            user_data.get('last_name'),
            user_data.get('photo_url'))


        return {'success': True, 'user': user_data}
        
    except HTTPException:
        raise
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f'Internal server error: {str(e)}')



@app.get('/api/me')
async def get_current_user(request: Request):
    try:
        user_id_str = request.cookies.get('user_id')
        if not user_id_str:
            success = True
            loggined = False
            user = None
            return {'success': success, 'loggined': loggined, 'user': user}

        try:
            user_id = int(user_id_str)  
        except (ValueError, TypeError) as e:
            raise HTTPException(status_code=400, detail=f'Invalid user_id in cookie or {e}.')

        async with app.state.db.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT id, utg as username, ufn as first_name, uln as last_name, photo_url, sub_exists, sub_until, request_limit, last_limit_reset FROM site_users WHERE id = $1',
                user_id
            )
            if row:
                user = dict(row)
                sub_exists = user.get('sub_exists')
                sub_until = user.get('sub_until')

                if sub_until and isinstance(sub_until, str):
                    sub_until = datetime.fromisoformat(sub_until)

                if sub_exists and sub_until and sub_until < datetime.now(sub_until.tzinfo):
                    await conn.execute(
                        'UPDATE site_users SET sub_exists = FALSE WHERE id = $1',
                        user_id
                    )
                    user['sub_exists'] = False 
                    sub_exists = False
                
                last_reset = user.get('last_limit_reset')
                if not sub_exists and last_reset:
                    if isinstance(last_reset, str):
                        last_reset = datetime.fromisoformat(last_reset)
                    
                    if (datetime.now(last_reset.tzinfo) - last_reset).total_seconds() >= 24 * 60 * 60:
                        await conn.execute(
                            f'UPDATE site_users SET request_limit = {BASE_REQUESTS_PER_DAY_COUNT}, last_limit_reset = NOW() AT TIME ZONE \'Europe/Moscow\' WHERE id = $1', user_id
                        )
                        user['request_limit'] = BASE_REQUESTS_PER_DAY_COUNT

                success = True
                loggined = True
                
                sub_active = False
                if sub_exists and sub_until:
                    sub_active = sub_until > datetime.now(sub_until.tzinfo)

                return {'success': success, 'loggined': loggined, 'user': user} if sub_active else {'success': success, 'loggined': loggined, 'user': user}
            else:
                raise HTTPException(status_code=404, detail="User not found.")
    

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /api/me: {e}")
        raise HTTPException(status_code=500, detail=f'Internal server error: {str(e)}')


@app.post('/api/logout')
async def logout(response: Response):
    response.delete_cookie(key='user_id', path='/')
    return {'success': True, 'message': 'Logged out successfully'}


@app.post('/api/payment')
async def process_payment(request: Request, payment_data: PaymentRequest):
    try:
        await asyncio.sleep(5)
        r = requests.get(f'{TON_API_BASE_URL}/accounts/{TARGET_WALLET_ADDRESS}')
        rj = r.json()
        ACCOUNT_ID = rj.get('address')

        amount = payment_data.amount
        text = payment_data.text
        via_tonkeeper = payment_data.via_tonkeeper

        r = requests.get(f"{TON_API_BASE_URL}/accounts/{TARGET_WALLET_ADDRESS}/events?limit=20", headers=TON_HEADERS)
        r.raise_for_status()
        rj = r.json()
        events = rj.get('events', [])

        if not events:
            return {'success': False, 'reason': 'no_events'}
        
        for event in events:
            action = event.get('actions')[0]
            now_time = datetime.now()
            event_time = datetime.fromtimestamp(event.get('timestamp'))

            if (datetime.now() - event_time).total_seconds() > 1200:
                continue


            if action.get('type') == 'TonTransfer' and action.get('status') == 'ok' and action.get('TonTransfer').get('recipient').get('address') == ACCOUNT_ID and action.get('TonTransfer').get('amount') == int(convert_normal_to_nano(amount)) and action.get('TonTransfer').get('comment') == text and (now_time - event_time).total_seconds() < 300:
                success=True
                transaction_id = event['event_id']


                async with app.state.db.acquire() as conn:
                    async with conn.transaction():
                        
                        await conn.execute('''
                            UPDATE site_users
                            SET sub_exists = TRUE, sub_until = NOW() AT TIME ZONE 'Europe/Moscow' + INTERVAL '30 days'
                            WHERE id = $1
                        ''', int(text))

                        await conn.execute('''
                            INSERT INTO subs_history (uid, amount, transaction_id, payment_time, via_tonkeeper) 
                            VALUES ($1, $2, $3, NOW() AT TIME ZONE 'Europe/Moscow', $4)
                            ON CONFLICT (transaction_id) DO NOTHING''', int(text), amount, transaction_id, via_tonkeeper)
                    

                return {'success': success}
                
            await asyncio.sleep(5) 
                    
        success=False
        return {'success': success, 'p': payment_data}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /api/payment: {e}")
        raise HTTPException(status_code=500, detail=f'Internal server error: {str(e)}')


@app.post('/api/referral')
async def process_referral(request: Request, referral_data: ReferralRequest):
    try:
        print(referral_data)
        referrer_id = referral_data.referrer_id
        referee_id = referral_data.referee_id

        if not all([referrer_id, referee_id]):
            raise HTTPException(status_code=400, detail="Missing referrer_id or referee_id")

        if referrer_id == referee_id:
            raise HTTPException(status_code=400, detail="User cannot refer themselves.")

        async with app.state.db.acquire() as conn:
            referrer_user = await conn.fetchrow('SELECT id, request_limit FROM site_users WHERE id = $1', referrer_id)
            if not referrer_user:
                raise HTTPException(status_code=404, detail="Referrer not found.")

            referee_user = await conn.fetchrow('SELECT id, used_referral FROM site_users WHERE id = $1', referee_id)
            if not referee_user:
                raise HTTPException(status_code=404, detail="Referee not found.")

            if referee_user.get('used_referral'):
                return {'success': False, 'message': 'Referee has already been referred, no new bonus applied.'}

            await conn.execute(
                f'UPDATE site_users SET request_limit = request_limit + {BASE_REQUESTS_PER_DAY_COUNT} WHERE id = $1',
                referrer_id
            )

            await conn.execute('UPDATE site_users SET used_referral = TRUE WHERE id = $1', referee_id)

            return {'success': True, 'message': 'Referral bonus applied.'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /api/referral: {e}")
        raise HTTPException(status_code=500, detail=f'Internal server error: {str(e)}')


if __name__ == "__main__":
    uvicorn.run(
        'api:app',
        host='0.0.0.0',
        port=8000,
        reload=True,
    )
