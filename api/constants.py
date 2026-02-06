BASE_API_URL = 'https://look.tg'
CDN_GIFTS_API = 'https://cdn.changes.tg'
TON_API_BASE_URL = 'https://tonapi.io/v2'
BASE_REQUESTS_PER_DAY_COUNT = 5


API_KEY = ''
BOT_TOKEN = ''
BOT_API_KEY = ''
LOOK_API_KEY = ''
TON_API_KEY = ''
API_KEY_NAME = "Authorization"


TARGET_WALLET_ADDRESS = ''
TON_HEADERS = {
    "Authorization": f"Bearer {TON_API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}
OWNER_FIELDS = ['id', 'updated_at', 'username', 'full_name', 'ton_address', 'gift_address', 'comment', 'channel_id', 'hidden', 'from_user_id', 'from_user_username', 'from_user_full_name', 'to_user_id', 'to_user_username', 'to_user_full_name', 'sale_place', 'sale_id', 'sale_status', 'sale_price', 'sale_on_sale', 'sale_currency']



origins = [BASE_API_URL]
ADMINS = {}

ALLOWED_SORT_PARAMS = {'id', 'name', 'number', 'model', 'bg', 'pattern', 'model_rarity', 'bg_rarity', 'pattern_rarity', 'sale_price'}
ALLOWED_SORT_TYPES = {'asc', 'desc'}

MARKETPLACES = {
    8184312603: {'ru_name': 'МРКТ', 'en_name': 'MRKT', 'username': 'mrktbank', 'full_name': 'MRKT Bank', 'value': 'mrkt_market'},
    7736288522: {'ru_name': 'Тоннель', 'en_name': 'Tonnel', 'username': 'giftrelayer', 'full_name': 'Gift Relayer', 'value': 'tonnel_market'},
    7804544881: {'ru_name': 'Порталс', 'en_name': 'Portals', 'username': 'GiftsToPortals', 'full_name': 'Gift Relayer', 'value': 'portals_market'},
    6549302342: {'name': 'Fragment'},
    42777: {'ru_name': 'Телеграм Маркет', 'en_name': 'Telegram Market', 'value': 'telegram_market'}
}

MARKETPLACES_NAMES = {'MRKT Bank', 'Gift Relayer', 'Portal', 'Telegram Market', 'Fragment'}

ALLOWED_SORT_PARAMS = {'number', 'name', 'model', 'bg', 'pattern', 'selling_info'}
ALLOWED_SORT_TYPES = {'asc', 'desc'}


DB_NAME = 'postgres'
DB_HOST = "localhost"
DB_PORT = 5432
DB_USER = "123123"
DB_PASS = "123123"
