import { translations } from './translations.js';
let currentLangProfile = localStorage.getItem('language') || 'ru';


function applyTranslationsProfile(rootElement = document) {
    currentLangProfile = localStorage.getItem('language') || 'ru';
    const lang = currentLangProfile;
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




function renderProfileInfo(parentElement, user, enteredViaWebApp) {
    if (!enteredViaWebApp) {
        const profileHTML = `
            <div class="main-unbox profile-container">
                <div class="profile-content">
                    <h3 class="reg-font size-5" style="padding-bottom: 10px; border-bottom: 1px solid #444; margin-bottom: 15px;" data-lang="profile">Профиль</h3>
                    <img src="${user.username !== null ? `https://t.me/i/userpic/320/${user.username}.jpg` : user.photo_url}" alt="avatar" class="profile-avatar">
                    <p class="reg-font"><span data-lang="name">Имя</span>: ${user.first_name || 'N/A'}</p>
                    <p class="reg-font"><span data-lang="username">Юз</span>: @${user.username || 'N/A'}</p>
                </div>
                <div class="bottom-buttons-container">
                    <button id="logout-btn" class="state-btn logout-btn" data-lang="logout">Выйти</button>
                    <button id="ref-btn" class="state-btn ref-btn" data-lang="referal_link">Реферальная ссылка</button>
                </div>
            </div>
        `;
        parentElement.innerHTML = profileHTML;

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            fetch('/api/logout', { method: 'POST' })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/profile';
                    }
                })
                .catch(err => console.error('Logout request failed', err));
        });

        document.getElementById('ref-btn')?.addEventListener('click', async () => {
            const refLink = `https://t.me/look_tg_bot?startapp=ref_${user.id}`;
            await navigator.clipboard.writeText(refLink);
            showCopyNotificationProfile();
            window.getSelection().removeAllRanges();
        });

    } else {
        const profileHTML = `
            <div class="main-unbox">
                <h3 class="reg-font size-5" style="padding-bottom: 10px; border-bottom: 1px solid #444; margin-bottom: 15px;" data-lang="profile">Профиль</h3>
                <img src="${user.username !== null ? `https://t.me/i/userpic/320/${user.username}.jpg` : user.photo_url}" alt="avatar" class="profile-avatar">
                <p class="reg-font"><span data-lang="name">Имя</span>: ${user.first_name || 'N/A'}</p>
                <p class="reg-font"><span data-lang="username">Юз</span>: @${user.username || 'N/A'}</p>
                <button id="ref-btn" class="state-btn ref-btn" data-lang="referal_link">Реферальная ссылка</button>
            </div>
        `;
        parentElement.innerHTML = profileHTML;
        document.getElementById('ref-btn')?.addEventListener('click', async () => {
            const refLink = `https://t.me/look_tg_bot?startapp=ref_${user.id}`;
            await navigator.clipboard.writeText(refLink);
            showCopyNotificationProfile();
            window.getSelection().removeAllRanges();
        });
    }
}


function showCopyNotificationProfile() {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="checkmark">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    <span>Скопировано</span>
  `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}


function renderSubscriptionInfo(parentElement, user) {
    const expiryDate = user.sub_until ? new Date(user.sub_until) : null;
    const isSubscribed = expiryDate && expiryDate > new Date();
    const subscriptionEndDate = expiryDate ? expiryDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

    const subscriptionHTML = `
        <div class="main-unbox">
            <div id="profile-subscription-head">
                <h3 class="reg-font size-5" data-lang="subscription_status">Статус подписки</h3>
                <svg id="subscription-icon"
                     data-tooltip="С подпиской у вас не будет лимита на поиск подарков до её истечения."
                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                     stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>

            </div>
            ${isSubscribed
            ? `<p class="reg-font subscription-status-text" data-lang="subscription_active_until">Ваша подписка активна до:</p><p class="reg-font" style='margin: 0 auto;'>${subscriptionEndDate}</p>`
            : `<p class="reg-font subscription-status-text" data-lang="subscription_not_active">У вас нет активной подписки.</p>
                <div class="subscription-offer">
                    <h4 class="reg-font" data-lang="subscription_pay_type_choose">Выберите способ оплаты подписки:</h4>
                    <div class="payment-buttons">
                        <button id="buy-tonkeeper" class="state-btn" data-lang="via_tonkeeper">Через Tonkeeper</button>
                        <button id="buy-bot" class="state-btn" data-lang="via_bot">Через телеграм бота</button>
                        <button id="buy-other" class="state-btn" data-lang="via_other">Просто оплатить</button>
                </div>
            </div>`
        }
        </div>
    `;
    parentElement.innerHTML = subscriptionHTML;

    const icon = document.getElementById('subscription-icon');
    if (icon) {
        icon.addEventListener('click', () => {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';


            modalContent.innerHTML = `
                <h4 class="reg-font" data-lang="subscription_features"Что дает подписка?></h4>
                <p class="light-font" data-lang='subscription_tooltip'>Подписка дает безлимитный поиск подарков при активации. Длительность: 30 дней. Цена: 10 TON. Без нее действует ограничение 10 запросов в сутки</p>
                <button class="state-btn modal-close-btn" data-lang="understand">Понятно</button>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            applyTranslationsProfile(modalOverlay);

            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay || e.target.classList.contains('modal-close-btn')) {
                    document.body.removeChild(modalOverlay);
                }
            });
        });
    }

    const uid = user.id;

    if (!isSubscribed) {
        const buyTonkeeperBtn = document.getElementById('buy-tonkeeper');
        const amount = 10;
        const buyBotBtn = document.getElementById('buy-bot');

        if (buyBotBtn) {
            buyBotBtn.addEventListener('click', () => {
                window.open('https://t.me/look_tg_bot?start=subscription', '_blank');
            });
        }

        if (buyTonkeeperBtn) {
            buyTonkeeperBtn.addEventListener('click', () => {
                window.location.href = `/payment_waiting?via_tonkeeper=true&amount=${amount}&text=${uid}`;
            });
        }

        const buyOtherBtn = document.getElementById('buy-other');
        if (buyOtherBtn) {
            buyOtherBtn.addEventListener('click', () => {
                window.location.href = `/payment_waiting?via_tonkeeper=false&amount=${amount}&text=${uid}`;
            });
        }
    }
}


