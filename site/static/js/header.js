import { translations } from './translations.js';

let currentLangHeader = localStorage.getItem('language');

if (!translations[currentLangHeader]) {
    currentLangHeader = 'ru';
    localStorage.setItem('language', 'ru');
}


function changeLanguage(lang) {
    if (!translations[lang]) return;

    currentLangHeader = lang;
    localStorage.setItem('language', lang);

    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        element.innerHTML = translations[lang][key] || element.innerHTML || key;
    });

    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        element.placeholder = translations[lang][key] || element.placeholder || key;
    });

    window.dispatchEvent(new CustomEvent('languageChanged'));
}


document.body.addEventListener('click', (e) => {
    if (e.target.closest('#lang-div')) {
        const newLang = currentLangHeader === 'ru' ? 'en' : 'ru';
        changeLanguage(newLang);
    }
});


const BOT_NAME = 'look_tg_bot';



fetch('https://look.tg/api/ping').then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
})
    .then(data => null)
    .catch(error => console.error('Ping fail ', error));



function setupProfileButton(button, user) {
    if (!button) return;
    const displayName = user.first_name ? user.first_name.substring(0, 10) : '';

    const profileContent = `
        <a href="/profile" class="hd a no-underline" style="display: flex; align-items: center; gap: 8px;">
            ${user.photo_url ? `<img src="${user.photo_url}" class="tg-user-photo" alt="avatar" style="width: 32px; height: 32px;">` : ''}
            <span>${displayName}</span>
        </a>
    `;

    button.innerHTML = profileContent;
}


function showLoginSuccessOverlay(redirectUrl) {
    sessionStorage.setItem('showLoginSuccess', 'true');
    sessionStorage.setItem('loginRedirectUrl', redirectUrl);
    window.location.href = '/empty';
}


