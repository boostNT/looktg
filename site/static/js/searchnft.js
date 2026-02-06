import { translations } from './translations.js';
let currentLang = localStorage.getItem('language') || 'ru';

const CDN_CHANGES_API_URL = "https://cdn.changes.tg";
const CHANGES_API_URL = "https://api.changes.tg";
const SELF_API_URL = "https://look.tg";
const NFT_FRAGMENT_URL = 'https://nft.fragment.com';


let noNeedAppend;
let selectedParams = {};
let nftGiftsResponseResults = [];
let nftGiftsResponseInfo = null;
let giftNameChoosen = false;
let giftsResultsExists = false;
let currentPage = 1;
let isLoading = false;
let hasMoreData = true;
const checkIsMobile = () => window.innerWidth <= 768;
let isSearchInProgress = false;
let currentViewType = checkIsMobile() ? 'cards' : 'table';
let searchAbortController = null;
const ANONYMOUS_REQUEST_LIMIT = 5;
const apiCache = new Map();
let previousGiftName;




const patternPositions = [{
    top: "5%",
    left: "21.5%",
    size: "8%",
    opacity: "10"
}, {
    top: "5%",
    left: "70.5%",
    size: "8%",
    opacity: "10"
}, {
    top: "38%",
    left: "-4.5%",
    size: "8%",
    opacity: "10"
}, {
    top: "38%",
    left: "96.5%",
    size: "8%",
    opacity: "10"
}, {
    top: "93%",
    left: "46%",
    size: "8%",
    opacity: "10"
}, {
    top: "7%",
    left: "46%",
    size: "8%",
    opacity: "15"
}, {
    top: "21.5%",
    left: "5.3%",
    size: "8%",
    opacity: "15"
}, {
    top: "21.5%",
    left: "86.8%",
    size: "8%",
    opacity: "15"
}, {
    top: "63%",
    left: "2.3%",
    size: "8%",
    opacity: "15"
}, {
    top: "63%",
    left: "89.6%",
    size: "8%",
    opacity: "15"
}, {
    top: "84.2%",
    left: "8.8%",
    size: "8%",
    opacity: "15"
}, {
    top: "84.2%",
    left: "30.8%",
    size: "8%",
    opacity: "15"
}, {
    top: "84.2%",
    left: "61.2%",
    size: "8%",
    opacity: "15"
}, {
    top: "84.2%",
    left: "83%",
    size: "8%",
    opacity: "15"
}, {
    top: "16.5%",
    left: "29%",
    size: "10%",
    opacity: "24"
}, {
    top: "16.5%",
    left: "60.5%",
    size: "10%",
    opacity: "24"
}, {
    top: "30%",
    left: "18.2%",
    size: "8%",
    opacity: "24"
}, {
    top: "28%",
    left: "73.8%",
    size: "8%",
    opacity: "24"
}, {
    top: "45%",
    left: "11%",
    size: "11%",
    opacity: "24"
}, {
    top: "45%",
    left: "77.8%",
    size: "11%",
    opacity: "24"
}, {
    top: "70%",
    left: "19.5%",
    size: "9%",
    opacity: "24"
}, {
    top: "70%",
    left: "71%",
    size: "9%",
    opacity: "24"
}, {
    top: "74.5%",
    left: "45.5%",
    size: "9%",
    opacity: "24"
}];

const NORMALIZED_PARAMS = {
    'names': 'name',
    'models': 'model',
    'bgs': 'bg',
    'patterns': 'pattern',
    'numbers': 'number',
};

const GIFT_NAMES = await getNftGiftsNames();
const GIFT_BACKGROUNDS = await getNftGiftsBgs();
const GIFT_PATTERNS = await getNftGiftsPatterns();

const GIFT_PARAMS = ['names', 'models', 'bgs', 'patterns', 'selling-infos', 'owner-infos'];
const GIFT_PARAMS_REQUIRNG_NAME = ['models'];
const PARAM_FUNCTIONS = {
    'names': GIFT_NAMES,
    'bgs': GIFT_BACKGROUNDS,
    'patterns': GIFT_PATTERNS,
};
const GIFT_PARAMS_NOT_REQUIRNG_API = ['selling-infos', 'owner-infos', 'numbers'];

const TRANSLATED_PARAMS = {
    'names': 'подарки',
    'models': 'модели',
    'bgs': 'фоны',
    'patterns': 'узоры',
};

const paramToTranslationKey = {
    'names': 'all_gifts',
    'models': 'all_models',
    'bgs': 'all_bgs',
    'patterns': 'all_patterns'
};


const MARKETPLACES = {
    'Portals': {
        ru_name: 'Порталс',
        en_name: 'Portals',
        username: 'GiftsToPortals',
        full_name: 'Portal',
        id: 7804544881,
        value: 'portals_market',
        text_color: 'a98ff6',
        link_for_gift: 'https://t.me/portals/market?startapp=gift_'
    },
    'Tonnel': {
        ru_name: 'Тоннель',
        en_name: 'Tonnel',
        username: 'giftrelayer',
        full_name: 'Gift Relayer',
        id: 7736288522,
        value: 'tonnel_market',
        text_color: 'd86fe3',
        link_for_gift: 'https://t.me/tonnel_network_bot/gift?startapp='
    },
    'MRKT': {
        ru_name: 'МРКТ',
        en_name: 'MRKT',
        username: 'mrktbank',
        full_name: 'MRKT Bank',
        id: 8184312603,
        value: 'mrkt_market',
        text_color: '535352',
        link_for_gift: 'https://t.me/mrkt/app?startapp='
    },
    'TG Market': {
        ru_name: 'Телеграм Маркет',
        id: 42777,
        en_name: 'TG Market',
        value: 'telegram_market',
        text_color: '98dddc',
        link_for_gift: 'https://t.me/nft/'
    },
    'Fragment': {
        ru_name: 'Фрагмент',
        en_name: 'Fragment',
        id: 6549302342,
        value: 'fragment',
        text_color: '8c9aa9',
        link_for_gift: 'https://fragment.com/gift/'
    }
};




function saveViewType(viewType) {
    localStorage.setItem('currentViewType', viewType);
}

document.addEventListener('DOMContentLoaded', async () => {
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;

    if (referrer && referrer.startsWith(currentOrigin)) {
        const referrerUrl = new URL(referrer);
        const fromPath = referrerUrl.pathname;


        const savedParams = sessionStorage.getItem('selectedParams');
        // console.log(savedParams);
        if (savedParams) {
            try {
                selectedParams = JSON.parse(savedParams);
                giftNameChoosen = !!selectedParams.name;

                await restoreSelectedParamsState(selectedParams);
                updateModelListStyle();

                if (selectedParams.number) {
                    const numberInput = document.getElementById('nft-number-input');
                    if (numberInput) numberInput.value = selectedParams.number;
                }

                if (selectedParams.sort) {
                    const sortParam = document.getElementById('sort-param-select');
                    const sortOrder = document.getElementById('sort-order-select');
                    if (sortParam && sortOrder) {
                        sortParam.value = selectedParams.sort.type;
                        sortOrder.value = selectedParams.sort.order;
                    }
                }

                if (giftsResultsExists || Object.keys(selectedParams).length > 0) {
                    setTimeout(() => {
                        document.getElementById('find-gifts-btn').click();
                    }, 300);
                }
            } catch (e) {
                console.error("Failed to restore params:", e);
            }
        }

    } else {

    }
});


const savedViewType = localStorage.getItem('currentViewType');
if (savedViewType && ['cards', 'table', 'images'].includes(savedViewType)) {
    if (savedViewType !== 'images') {
        const isMobile = checkIsMobile();
        if ((isMobile && savedViewType === 'cards') || (!isMobile && savedViewType === 'table')) {
            currentViewType = savedViewType;
        }
    }
}


window.addEventListener('resize', () => {
    const newIsMobile = checkIsMobile();
    let newViewType;

    if (newIsMobile) {
        newViewType = currentViewType === 'images' ? 'images' : 'cards';
    } else {
        newViewType = currentViewType === 'images' ? 'images' : 'table';
    }

    if (newViewType !== currentViewType && giftsResultsExists) {
        currentViewType = newViewType;
        saveViewType(currentViewType);
        fillNftGiftsBody(nftGiftsResponseInfo, nftGiftsResponseResults, false, currentViewType);

        setTimeout(() => {
            reconnectObserver();
        }, 100);
    }
});


function howMuchTimeAgo(createdAt) {
    if (!createdAt) return '';

    const pastDate = createdAt * 1000;
    const now = Date.now();
    let diff = now - pastDate;

    if (diff < 0) {
        return 'только что';
    }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} дн ${hours % 24} ч назад`;
    }
    if (hours > 0) {
        return `${hours} ч ${minutes % 60} мин назад`;
    }
    if (minutes > 0) {
        return `${minutes} мин ${seconds % 60} сек назад`;
    }
    if (seconds > 5) {
        return `${seconds} сек назад`;
    }
    return 'только что';
}


function transformApostrof(string) { return string ? String(string).replace(/’/g, "'") : ''; }
function backApostrof(string) { return string.replace("'", "’"); }
function defaultApostrof(string) { return string.replace("’", "'"); }

function convertParamsToString(params) {
    return Object.entries(params)
        .map(([key, value]) => {
            if (key === 'sort') {
                return `&sort_param=${value.type}&sort_type=${value.order}`;
            }
            if (typeof value === 'string' && value.includes("'")) {
                value = backApostrof(value);
            }
            // if (key === 'on_sale_only' && value === true) {
            //     return `&on_sale_only=true`;
            // }

            return `&${key}=${encodeURIComponent(value)}`;
        })
        .join('');
}


function createModal() {
    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.className = 'nft-gift-modal';
    modal.style.display = 'none';
    document.body.appendChild(modal);
    return modal;
}


function showLimitReachedModal() {
    const modal = createModal();
    const style = document.createElement('style');
    document.head.appendChild(style);

    modal.innerHTML = `
        <div class="auth-modal-overlay"></div>
        <div class="auth-modal">
            <h3 data-lang="limit_reached">Вы исчерпали лимит запросов на сегодня.</h3>
            <p data-lang="limit_subscribe">Вы можете подождать 24 часа, приобрести подписку или пригласить друзей по реферальной ссылке на странице профиля для снятия ограничений.
            </p>
            <a href="/profile" class="state-btn go-to-profile-btn no-underline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
                </svg>
                <span>Перейти в профиль</span>
            </a>
        </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        modal.querySelector('.auth-modal-overlay').classList.add('show');
        modal.querySelector('.auth-modal').classList.add('show');
    });

    const closeModal = () => {
        const overlay = modal.querySelector('.auth-modal-overlay');
        const authModal = modal.querySelector('.auth-modal');
        overlay.classList.remove('show');
        authModal.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            modal.innerHTML = '';
            document.body.style.overflow = '';
            style.remove();
        }, 300);
    };

    modal.querySelector('.auth-modal-overlay').addEventListener('click', closeModal);

    applyTranslations(modal);
}


function fillBlockWithPatterns(targetBlock, giftName, patternName, textColor, zIndex = undefined) {
    if (!targetBlock || !giftName || !patternName) {
        return;
    }
    const existingOverlay = targetBlock.querySelector('.pattern-overlay');
    if (existingOverlay) {
        if (existingOverlay.dataset.patternName === patternName) {
            return;
        }
        existingOverlay.remove();
    }

    const renderOverlay = async () => {
        const targetBlockWidth = targetBlock.offsetWidth;
        const targetBlockHeight = targetBlock.offsetHeight;
        if (!targetBlockWidth || !targetBlockHeight) {
            return;
        }

        const uniqueId = `${giftName.replace(/[^a-zA-Z0-9]/g, '')}-${patternName.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 9)}`;

        let patternSrcWithTransform = `${CDN_CHANGES_API_URL}/gifts/patterns/${transformApostrof(giftName)}/png/${transformApostrof(patternName)}.png`;
        // const patternSrcWithoutTransform = `${CDN_CHANGES_API_URL}/gifts/patterns/${transformApostrof(giftName)}/png/${patternName}.png`;




        const r = fetch(patternSrcWithTransform, { method: 'HEAD' });
        if (!r.ok) {
            const patternsData = await getNftGiftsPatterns();
            const patternItem = patternsData.find(item => item.pattern === patternName);
            if (patternItem) {
                patternSrcWithTransform = `${CDN_CHANGES_API_URL}/gifts/patterns/${transformApostrof(patternItem.gift_name)}/png/${patternItem.pattern}.png`;
            }
        }


        const finalTextColor = textColor || '#6c6868';
        const patternUses = patternPositions.map(pos => {
            const size = (parseFloat(pos.size) / 100) * Math.min(targetBlockWidth, targetBlockHeight);
            const translateX = ((parseFloat(pos.left) / 100) * targetBlockWidth) * 1.1;
            const translateY = ((parseFloat(pos.top) / 100) * targetBlockHeight) * 1.1;
            const opacity = `0.${pos.opacity}`;

            return `
            <g opacity="${opacity}" transform="translate(${translateX}, ${translateY}) scale(${size / 100})" filter="url(#colorize-${uniqueId})">
                <use xlink:href="#patternImage-${uniqueId}"></use>
            </g>
        `;
        }).join('');

        let zIndexStr = zIndex !== undefined ? `z-index: ${zIndex};` : '';
        const svgString = `
        <svg class="pattern-overlay" data-pattern-name="${patternName}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;${zIndexStr}">
            <defs>
                <image id="patternImage-${uniqueId}" x="-50" y="-50" width="100" height="100"
                    xlink:href="${patternSrcWithTransform}"/>
                <filter id="colorize-${uniqueId}">
                    <feFlood flood-color="${finalTextColor}" result="flood" />
                    <feComposite in="flood" in2="SourceAlpha" operator="in" />
                </filter>
            </defs>
            ${patternUses}
        </svg>
    `;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = svgString.trim();
        const svgElement = tempContainer.firstChild;
        targetBlock.appendChild(svgElement);
    };

    if (!targetBlock.offsetWidth || !targetBlock.offsetHeight) {
        const resizeObserver = new ResizeObserver(() => {
            if (targetBlock.offsetWidth && targetBlock.offsetHeight) {
                resizeObserver.disconnect();
                renderOverlay();
            }
        });
        resizeObserver.observe(targetBlock);
        requestAnimationFrame(renderOverlay);
    } else {
        renderOverlay();
    }
}


async function getNftGiftsNames() {
    try {
        const fallbackResponse = await fetch(`${CDN_CHANGES_API_URL}/gifts/id-to-name.json`, {
            cache: 'no-cache',
        });
        const fallbackData = await fallbackResponse.json();
        return Object.values(fallbackData) || [];
    } catch (e) {
        // console.warn('Could not fetch from self API, falling back to CDN.', e);
        try {
            const response = await fetch(`${SELF_API_URL}/api/getnftgifts/names`);
            if (!response.ok) {
                console.log('self err', response);
                throw new Error(`Self API failed with status: ${response.status}`);
            }
            const data = await response.json();
            return Array.from(data.names) || [];
        } catch (fallbackError) {
            // console.error('Fallback to CDN also failed:', fallbackError);
            return [];
        }
    }
}

