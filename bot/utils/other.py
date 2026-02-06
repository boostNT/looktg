from itertools import zip_longest


def chunked(lst, n):
    args = [iter(lst)] * n
    return [list(filter(None, group)) for group in zip_longest(*args)]


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
        return round(price, 3) if str(price)[str(price).find('.')+1:] != '0' else int(price)


def rgn(name):
    return name.replace(' ', '').replace("'", '').replace('-', '').replace("’",'')


def get_nft_link(name, num):
    return f't.me/nft/{rgn(name)}-{num}'