async function handleAuth() {
    if (!window.Telegram || !window.Telegram.WebApp) {
        return;
    }

    const tg = window.Telegram.WebApp;
    tg.ready();

    const initData = tg.initData || tg.initDataUnsafe;
    const startParam = tg.initDataUnsafe?.start_param;
    // console.log(startParam);

    if (startParam === 'login') {
        fetch('/api/telegram_webapp_auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initData })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.detail || 'Authentication failed on server.');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.user) {
                    const profileUrl = new URL('/profile', window.location.origin);
                    profileUrl.searchParams.set('d', JSON.stringify(data.user));
                    showLoginSuccessOverlay(profileUrl.href);
                } else {
                    throw new Error(data.detail || 'Unknown authentication error.');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
            });
    } else if (startParam && startParam.startsWith('ref_')) {
        const referrerId = parseInt(startParam.split('_')[1], 10);
        const referee = tg.initDataUnsafe?.user;
        console.log(referrerId, referee);

        if (!referee || referee.id === referrerId) {
            console.log('User cannot refer themselves.');
            return;
        }

        const referralApplied = localStorage.getItem('referral_bonus_applied');
        console.log(referralApplied, typeof (referralApplied));
        if (referralApplied !== 'true') {
            fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referrer_id: referrerId,
                    referee_id: referee.id
                })
            })
                .then(response => {
                    if (!response.ok) throw new Error('Referral API call failed');
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        console.log('Referral bonus applied to referrer.');
                        localStorage.setItem('referral_bonus_applied', 'true');
                    }
                })
                .catch(error => console.error('Referral error:', error));
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    changeLanguage(currentLangHeader);

    const path = window.location.pathname;
    if (!path.endsWith('/login.html') && !path.endsWith('/login') && !path.endsWith('/empty')) {
        handleAuth();
    }
    if (path.endsWith('/empty')) {
        if (sessionStorage.getItem('showLoginSuccess') === 'true') {
            const redirectUrl = sessionStorage.getItem('loginRedirectUrl');
            sessionStorage.removeItem('showLoginSuccess');
            sessionStorage.removeItem('loginRedirectUrl');

            const overlay = document.createElement('div');
            overlay.id = 'login-success-overlay';
            const body = document.body;

            body.style.margin = '0';


            overlay.innerHTML = `
            <h2 style="margin-bottom: 1rem;">Вы успешно вошли!</h2>
            <p style="margin-bottom: 2rem; max-width: 300px; line-height: 1.5;" data-lang="back_to_browser_text">
                Нажмите кнопку ниже, чтобы вернуться в браузер и завершить вход.
            </p>
            <button data-lang="back_to_browser" id="redirect-to-browser-btn" style="
                background: #007bff; color: white; border: none;
                padding: 12px 24px; border-radius: 8px; cursor: pointer;
                font-size: 16px; font-family: 'ManropeBold', sans-serif;
                transition: background-color 0.2s, transform 0.2s;
            ">Вернуться в браузер</button>
        `;

            body.appendChild(overlay);

            document.getElementById('redirect-to-browser-btn').addEventListener('click', () => {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.openLink(redirectUrl);
                    window.Telegram.WebApp.close();
                } else {
                    window.location.href = redirectUrl;
                }
            });
        }
    }
    const burger = document.getElementById('burger-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const nav = document.getElementById('main-nav');

    if (burger && mobileMenu && nav) {
        let backdrop = document.getElementById('mobile-menu-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'mobile-menu-backdrop';
            document.body.appendChild(backdrop);
        }

        const crossSVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>`;
        const burgerSVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`;

        let isMenuAnimating = false;
        function openMenu() {
            mobileMenu.classList.add('active', 'slide-down');
            mobileMenu.classList.remove('mobile-menu-hidden', 'slide-up');
            backdrop.style.display = 'block';
            backdrop.classList.add('active');
            requestAnimationFrame(() => backdrop.classList.add('show'));
            mobileMenu.innerHTML = nav.innerHTML;
            burger.innerHTML = crossSVG;
            burger.classList.add('open');
        }

        function closeMenu() {
            mobileMenu.classList.remove('active', 'slide-down');
            mobileMenu.classList.add('slide-up');
            isMenuAnimating = true;
            setTimeout(() => {
                mobileMenu.classList.add('mobile-menu-hidden');
                mobileMenu.classList.remove('slide-up');
                isMenuAnimating = false;
                backdrop.classList.remove('active');
            }, 300);
            backdrop.style.display = 'none';
            backdrop.classList.remove('show');
            burger.innerHTML = burgerSVG;
            burger.classList.remove('open');
        }

        burger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isMenuAnimating) return;

            if (mobileMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        backdrop.addEventListener('click', closeMenu);
        document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('active') && !mobileMenu.contains(e.target) && e.target !== burger) {
                closeMenu();
            }
        });
    }

    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || tg?.initDataUnsafe;


    if (initData && Object.keys(initData).length > 0) {
        const params = new URLSearchParams(initData);
        const userJson = params.get('user');
        const initDataUserer = JSON.parse(userJson);


        const profileContainer = document.querySelector('.profile.hd');
        if (profileContainer) {
            setupProfileButton(profileContainer, initDataUserer);
        }
        fetch('/api/telegram_webapp_auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initData })
        }).catch(err => console.error("Silent auth ping failed:", err));
    } else {
        fetch('/api/me')
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                return Promise.reject('Not authenticated');
            })
            .then(data => {
                if (data.user && data.user.id) {
                    const profileContainer = document.querySelector('.profile.hd');
                    if (profileContainer) {
                        setupProfileButton(profileContainer, data.user);
                    }
                }
            })
            .catch(error => {
                // console.log('Header auth check failed:', error);
            });
    }

    const navLinks = document.querySelectorAll("#main-nav a");
    const currentPath = window.location.pathname.replace(/\/$/, '');

    navLinks.forEach(link => {
        let linkPath = link.getAttribute('href');
        if (!linkPath) return;

        linkPath = linkPath.replace(/\/$/, '').replace(/\.html$/, '');

        if (linkPath === currentPath) {
            link.style.color = 'rgb(43, 216, 43)';
        }
    });

});