async function getNftGiftsModels(name) {
    const cacheKey = `models_${name}`;
    if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
    }

    try { // Сначала пробуем загрузить с CDN
        const response = await fetch(`${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(name)}/sorted.json`, {
            cache: 'no-cache',
        });
        if (!response.ok) {
            throw new Error(`CDN API for models failed with status: ${response.status}`);
        }
        const data = await response.json();
        const models = Array.from(data).map(val => val.name) || [];
        if (models.length > 0) {
            apiCache.set(cacheKey, models);
        }
        return models;
    } catch (e) {
        console.warn('Could not fetch models from CDN API, falling back to self API.', e);
        // В случае ошибки, загружаем с нашего API
        try {
            const fallbackResponse = await fetch(`${SELF_API_URL}/api/getnftgifts/models?name=${encodeURIComponent(name)}`);
            const fallbackData = await fallbackResponse.json();
            const models = fallbackData.models || [];
            if (models.length > 0) {
                apiCache.set(cacheKey, models);
            }
            return models;
        } catch (fallbackError) {
            console.error('Fallback to self API for models also failed:', fallbackError);
            return [];
        }
    }
}



async function getNftGiftsBgs(name = null) {
    const cacheKey = `bgs_${name || 'all'}`;
    if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
    }

    try { // Сначала пробуем загрузить с CDN
        const url = name
            ? `${CDN_CHANGES_API_URL}/gifts/backdrops/${name}/backdrops.json`
            : `${CDN_CHANGES_API_URL}/gifts/backdrops.json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CDN API for bgs failed with status: ${response.status}`);
        }
        const data = await response.json();
        const bgs = Array.from(data)
            .map(val => ({ name: val.name, centerColor: val.centerColor, edgeColor: val.edgeColor, textColor: val.textColor }))
            .sort((a, b) => a.name.localeCompare(b.name));
        if (bgs.length > 0) {
            apiCache.set(cacheKey, bgs);
        }
        return bgs;
    } catch (e) {
        console.warn('Could not fetch bgs from CDN API, falling back to self API.', e);
        const response = await fetch(`${SELF_API_URL}/api/getnftgifts/bgs`);
        const data = await response.json();
        const bgs = Array.from(data)
            .map(val => ({ name: val.name }))
            .sort((a, b) => a.name.localeCompare(b.name));
        if (bgs.length > 0) {
            apiCache.set(cacheKey, bgs);
        }
        return bgs;
    }
}

async function getNftGiftsPatterns(name = null) {
    let patterns = [];
    const cacheKey = `patterns_${name || 'all'}`;

    if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
    }

    if (name) {
        try { // Сначала пробуем загрузить с CDN
            const response = await fetch(`${CDN_CHANGES_API_URL}/gifts/patterns/${name}/patterns.json`);
            if (!response.ok) {
                throw new Error(`CDN API for patterns failed with status: ${response.status}`);
            }
            const data = await response.json();
            patterns = Array.from(data).map(val => val.name);
            if (patterns.length > 0) {
                apiCache.set(cacheKey, patterns);
            }
            return patterns;
        } catch (e) {
            console.warn('Could not fetch patterns from CDN API, falling back to self API.', e);
            // В случае ошибки, загружаем с нашего API
            const fallbackResponse = await fetch(`${SELF_API_URL}/api/getnftgifts/patterns_by_name?name=${encodeURIComponent(name)}`);
            const fallbackData = await fallbackResponse.json();
            patterns = fallbackData.patterns || [];
            if (patterns.length > 0) {
                apiCache.set(cacheKey, patterns);
            }
            return patterns;
        }
    } else {
        // Если имя не указано, получаем все паттерны, как и раньше
        const response = await fetch(`${SELF_API_URL}/api/getnftgifts/patterns`);
        const data = await response.json();
        patterns = data.patterns || [];
        apiCache.set(cacheKey, patterns);
        return data.patterns || [];
    }
}


function convertGiftNameForLink(name) {
    return name.replace(/[- '’]/g, '').replace('’', '');
}


async function restoreSelectedParamsState(params) {
    if (!params || Object.keys(params).length === 0) return;

    await new Promise(resolve => setTimeout(resolve, 500));

    for (const [paramKey, paramValue] of Object.entries(params)) {
        if (paramKey === 'sort') continue;

        let paramName = null;
        for (const [key, value] of Object.entries(NORMALIZED_PARAMS)) {
            if (value === paramKey) {
                paramName = key;
                break;
            }
        }

        if (!paramName) continue;

        let domParamName = paramName;
        if (paramName === 'names') domParamName = 'name';
        else if (paramName === 'models') domParamName = 'model';
        else if (paramName === 'bgs') domParamName = 'bg';
        else if (paramName === 'patterns') domParamName = 'pattern';

        const targetDiv = document.querySelector(`.searchtools.${domParamName} .paramlist`);
        if (targetDiv) {
            const allParamSpan = targetDiv.querySelector(`#all-${paramName}`);
            if (allParamSpan) {
                allParamSpan.textContent = paramValue;
                allParamSpan.style.color = 'rgb(117, 205, 208)';
                // allParamSpan.style.color = 'rgb(208, 117, 117)';
            }
        }

        const spanWithSelectedParam = document.getElementById(`all-${paramName}`);
        if (spanWithSelectedParam) {
            // spanWithSelectedParam.style.color = 'rgb(208, 117, 117)';
        }

        const ownerInfoSpan = document.querySelector('.owner-info #all-owner-infos');
        if (ownerInfoSpan) {
            if (params.biggest_owner) {
                ownerInfoSpan.textContent = translations[currentLang].biggest_owner || 'Biggest Owner';
                ownerInfoSpan.style.color = 'rgb(117, 205, 208)';
                ownerInfoSpan.removeAttribute('data-lang');
            } else if (params.owner_param && params.owner_value) {
                const labelElement = document.querySelector(`.modal-input-group label[for="${params.owner_param}"]`);
                const labelText = labelElement ? labelElement.textContent : params.owner_param;
                ownerInfoSpan.textContent = `${labelText}: ${String(params.owner_value).substring(0, 10)}`;
                ownerInfoSpan.style.color = 'rgb(117, 205, 208)';
                ownerInfoSpan.removeAttribute('data-lang');
            }
        }

        const sellingInfoSpan = document.querySelector('.selling-info #all-selling-infos');
        if (sellingInfoSpan) {
            let displayText = null;
            let applyStyle = false;

            if (params.selling_param === 'on_sale' && params.selling_value === 'true') {
                displayText = translations[currentLang]['on_sale_only'] || 'Только на продаже';
                applyStyle = true;
            }

            if (displayText) {
                sellingInfoSpan.textContent = displayText;
                sellingInfoSpan.style.color = 'rgb(117, 205, 208)';
                sellingInfoSpan.removeAttribute('data-lang');
            }
        }

        if (paramKey === 'name') {
            giftNameChoosen = true;
            const giftNameNotChosen = document.getElementById('gift-name-not-chosen');
            if (giftNameNotChosen) {
                giftNameNotChosen.textContent = '';
            }

            try {
                if (!params.model) {
                    updateModelListStyle();
                    await loadAnimation(paramValue);
                    updateModelListStyle();
                }
            } catch (e) {
            }
        } else if (paramKey === 'bg') {
            try {
                await loadBg(paramValue);
            } catch (e) {
            }
        } else if (paramKey === 'model') {
            try {
                await loadModel(paramValue);
            } catch (e) {
            }
        } else if (paramKey === 'pattern') {
            try {
                await loadPatternLottie(params.name || '', paramValue);
            } catch (e) {
            }
        }
    }
}

function paramsListClicked(param) {
    return async function (e) {
        let domParamName = param;
        if (param === 'names') {
            domParamName = 'name';
        }
        else if (param === 'models') domParamName = 'model';
        else if (param === 'bgs') domParamName = 'bg';
        else if (param === 'patterns') domParamName = 'pattern';

        let targetDiv = document.querySelector(`.searchtools.${domParamName} .paramlist`);
        if (!targetDiv) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const allParamSpan = targetDiv.querySelector(`#all-${param}`);
        const isOpen = targetDiv.classList.contains('open');

        document.querySelectorAll('.paramlist.open').forEach(list => {
            const span = list.querySelector('span[id^="all-"]');
            if (span) span.classList.remove('active-param');
            list.classList.remove('open');
        });

        if (isOpen) {
            if (allParamSpan) allParamSpan.classList.remove('active-param');
            return;
        }

        targetDiv.classList.add('open');
        if (allParamSpan) allParamSpan.classList.add('active-param');

        let giftItemList = document.createElement('div');
        giftItemList.className = 'dropdown-list';

        let overlay = null;
        if (checkIsMobile()) {
            overlay = document.createElement('div');
            overlay.className = 'dropdown-overlay';
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                closeMobileDropdown(targetDiv);
            });
        }

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        if (checkIsMobile()) {
            giftItemList.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                isDragging = true;
            }, { passive: true });

            giftItemList.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;

                if (deltaY > 50 && giftItemList.scrollTop === 0) {
                    closeMobileDropdown(targetDiv);
                    isDragging = false;
                }
            }, { passive: true });

            giftItemList.addEventListener('touchend', () => {
                isDragging = false;
            }, { passive: true });
        }

        let searchInput = document.createElement('input');
        searchInput.className = 'gift-search-input';
        searchInput.placeholder = 'Поиск';
        searchInput.setAttribute('data-lang', 'search');
        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (checkIsMobile()) {
                searchInput.focus();
            }
        });
        searchInput.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();
            const items = giftItemList.querySelectorAll('.gift-item-undiv:not(#all-' + param + ')');
            items.forEach(item => {
                const text = item.querySelector('span').textContent.toLowerCase().replace('-', '');
                item.style.display = text.includes(filterText) ? 'flex' : 'none';
            });
        });
        giftItemList.appendChild(searchInput);



        let allOption = document.createElement('div');
        allOption.className = 'gift-item-undiv medium-font';
        allOption.innerHTML = `${translations[currentLang][paramToTranslationKey[param]] || 'Все'}`;
        allOption.id = `all-${param}`;
        allOption.addEventListener('click', (e) => {
            e.stopPropagation();
            delete selectedParams[NORMALIZED_PARAMS[param]];
            sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));
            targetDiv.querySelector(`#all-${param}`).textContent = translations[currentLang][paramToTranslationKey[param]] || `Все ${TRANSLATED_PARAMS[param]}`;

            targetDiv.querySelector(`#all-${param}`).style.color = '';
            targetDiv.querySelector(`#all-${param}`).classList.remove('active-param');
            targetDiv.classList.remove('open');

            if (param === 'names') {
                giftNameChoosen = false;
                const animationContainer = document.getElementById('lottie-animation');

                if (selectedParams.model) {
                    const allModels = document.getElementById('all-models');
                    allModels.textContent = translations[currentLang]['all_models'] || 'Все модели';
                    allModels.style.color = '';
                }

                if (animationContainer) {
                    lottie.getRegisteredAnimations().forEach(anim => anim.destroy());
                    animationContainer.innerHTML = '';
                }
                updateModelListStyle();
            } else if (param === 'models') {
                const animationContainer = document.getElementById('lottie-animation');
                if (animationContainer) {
                    lottie.getRegisteredAnimations().forEach(anim => anim.destroy());
                    animationContainer.innerHTML = '';
                }
            } else if (param === 'bgs') {
                const viewBox = document.querySelector('.nftpreview');
                if (viewBox) viewBox.style.background = '';
            } else if (param === 'patterns') {
                const targetBlockToFill = document.querySelector('.nftpreview.main-unbox');
                const existingOverlay = targetBlockToFill.querySelector('.pattern-overlay');
                if (existingOverlay) existingOverlay.remove();
            }

            if (checkIsMobile()) closeMobileDropdown(targetDiv);
        });
        giftItemList.appendChild(allOption);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'dropdown-items-container';
        giftItemList.appendChild(itemsContainer);

        const existingDropdown = targetDiv.querySelector('.dropdown-list');
        const existingOverlay = document.querySelector('.dropdown-overlay');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        if (existingOverlay) {
            existingOverlay.remove();
        }

        if (checkIsMobile() && overlay) {
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => overlay.classList.add('show'));
        }

        if (checkIsMobile()) {
            document.body.appendChild(giftItemList);
            requestAnimationFrame(() => giftItemList.classList.add('open'));
        } else {
            targetDiv.appendChild(giftItemList);
        }

        if (checkIsMobile()) {
            searchInput.blur();
        } else {
            setTimeout(() => searchInput.focus(), 0);
        }

        itemsContainer.innerHTML = `<div class="dropdown-loading" data-lang="loading"></div>`;
        applyTranslations(itemsContainer);

        const giftName = selectedParams.name;
        let data = [];
        if (GIFT_PARAMS.includes(param)) {
            if (GIFT_PARAMS_REQUIRNG_NAME.includes(param)) {
                if (giftNameChoosen) data = await getNftGiftsModels(giftName);
            } else {
                if (giftNameChoosen && (param === 'patterns' || param === 'bgs')) {
                    if (param === 'patterns') data = await getNftGiftsPatterns(giftName);
                    else if (param === 'bgs') data = await getNftGiftsBgs(giftName);
                    else data = PARAM_FUNCTIONS[param];
                } else {
                    data = PARAM_FUNCTIONS[param];
                }
                data.sort();
            }
        }

        itemsContainer.innerHTML = '';
        allOption.innerHTML = `${translations[currentLang][paramToTranslationKey[param]] || 'Все'} <p class='small-number grray'>(${data.length})</p>`;

        data.forEach(item => {
            let itemName = item;
            let giftItem = document.createElement('div');
            giftItem.className = 'gift-item-undiv light-font';
            const normalizedName = transformApostrof(item.name || item.gift_name || item);
            let giftItemPng = document.createElement('img');
            giftItemPng.loading = 'lazy';
            giftItemPng.addEventListener('load', () => {
                giftItemPng.classList.add('loaded');
                delete giftItemPng.dataset.skipLoaded;
            });
            giftItemPng.addEventListener('error', () => {
                if (giftItemPng.dataset.skipLoaded === '1') return;
                giftItemPng.classList.add('loaded');
            });

            if (param === 'names') {
                const pngItemLink = `${CDN_CHANGES_API_URL}/gifts/models/${normalizedName}/png/Original.png`;
                giftItemPng.className = 'gift-item-img';
                giftItemPng.src = pngItemLink;
                giftItemPng.alt = item;
                giftItem.appendChild(giftItemPng);
            } else if (param === 'bgs') {
                const itembg = document.createElement('div');
                itembg.className = 'gift-item-unbg';
                let centerColor = item.centerColor ? `#${item.centerColor.toString(16).padStart(6, '0')}` : item['hex-centerColor'];
                let edgeColor = item.edgeColor ? `#${item.edgeColor.toString(16).padStart(6, '0')}` : item['hex-edgeColor'];
                let bgColor = item
                    ? `radial-gradient(circle, ${centerColor} 1%, ${edgeColor} 80%)`
                    : '#ccc';
                itembg.style.background = bgColor;
                giftItem.appendChild(itembg);
                itemName = item.name;
            } else if (param === 'models') {
                const pngItemLink = `${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(giftName)}/png/${item}.png`;
                giftItemPng.className = 'gift-item-img';
                giftItemPng.src = pngItemLink;
                giftItemPng.alt = item;
                giftItem.appendChild(giftItemPng);
            } else if (param === 'patterns') {
                const pngItemLink = giftNameChoosen === true ? `${CDN_CHANGES_API_URL}/gifts/${param}/${transformApostrof(giftName)}/png/${item}.png` : `${CDN_CHANGES_API_URL}/gifts/${param}/${transformApostrof(item.gift_name)}/png/${transformApostrof(item.pattern)}.png`;
                giftItemPng.className = 'gift-item-img';
                giftItemPng.src = pngItemLink;
                giftItemPng.alt = item.pattern || item;

                if (!giftNameChoosen) {
                    giftItemPng.dataset.skipLoaded = '1';
                    const fallbackUrl = `${CDN_CHANGES_API_URL}/gifts/${param}/${transformApostrof(item.gift_name)}/png/${item.pattern}.png`;
                    const onPatternError = function onPatternError() {
                        if (giftItemPng.dataset.retried !== '1') {
                            giftItemPng.dataset.retried = '1';
                            giftItemPng.src = fallbackUrl;
                        } else {
                            delete giftItemPng.dataset.skipLoaded;
                            giftItemPng.classList.add('loaded');
                            giftItemPng.removeEventListener('error', onPatternError);
                        }
                    };
                    giftItemPng.addEventListener('error', onPatternError);
                }

                giftItem.appendChild(giftItemPng);
            }

            let textSpan = document.createElement('span');
            textSpan.textContent = item.pattern || itemName;
            giftItem.appendChild(textSpan);

            giftItem.addEventListener('click', (e) => {
                e.stopPropagation();

                if (param === 'names') {
                    previousGiftName = selectedParams.name;
                }

                selectedParams[NORMALIZED_PARAMS[param]] = item.pattern || itemName;
                sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));

                const spanWithSelectedParam = document.getElementById(`all-${param}`);
                spanWithSelectedParam.style.color = 'rgb(117, 205, 208)';

                // if (spanWithSelectedParam && Object.keys(selectedParams).includes(param.replace('s', ''))) spanWithSelectedParam.style.color = 'rgb(208, 117, 117)';
                if (param === 'names' && selectedParams.name !== previousGiftName) {
                    const paramsToReset = ['model', 'pattern'];
                    paramsToReset.forEach(paramToReset => {
                        delete selectedParams[paramToReset];
                        const paramSpan = document.getElementById(`all-${paramToReset}s`);
                        if (paramSpan) {
                            const translationKey = `all_${paramToReset}`;
                            const defaultText = `Все ${TRANSLATED_PARAMS[`${paramToReset}s`]}`;
                            paramSpan.textContent = translations[currentLang][translationKey] || defaultText;
                            paramSpan.style.color = '';
                        }
                        if (paramToReset === 'pattern') {
                            const targetBlockToFill = document.querySelector('.nftpreview.main-unbox');
                            const existingOverlay = targetBlockToFill.querySelector('.pattern-overlay');
                            if (existingOverlay) existingOverlay.remove();
                        }
                    });
                }

                targetDiv.querySelector(`#all-${param}`).textContent = item.pattern || itemName;
                spanWithSelectedParam.classList.remove('active-param');
                targetDiv.classList.remove('open');
                if (checkIsMobile()) closeMobileDropdown(targetDiv);

                if (param === 'names') {
                    giftNameChoosen = true;
                    loadAnimation(itemName);
                    updateModelListStyle();
                    document.getElementById('gift-name-not-chosen').textContent = '';
                } else if (param === 'bgs') {
                    const bgDiv = giftItem.querySelector('.gift-item-unbg');
                    let bgColor = bgDiv.style.background;
                    loadBg(bgColor);
                } else if (param === 'models') {
                    loadModel(item);
                } else if (param === 'patterns') {
                    loadPatternLottie(item.gift_name || giftName, item.pattern || item);
                }
            });
            itemsContainer.appendChild(giftItem);
        });
    };
}



