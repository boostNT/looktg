import hmac
import hashlib
import time
from curl_cffi import AsyncSession
from aiocache import cached
from typing import Optional
from urllib.parse import unquote
from constants import BOT_TOKEN
from math import floor, ceil


def check_telegram_webapp_auth(init_data: str) -> Optional[dict]:
    try:
        init_data_str = unquote(init_data)

        params = dict(pair.split('=', 1) for pair in init_data_str.split('&'))

        received_hash = params.pop('hash', None)
        if not received_hash:
            return False, None


        sorted_keys = sorted(params.keys())
        data_check_string = "\n".join(f"{key}={params[key]}" for key in sorted_keys)
        secret_key = hmac.new("WebAppData".encode(), BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if calculated_hash != received_hash:
            return False, None


        validated_data = {k: unquote(v) for k, v in params.items()}

        if 'auth_date' in validated_data and (time.time() - int(validated_data['auth_date'])) > 86400:
            return None

        return validated_data
    except Exception as e:
        return None


@cached(ttl=3600)
async def get_bgs_colors():
    async with AsyncSession() as s:
        r = await s.get('https://cdn.changes.tg/gifts/id-to-name.json')
        names = [x for x in r.json().values()]
        bgs = set()
        for name in names:
            r = await s.get(f'https://cdn.changes.tg/gifts/backdrops/{name}/backdrops.json')
            for q in r.json():
                q.pop('rarityPermille', None)
                q.pop('backdropId', None)
                if 'hex' in q:
                    for k,v in q['hex'].items():
                        q[f'hex-{k}'] = v
                q.pop('hex',None)
                bgs.add(tuple(sorted(q.items())))
        bgsl = [dict(x) for x in bgs]
        return bgsl


def convert_nano_to_normal(nano_value: str, round_down: bool = False) -> str:
    decimal_value = float(nano_value) / 1e7
    
    rounded = round(decimal_value, 10)
    
    final_value = (floor(rounded) if round_down else ceil(rounded)) / 100
    
    return "{:.2f}".format(final_value)


def convert_normal_to_nano(normal_value: str, round_down: bool = False) -> str:
    nano_decimal = float(normal_value) * 1e9
    final_nano = floor(nano_decimal) if round_down else ceil(nano_decimal)
    
    return str(int(final_nano))