function renderProfilePage(user, enteredViaWebApp) {
    const profileRoot = document.getElementById('profile-root');
    if (!profileRoot) return;

    profileRoot.innerHTML = `
        <div id="profile-page-container">
            <div id="profile-info-block" class="profile-info-box"></div>
            <div id="profile-subscription-block" class="subscription-box"></div>
        </div>
    `;

    const profileInfoBlock = document.getElementById('profile-info-block');
    const subscriptionBlock = document.getElementById('profile-subscription-block');

    renderProfileInfo(profileInfoBlock, user, enteredViaWebApp);
    renderSubscriptionInfo(subscriptionBlock, user);

    applyTranslationsProfile(profileRoot);
}


function showLoginPrompt() {
    const profileRoot = document.getElementById('profile-root');
    if (!profileRoot) return;

    profileRoot.innerHTML = `
        <div class="main-unbox profile-info-box">
            <h3 class="reg-font size-5" style="margin-bottom: 1rem;" data-lang='enter_to_account'>Войдите в аккаунт</h3>
            <p class="light-font" style="margin-bottom: 2rem;" data-lang='enter_to_account_description'>Для просмотра профиля необходимо войти через Telegram.</p>
            <button id="profile-login-btn" class="state-btn" style="cursor: pointer; background: #0088cc; display: flex; align-items: center; gap: 8px; justify-content: center;">
                    <img src="/site/static/imgs/telegramlogo.png" alt="Telegram" style="width: 20px; height: 20px;">
                    <span data-lang='enter_with_telegram'>Войти через Telegram</span>
                </button>
    `;

    document.getElementById('profile-login-btn')?.addEventListener('click', () => {
        window.location.href = `https://t.me/look_tg_bot?startapp=login`;
    });

    applyTranslationsProfile(profileRoot);
}


document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const enteredViaWebApp = Boolean(window.Telegram?.WebApp?.initDataUnsafe?.user);
    const initDataRaw = window.Telegram?.WebApp?.initData || urlParams.get('d');


    if (enteredViaWebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;

        renderProfilePage(user, true);

        if (user.id) {
            document.cookie = `user_id=${user.id}; Path=/; MaxAge=${60 * 60 * 24 * 30}; SameSite=Lax`;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initDataRaw })
        }).catch(() => { });


        return;
    }

    if (initDataRaw) {
        try {
            const user = JSON.parse(decodeURIComponent(initDataRaw));
            renderProfilePage(user, true);
            if (user.id) {
                document.cookie = `user_id=${user.id}; Path=/; MaxAge=${60 * 60 * 24 * 30}; SameSite=Lax`;
            }
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: initDataRaw })
            }).catch(() => { });
        } catch (e) { }
    }

    console.log(urlParams.get('d'));
    if (urlParams.get('d') !== null) {
        window.location.href = '/profile';
        return;
    }
    fetch('/api/me')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
            if (data.user) renderProfilePage(data.user, false);
            else showLoginPrompt();
        })
        .catch(() => showLoginPrompt());
});

window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});