document.querySelectorAll('.searchtools .paramlist, .nft-number-input-div').forEach(list => {
    let param = list.classList.contains('name') ? 'names' :
        list.classList.contains('model') ? 'models' :
            list.classList.contains('number') ? 'numbers' :
                list.classList.contains('bg') ? 'bgs' :
                    list.classList.contains('pattern') ? 'patterns' :
                        list.classList.contains('selling-info') ? 'selling-infos' :
                            list.classList.contains('owner-info') ? 'owner-infos' : '';
    if (param) {
        if (!giftNameChoosen && param === 'models') {
            return;
        } if (GIFT_PARAMS_NOT_REQUIRNG_API.includes(param)) {
            list.addEventListener('click', inputsListClicked(param));
        } else {
            list.addEventListener('click', paramsListClicked(param));
        }
    }
});


updateModelListStyle();


function updateModelListStyle() {
    const modelDiv = document.querySelector('.searchtools.model .paramlist');
    if (modelDiv) {
        modelDiv.classList.remove('model-disabled');
        const newModelDiv = modelDiv.cloneNode(true);
        modelDiv.parentNode.replaceChild(newModelDiv, modelDiv);
        if (!giftNameChoosen) {
            newModelDiv.classList.add('model-disabled');
            newModelDiv.style.cursor = 'not-allowed';
            newModelDiv.style.background = '';
            newModelDiv.style.opacity = '0.5';
            newModelDiv.addEventListener('mouseout', () => {
                newModelDiv.style.background = '';
            });
            newModelDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                return;
            });
        } else {
            newModelDiv.style.cursor = 'pointer';
            newModelDiv.style.background = '';
            newModelDiv.style.opacity = '1';
            newModelDiv.addEventListener('click', paramsListClicked('models'));
        }
    }
}


async function loadModel(modelName) {
    const container = document.getElementById('lottie-animation');
    if (container) {
        const animations = lottie.getRegisteredAnimations();
        animations.forEach(anim => anim.container === container && anim.destroy());
        container.innerHTML = '';
        container.innerHTML = `<dotlottie-wc src="https://lottie.host/177c7b9c-9327-40bd-9ad9-2f292277cdc5/GYMkqo1QNE.lottie" style="width: 2rem;height: 2rem;margin:0 auto;align-items: center;align-self: center; align-content: center" speed="1" autoplay loop></dotlottie-wc>`;
    }

    const normalizedName = transformApostrof(modelName);
    const giftName = transformApostrof(selectedParams.name);
    let timeoutId = null;
    const animation = window.lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: `${CDN_CHANGES_API_URL}/gifts/models/${giftName}/lottie/${normalizedName}.json`,
    });
    animation.addEventListener('DOMLoaded', () => {
        clearTimeout(timeoutId);
        const loader = container.querySelector('dotlottie-wc');
        if (loader) {
            loader.remove();
        }
        const fallbackImg = container.querySelector('img');
        if (fallbackImg) {
            fallbackImg.remove();
        }
    });

    const showError = () => {
        const loader = container.querySelector('dotlottie-wc');
        if (loader) {
            loader.remove();
        }
        const fallbackImg = document.createElement('img');
        fallbackImg.src = `${CDN_CHANGES_API_URL}/gifts/models/${giftName}/png/${normalizedName}.png`;
        fallbackImg.style.cssText = 'width: 150px; height: 150px;';
        if (container) {
            container.appendChild(fallbackImg);
        }
    };

    animation.addEventListener('error', showError);
    timeoutId = setTimeout(showError, 6000);

    container.style.display = 'flex';
    container.style.transform = 'scale(1.3)';
}

async function loadAnimation(name) {
    const container = document.getElementById('lottie-animation');
    if (container) {
        const animations = lottie.getRegisteredAnimations();
        animations.forEach(anim => anim.container === container && anim.destroy());
        container.innerHTML = '';
        container.innerHTML = `<dotlottie-wc src="https://lottie.host/177c7b9c-9327-40bd-9ad9-2f292277cdc5/GYMkqo1QNE.lottie" style="width: 2rem;height: 2rem;margin:0 auto;align-items: center;align-self: center; align-content: center" speed="1" autoplay loop></dotlottie-wc>`;
    }

    const normalizedName = transformApostrof(name);
    let timeoutId = null;
    const animation = window.lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: `${CDN_CHANGES_API_URL}/gifts/models/${normalizedName}/lottie/Original.json`,
    });
    animation.addEventListener('DOMLoaded', () => {
        clearTimeout(timeoutId);
        const loader = container.querySelector('dotlottie-wc');
        if (loader) {
            loader.remove();
        }
        const fallbackImg = container.querySelector('img');
        if (fallbackImg) {
            fallbackImg.remove();
        }
    });

    const showError = () => {
        const loader = container.querySelector('dotlottie-wc');
        if (loader) {
            loader.remove();
        }
        const fallbackImg = document.createElement('img');
        fallbackImg.src = `${CDN_CHANGES_API_URL}/gifts/models/${normalizedName}/png/Original.png`;
        fallbackImg.style.cssText = 'width: 150px; height: 150px;';
        if (container) {
            container.appendChild(fallbackImg);
        }
    };

    animation.addEventListener('error', showError);
    timeoutId = setTimeout(showError, 6000);

    container.style.display = 'flex';
}


async function loadPatternLottie(name, pattern) {
    const container = document.getElementById('lottie-animation-pattern');
    if (container && name && pattern) {
        let textColor = '#6c6868';
        if (selectedParams.bg && selectedParams.name) {
            try {
                const bgData = await getNftGiftsBgs(transformApostrof(selectedParams.name));
                const bgItem = bgData.find(item => item.name === selectedParams.bg);
                if (bgItem) {
                    textColor = bgItem.textColor ? `#${bgItem.textColor.toString(16).padStart(6, '0')}` : (bgItem['hex-textColor'] || '#6c6868');
                }
            } catch (e) {
            }
        }
        const targetBlockToFill = document.querySelector('.nftpreview.main-unbox');
        fillBlockWithPatterns(targetBlockToFill, name, pattern, textColor);
    }
}


async function loadBg(bgColor) {
    const viewBox = document.querySelector('.nftpreview');
    viewBox.style.background = bgColor;
}


window.addEventListener('beforeunload', () => {
    if (Object.keys(selectedParams).length > 0) {
        sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && Object.keys(selectedParams).length > 0) {
        sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));
    }
});


document.getElementById('sort-div').addEventListener('click', async (e) => {
    const sortSelecting = document.getElementById('sort-selecting');
    let displayingSort = sortSelecting.style.display;

    if (e.target.closest('#sort-selecting')) {
        return;
    }

    if (displayingSort === 'block') {
        sortSelecting.style.display = 'none';
    } else {
        const currentSelections = {
            gift: document.getElementById('all-names').textContent,
            model: document.getElementById('all-models').textContent,
            bg: document.getElementById('all-bgs').textContent,
            pattern: document.getElementById('all-patterns').textContent
        };

        sortSelecting.style.display = 'block';
        applyTranslations();

        document.getElementById('all-names').textContent = currentSelections.gift;
        document.getElementById('all-models').textContent = currentSelections.model;
        document.getElementById('all-bgs').textContent = currentSelections.bg;
        document.getElementById('all-patterns').textContent = currentSelections.pattern;

        if (selectedParams.sort) {
            document.getElementById('sort-param-select').value = selectedParams.sort.type;
            document.getElementById('sort-order-select').value = selectedParams.sort.order;
        }
    }
});





document.getElementById('apply-sort-btn').addEventListener('click', async () => {
    // if (isSearchInProgress) {
    //     console.log('Search is already in progress. Please wait.');
    //     return;
    // }

    const sortParam = document.getElementById('sort-param-select').value;
    const sortOrder = document.getElementById('sort-order-select').value;

    selectedParams['sort'] = { type: sortParam, order: sortOrder };

    document.getElementById('sort-selecting').style.display = 'none';

    if (giftsResultsExists) {
        isSearchInProgress = true;
        currentPage = 1;
        hasMoreData = true;
        observer.disconnect();
        const paramsString = convertParamsToString(selectedParams);
        try {
            const { info, results } = await fetchNftGifts(currentPage, paramsString);
            nftGiftsResponseResults = results;
            await fillNftGiftsBody(info, nftGiftsResponseResults, false, currentViewType);
            await restoreSelectedParamsState(selectedParams);
        } catch (e) {
            // console.error("Error applying sort:", e);
        }
    }
});

document.getElementById('clear-sort-btn').addEventListener('click', () => {
    delete selectedParams.sort;
    document.getElementById('sort-param-select').value = 'number';
    document.getElementById('sort-order-select').value = 'asc';
    if (giftsResultsExists) {
        document.getElementById('apply-sort-btn').click();
    }
});


document.addEventListener('click', (e) => {
    const sortDiv = document.getElementById('sort-div');
    const sortSelecting = document.getElementById('sort-selecting');

    if (sortSelecting && !e.target.closest('#sort-div') && sortSelecting.style.display === 'block') {
        sortSelecting.style.display = 'none';
    }

    const openParamLists = document.querySelectorAll('.paramlist.open');
    if (openParamLists.length > 0 && !e.target.closest('.paramlist')) {
        openParamLists.forEach(list => {
            list.classList.remove('open');
            if (checkIsMobile()) closeMobileDropdown(list);
        });
    }
});


