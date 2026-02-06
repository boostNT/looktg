from re import compile


BOT_TOKEN = ''
BOT_API_KEY = ""
API_KEY_NAME = "Authorization"
NEW_USERS_GROUP_ID = -123123
QUESTIONS_GROUP_ID = -123123


DB_HOST = 'localhost'
DB_PORT = 5432
DB_USER = 'user'
DB_PASS = '123123'
DB_NAME = '123123'

FRAGMENT_HEADERS = {
    'authority': 'fragment.com',
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'referer': 'https://fragment.com/stars',
    'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'x-aj-referer': 'https://fragment.com/stars',
    'x-requested-with': 'XMLHttpRequest'
}


BOT_ID = 8025023082
ADMINS = {1469490417, 7164615295, 2072081017, 7814087048}
WEB_APP_DOMAIN = 'https://look.tg'
GIFT_SLUG_RE = compile(r'(?:https?://)?t\.me/nft/([\w-]+)-(\d+)')



