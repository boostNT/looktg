import asyncpg
from bot.constants import DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
from datetime import datetime


_pool = None


async def add_user_to_db(uid, unm, utg, fmt):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            'INSERT INTO bot_db (uid, unm, utg, fmt) VALUES ($1, $2, $3, $4)',
            uid, unm, utg, fmt
        )


async def check_subscription(uid):
    pool = await get_pool()
    async with pool.acquire() as conn:
        
        row = await conn.fetchrow('SELECT sub_exists, sub_until FROM site_users WHERE id = $1', uid)
        if row:
            sub_exists = row['sub_exists']
            sub_until = row['sub_until']
            return sub_exists, sub_until
        else:
            return False


async def add_new_sub_to_db(uid, amount, trid):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute('UPDATE site_users SET sub_exists = TRUE WHERE id = $1', uid)
        await conn.execute('INSERT INTO subs_history (uid, amount, transaction_id, payment_time, via_tonkeeper) VALUES ($1, $2, $3, $4, $5)',
            uid, amount, f'tg_stars:{trid}', datetime.now().strftime('%Y-%m-%d %H:%M:%S'), False)


async def check_user_in_db(uid):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchrow(
            'SELECT uid FROM bot_db WHERE uid = $1', uid
        )
        return bool(result)


async def get_pool():

    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            max_inactive_connection_lifetime=30
        )
    return _pool


async def init_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute('CREATE TABLE IF NOT EXISTS bot_db (id SERIAL PRIMARY KEY, uid BIGINT, unm TEXT, utg TEXT, fmt TEXT)')