async function fillNftGiftsBody(info, newResults, append = false, viewType) {
    if (info.totalFound < 20) {
        noNeedAppend = true;
    } else {
        noNeedAppend = false;
    }


    if (!append) {
        currentPage = 1;
        hasMoreData = true;
    }
    const displayInfo = info || nftGiftsResponseInfo;
    const isMobile = checkIsMobile();

    currentViewType = viewType || currentViewType;
    saveViewType(currentViewType);

    const nextViewType = isMobile
        ? (currentViewType === 'cards' ? 'images' : 'cards')
        : (currentViewType === 'table' ? 'images' : 'table');

    const nftGiftsMainBox = document.getElementById('nft-gifts-main-box');
    const resRightSwapViewBut = document.createElement('div');
    resRightSwapViewBut.id = 'swap-nft-view';

    const viewIcons = {
        table: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 images-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" /></svg>`,
        images: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 images-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>`,
        cards: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 images-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>`
    };

    const tableIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 images-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" /></svg>`;
    const imagesIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 images-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>`;
    const cardsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 images-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>`;
    resRightSwapViewBut.innerHTML = viewIcons[nextViewType] || viewIcons.table;

    resRightSwapViewBut.innerHTML = nextViewType === 'images' ? imagesIcon : nextViewType === 'table' ? tableIcon : cardsIcon;

    let fragment = document.createDocumentFragment();
    let tbody;
    const thead = document.createElement('thead');

    if (!append) {
        nftGiftsMainBox.innerHTML = '';
        const nftGiftRes = document.createElement('div');
        nftGiftRes.className = 'nft-res-box';

        const resLeftDiv = document.createElement('div');
        resLeftDiv.className = 'nft-res-div-left';
        const resLeftSpan = document.createElement('span');
        if (displayInfo && displayInfo.totalFound) {
            resLeftSpan.innerHTML = `<span data-lang='found_gifts'>Найдено подарков</span>: ${(displayInfo.totalFound).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
        } else {
            resLeftSpan.innerText = 'Результаты поиска';
        }
        resLeftDiv.appendChild(resLeftSpan);

        const resRightDiv = document.createElement('div');
        resRightDiv.className = 'nft-res-div-right';

        resRightSwapViewBut.addEventListener('click', async (e) => {
            e.preventDefault();

            const oldContainer = nftGiftsMainBox.querySelector('.nft-gift-div-results, .nft-gift-images-grid, .nft-gift-cards-container');
            if (!oldContainer) return;

            const scrollY = window.scrollY;
            const containerHeight = oldContainer.offsetHeight;

            const transitionWrapper = document.createElement('div');
            transitionWrapper.style.position = 'relative';
            transitionWrapper.style.height = `${containerHeight}px`;
            nftGiftsMainBox.insertBefore(transitionWrapper, oldContainer);
            transitionWrapper.appendChild(oldContainer);

            oldContainer.style.position = 'absolute';
            oldContainer.style.width = '100%';
            oldContainer.style.top = '0';
            oldContainer.style.left = '0';
            oldContainer.style.opacity = '0';

            await fillNftGiftsBody(displayInfo, newResults, false, nextViewType);
            const tableContainer = nftGiftsMainBox.querySelector('.nft-gift-div-results');
            if (tableContainer) {
                tableContainer.scrollTop = 0;
            }

            window.scrollTo({ top: scrollY, behavior: 'instant' });

            setTimeout(() => transitionWrapper.remove(), 50);
        });
        resRightDiv.appendChild(resRightSwapViewBut);

        nftGiftRes.append(resLeftDiv, resRightDiv);
        fragment.appendChild(nftGiftRes);

    }

    if (viewType === 'cards') {
        let cardsContainer;

        const cardsFragment = document.createDocumentFragment();
        if (append) {
            cardsContainer = nftGiftsMainBox.querySelector('.nft-gift-cards-container');
        } else {
            cardsContainer = document.createElement('div');
            cardsContainer.className = 'nft-gift-cards-container';
        }
        cardsContainer.style.transition = 'opacity 0.2s ease-in-out';

        if (!cardsContainer) { return; }

        for (const [index, gift] of newResults.entries()) {
            const card = document.createElement('div');
            card.className = 'nft-gift-card';
            const giftCount = append ? (currentPage - 1) * 20 + index + 1 : index + 1;

            const bgData = await getNftGiftsBgs(transformApostrof(gift.name));
            const bgItem = bgData.find(item => item.name === gift.bg);
            const centerColor = bgItem ? (
                bgItem.centerColor ? `#${bgItem.centerColor.toString(16).padStart(6, '0')}` :
                    bgItem['hex-centerColor'] || '#ffffff'
            ) : '#ffffff';

            const edgeColor = bgItem ? (
                bgItem.edgeColor ? `#${bgItem.edgeColor.toString(16).padStart(6, '0')}` :
                    bgItem['hex-edgeColor'] || '#000000'
            ) : '#000000';

            const textColor = bgItem ? (
                bgItem.textColor ? `#${bgItem.textColor.toString(16).padStart(6, '0')}` :
                    bgItem['hex-textColor'] || '#000000'
            ) : '#a3a3a3';

            const model = gift.model;
            const bg = gift.bg;
            const pattern = gift.pattern;
            const model_rarity = gift.model_rarity || null;
            const bg_rarity = gift.bg_rarity || null;
            const pattern_rarity = gift.pattern_rarity || null;

            const reffed = model_rarity === null;
            const modelText = !reffed ? `${model} <span class='small-number grray'>(${model_rarity / 10}%)</span>` : 'N/A';
            const bgText = !reffed ? `${bg} <span class='small-number grray'>(${bg_rarity / 10}%)</span>` : 'N/A';
            const patternText = !reffed ? `${pattern} <span class='small-number grray'>(${pattern_rarity / 10}%)</span>` : 'N/A';



            card.innerHTML = `
                <div class="card-header" style="background: linear-gradient(90deg, ${centerColor}, ${edgeColor}); color: ${textColor}">
                    <div class="header-text">
                        <span>№${giftCount}</span>
                    </div>
                    ${gift.model === null ? `<span data-lang='this_gift_refunded' class='refunded-gift'>Этот подарок рефанднутый</span>` : ''}
                    <div class="header-val">
                        <span>${gift.name} #${gift.number}</span>
                    </div>
                </div>
                <div class="card-body">
                </div>
            `;

            const cardBody = card.querySelector('.card-body');
            const cardTexts = document.createElement('div');
            cardTexts.className = 'card-texts';
            cardTexts.innerHTML = `
                        <div class="card-row">
                            <span class="card-label light-font" data-lang="owner">Владелец</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label light-font" data-lang="model">Модель</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label light-font" data-lang="bg">Фон</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label light-font" data-lang="pattern">Узор</span>
                        </div>
            `;
            const cardGiftImage = document.createElement('div');
            cardGiftImage.className = 'card-gift-image';

            const giftImg = document.createElement('img');
            giftImg.className = 'gift-img';
            giftImg.alt = `${gift.name} #${gift.number}`;

            const cardGiftImageLink = document.createElement('a');
            const giftLinkUrl = `https://t.me/nft/${convertGiftNameForLink(gift.name)}-${gift.number}`;
            cardGiftImageLink.href = giftLinkUrl;
            cardGiftImageLink.target = '_blank';
            cardGiftImageLink.rel = 'noopener noreferrer';

            if (window?.Telegram?.WebApp?.initData) {
                cardGiftImageLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.Telegram.WebApp.openTelegramLink(giftLinkUrl);
                });
                giftImg.src = `${NFT_FRAGMENT_URL}/gift/${convertGiftNameForLink(gift.name)}-${gift.number}.webp`;
            } else {
                giftImg.src = `${NFT_FRAGMENT_URL}/gift/${convertGiftNameForLink(gift.name)}-${gift.number}.webp`;
            }

            giftImg.onerror = async function () {
                const bgData = await getNftGiftsBgs(transformApostrof(gift.name));
                const bgItem = bgData.find(item => item.name === gift.bg);
                const centerColor = bgItem?.centerColor ? `#${bgItem.centerColor.toString(16).padStart(6, '0')}` : bgItem?.['hex-centerColor'] || '#ffffff';
                const edgeColor = bgItem?.edgeColor ? `#${bgItem.edgeColor.toString(16).padStart(6, '0')}` : bgItem?.['hex-edgeColor'] || '#000000';

                giftImg.className = 'gift-img-errored';
                cardGiftImage.style.background = `radial-gradient(circle, ${centerColor} 1%, ${edgeColor} 80%)`;

                this.src = `${CDN_CHANGES_API_URL}/gifts/models/${gift.name}/png/${defaultApostrof(gift.model)}.png`;
                // this.src = `${CDN_CHANGES_API_URL}/gifts/models/${gift.name}/png/Original.png`;
                this.onerror = null;
                fillBlockWithPatterns(cardGiftImage, gift.name, gift.pattern);

            };

            const cardVals = document.createElement('div');
            cardVals.className = 'card-vals';
            cardVals.innerHTML = `
                <div class="card-row">
                    <span class="card-value light-font">${formatOwnerInfo(gift.owner_info)}</span>
                </div>
                <div class="card-row">
                    <span class="card-value light-font">${modelText}</span>
                </div>
                <div class="card-row">
                    <span class="card-value light-font">${bgText}</span>
                </div>
                <div class="card-row">
                    <span class="card-value light-font">${patternText}</span>
                </div>
            `;

            cardGiftImageLink.appendChild(giftImg);
            cardGiftImage.appendChild(cardGiftImageLink);


            cardBody.appendChild(cardTexts);
            cardBody.appendChild(cardGiftImage);
            cardBody.appendChild(cardVals);

            const sellingInfoHTML = formatSellingInfo(gift.owner_info, gift.name, gift.number);
            if (!sellingInfoHTML.includes('—')) {
                cardTexts.innerHTML += `
                    <div class="card-row">
                        <span class="card-label light-font" data-lang="selling_info">Маркет</span>
                    </div>`;
                cardVals.innerHTML += `
                    <div class="card-row">
                        ${sellingInfoHTML}
                    </div>`;
            }

            card.appendChild(cardBody);

            cardsFragment.appendChild(card);
        };

        if (append) {
            cardsContainer.appendChild(cardsFragment);
        } else {
            cardsContainer.appendChild(cardsFragment);
            fragment.appendChild(cardsContainer);
        }

    } else if (viewType == 'table') {
        if (!append) {
            const nftGiftsResult = document.createElement('div');
            nftGiftsResult.className = 'nft-gift-div-results table';
            nftGiftsResult.style.transition = 'opacity 0.2s ease-in-out';
            fragment.appendChild(nftGiftsResult);

            const table = document.createElement('table');
            nftGiftsResult.appendChild(table);

            thead.className = 'nft-gift-results-thead';
            table.appendChild(thead);

            tbody = document.createElement('tbody');
            tbody.className = 'nft-gift-results-tbody';
            table.appendChild(tbody);

            const headersMapping = {
                'i': '№',
                'number': 'Номер',
                'owner_info': 'Владелец',
                'model': 'Модель',
                'bg': 'Фон',
                'pattern': 'Узор',
                'selling_info': 'Маркет',
                ...(giftNameChoosen ? {} : { 'preview': 'Иконка' })
            };

            for (const [key, val] of Object.entries(headersMapping)) {
                const headerTh = document.createElement('th');
                headerTh.className = 'nft-gift-table-th';
                headerTh.dataset.sortKey = key;
                headerTh.id = key;

                const headerThDiv = document.createElement('div');
                headerThDiv.className = 'nft-gift-table-th-div';

                const headerThDivSpan = document.createElement('span');
                headerThDivSpan.className = 'nft-gift-table-th-div-span reg-font';
                headerThDivSpan.textContent = val;

                headerThDiv.appendChild(headerThDivSpan);

                const sortableColumns = ['number', 'model', 'bg', 'pattern'];


                if (!giftNameChoosen && key === 'preview') {
                    headerThDivSpan.textContent = '';
                    // const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    // svgIcon.setAttribute('width', '56');
                    // svgIcon.setAttribute('height', '56');
                    // svgIcon.setAttribute('viewBox', '0 0 56 56');
                    // const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path.setAttribute('fill', '#59c7f9');
                    // path.setAttribute('d', 'M9.66 16.094c-2.742 0-4.453 1.804-4.453 4.664v5.906c0 2.461 1.195 4.148 3.375 4.57v14.578c0 4.43 2.414 6.75 6.844 6.75h25.148c4.43 0 6.844-2.32 6.844-6.75V31.235c2.203-.422 3.375-2.109 3.375-4.57v-5.906c0-2.86-1.57-4.664-4.453-4.664h-4.97c1.313-1.29 2.086-2.977 2.086-4.875c0-4.547-3.586-7.781-8.133-7.781c-3.351 0-6.094 1.851-7.312 5.156c-1.22-3.305-3.985-5.156-7.336-5.156c-4.524 0-8.133 3.234-8.133 7.78c0 1.9.75 3.587 2.062 4.876Zm12.773 0c-3.867 0-5.906-2.274-5.906-4.711c0-2.531 1.875-4.031 4.383-4.031c2.883 0 5.156 2.226 5.156 5.953v2.789Zm11.133 0h-3.633v-2.79c0-3.726 2.274-5.952 5.157-5.952c2.508 0 4.406 1.5 4.406 4.03c0 2.438-2.11 4.712-5.93 4.712m-22.945 3.539h15.305v8.156H10.62c-1.172 0-1.64-.492-1.64-1.664v-4.852c0-1.171.468-1.64 1.64-1.64m34.781 0c1.172 0 1.617.469 1.617 1.64v4.852c0 1.172-.445 1.664-1.617 1.664H30.074v-8.156Zm-30 29.414c-1.968 0-3.046-1.102-3.046-3.047V31.328h13.57v17.719ZM43.645 46c0 1.945-1.079 3.047-3.024 3.047H30.074V31.328h13.57Z');
                    // svgIcon.appendChild(path);
                    // headerTh.appendChild(svgIcon);
                } else if (key === 'owner_info') {
                    // const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    // svgIcon.setAttribute('width', '24');
                    // svgIcon.setAttribute('height', '24');
                    // svgIcon.setAttribute('viewBox', '0 0 24 24');
                    // svgIcon.setAttribute('fill', 'none');
                    // svgIcon.setAttribute('stroke', 'currentColor');
                    // svgIcon.setAttribute('stroke-width', '1.5');
                    // svgIcon.setAttribute('class', 'size-6');
                    // const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path.setAttribute('stroke-linecap', 'round');
                    // path.setAttribute('stroke-linejoin', 'round');
                    // path.setAttribute('d', 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z');
                    // svgIcon.appendChild(path);
                    // headerThDiv.insertBefore(svgIcon, headerThDivSpan.nextSibling);
                } else if (sortableColumns.includes(key)) {
                    // headerThSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    // headerThSvg.setAttribute('width', '24');
                    // headerThSvg.setAttribute('height', '24');
                    // headerThSvg.setAttribute('viewBox', '0 0 24 24');
                    // headerThSvg.setAttribute('fill', 'none');
                    // headerThSvg.setAttribute('stroke', 'currentColor');
                    // headerThSvg.setAttribute('stroke-width', '1.5');
                    // headerThSvg.setAttribute('class', 'size-6');
                    // headerThSvg.setAttribute('id', `arrow-${key}`);
                    // const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path.setAttribute('stroke-linecap', 'round');
                    // path.setAttribute('stroke-linejoin', 'round');
                    // path.setAttribute('d', 'm19.5 8.25-7.5 7.5-7.5-7.5');
                    // headerThSvg.appendChild(path);
                    // headerThDiv.insertBefore(headerThSvg, headerThDivSpan.nextSibling);

                    if (selectedParams.sort && selectedParams.sort.type === key) {
                        // headerThSvg.style.transform = selectedParams.sort.order === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)';
                    }

                    headerThDiv.addEventListener('click', async (e) => {
                        let sortKey = key;
                        if (sortKey === 'number') {
                            // pass
                        } else {
                            sortKey = `${sortKey}_rarity`;
                        }

                        let currentOrder = 'asc';
                        if (selectedParams.sort && selectedParams.sort.type === sortKey) {
                            currentOrder = selectedParams.sort.order === 'asc' ? 'desc' : 'asc';
                        }
                        selectedParams['sort'] = { type: sortKey, order: currentOrder };

                        currentPage = 1;
                        hasMoreData = true;
                        observer.disconnect();

                        const paramsString = convertParamsToString(selectedParams);

                        try {
                            const { info, results } = await fetchNftGifts(currentPage, paramsString);
                            nftGiftsResponseResults = results;
                            await fillNftGiftsBody(info, nftGiftsResponseResults, false, currentViewType);
                            // await restoreSelectedParamsState(selectedParams);
                        } catch (error) {
                            console.error("Error on sorting:", error);
                        }
                    });
                }
                headerTh.appendChild(headerThDiv);
                thead.appendChild(headerTh);
            }
        }
    }

    tbody = append ? nftGiftsMainBox.querySelector('.nft-gift-results-tbody') : tbody;
    if (tbody) {
        const rows = newResults.map((giftData, index) => {
            const tr = document.createElement('tr');
            tr.className = 'nft-gift-table-tr';

            const globalIndex = append ? (currentPage - 1) * 20 + index + 1 : index + 1;

            const { name, number, model, model_rarity, bg, bg_rarity, pattern, pattern_rarity, owner_info } = giftData;
            const reffed = model_rarity === null;
            const modelText = !reffed ? `${model} <span class='small-number grray'>(${model_rarity / 10}%)</span>` : 'N/A';
            const bgText = !reffed ? `${bg} <span class='small-number grray'>(${bg_rarity / 10}%)</span>` : 'N/A';
            const patternText = !reffed ? `${pattern} <span class='small-number grray'>(${pattern_rarity / 10}%)</span>` : 'N/A';

            const ownersInfoList = owner_info.map((owner) => {
                if (owner.username) {
                    return `<a href="https://t.me/${owner.username}" target="_blank" rel="noopener noreferrer" class="no-underline">${owner.full_name.substring(0, 25) || owner.username}</a>`;
                }
                if (owner.ton_address) {
                    const placeHolder = owner.ton_address.includes('.ton') ? owner.ton_address : `${owner.ton_address.substring(0, 5)}...${owner.ton_address.substring(owner.ton_address.length - 8)} `;
                    return `<a class="no-underline" href="https://tonviewer.com/${owner.ton_address}" target="_blank" rel="noopener noreferrer" class="no-underline">${placeHolder}</a>`;
                }
                if (owner.gift_address) {
                    const placeHolder = owner.ton_address.includes('.ton') ? owner.ton_address : `${owner.ton_address.substring(0, 5)}...${owner.ton_address.substring(owner.ton_address.length - 8)} `;
                    return `<a class="no-underline" href="https://tonviewer.com/${owner.ton_address}" target="_blank" rel="noopener noreferrer" class="no-underline">${placeHolder}</a>`;
                }
                if (owner.channel_id) {
                    return `<span style='color: red;'><span data-lang='channel_id'>ID канала</span>: -100${owner.channel_id}</span>`;
                }
                return owner.full_name || 'N/A';
            });


            let sellingInfoList = [];
            if (owner_info[0].selling_info) {
                sellingInfoList = ['Fragment', 'TG Market'].includes(owner_info[0].selling_info.place) ? formatSellingInfo(owner_info, name, number) : formatSellingInfo(owner_info);
            } else {
                sellingInfoList = '<div class="selling-info-centered">—</div>';
            }


            const cells = [
                `${!reffed ? globalIndex : `${globalIndex} <div class="reffed-container">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="red" class="size-6 reffed-icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9.75h4.875a2.625 2.625 0 0 1 0 5.25H12M8.25 9.75 10.5 7.5M8.25 9.75 10.5 12m9-7.243V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"></path>
                    </svg>
                    <span class="reffed-tooltip" data-lang="reffed_tooltip">Подарок рефнутый, невозможно получить его данные</span>
                </div>`}`,
                `<a href = "https://t.me/nft/${convertGiftNameForLink(name)}-${number}" target = "_blank" rel = "noopener noreferrer" class= "no-underline" > #${giftData.number}</a> `,
                ownersInfoList.join(', ') || 'N/A',
                modelText,
                bgText,
                patternText,
                sellingInfoList
                // sellingInfoList.filter(item => item !== '-').join('') || '-'
            ];

            if (!giftNameChoosen) {
                cells.push(`<img src = "${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(giftData.name)}/png/${transformApostrof(giftData.model)}.png" style = "width: 7vh; height: 7vh; display: block; margin: 0 auto;" alt='${giftData.name}/${giftData.model}'></img> `);
            }

            const sellingInfoIndex = 6;
            const sellingInfoContent = cells[sellingInfoIndex];
            const isNotForSale = (typeof sellingInfoContent === 'string' && sellingInfoContent.includes('not-for-sale')) || sellingInfoContent === '—';





            cells.forEach(cell => {
                const td = document.createElement('td');
                td.className = 'nft-gift-table-td-div';
                td.innerHTML = `<div class= "nft-gift-table-td reg-font"> ${cell}</div> `;
                tr.appendChild(td);
            });

            if (isNotForSale) {
                const sellingInfoTd = tr.children[sellingInfoIndex];
                if (sellingInfoTd) sellingInfoTd.style.textAlign = 'center';
            }
            return tr;
        });
        tbody.append(...rows);
    } else if (viewType === 'images') {
        let imageGrid;
        const imagesFragment = document.createDocumentFragment();

        if (append) {
            imageGrid = nftGiftsMainBox.querySelector('.nft-gift-images-grid');
        } else {
            imageGrid = document.createElement('div');
            imageGrid.className = 'nft-gift-images-grid';
            imageGrid.style.transition = 'opacity 0.2s ease-in-out';
        }

        if (imageGrid) {
            for (const [index, gift] of newResults.entries()) {
                const globalIndex = append ? (currentPage - 1) * 20 + index + 1 : index + 1;
                const bgData = await getNftGiftsBgs(transformApostrof(gift.name));
                const bgItem = bgData.find(item => item.name === gift.bg);
                const centerColor = bgItem?.centerColor ? `#${bgItem.centerColor.toString(16).padStart(6, '0')}` : bgItem?.['hex-centerColor'] || '#979797ff';
                const edgeColor = bgItem?.edgeColor ? `#${bgItem.edgeColor.toString(16).padStart(6, '0')}` : bgItem?.['hex-edgeColor'] || '#979797ff';
                const textColor = bgItem?.textColor ? `#${bgItem.textColor.toString(16).padStart(6, '0')}` : bgItem?.['hex-textColor'] || '#979797ff';

                const container = document.createElement('div');
                container.className = 'nft-gift-img-container';

                container.addEventListener('click', async () => {
                    const modal = document.getElementById('modal') || createModal();

                    modal.innerHTML = '';

                    const overlay = document.createElement('div');
                    overlay.className = 'modal-overlay';

                    const modalContent = document.createElement('div');
                    modalContent.className = 'nft-gift-modal-content';

                    if (isMobile) {
                        modalContent.style.width = '90%';
                        modalContent.style.maxWidth = '400px';
                    }

                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'nft-gift-modal-image-container';
                    imageContainer.style.background = `black`;
                    imageContainer.style.background = `radial-gradient(circle, ${centerColor} 1%, ${edgeColor} 80%)`;

                    if (isMobile) {
                        imageContainer.style.height = '200px';
                    }

                    const giftLink = `https://t.me/nft/${convertGiftNameForLink(gift.name)}-${gift.number}`;

                    const lotticeContainerHref = document.createElement('a');
                    lotticeContainerHref.href = giftLink;
                    lotticeContainerHref.target = '_blank';
                    lotticeContainerHref.rel = 'noopener noreferrer';
                    lotticeContainerHref.style.cursor = 'pointer';
                    lotticeContainerHref.style.display = 'inline-flex';

                    lotticeContainerHref.addEventListener('click', (e) => {
                        if (window?.Telegram?.WebApp?.initData && isMobile) {
                            window.Telegram.WebApp.openTelegramLink(giftLink);
                        }
                    });


                    const lottieContainer = document.createElement('div');
                    lottieContainer.id = `lottie-container-${gift.number}`;
                    lottieContainer.className = 'lottie-container';

                    const imageText = document.createElement('div');
                    imageText.className = 'nft-gift-modal-image-text';
                    imageText.innerHTML = `${gift.name} #${gift.number}`;

                    lotticeContainerHref.appendChild(lottieContainer);
                    imageContainer.appendChild(lotticeContainerHref);
                    imageContainer.appendChild(imageText);


                    const modalInfoDiv = document.createElement('div');
                    modalInfoDiv.className = 'nft-gift-modal-info-div';
                    modalInfoDiv.style.color = textColor;

                    const modalInfo = document.createElement('div');
                    modalInfo.className = 'nft-gift-modal-info';
                    modalInfo.style.color = textColor;

                    const modalOkBut = document.createElement('button');
                    modalOkBut.className = 'nft-gift-modal-ok-but';
                    modalOkBut.textContent = 'Ок';


                    modalInfoDiv.appendChild(modalInfo);

                    if (gift.owner_info[0].selling_info) {
                        const modalSellingInfoBut = document.createRange().createContextualFragment(formatSellingInfo(gift.owner_info, gift.name, gift.number, true));
                        if (modalSellingInfoBut.textContent.includes('—') === false) {
                            modalInfoDiv.appendChild(modalSellingInfoBut);
                        } else {
                            // pass
                        }
                    }

                    modalInfoDiv.appendChild(modalOkBut);

                    const model = gift.model;
                    const bg = gift.bg;
                    const pattern = gift.pattern;
                    const model_rarity = gift.model_rarity || null;
                    const bg_rarity = gift.bg_rarity || null;
                    const pattern_rarity = gift.pattern_rarity || null;

                    const reffed = model_rarity === null;
                    const modelText = !reffed ? `${model} <span class='small-number grray'>(${model_rarity / 10}%)</span>` : 'N/A';
                    const bgText = !reffed ? `${bg} <span class='small-number grray'>(${bg_rarity / 10}%)</span>` : 'N/A';
                    const patternText = !reffed ? `${pattern} <span class='small-number grray'>(${pattern_rarity / 10}%)</span>` : 'N/A';

                    // console.log(gift.owner_info);
                    modalInfo.innerHTML = `
                        <table class="nft-gift-modal-table">
                            <tbody>
                                <tr>
                                    <td class='medium-font left-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20;" data-lang='owner'>Владелец</td>
                                    <td class='light-font right-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20;">${gift.model !== null ? formatOwnerInfo(gift.owner_info, 0, true) : 'N/A'}</td>
                                </tr>
                                <tr>
                                ${gift.owner_info.length > 1 ?
                            `
                                    <td class='medium-font left-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20; display: flex; flex-direction: column;" data-lang='owner'>
                                        <span data-lang='earlier'>Ранее</span>
                                        <span class='how-much-time-ago-text'>(${howMuchTimeAgo(gift.owner_info[1].updated_at)})</span>
                                    </td>
                                    <td class='light-font right-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20;">${formatOwnerInfo(gift.owner_info, 1, true)}</td>
                                </tr>
                        ` :
                            ''}

                                <tr>
                                    <td class='medium-font left-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20;" data-lang='model'>Модель</td>
                                    <td class='light-font right-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20;">${modelText}</td>
                                </tr>
                                <tr>
                                    <td class='medium-font left-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20;" data-lang='bg'>Фон</td>
                                    <td class='light-font right-col wh' style="padding: 8px; border-bottom: 1px solid ${textColor}20;">${bgText}</td>
                                </tr>
                                <tr>
                                    <td class='medium-font left-col wh' style="padding: 8px;" data-lang='pattern'>Узор</td>
                                    <td class='light-font right-col wh' style='padding: 8px;'>${patternText}</td>
                                </tr>
                                ${gift.owner_info[0] && gift.owner_info[0].from_user && gift.owner_info[0].to_user ? `
                                <tr>
                                    <td colspan="2" class='extra-light-font' style="padding: 8px; font-size: 16px; text-align: center; border-top: 1px solid ${textColor}20;">
                                        Подарок от 
                                        <a href='https://t.me/${gift.owner_info[0].from_user.username}' class='no-underline owner_username' target='_blank' rel='noopener noreferrer'>
                                            ${gift.owner_info[0].from_user.full_name ?
                                Array.from(gift.owner_info[0].from_user.full_name).slice(0, 15).join('') :
                                `ID: ${gift.owner_info[0].from_user.id}`
                            }
                                        </a> 
                                        для 
                                        <a href='https://t.me/${gift.owner_info[0].to_user.username}' class='no-underline owner_username' target='_blank' rel='noopener noreferrer'>
                                            ${gift.owner_info[0].to_user.full_name ?
                                Array.from(gift.owner_info[0].to_user.full_name).slice(0, 15).join('') :
                                `ID: ${gift.owner_info[0].to_user.id}`
                            }
                                        </a>
                                    </td>
                                </tr>` : ''} ${gift.owner_info[0].comment ? `
                                <tr>
                                    <td colspan="2" class='extra-light-font' style="padding: 8px; font-size: 16px; text-align: center; border-top: 1px solid ${textColor}20; wh">
                                    с комментарием «${gift.owner_info[0].comment}»</td>
                                </tr>
                                    ` : ''}
                            </tbody>
                        </table>

                    `;


                    modalContent.appendChild(imageContainer);
                    modalContent.appendChild(modalInfoDiv);
                    modal.appendChild(overlay);
                    modal.appendChild(modalContent);

                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';

                    fillBlockWithPatterns(imageContainer, gift.name, gift.pattern, textColor);

                    if (window.lottie) {
                        const animationContainer = modal.querySelector(`#lottie-container-${gift.number}`);
                        const pathWithTransform = gift.model !== null ? `${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(gift.name)}/lottie/${transformApostrof(gift.model)}.json` : `${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(gift.name)}/lottie/Original.json`;
                        const pathWithoutTransform = `${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(gift.name)}/lottie/${gift.model}.json`;

                        const animation = lottie.loadAnimation({
                            container: animationContainer,
                            renderer: 'svg',
                            loop: true,
                            autoplay: true,
                            path: pathWithTransform,
                            rendererSettings: {
                                preserveAspectRatio: 'xMidYMid slice'
                            }
                        });
                        animationContainer.style.cssText = 'width: 10rem; height: 10rem; margin: auto;';

                        animation.addEventListener('error', () => {
                            animation.destroy();
                            const fallbackAnimation = lottie.loadAnimation({
                                container: animationContainer,
                                renderer: 'svg',
                                loop: true,
                                autoplay: true,
                                path: pathWithoutTransform,
                                rendererSettings: {
                                    preserveAspectRatio: 'xMidYMid slice'
                                }
                            });
                            modal._animation = fallbackAnimation;
                        });

                        modal._animation = animation;
                    }

                    requestAnimationFrame(() => {
                        overlay.style.opacity = '0.7';
                        modal.classList.add('show');
                    });

                    const closeModal = () => {
                        overlay.style.opacity = '0';
                        modal.classList.remove('show');
                        document.body.style.overflow = '';

                        if (modal._animation) {
                            modal._animation.destroy();
                        }

                        setTimeout(() => {
                            modal.style.display = 'none';
                            modal.innerHTML = '';
                        }, 300);
                    };

                    overlay.addEventListener('click', closeModal);
                    modalOkBut.addEventListener('click', closeModal);
                });


                let img = document.createElement('img');
                img.alt = `${gift.name} #${gift.number}`;
                img.loading = 'lazy';

                const fragmentUrl = `${NFT_FRAGMENT_URL}/gift/${convertGiftNameForLink(gift.name)}-${gift.number}.webp`;
                const cdnModelUrl = `${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(gift.name)}/png/${transformApostrof(gift.model)}.png`;
                const cdnOriginalUrl = `${CDN_CHANGES_API_URL}/gifts/models/${transformApostrof(gift.name)}/png/Original.png`;

                img.src = gift.model !== null ? fragmentUrl : cdnOriginalUrl;
                img.className = gift.model !== null ? 'nft-gift-img' : 'nft-gift-img-errored';
                container.style.background = gift.model !== null ? '' : `radial-gradient(circle, ${centerColor} 1%, ${edgeColor} 80%)`;

                const nameDiv = document.createElement('div');
                nameDiv.className = 'nft-gift-name';
                nameDiv.style.color = gift.model !== null ? textColor : 'black';
                nameDiv.textContent = gift.name;

                const handleError = async () => {
                    if (img.src.includes('fragment.com')) {
                        img.src = cdnModelUrl;
                        img.style.height = '60%';
                        img.style.width = '60%';
                        img.style.alignSelf = 'center';
                        img.style.zIndex = '1';
                        img.style.margin = '0 auto';
                        nameDiv.style.zIndex = '1';
                    }
                    else if (img.src === cdnModelUrl) {
                        img.src = cdnOriginalUrl;
                    }
                    else {
                        img.removeEventListener('error', handleError);
                    }
                    container.style.background = `radial-gradient(circle, ${centerColor} 1%, ${edgeColor} 80%)`;
                    if (gift.name && gift.pattern) {
                        fillBlockWithPatterns(container, gift.name, gift.pattern, textColor, 0);
                    }
                };

                img.addEventListener('error', handleError);

                img.onload = () => {
                    img.classList.add('loaded');
                    img.removeEventListener('error', handleError);
                };


                img.onload = () => {
                    img.classList.add('loaded');
                };


                const ribbonId = document.createElement('div');
                ribbonId.className = 'nft-gift-ribbon-id';
                ribbonId.textContent = `№${globalIndex}`;

                const ribbon = document.createElement('div');
                ribbon.className = 'nft-gift-ribbon';
                ribbon.style.background = `linear-gradient(90deg, ${centerColor}, ${edgeColor})`;
                ribbon.textContent = `#${gift.number}`;

                const sellingInfo = gift.owner_info?.[0]?.selling_info;
                if (sellingInfo && (sellingInfo.on_sale || ['TG Market', 'Fragment'].includes(sellingInfo.place))) {
                    const sellingInfoContainer = document.createElement('div');
                    sellingInfoContainer.className = 'selling-info-bottom';

                    const marketIcon = document.createElement('img');
                    marketIcon.src = `/site/static/imgs/${MARKETPLACES[sellingInfo.place].value.toLowerCase()}.svg`;
                    marketIcon.alt = sellingInfo.place;
                    marketIcon.className = 'market-icon';

                    const priceContainer = document.createElement('div');
                    priceContainer.className = 'price-container';

                    if (sellingInfo.price !== null && sellingInfo.price !== undefined) {
                        if (sellingInfo.id) {
                            priceContainer.addEventListener('click', () => {
                                window.open(MARKETPLACES[sellingInfo.place]['link_for_gift'](sellingInfo.id), '_blank');
                            });
                        }

                        const priceSpan = document.createElement('span');
                        priceSpan.className = 'price';
                        priceSpan.textContent = Number.isInteger(sellingInfo.price) ? sellingInfo.price : sellingInfo.price.toFixed(2);
                        priceContainer.appendChild(priceSpan);

                        const currencyIcon = document.createElement('img');
                        currencyIcon.src = (sellingInfo.currency === 'TON' || sellingInfo.currency === null) ? '/site/static/imgs/ton.svg' : '/site/static/imgs/telegram_star_icon.svg';
                        currencyIcon.className = 'ton-icon';
                        priceContainer.appendChild(currencyIcon);
                        sellingInfoContainer.append(marketIcon, priceContainer);
                        nameDiv.textContent = '';
                    }
                    container.appendChild(sellingInfoContainer);
                }

                container.appendChild(img);
                container.appendChild(nameDiv);
                if (sellingInfo && (sellingInfo.on_sale || ['TG Market', 'Fragment'].includes(sellingInfo.place)) && sellingInfo.price !== null && sellingInfo.price !== undefined) {
                    container.removeChild(nameDiv);
                }
                container.appendChild(ribbonId);
                container.appendChild(ribbon);
                imagesFragment.appendChild(container);
            }
            imageGrid.appendChild(imagesFragment);

            if (!append) {
                fragment.appendChild(imageGrid);
            }
        }

    }


    if (!append) {
        nftGiftsMainBox.appendChild(fragment);
    }

    if (newResults.length > 0 && hasMoreData) {
        let lastElement;

        if (viewType === 'cards') {
            lastElement = nftGiftsMainBox.querySelector('.nft-gift-cards-container')?.lastElementChild;
        } else if (viewType === 'table') {
            lastElement = nftGiftsMainBox.querySelector('.nft-gift-results-tbody')?.lastElementChild;
        } else if (viewType === 'images') {
            lastElement = nftGiftsMainBox.querySelector('.nft-gift-images-grid')?.lastElementChild;
        }

        if (lastElement) {
            observer.disconnect();
            observer.observe(lastElement);
        }
    }

}




