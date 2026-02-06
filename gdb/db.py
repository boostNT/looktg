import asyncpg
import asyncio
from constants import DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME


async def init_db():
    try:
        pool = await asyncpg.create_pool(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            max_inactive_connection_lifetime=30,
            max_size=40,
            min_size=10,
        )
        async with pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS gifts (
                    id BIGINT PRIMARY KEY,
                    name TEXT NOT NULL,
                    number INTEGER NOT NULL,
                    model TEXT,
                    bg TEXT,
                    pattern TEXT,
                    model_rarity SMALLINT,
                    bg_rarity SMALLINT,
                    pattern_rarity SMALLINT,
                    fetched_at TEXT,
                               

                    owner_id_1 BIGINT,
                    owner_updated_at_1 BIGINT,
                    owner_username_1 VARCHAR(32),
                    owner_full_name_1 VARCHAR(256),
                    owner_ton_address_1 TEXT,
                    owner_gift_address_1 TEXT,
                    owner_comment_1 TEXT,
                    owner_channel_id_1 BIGINT,
                    owner_hidden_1 BOOLEAN,
                    owner_from_user_id_1 BIGINT,
                    owner_from_user_username_1 VARCHAR(32),
                    owner_from_user_full_name_1 VARCHAR(256),
                    owner_to_user_id_1 BIGINT,
                    owner_to_user_username_1 VARCHAR(32),
                    owner_to_user_full_name_1 VARCHAR(256),
                    owner_sale_place_1 VARCHAR(16),
                    owner_sale_id_1 TEXT,
                    owner_sale_status_1 BOOLEAN,
                    owner_sale_price_1 FLOAT4,
                    owner_sale_on_sale_1 BOOLEAN,
                               

                    owner_id_2 BIGINT,
                    owner_updated_at_2 BIGINT,
                    owner_username_2 VARCHAR(32),
                    owner_full_name_2 VARCHAR(256),
                    owner_ton_address_2 TEXT,
                    owner_gift_address_2 TEXT,
                    owner_comment_2 TEXT,
                    owner_channel_id_2 BIGINT,
                    owner_hidden_2 BOOLEAN,
                    owner_from_user_id_2 BIGINT,
                    owner_from_user_username_2 VARCHAR(32),
                    owner_from_user_full_name_2 VARCHAR(256),
                    owner_to_user_id_2 BIGINT,
                    owner_to_user_username_2 VARCHAR(32),
                    owner_to_user_full_name_2 VARCHAR(256),
                    owner_sale_place_2 VARCHAR(16),
                    owner_sale_id_2 TEXT,
                    owner_sale_status_2 BOOLEAN,
                    owner_sale_price_2 FLOAT4,
                    owner_sale_on_sale_2 BOOLEAN
                )
            """)



            await conn.execute("CREATE TABLE IF NOT EXISTS gifts_names (name TEXT)")
            await conn.execute("CREATE TABLE IF NOT EXISTS gifts_bgs (bg TEXT)")
            await conn.execute("CREATE TABLE IF NOT EXISTS gifts_patterns (pattern TEXT, gift_name TEXT)")

            # await conn.execute("CREATE INDEX IF NOT EXISTS idx_gifts_name ON gifts (LOWER(TRIM(name)))")
            # await conn.execute("CREATE INDEX IF NOT EXISTS idx_gifts_model ON gifts (LOWER(TRIM(model)))")
            # await conn.execute("CREATE INDEX IF NOT EXISTS idx_gifts_bg ON gifts (LOWER(TRIM(bg)))")
            # await conn.execute("CREATE INDEX IF NOT EXISTS idx_gifts_pattern ON gifts (LOWER(TRIM(pattern)))")
            # await conn.execute("CREATE INDEX IF NOT EXISTS idx_gifts_number ON gifts (number)")
            # await conn.execute("CREATE INDEX IF NOT EXISTS idx_gifts_owner_username_1 ON gifts (LOWER(TRIM(owner_username_1)))")


            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_name_bg ON gifts (LOWER(TRIM(name)), LOWER(TRIM(bg)))""")
            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_name_pattern ON gifts (LOWER(TRIM(name)), LOWER(TRIM(pattern)))""")
            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_name_model ON gifts (LOWER(TRIM(name)), LOWER(TRIM(model)))""")
            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_bg_pattern ON gifts (LOWER(TRIM(bg)), LOWER(TRIM(pattern)))""")


            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_name_model_bg ON gifts (LOWER(TRIM(name)), LOWER(TRIM(model)), LOWER(TRIM(bg)))""")
            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_name_model_pattern ON gifts (LOWER(TRIM(name)), LOWER(TRIM(model)), LOWER(TRIM(pattern)))""")
            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_name_bg_pattern ON gifts (LOWER(TRIM(name)), LOWER(TRIM(bg)), LOWER(TRIM(pattern)))""")


            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_owner_id_1_owner_sale_on_sale_1 ON gifts (owner_id_1, owner_sale_on_sale_1)""")
            # await conn.execute("""CREATE INDEX IF NOT EXISTS idx_gifts_owner_sale_on_sale_1 ON gifts (owner_sale_on_sale_1)""")


        # print('✅ БД инициализирована')
        return pool
    except Exception as e:
        print(f'💥 Ошибка при инициализации БД: {e}')
        raise


async def update_gifts_params(pool):
    while 1:
        try:
            async with pool.acquire() as conn:
                # await conn.execute('ANALYZE gifts')
                # await conn.execute('VACUUM gifts')
                # await pool.execute("REINDEX TABLE gifts")
                await conn.execute("""
                    INSERT INTO gifts_names (name)
                    SELECT DISTINCT name FROM gifts
                    WHERE name NOT IN (SELECT name FROM gifts_names)
                    AND name != 'SLUG_INVALID'
                    ORDER BY name
                """)

                await conn.execute("""
                    INSERT INTO gifts_bgs (bg)
                    SELECT DISTINCT bg FROM gifts
                    WHERE bg NOT IN (SELECT bg FROM gifts_bgs)
                    AND bg != '0'
                    ORDER BY bg
                """)

                await conn.execute("""
                    INSERT INTO gifts_patterns (pattern, gift_name)
                    SELECT pattern, MIN(name) as gift_name
                    FROM gifts
                    WHERE pattern != '0'
                    AND pattern NOT IN (SELECT pattern FROM gifts_patterns)
                    GROUP BY pattern
                    ORDER BY pattern
                """)


        except Exception as e:
            print(f'Ошибка при обновлении имен подарков: {e}')
            
        await asyncio.sleep(60*60*2)
