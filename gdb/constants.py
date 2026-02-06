DB_NAME = 'postgres'
DB_HOST = "localhost"
DB_PORT = 5432
DB_USER = "postgres"
DB_PASS = "password"


ST = 4.2
BATCH_SIZE = 150
LEN_OF_MARKET_GIFTS_DATA_BATCH = 5
TONNEL_API_URL = 'https://gifts3.tonnel.network/api/pageGifts'
MRKT_API_URL = 'https://api.tgmrkt.io/api/v1'
PORTALS_API_URL = 'https://portal-market.com/api'
FRAGMENT_API_URL = 'https://fragment.com/api'
IMPERSONATE_LIST = ["chrome99","chrome100","chrome101","chrome104","chrome107","chrome110","chrome116","chrome119","chrome120","chrome123","chrome124","chrome99_android","edge99","edge101","safari15_3","safari15_5","safari17_0","safari17_2_ios"]
TONNEL_HEADERS = {
    'origin': 'https://market.tonnel.network',
    'referer': 'https://market.tonnel.network/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
}


OWNER_FIELDS = ['id', 'updated_at', 'username', 'full_name', 'ton_address', 'gift_address', 'comment', 'channel_id', 'hidden', 'from_user_id', 'from_user_username', 'from_user_full_name', 'to_user_id', 'to_user_username', 'to_user_full_name', 'sale_place', 'sale_id', 'sale_status', 'sale_price', 'sale_on_sale', 'sale_currency']


MARKETPLACES_DICT = {
    7736288522: {'name': 'Tonnel', 'bot_tag': 'Tonnel_Network_bot'},
    8184312603: {'name': 'MRKT', 'bot_tag': 'main_mrkt_bot', 'short_name': 'app'},
    7804544881: {'name': 'Portals', 'bot_tag': 'portals_market_bot', 'short_name': 'market'},
    6549302342: {'name': 'Fragment'},
    42777: {'name': 'TG Market'},
}