function showFilterModal(title, contentElement, onApply, type) {
    const overlay = document.createElement('div');
    overlay.className = 'filter-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'filter-modal';

    document.body.style.overflow = 'hidden';
    modal.innerHTML = `
    <div class="filter-modal-header">
        <h3 class="filter-modal-title" data-lang='${type === 'selling-infos' ? 'filter_by_marketplace' : 'filter_by_owner'}'>${title}</h3>
        <button class="filter-modal-close">&times;</button>
    </div>
    <div class="filter-modal-body"></div>
    <div class="filter-modal-price-body"></div>
    <div class="filter-modal-footer">
        <button class="filter-modal-cancel-btn" data-lang='reset'>Сбросить</button>
        <button class="filter-modal-apply-btn" data-lang='apply'>Применить</button>
    </div>
`;

    modal.querySelector('.filter-modal-body').appendChild(contentElement);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    applyTranslations(modal);

    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
    });

    const closeModal = () => {
        overlay.classList.remove('show');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            overlay.remove();
            modal.remove();
        }, 300);
    };

    modal.querySelector('.filter-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.filter-modal-cancel-btn').addEventListener('click', function () {
        if (type === 'owner-infos') {

            modal.querySelectorAll('input').forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });

            delete selectedParams['owner_param'];
            delete selectedParams['owner_value'];
            delete selectedParams['biggest_owner'];
            const ownerInfoSpan = document.querySelector('.owner-info #all-owner-infos');
            if (ownerInfoSpan) {
                ownerInfoSpan.setAttribute('data-lang', 'all_owners');
                applyTranslations(ownerInfoSpan.parentElement);
                ownerInfoSpan.style.color = '';
            }
        } else if (type === 'selling-infos') {
            const onSaleSwitch = modal.querySelector('#modal-control-group');
            if (onSaleSwitch) {
                onSaleSwitch.checked = false;
            }

            const triggerContent = modal.querySelector('.trigger-content');
            const allMarketplacesOption = modal.querySelector('.custom-option[data-value=""]');
            if (triggerContent && allMarketplacesOption) {
                triggerContent.innerHTML = allMarketplacesOption.innerHTML;
            }
            if (applyCallback) {
                applyCallback(true);
            }
            delete selectedParams['selling_param'];
            delete selectedParams['selling_value'];
            const sellingInfoSpan = document.querySelector('.selling-info #all-selling-infos');
            if (sellingInfoSpan) {
                sellingInfoSpan.setAttribute('data-lang', 'all_marketplaces');
                applyTranslations(sellingInfoSpan.parentElement);
                sellingInfoSpan.style.color = '';
            }
        }
    });
    overlay.addEventListener('click', closeModal);

    modal.querySelector('.filter-modal-apply-btn').addEventListener('click', () => {
        if (onApply) {
            onApply();
        }
        closeModal();
    });
}


function inputsListClicked(inputId) {
    return function (e) {
        e.stopPropagation();

        if (inputId === 'numbers') {


            const numberInput = document.getElementById('nft-number-input');
            if (numberInput) {
                numberInput.addEventListener('input', () => {
                    const inputValue = numberInput.value.trim();
                    // console.log(inputValue);

                    if (!selectedParams['name']) {
                        delete selectedParams['name'];
                    }
                    delete selectedParams['number'];

                    if (inputValue) {
                        const urlRegex = /t\.me\/nft\/([a-zA-Z\d_]+)-(\d+)/;
                        const match = inputValue.match(urlRegex);

                        if (match) {
                            selectedParams['name'] = match[1];
                            selectedParams['number'] = Number(match[2]);
                        } else if (!isNaN(inputValue)) {
                            selectedParams['number'] = Number(inputValue);
                        }
                    }
                    localStorage.setItem('selectedParams', JSON.stringify(selectedParams));
                    sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));
                });
            }

        } else {
            const modalContent = document.createElement('div');
            let modalTitle = '';
            let applyCallback = null;

            if (inputId === 'owner-infos') {
                modalTitle = translations[currentLang].filter_buy_owner || 'Filter by owner';
                modalContent.className = 'owner-infos-modal-content';
                modalContent.innerHTML = `
                <div class="modal-input-group"><label data-lang='id'></label><input type="number" placeholder="6579372089" id="id"></div>
                <div class="modal-input-group"><label data-lang='username'></label><input type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="borz" id="username"></div>
                <div class="modal-input-group"><label data-lang='full_name'></label><input type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Pavel Durov" id="full_name"></div>
                <div class="modal-input-group"><label data-lang='ton_address'></label><input type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="UQ..." id="ton_address"></div>
                <div class="modal-input-group"><label data-lang='gift_address'></label><input type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="EQ..." id="gift_address"></div>
                <div class="modal-input-group"><label data-lang='comment'></label><input type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Hello" id="comment"></div>
                <div class="modal-checkbox-group">
                    <label for='biggest_owner' data-lang='biggest_owner'></label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="biggest_owner">
                        <span class="slider"></span>
                    </label>
                </div>`;

                modalContent.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
                    if (selectedParams['owner_param'] === input.id) {
                        input.value = selectedParams['owner_value'] || '';
                    }
                });

                const biggestOwnerCheckbox = modalContent.querySelector('#biggest_owner');
                if (biggestOwnerCheckbox) {
                    biggestOwnerCheckbox.checked = !!selectedParams['biggest_owner'];

                    const biggestOwnerGroup = biggestOwnerCheckbox.closest('.modal-checkbox-group');
                    if (biggestOwnerGroup) {
                        biggestOwnerGroup.addEventListener('click', (e) => {


                            if (e.target === biggestOwnerGroup) {
                                biggestOwnerCheckbox.checked = !biggestOwnerCheckbox.checked;
                            }


                            if (biggestOwnerCheckbox.checked) {
                                selectedParams['biggest_owner'] = true;
                                modalContent.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
                                    input.value = '';
                                });
                                delete selectedParams['owner_param'];
                                delete selectedParams['owner_value'];
                            } else {
                                delete selectedParams['biggest_owner'];
                            }
                        });
                    }
                }

                applyCallback = () => {
                    let activeInput = null;
                    modalContent.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
                        if (input.value.trim() !== '') {
                            activeInput = input;
                        }
                    });

                    const ownerInfoSpan = document.querySelector('.owner-info #all-owner-infos');
                    delete selectedParams['owner_param'];
                    delete selectedParams['owner_value'];

                    if (activeInput) {
                        selectedParams['owner_param'] = activeInput.id;
                        selectedParams['owner_value'] = activeInput.value;
                        delete selectedParams['biggest_owner'];
                        const labelElement = activeInput.closest('.modal-input-group').querySelector('label');
                        const labelText = labelElement ? labelElement.textContent : activeInput.id;
                        ownerInfoSpan.textContent = `${labelText}: ${activeInput.value.substring(0, 10)}`;
                        ownerInfoSpan.style.color = 'rgb(117, 205, 208)';
                        ownerInfoSpan.removeAttribute('data-lang');
                    } else if (biggestOwnerCheckbox.checked) {
                        selectedParams['biggest_owner'] = true;
                        ownerInfoSpan.textContent = translations[currentLang].biggest_owner || 'Biggest Owner';
                        ownerInfoSpan.style.color = 'rgb(117, 205, 208)';
                        ownerInfoSpan.removeAttribute('data-lang');
                    } else {
                        delete selectedParams['biggest_owner'];
                        ownerInfoSpan.setAttribute('data-lang', 'all_owners');
                        applyTranslations(ownerInfoSpan.parentElement);
                        ownerInfoSpan.style.color = '';
                    }
                };

                modalContent.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
                    input.addEventListener('input', () => {
                        modalContent.querySelectorAll('input[type="text"], input[type="number"]').forEach(otherInput => {
                            if (otherInput !== input) {
                                otherInput.value = '';
                            }
                        });
                        if (biggestOwnerCheckbox.checked) {
                            biggestOwnerCheckbox.checked = false;
                            delete selectedParams['biggest_owner'];
                        }
                    });
                });

            } else if (inputId === 'selling-infos') {
                modalTitle = translations[currentLang].filter_buy_marketplace || 'Filter by marketplace';
                modalContent.innerHTML = `
                    <div class="modal-control-group">
                        <label data-lang="marketplace">Маркет</label>
                        <div class="custom-select-container">
                            <div class="custom-select-trigger">
                                <div class="trigger-content">
                                    <span data-lang="all_marketplaces">Все маркетплейсы</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                            </div>
                            <div class="custom-options">
                                <div class="custom-option" data-value="">
                                    <span data-lang="all_marketplaces">Все маркетплейсы</span>
                                </div>
                                ${Object.values(MARKETPLACES).map(market => `
                                    <div class="custom-option" data-value="${market.id}">
                                        <img src='/site/static/imgs/${market.value.toLowerCase()}.svg' alt='${market.value.toLowerCase()}' class='market-icon'>
                                        <span>${market.en_name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="modal-control-group modal-checkbox-group">
                        <label for="on-sale-only-switch" data-lang="on_sale_only">Только на продаже</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="on-sale-only-switch">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;

                const customSelect = modalContent.querySelector('.custom-select-container');
                const trigger = customSelect.querySelector('.custom-select-trigger');
                const options = customSelect.querySelector('.custom-options');
                const triggerContent = trigger.querySelector('.trigger-content');
                const onSaleOnlySwitch = modalContent.querySelector('#on-sale-only-switch');


                const onlyOnSaleGroup = modalContent.querySelector('.modal-checkbox-group');
                if (onlyOnSaleGroup) {
                    onlyOnSaleGroup.addEventListener('click', (e) => {

                        if (e.target === onlyOnSaleGroup) {
                            onSaleOnlySwitch.checked = !onSaleOnlySwitch.checked;
                        }

                        if (onSaleOnlySwitch.checked) {
                            selectedParams['selling_value'] = 'true';
                        } else {
                            delete selectedParams['selling_value'];
                        }
                    });
                }



                let selectedMarketplaceId = selectedParams['owner_value'] || '';

                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    options.classList.toggle('open');
                });

                const closeOptions = (e) => {
                    if (!customSelect.contains(e.target)) {
                        options.classList.remove('open');
                    }
                };
                document.addEventListener('click', closeOptions);

                options.querySelectorAll('.custom-option').forEach(option => {
                    option.addEventListener('click', () => {
                        delete selectedParams['owner_param'];
                        delete selectedParams['owner_value'];
                        selectedMarketplaceId = option.getAttribute('data-value');
                        triggerContent.innerHTML = option.innerHTML;
                        options.classList.remove('open');
                    });
                });

                if (selectedMarketplaceId) {
                    const selectedOption = options.querySelector(`.custom-option[data-value="${selectedMarketplaceId}"]`);
                    if (selectedOption) {
                        triggerContent.innerHTML = selectedOption.innerHTML;
                    }
                }
                if (selectedParams['selling_param'] === 'on_sale' && selectedParams['selling_value'] === 'true') {
                    onSaleOnlySwitch.checked = true;
                } else {
                    delete selectedParams['selling_param'];
                    delete selectedParams['selling_value'];
                }

                applyCallback = (isReset = false) => {
                    const sellingInfoSpan = document.querySelector('.selling-info #all-selling-infos');

                    delete selectedParams['selling_value'];

                    const onSaleOnly = onSaleOnlySwitch.checked;

                    document.removeEventListener('click', closeOptions);

                    let displayText = translations[currentLang]['all_marketplaces'] || 'Все маркетплейсы';
                    let applyStyle = false;

                    if (selectedMarketplaceId && !isReset) {
                        selectedParams['owner_param'] = 'id';
                        selectedParams['owner_value'] = selectedMarketplaceId;
                        const selectedOption = modalContent.querySelector(`.custom-option[data-value="${selectedMarketplaceId}"]`);
                        displayText = selectedOption.textContent.trim();
                        applyStyle = true;
                    }

                    if (onSaleOnly && !isReset) {
                        selectedParams['selling_value'] = 'true';
                        selectedParams['selling_param'] = 'on_sale';
                        if (!selectedMarketplaceId) {
                            displayText = translations[currentLang]['on_sale_only'] || 'Только на продаже';
                        }
                        applyStyle = true;
                    }

                    sellingInfoSpan.textContent = displayText;
                    if (applyStyle) {
                        sellingInfoSpan.style.color = 'rgb(117, 205, 208)';
                        sellingInfoSpan.removeAttribute('data-lang');
                    } else {
                        sellingInfoSpan.setAttribute('data-lang', 'all_marketplaces');
                        applyTranslations(sellingInfoSpan.parentElement);
                        sellingInfoSpan.style.color = '';
                    }
                };
            };

            if (modalTitle) {
                showFilterModal(modalTitle, modalContent, applyCallback, inputId);
            }
        }
    };
}