MARKETPLACES_IDS = {8184312603, 7736288522, 7804544881, 6549302342}
ONCHAIN_MARKETS = {8184312603, 7736288522, 7804544881}
PORTALS_GIFTS_IDS_DATA = {'Santa Hat': 'b577efed-76dc-410f-bda9-edae43ab0f4a', 'Signet Ring': 'a1a5ec7e-53b9-45b9-91e5-cad37a15fe5e', 'Precious Peach': '40131849-420d-4775-b616-6d359c17c22f', 'Plush Pepe': '8d21b568-63bb-437a-9093-8684c5b63485', 'Spiced Wine': '9aac072e-34d6-4819-a7f4-70ad25af8196', 'Jelly Bunny': '1a139fcf-5850-48c3-aee6-924134ad17d8', "Durov's Cap": 'fc46d19d-5f25-44c5-8924-5976c2fb790e', 'Perfume Bottle': 'e1b2c024-a443-4637-b451-02904a6bc3f6', 'Eternal Rose': 'fa27c78c-6eb9-4653-a619-19544b8255b1', 'Berry Box': 'b8747d58-90ed-49cf-8e29-b9e2c8b3e7a6', 'Vintage Cigar': '48204369-2f95-4909-8018-1660b37c2b9d', 'Magic Potion': 'a17b488a-3942-4eae-89f9-bba2ce342c6b', 'Kissed Frog': '2c68a297-604a-4710-a32e-d3eac17e15ae', 'Hex Pot': '66e62058-8600-471f-909b-844751f5f103', 'Evil Eye': 'f639a421-45df-4848-ac69-a089746828c4', 'Sharp Tongue': '308fc63d-1ebc-4e31-865e-c756018e4dff', 'Trapped Heart': 'bef99328-29f3-454a-abef-4d2f34b3bf3f', 'Skull Flower': '61a23d97-cf11-4c91-8435-476ba84c81eb', 'Scared Cat': 'a4a90909-9a06-4b78-9d75-4de42280334a', 'Spy Agaric': 'a39d2458-5df0-42ff-98d5-08af484001d6', 'Homemade Cake': 'f7a194d4-d53a-419a-b357-3c794f6cd98b', 'Genie Lamp': '7693b50e-b9ad-4eed-8791-a7b4bf3ea726', 'Lunar Snake': 'a4b271b4-efa3-4854-b53f-9ae6f3ecac59', 'Party Sparkler': '53110539-1d3e-4334-9692-a665e0527f69', 'Jester Hat': 'ea32e880-b03c-4791-9385-68d24db9784b', 'Witch Hat': 'a7253309-ed0e-4d5d-972c-2bc9c0194bea', 'Hanging Star': '1d7b6d74-5eef-45ee-b25b-632a96b9505a', 'Love Candle': '128c7b37-36db-4b21-a21b-7d858c8dbc1a', 'Cookie Heart': '35c106ab-7133-4f10-a502-e2c602b64da9', 'Desk Calendar': 'ae8f48a9-e090-44f2-9c61-5928702ab171', 'Jingle Bells': '1501b9b9-83e0-4d05-a3af-d0e2021c6d5e', 'Snow Mittens': '0009551d-bdd4-40ee-a276-b6e01fa4d327', 'Voodoo Doll': 'ba7390cc-72d4-45ce-96e4-d243e22a6500', 'Mad Pumpkin': '1f281b21-1955-4691-923c-8f58ce00a456', 'Hypno Lollipop': 'fe1816f1-a6a9-4770-8921-839a5bfa5a22', 'B-Day Candle': '12efb9cd-179f-44c6-af65-a63480691c18', 'Bunny Muffin': '586cd461-0194-49af-86b0-cbc3b55a2a65', 'Astral Shard': '207d7011-8359-429c-b86b-df191b3659dd', 'Flying Broom': '73de1866-6b90-45b4-a543-fb5ea9ca1415', 'Crystal Ball': 'ac575eb3-2929-48d6-96d0-1db8f12243de', 'Eternal Candle': '257ad54a-134c-437c-ab1e-febc4c798243', 'Swiss Watch': 'f0125f02-2b17-4882-95b4-8715a88678a5', 'Ginger Cookie': 'b85209cd-4e16-4d1a-985c-d784619fe2d0', 'Mini Oscar': 'ea3f1a6f-80c8-4abf-8c56-cd41a0e1c89a', 'Lol Pop': '98850266-bb6c-43a6-9559-accedf420a02', 'Ion Gem': '47f0cf89-4fc9-4aa2-99b2-7f3cf9a6c16a', 'Star Notepad': 'a76231dd-a8be-4f06-b7a3-e119b65074da', 'Loot Bag': 'db7f4abd-96d9-4968-ba81-7f1a07bc2e9c', 'Love Potion': '7369ac28-ddaf-4100-9a75-a4225b64e1b0', 'Toy Bear': '060d4cef-3a21-47e6-98fc-cd338ae0b5e0', 'Diamond Ring': '45aa08dd-94e0-492f-bf04-1952aa024951', 'Sakura Flower': '1c1616f5-2f39-47dc-9f27-e77fa1b6a569', 'Sleigh Bell': '8519c4e9-ef09-48fd-af9c-9e7412809e7c', 'Top Hat': '860ae248-5a63-4ea9-ae6d-defd3c0952b9', 'Record Player': '99cb46d0-c724-4e27-8497-ac381e10d97c', 'Winter Wreath': '13bada87-1353-4db5-b77c-d451c95365e0', 'Snow Globe': 'ffdfcb47-b9c9-4a5c-a59f-d6d236b583cf', 
'Electric Skull': '43b4502a-ca8c-49e8-ba5d-03cdf66d8f48', 'Tama Gadget': 'beed4df4-cce3-4b21-aefe-0cc5e5196834', 'Candy Cane': '8b001ea2-5a73-4a61-a3a2-6f01d557fee7', 'Neko Helmet': 'f3e9621f-a32f-49d9-b602-71ecf2515ded', 'Jack-in-the-Box': '996e7628-28bf-4874-b3ec-2e5f7c1cb684', 'Easter Egg': '88a37665-6d13-4619-afa9-47de8464adb4', 'Bonded Ring': '07484deb-1790-4a21-9d2f-ece02acdcb84', 'Pet Snake': '563ed415-a63b-49e8-870d-745602fb3de3', 'Snake Box': 'f50f29bb-70b5-4502-a21b-8eadf20518fa', 'Xmas Stocking': 'acebace7-be16-4a4b-9b02-c274bed4c856', 'Big Year': '8b58d6ea-a8e0-47ef-bdd1-3ade5d5ea0cb', 'Holiday Drink': '6bf906a0-e5b1-4c7f-b741-a70c3f7ed77b', 'Gem Signet': '020c2380-709d-4d09-bbad-814852b32551', 'Light Sword': '0ebbc5d6-f59f-49f5-9a48-7a1fc1625093', 'Restless Jar': '9537661e-290b-49f3-adaf-d96e8f590288', 'Nail Bracelet': '40311c45-48a8-4863-8abb-7156ae62767b', 'Heroic Helmet': '013a775d-4d7d-457b-9d3d-30a6429ea79f', 'Bow Tie': '216c52eb-447a-4775-921d-a59f9b67082c', 'Heart Locket': '92d41f91-edb8-41a4-8798-85b03924cbb2', 
'Lush Bouquet': 'a656ed7d-fcd7-4412-b143-94e6aafcb30b', 'Whip Cupcake': '35e4cd4e-366b-4731-b7a8-8770d0e42bfe', 'Joyful Bundle': 'c2d8ee29-e14b-4372-9b79-72407f9d593d', 'Cupid Charm': '2ddc363c-1f77-44aa-9dfa-8378add31406', 'Valentine Box': 'd865f0ce-aa14-4764-aa9f-87fb27cb050c', 'Snoop Dogg': '5b4448f0-4805-4c4c-8246-972b82f709bc', 'Swag Bag': '66850ebe-2531-4e25-813a-3f3294818f7d', 'Snoop Cigar': 'f0b752de-c997-43dd-859c-f309008b2352', 'Low Rider': 'a2e98247-e9e5-4fd7-86d7-fce0ceea5d61', 'Westside Sign': '3a2d754c-f1f1-4211-8a4b-26d49b2d17b9', 'Stellar Rocket': '94acaf8c-de56-401f-b096-1c9304016284', 'Jolly Chimp': '7a44c400-e762-4385-83a0-a146ab225dee', 'Moon Pendant': '899324a6-c867-4d22-8883-44164f0fb155', 'Ionic Dryer': '13046126-f10f-46c8-9648-97edee365c27', 'Input Key': '46c95fc3-b4a5-492c-9bb9-974c4c27d858', 'Mighty Arm': 'c881c80a-3b38-4afd-a8ff-50835dcb07b1', 'Artisan Brick': '542a9425-0fbe-42ab-b389-0f9e1581d9c6', 'Clover Pin': '80c24f0d-94cb-4169-ae8c-c10620ae04bb', 'Sky Stilettos': '5dc9c807-f1de-4790-8b53-df3f403b8801', 'Fresh Socks': '5dcccebc-1977-47db-8e3e-6f92bb83c15d', 'Happy Brownie': '27ff8a55-f9b7-435d-af08-1063fdf1e026', 'Ice Cream': 'a4434643-6add-47e1-a68b-8c15b1807b75', 'Spring Basket': 'dd0f6245-034c-4d58-9815-a8e939d1def9', 'Instant Ramen': '6417abaa-3deb-4f4d-b200-356c23401487', 'Faith Amulet': '1583eda9-f5fe-4265-833b-ab973e30afc8', 'Mousse Cake': '5f6892b6-8fd6-4e90-b666-9ebfa5414ae5', 
'Bling Binky': '67e55e12-e917-4bdf-9615-771264021fb7', 'Money Pot': '99f08b67-8723-4506-99e2-b16a5c58ef2a', 'Pretty Posy': '4b38ccc3-0518-4130-89da-def5abc3a4f4', "Khabib's Papakha": '182c1bca-96ef-46c5-ab45-d4b98610ff58', 'UFC Strike': '1211530b-fee3-4256-80a6-fa012bd413da'}