document.addEventListener('DOMContentLoaded', () => {

    const sellingInfoSpan = document.querySelector('.selling-info #all-selling-infos');
    const ownerInfoSpan = document.querySelector('.owner-info #all-owner-infos');

    if (sellingInfoSpan) {
        sellingInfoSpan.setAttribute('data-lang', 'all_marketplaces');
        applyTranslations(sellingInfoSpan.parentElement);
    }

    if (ownerInfoSpan) {
        ownerInfoSpan.setAttribute('data-lang', 'all_owners');
        applyTranslations(ownerInfoSpan.parentElement);
    }
});


async function fetchNftGifts(page, params) {
    try {
        let response = await fetch(`${SELF_API_URL}/api/getnftgifts?page=${page}&limit=20${params}`, {
            method: 'GET',
            signal: searchAbortController.signal,
            headers: { 'Authorization': '220825029010:qFtQm6ShcHu+gQYAD6727Q==' }
        });
        if (response.status === 429) {
            return { error: 'rate_limit_exceeded' };
        }
        let data = await response.json();
        if (!data.results || data.results.length < 20) {
            hasMoreData = false;
        }
        return data;
    } catch (e) {
        console.log(e);
        if (e.toString() === 'TypeError: Failed to fetch') {
            return { error: 'Quick Tg Api Disabled' };
        } else {
            return { error: e.toString() };
        }
    }
}




function formatOwnerInfo(ownerInfo, index = undefined, addIdAtTheEnd = false) {
    if (!ownerInfo || ownerInfo.length === 0) return 'N/A';
    const isWebApp = window?.Telegram?.WebApp?.initData;

    if (index === undefined) {
        return ownerInfo.map(owner => {
            if (owner.username) {
                if (isWebApp) {
                    return `<a class="no-underline owner_username" href="#" onclick="event.preventDefault(); window.Telegram.WebApp.openTelegramLink('https://t.me/${owner.username}');">${owner.full_name !== null ? owner.full_name.substring(0, 15) : owner.username}</a>`;
                } else {
                    return `<a class="no-underline owner_username" href="https://t.me/${owner.username}" target="_blank">${owner.full_name !== null ? owner.full_name.substring(0, 15) : owner.username}</a>`;
                }
            }
            if (owner.ton_address) {
                const shortAddress = owner.ton_address.includes('.ton') ?
                    owner.ton_address :
                    `${owner.ton_address.substring(0, 5)}...${owner.ton_address.substring(owner.ton_address.length - 8)}`;
                return `<a class="no-underline owner_username"  href="https://tonviewer.com/${owner.ton_address}" target="_blank">${shortAddress}</a>`;
            }
            if (owner.id) {
                if (isWebApp) {
                    return `<span style='color: #00e900'><a class="no-underline owner_username" href="#" onclick="event.preventDefault(); window.Telegram.WebApp.openTelegramLink('tg://resolve?domain_id=${owner.id}');">${owner.full_name !== null ? owner.full_name.substring(0, 15) : owner.id}</a></span>`;
                } else {
                    return `<span style='color: #00e900'><a class="no-underline owner_username" href="tg://user?id=${owner.id}">${owner.full_name !== null ? owner.full_name.substring(0, 15) : owner.id}</a></span>`;
                }
            } else {
                return owner.full_name ? owner.full_name.length <= 15 ? owner.full_name : `${owner.full_name.substring(0, 15)}...` : owner.channel_id !== null ? `<span style='color: red;'><span data-lang='channel_id'>ID Канала</span>: -100${owner.channel_id}</span>` : 'N/A';
            }
        }).join(', ');
    } else {
        let textToReturn = '';
        let currentOwner = ownerInfo[index];
        const hidden = currentOwner.hidden;
        let name = currentOwner.full_name;
        name = name ? Array.from(currentOwner.full_name).slice(0, 15).join('') : 'Пользователь';
        let username = currentOwner.username;
        let tonAddress = currentOwner.ton_address;
        let channelId = currentOwner.channel_id;
        let id = currentOwner.id;



        if (username) {
            if (isWebApp) {
                textToReturn = `<a class="no-underline owner_username" href="#" onclick="event.preventDefault(); window.Telegram.WebApp.openTelegramLink('https://t.me/${username}');">${username || name}</a>`;
            } else {
                textToReturn = `<a class="no-underline owner_username" href="https://t.me/${username}" target="_blank">${username || name}</a>`;
            }
        } if (tonAddress) {
            const shortAddress = tonAddress.includes('.ton') ?
                tonAddress :
                ` ${tonAddress.substring(0, 5)}...${tonAddress.substring(tonAddress.length - 8)}`;
            textToReturn = `<a class='no-underline owner_username' href="https://tonviewer.com/${tonAddress}" target="_blank">${shortAddress}</a>`;
        } if (id && username === null) {
            if (isWebApp) {
                textToReturn = `<span style='color: #00e900'><a class="no-underline owner_username" href="#" onclick="event.preventDefault(); window.Telegram.WebApp.openTelegramLink('tg://resolve?domain_id=${id}');">${name || id}</a></span>`;
            } else {
                textToReturn = `<span style='color: #00e900'><a class="no-underline owner_username" href="tg://user?id=${id}">${name || id}</a></span>`;
            }
        } if (channelId && !username) {
            textToReturn = `<span style='color: red;'>ID Канала: -100${channelId}</span>`;
        } if (hidden && name && !(tonAddress || channelId)) {
            textToReturn = `${name} `;
        } if (addIdAtTheEnd && !hidden) {
            return textToReturn + `<i>{ ${id} }</i>`;
        } if (addIdAtTheEnd && hidden) {
            return textToReturn + '<i>{ скрыт }</i>';
        } else {
            return textToReturn;
        }
    }

}


function formatSellingInfo(owner_info, name = undefined, number = undefined, forImagesView = false) {


    const selling_info = owner_info[0].selling_info || null;
    if (selling_info === null || selling_info.status === false || selling_info.status === null || !owner_info || !owner_info[0]?.selling_info && forImagesView !== true) {
        return `<div class="selling-info-centered">—</div>`;
    }

    const market = selling_info.place;
    const on_sale = selling_info.on_sale;


    const market_icon = `<img src="/site/static/imgs/${MARKETPLACES[market].value.toLowerCase()}.svg" alt='${market}' class='market-icon'>`;


    const id = selling_info.id;
    let price = selling_info.price;

    if (typeof price === 'number') {
        price = Number.isInteger(price) ? price : price.toFixed(2);
    }
    if (price === null && on_sale === true) price = 'Бандл';

    const spanText = selling_info.on_sale || ['TG Market'].includes(market)
        ? `<span class='price'>${price}</span>`
        : `<span class='not-for-sale'>не продаётся</span>`;

    let link, currencyIcon, className1;
    currencyIcon = (selling_info.currency === 'TON') || (selling_info.currency === null) ? `<img src="/site/static/imgs/ton.svg" class='ton-icon' alt='TON'>` : `<img src="/site/static/imgs/telegram_star_icon.svg" class='ton-icon' alt='Stars'>`;
    link = ['Fragment', 'TG Market'].includes(market) ? `${MARKETPLACES[market].link_for_gift}${convertGiftNameForLink(name)}-${number}` : `${MARKETPLACES[market].link_for_gift}${id}`;
    if (!selling_info.on_sale) {
        currencyIcon = '';
    }


    className1 = !forImagesView ? 'selling-info-div' : 'selling-info-for-images-view';


    return `<a href='${link}' target='_blank' rel='noopener noreferrer' class='no-underline ${className1}'>
        ${market_icon}
        <div class='price-img-div'>
            ${spanText}${currencyIcon}
        </div>
    </a>`;
}





const scrollToTopBtn = document.getElementById('scroll-to-top');

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    scrollToTopBtn.classList.toggle('visible', scrolled > 800);
}, { passive: true });

scrollToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

const observer = new IntersectionObserver(
    async (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMoreData && giftsResultsExists && !noNeedAppend) {
            isLoading = true;
            currentPage++;

            if (currentViewType === 'table') {
                const tbody = document.querySelector('.nft-gift-results-tbody');
                if (tbody) {
                    const loadingRow = document.createElement('tr');
                    loadingRow.id = 'loading-gifts-row';
                    const loadingCell = document.createElement('td');
                    const numColumns = document.querySelector('.nft-gift-results-thead tr')?.childElementCount || 7;
                    loadingCell.colSpan = numColumns;
                    loadingCell.style.textAlign = 'center';
                    loadingCell.style.padding = '2rem 0';

                    const loaderContainer = document.createElement('div');
                    createLottieLoader(loaderContainer, translations[currentLang].loading_results);

                    loadingCell.appendChild(loaderContainer);
                    loadingRow.appendChild(loadingCell);
                    tbody.appendChild(loadingRow);
                }
            } else {
                let container;
                if (currentViewType === 'cards') {
                    container = document.querySelector('.nft-gift-cards-container');
                } else if (currentViewType === 'images') {
                    container = document.querySelector('.nft-gift-images-grid');
                }

                if (container) {
                    const loadingDiv = document.createElement('div');
                    loadingDiv.id = 'loading-gifts';
                    createLottieLoader(loadingDiv, translations[currentLang].loading_results);
                    loadingDiv.style.gridColumn = '1 / -1';
                    container.appendChild(loadingDiv);
                }
            }

            const paramsString = Object.entries(selectedParams)
                .map(([key, value]) => {
                    if (key === 'sort') {
                        return `&sort_param=${value.type}&sort_type=${value.order}`;
                    }
                    return `&${key}=${encodeURIComponent(value)}`;
                })
                .join('');

            try {
                if (searchAbortController) {
                    searchAbortController.abort();
                }
                searchAbortController = new AbortController();
                const { info, results: newResults } = await fetchNftGifts(currentPage, paramsString);

                const loadingIndicator = document.getElementById('loading-gifts') || document.getElementById('loading-gifts-row');
                if (loadingIndicator) loadingIndicator.remove();


                if (newResults && newResults.length > 0 && info.totalFound >= 19) {
                    nftGiftsResponseResults.push(...newResults);
                    await fillNftGiftsBody(info, newResults, true, currentViewType);
                } else {
                    hasMoreData = false;
                    observer.disconnect();
                }
            } catch (e) {
                const loadingIndicator = document.getElementById('loading-gifts') || document.getElementById('loading-gifts-row');
                if (loadingIndicator) loadingIndicator.remove();

                hasMoreData = false;
                observer.disconnect();
                console.error('Error loading more gifts:', e);
            } finally {
                isLoading = false;
            }
        }
    },
    {
        root: null,
        threshold: 0.1,
        rootMargin: '10px'
    }
);


function reconnectObserver() {
    observer.disconnect();

    if (giftsResultsExists && nftGiftsResponseResults.length > 0 && hasMoreData) {
        let lastElement;

        if (currentViewType === 'cards') {
            lastElement = document.querySelector('.nft-gift-cards-container')?.lastElementChild;
        } else if (currentViewType === 'table') {
            lastElement = document.querySelector('.nft-gift-results-tbody')?.lastElementChild;
        } else if (currentViewType === 'images') {
            lastElement = document.querySelector('.nft-gift-images-grid')?.lastElementChild;
        }

        if (lastElement) {
            observer.observe(lastElement);
        }
    }
}



function createLottieLoader(container, text) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.gap = '12px';


    const lottieContainer = document.createElement('div');
    lottieContainer.style.width = '95%';
    lottieContainer.style.maxWidth = '400px';
    lottieContainer.style.height = '100px';
    // lottieContainer.style.margin = '0 auto';

    const textSpan = document.createElement('span');
    textSpan.className = 'reg-font';
    textSpan.style.marginBottom = '1rem';
    textSpan.setAttribute('data-lang', 'loading_results');
    textSpan.textContent = text;

    wrapper.append(lottieContainer, textSpan);
    container.append(wrapper);

    window.lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: `/site/static/imgs/eyes.json`,
    });
}



document.getElementById('find-random-nfts').addEventListener('click', async (e) => {
    e.preventDefault();

    if (isLoading || isSearchInProgress) return;

    isLoading = true;
    isSearchInProgress = true;

    const btn = e.currentTarget;
    btn.disabled = true;

    if (searchAbortController) {
        searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    try {
        let isUserLoggedIn = false;
        let isSubExists = false;
        let shitCount = 0;
        try {
            const userData = await (await fetch('/api/me')).json();
            isSubExists = userData?.user?.sub_exists === true;
            isUserLoggedIn = userData?.loggined === true;
            shitCount = userData?.user?.anonymous_request_count;
        } catch (error) { }
        btn.disabled = false;

        if (shitCount >= ANONYMOUS_REQUEST_LIMIT && !isSubExists && isUserLoggedIn) {
            showLimitReachedModal();
            btn.style.pointerEvents = '';
            return;
        } if (!isUserLoggedIn) {
            // } if (shitCount < ANONYMOUS_REQUEST_LIMIT && !isSubExists && !isUserLoggedIn) {
            btn.disabled = false;
            btn.style.pointerEvents = '';
            const nftGiftsMainBox = document.getElementById('nft-gifts-main-box');
            const modal = createModal();

            const style = document.createElement('style');
            document.head.appendChild(style);

            modal.innerHTML = `
                <div class="auth-modal-overlay"></div>
                <div class="auth-modal">
                    <h3 data-lang="enter_to_account">Войдите в аккаунт</h3>
                    <p data-lang="enter_to_account_for_gifts_description">
                        Для поиска подарков необходимо войти через Telegram.
                    </p>
                    <button class="login-btn" id="profile-login-btn">
                        <img src="/site/static/imgs/telegramlogo.png" alt="Telegram">
                        <span data-lang="enter_with_telegram">Войти через Telegram</span>
                    </button>
                </div>
            `;

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                modal.querySelector('.auth-modal-overlay').classList.add('show');
                modal.querySelector('.auth-modal').classList.add('show');
            });

            modal.querySelector('#profile-login-btn').addEventListener('click', () => {
                window.location.href = `https://t.me/look_tg_bot?startapp=login`;
            });

            modal.querySelector('.auth-modal-overlay').addEventListener('click', () => {
                const overlay = modal.querySelector('.auth-modal-overlay');
                const authModal = modal.querySelector('.auth-modal');
                overlay.classList.remove('show');
                authModal.classList.remove('show');

                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.innerHTML = '';
                    document.body.style.overflow = '';
                    style.remove();
                }, 300);
            });

            btn.disabled = false;
            btn.style.pointerEvents = '';
            btn.classList.remove('loading');
            applyTranslations(modal);

            return;
        }
    } catch (e) { }
    giftsResultsExists = false;
    currentPage = 1;
    hasMoreData = true;
    observer.disconnect();
    nftGiftsResponseResults = [];
    nftGiftsResponseInfo = null;

    const nftGiftsMainBox = document.getElementById('nft-gifts-main-box');
    nftGiftsMainBox.innerHTML = '';
    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'loading-gifts';
    createLottieLoader(loaderDiv, translations[currentLang].loading_results);
    nftGiftsMainBox.appendChild(loaderDiv);

    let randomGiftName, randomGiftModel;


    randomGiftName = GIFT_NAMES[Math.floor(Math.random() * GIFT_NAMES.length)];
    const models = await getNftGiftsModels(randomGiftName);
    randomGiftModel = models[Math.floor(Math.random() * models.length)];


    if (!randomGiftModel) {
        nftGiftsMainBox.innerHTML = '<span class="light-font gifts-not-found-span">❌ Не удалось найти подходящий подарок</span>';
        isLoading = false;
        isSearchInProgress = false;
        btn.disabled = false;
        return;
    }

    selectedParams = {
        name: randomGiftName,
        model: randomGiftModel,
    };
    giftNameChoosen = true;
    sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));

    (async () => {
        await restoreSelectedParamsState(selectedParams);
    })();
    updateModelListStyle();

    const paramsString = convertParamsToString(selectedParams);

    try {
        const { info, results: nftGiftsResponse } = await fetchNftGifts(1, paramsString);
        if (nftGiftsResponse?.length > 0) {
            nftGiftsResponseInfo = info;
            nftGiftsResponseResults = nftGiftsResponse;
            giftsResultsExists = true;
            await fillNftGiftsBody(info, nftGiftsResponse, false, currentViewType);
        }
        // else {
        //     nftGiftsMainBox.innerHTML = '<span class="light-font gifts-not-found-span">❌ Подарки не найдены</span>';
        // }
    } catch (e) {
        console.log(e);
        nftGiftsMainBox.innerHTML = '<span class="light-font">Ошибка загрузки</span>';
    } finally {
        isSearchInProgress = false;
        isLoading = false;
        btn.disabled = false;
    }
});



document.getElementById('find-gifts-btn').addEventListener('click', async (e) => {
    e.preventDefault();

    const btn = e.currentTarget;
    if (btn.disabled) return;

    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    btn.classList.add('loading');

    if (searchAbortController) {
        searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    try {
        let isUserLoggedIn = false;
        let isSubExists = false;
        let shitCount = 0;
        try {
            const userData = await (await fetch('/api/me')).json();
            isSubExists = userData?.user?.sub_exists === true;
            isUserLoggedIn = userData?.loggined === true;
            shitCount = userData?.user?.anonymous_request_count;
        } catch (error) { }

        btn.disabled = false;

        if (shitCount >= ANONYMOUS_REQUEST_LIMIT && !isSubExists && isUserLoggedIn) {
            showLimitReachedModal();
            btn.style.pointerEvents = '';
            return;
        } if (!isUserLoggedIn) {
            // } if (shitCount < ANONYMOUS_REQUEST_LIMIT && !isSubExists && !isUserLoggedIn) {
            btn.disabled = false;
            btn.style.pointerEvents = '';

            const modal = createModal();

            const style = document.createElement('style');
            document.head.appendChild(style);

            modal.innerHTML = `
                <div class="auth-modal-overlay"></div>
                <div class="auth-modal">
                    <h3 data-lang="enter_to_account">Войдите в аккаунт</h3>
                    <p data-lang="enter_to_account_for_gifts_description">
                        Для поиска подарков необходимо войти через Telegram.
                    </p>
                    <button class="login-btn" id="profile-login-btn">
                        <img src="/site/static/imgs/telegramlogo.png" alt="Telegram">
                        <span data-lang="enter_with_telegram">Войти через Telegram</span>
                    </button>
                </div>
            `;

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                modal.querySelector('.auth-modal-overlay').classList.add('show');
                modal.querySelector('.auth-modal').classList.add('show');
            });

            modal.querySelector('#profile-login-btn').addEventListener('click', () => {
                window.location.href = `https://t.me/look_tg_bot?startapp=login`;
            });

            modal.querySelector('.auth-modal-overlay').addEventListener('click', () => {
                const overlay = modal.querySelector('.auth-modal-overlay');
                const authModal = modal.querySelector('.auth-modal');
                overlay.classList.remove('show');
                authModal.classList.remove('show');

                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.innerHTML = '';
                    document.body.style.overflow = '';
                    style.remove();
                }, 300);
            });

            btn.disabled = false;
            btn.style.pointerEvents = '';
            btn.classList.remove('loading');
            applyTranslations(modal);

            return;
        }

        giftsResultsExists = true;
        currentPage = 1;
        hasMoreData = true;
        observer.disconnect();

        const nftGiftsMainBox = document.getElementById('nft-gifts-main-box');
        nftGiftsMainBox.innerHTML = '';
        const loaderDiv = document.createElement('div');
        loaderDiv.id = 'loading-gifts';
        createLottieLoader(loaderDiv, translations[currentLang].loading_results);
        nftGiftsMainBox.appendChild(loaderDiv);

        const paramsString = convertParamsToString(selectedParams);

        let response;
        try {
            response = await fetchNftGifts(currentPage, paramsString);
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }
            console.error('Ошибка поиска:', error);
        } finally {
            btn.disabled = false;
            btn.style.pointerEvents = '';
            btn.classList.remove('loading');
        }

        if (response.detail === 'User not authenticated.' || response.detail === 'Unauthorized' || response.detail === 'Request limit reached.' || response.error === 'rate_limit_exceeded') {
            showLimitReachedModal();
            nftGiftsMainBox.innerHTML = '';
            return;
        }

        if (response.error === 'Quick Tg Api Disabled') {
            const footer = document.getElementById('footer');
            nftGiftsMainBox.innerHTML = '';
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerHTML = `<span class="light-font" data-lang="error">${translations[currentLang].error}. <a href="https://t.me/bxxst" class="no-underline" target="_blank">${translations[currentLang].contact}</a> ${translations[currentLang].try_later}</span>`;
            footer.appendChild(notification);
            return;
        }

        if (response.detail === 'Нет подарков') {
            nftGiftsMainBox.innerHTML = '<span class="light-font gifts-not-found-span" data-lang="no_gifts_found">Подарки не найдены</span>';
            return;
        }

        if (response.detail === 'Ошибка БД') {
            nftGiftsMainBox.innerHTML = '<span class="light-font gifts-not-found-span" data-lang="bd_error">Произошла ошибка. Попробуйте позже.</span>';
            return;
        }

        const { info, results: newResults } = response;
        nftGiftsResponseInfo = info;

        if (newResults && newResults.length > 0) {
            await fillNftGiftsBody(info, newResults, false, currentViewType);
        } else if (searchAbortController && searchAbortController.signal.aborted) {
            nftGiftsMainBox.innerHTML = '';
        } else {
            // console.log(response);
            nftGiftsMainBox.innerHTML = '<span class="light-font gifts-not-found-span" data-lang="no_gifts_timeout">Превышено время ожидания. Проверьте интернет или попробуйте позже.</span>';
        }

    } catch (e) {
        console.error(e);
        document.getElementById('nft-gifts-main-box').innerHTML = '<span class="light-font gifts-not-found-span" data-lang="error_loading_gifts">Ошибка загрузки подарков</span>';
    } finally {
        isLoading = false;
        isSearchInProgress = false;

        btn.disabled = false;
    }
});





window.addEventListener('beforeunload', () => {
    if (Object.keys(selectedParams).length > 0) {
        sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));
    }
});


document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && Object.keys(selectedParams).length > 0) {
        sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));
    }
});


document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.includes('javascript')) {
        if (Object.keys(selectedParams).length > 0) {
            sessionStorage.setItem('selectedParams', JSON.stringify(selectedParams));
        }
    }
});

document.addEventListener('DOMContentLoaded', applyTranslations);
window.addEventListener('languageChanged', applyTranslations);


// document.getElementById('lottie-animation').addEventListener('animationend');


document.getElementById('reset-filters').addEventListener('click', (e) => {
    e.preventDefault();



    const box = document.getElementById('nft-gifts-main-box');
    const boxCount = box ? box.childElementCount : 0;

    if (boxCount > 0 || (selectedParams && Object.keys(selectedParams).length > 0)) {
        if (searchAbortController) {
            searchAbortController.abort();
        }

        selectedParams = {};
        giftsResultsExists = false;
        giftNameChoosen = false;
        nftGiftsResponseInfo = null;
        nftGiftsResponseResults.length = 0;
        sessionStorage.removeItem('selectedParams');
        localStorage.removeItem('selectedParams');
        updateModelListStyle();


        const allParamsToReset = {
            ...paramToTranslationKey,
            'selling-infos': 'all_marketplaces',
            'owner-infos': 'all_owners'
        };

        for (const [param, langKey] of Object.entries(allParamsToReset)) {
            const targetParamFilterBox = document.getElementById(`all-${param}`);
            if (targetParamFilterBox) {
                targetParamFilterBox.setAttribute('data-lang', langKey);
                targetParamFilterBox.removeAttribute('style');
            }
        }

        const nftPreview = document.querySelector('.nftpreview');
        nftPreview.style.background = '';


        const patternOverlay = nftPreview.querySelector('svg.pattern-overlay');
        if (patternOverlay) {
            patternOverlay.remove();
        }

        box.innerHTML = '';

        const animationContainer = document.getElementById('lottie-animation');
        if (animationContainer) {
            animationContainer.innerHTML = '';
            const giftNameSpan = document.getElementById('gift-name-not-chosen');
            if (giftNameSpan) giftNameSpan.textContent = '';
        }

        const numberInput = document.getElementById('nft-number-input');
        if (numberInput) {
            numberInput.value = '';
        }

        document.getElementById('scroll-to-top')?.classList.remove('visible');

        applyTranslations(document);

    } else {
        return;
    }

});






document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('find-gifts-btn').click();
    }
});

window.addEventListener('pageshow', function (event) {
    if (event.persisted || document.visibilityState === 'visible') {
        const findBtn = document.getElementById('find-gifts-btn');
        if (giftsResultsExists && findBtn) {
            setTimeout(() => {
                findBtn.click();
            }, 100);
        }
    }
});

window.addEventListener('focus', function () {
    if (giftsResultsExists && nftGiftsResponseInfo && nftGiftsResponseResults) {
        const existingGrid = document.querySelector('.nft-gift-images-grid');
        const existingCards = document.querySelector('.nft-gift-cards-container');
        const existingTable = document.querySelector('.nft-gift-results-tbody');

        if (currentViewType === 'images' && !existingGrid) {
            fillNftGiftsBody(nftGiftsResponseInfo, nftGiftsResponseResults, false, currentViewType);
        } else if (currentViewType === 'cards' && !existingCards) {
            fillNftGiftsBody(nftGiftsResponseInfo, nftGiftsResponseResults, false, currentViewType);
        } else if (currentViewType === 'table' && !existingTable) {
            fillNftGiftsBody(nftGiftsResponseInfo, nftGiftsResponseResults, false, currentViewType);
        }
    }
});

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && giftsResultsExists && nftGiftsResponseInfo && nftGiftsResponseResults) {
        setTimeout(() => {
            const existingGrid = document.querySelector('.nft-gift-images-grid');
            const existingCards = document.querySelector('.nft-gift-cards-container');
            const existingTable = document.querySelector('.nft-gift-results-tbody');

            if (currentViewType === 'images' && !existingGrid) {
                fillNftGiftsBody(nftGiftsResponseInfo, nftGiftsResponseResults, false, currentViewType);
            } else if (currentViewType === 'cards' && !existingCards) {
                fillNftGiftsBody(nftGiftsResponseInfo, nftGiftsResponseResults, false, currentViewType);
            } else if (currentViewType === 'table' && !existingTable) {
                fillNftGiftsBody(nftGiftsResponseInfo, nftGiftsResponseResults, false, currentViewType);
            }
        }, 100);
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const antiDebug = () => {
        const threshold = 160;
        const checkDevTools = () => {
            if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
            }
        };
        setInterval(checkDevTools, 2000);
    };
    antiDebug();
});


function closeMobileDropdown(targetDiv) {
    const overlay = document.querySelector('.dropdown-overlay');
    const dropdown = document.querySelector('.dropdown-list');
    if (overlay) overlay.classList.remove('show');

    if (dropdown) {
        dropdown.classList.remove('open');
        dropdown.classList.add('closing');
        const onEnd = () => {
            dropdown.removeEventListener('transitionend', onEnd);
            dropdown.remove();
            if (overlay) overlay.remove();
            document.body.style.overflow = '';
        };
        dropdown.addEventListener('transitionend', onEnd);
        setTimeout(onEnd, 350);
    } else {
        if (overlay) overlay.remove();
        document.body.style.overflow = '';
    }
    if (targetDiv && targetDiv.classList) targetDiv.classList.remove('open');
}



function applyTranslations(rootElement = document) {
    currentLang = localStorage.getItem('language') || 'ru';
    if (!(rootElement instanceof Element) && !(rootElement instanceof Document)) {
        console.warn('applyTranslations received an invalid rootElement:', rootElement);
        return;
    }
    const lang = currentLang;
    rootElement.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });
    rootElement.querySelectorAll('select[data-lang-options] option').forEach(option => {
        const key = option.value;
        const translationKey = `sort_${key}`;
        if (translations[lang] && translations[lang][translationKey]) {
            option.textContent = translations[lang][translationKey];
        }
    });
    rootElement.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
}


let isLookGiftsSubscribed = localStorage.getItem('lookgifts_subscribed') === 'true';

function createSubscribeModal() {
    const modal = document.createElement('div');
    modal.id = 'lookgifts-subscribe-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            background: #1a1a1a;
            border-radius: 20px;
            padding: 2rem;
            max-width: 380px;
            width: 80%;
            text-align: center;
        ">
            <h2 style="color: #59c7f9; margin: 0 0 1rem; font-size: 1.6rem;">
                Будь в курсе новостей!
            </h2>
            <p style="color: #ccc; margin: 1rem 0; line-height: 1.5;">
                Подпишись на канал чтобы не пропустить обновлений на сайте, а также новостей о разработке других интересных проектов.
            </p>
            <button id="subscribe-btn" style="
                background: #0088cc;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 12px;
                font-weight: bold;
                font-size: 1.1rem;
                cursor: pointer;
                margin: 1rem 0;
                display: flex;
                align-items: center;
                gap: 10px;
                justify-content: center;
                width: 100%;
                transition: 0.2s;
            ">
                <img src="/site/static/imgs/telegramlogo.png" width="24" height="24">
                <span>Подписаться</span>
            </button>
            <button id="subscribed-btn" style="
                background: transparent;
                color: #59c7f9;
                border: 1px solid #59c7f9;
                padding: 0.7rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                margin-top: 0.5rem;
            ">Потом</button>
        </div>
    `;

    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
        #subscribe-btn:hover { background: #006fa3 !important; }
        #subscribed-btn:hover { background: #59c7f930 !important; }
    `;
    document.head.appendChild(style);

    requestAnimationFrame(() => modal.style.opacity = '1');

    document.getElementById('subscribe-btn').onclick = () => {
        localStorage.setItem('lookgifts_subscribed', 'true');
        isLookGiftsSubscribed = true;
        let channelLink = 'https://t.me/lookgifts';
        if (window?.Telegram?.WebApp) {
            window.Telegram.WebApp.openTelegramLink(channelLink);
        } else {
            window.open(channelLink, '_blank');

        }
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 1000);
    };

    document.getElementById('subscribed-btn').onclick = () => {
        localStorage.setItem('lookgifts_subscribed', 'false');
        isLookGiftsSubscribed = false;
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    };
}

function checkAndShowSubscribeModal() {
    if (!isLookGiftsSubscribed) {
        createSubscribeModal();
    }
}

const originalFindGiftsBtn = document.getElementById('find-gifts-btn');
if (originalFindGiftsBtn) {
    originalFindGiftsBtn.addEventListener('click', (e) => {
        checkAndShowSubscribeModal();
    });
}

const randomBtn = document.getElementById('find-random-nfts');
if (randomBtn) {
    randomBtn.addEventListener('click', (e) => {
        checkAndShowSubscribeModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.tagName !== 'INPUT') {
        checkAndShowSubscribeModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!isLookGiftsSubscribed && window.location.pathname.includes('/gifts')) {
        setTimeout(checkAndShowSubscribeModal, 2000);
    }
});
