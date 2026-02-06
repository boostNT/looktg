const TARGET_TON_WALLET = ''; 
import { translations } from './translations.js';

function normalToNano(normalValue, roundDown = false) {
    const nanoDecimal = parseFloat(normalValue) * 1e9;
    const finalNano = roundDown ? Math.floor(nanoDecimal) : Math.ceil(nanoDecimal);

    return finalNano.toString();
}


function startCountdown(duration, display) {
    let timer = duration, minutes, seconds;
    const intervalId = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(intervalId);
            document.getElementById('payment-container').innerHTML = `
                <h3 class="reg-font size-5">Время вышло</h3>
                <p class="light-font">Сессия оплаты истекла. Пожалуйста, вернитесь в профиль и попробуйте снова.</p>
                <a href="/profile" class="state-btn" style="text-decoration: none; display: inline-block; margin-top: 1rem;">Вернуться в профиль</a>
            `;
        }
    }, 1000);
    return intervalId;
}


function waitForPayment(amount, uid, mainCountdownIntervalId, viaTonkeeper) {
    let isChecking = false;

    const paymentCheckInterval = setInterval(async () => {
        if (document.getElementById('countdown-timer') === null) {
            clearInterval(paymentCheckInterval);
            return;
        }

        if (isChecking) {
            return;
        }


        try {
            isChecking = true;
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    via_tonkeeper: viaTonkeeper,
                    amount: parseFloat(amount),
                    currency: 'TON',
                    text: uid.toString()
                })
            });

            if (!response.ok) {
                console.error(`Payment check failed with status: ${response.status}`);
            } else {
                const data = await response.json();
                if (data.success === true) {
                    console.log('Payment successful!');
                    clearInterval(paymentCheckInterval);
                    clearInterval(mainCountdownIntervalId);

                    const paymentContainer = document.getElementById('payment-container');
                    paymentContainer.innerHTML = `
                        <h3 class="reg-font size-5" data-lang="payment_successfull">✅ Оплата прошла успешно!</h3>
                        <p class="light-font" data-lang='redirect_text'>Вы будете автоматически перенаправлены в профиль через 5 секунд...</p>
                    `;

                    setTimeout(() => {
                        window.location.href = '/profile';
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('Error during payment check:', error);
        } finally {
            isChecking = false;
        }
    }, 5000);

    return paymentCheckInterval;
}


document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const amount = urlParams.get('amount');
    const uid = urlParams.get('text');
    const viaTonkeeper = urlParams.get('via_tonkeeper') === 'true' ? true : false;

    const paymentDetailsContainer = document.getElementById('payment-details');
    const countdownTimerElement = document.getElementById('countdown-timer');
    const paymentText = document.getElementById('payment-text');
    const paymentCommentText = document.getElementById('payment-comment-text');
    const uidText = document.querySelector('.uid-text');

    const manualWalletAddressContainer = document.getElementById('manual-wallet-address-container');
    const uidDisplayContainer = document.getElementById('uid-display-container');

    if (amount && uid && paymentDetailsContainer && countdownTimerElement) {
        const paymentUrl = `https://app.tonkeeper.com/transfer/${TARGET_TON_WALLET}?amount=${normalToNano(amount)}&text=${uid}`;
        const payButton = document.createElement('button');
        payButton.id = 'pay-tonkeeper-btn';
        payButton.className = 'state-btn';

        const backButton = document.createElement('button');
        backButton.href = '/profile';
        backButton.className = 'state-btn';
        backButton.style.textDecoration = 'none';
        backButton.style.backgroundColor = '#b72323';
        backButton.setAttribute('data-lang', 'back');

        backButton.onclick = () => {
            window.location.href = '/profile';
        };

        if (viaTonkeeper === true) {
            if (manualWalletAddressContainer) {
                manualWalletAddressContainer.remove();
            } else {
            }
            if (uidDisplayContainer) {
                uidDisplayContainer.remove();
            } else {
            }
            paymentText.setAttribute('data-lang', 'click_for_payment_tonkeeper');
            paymentText.innerText = `${paymentText.textContent} (${amount} TON)`;
            payButton.setAttribute('data-lang', 'pay');
            payButton.onclick = () => {
                window.open(paymentUrl, '_blank');
            };
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.gap = '0.5rem';
            buttonsContainer.append(payButton, backButton);
            paymentDetailsContainer.appendChild(buttonsContainer);
        } else if (viaTonkeeper === false) {
            paymentDetailsContainer.innerHTML = '';
            const lang = localStorage.getItem('language') || 'ru';
            const translationString = translations[lang]['transfer_ton_to_address'] || 'Переведите {{amount}} TON на адрес';
            paymentText.textContent = translationString.replace('{{amount}}', amount);

            paymentCommentText.setAttribute('data-lang', 'leave_comment');
            uidText.textContent = uid;
            paymentDetailsContainer.appendChild(backButton);
        }



        const twentyMinutes = 60 * 10;
        const countdownIntervalId = startCountdown(twentyMinutes, countdownTimerElement);
        waitForPayment(amount, uid, countdownIntervalId, viaTonkeeper);
    } else {
        console.log('Debug: Отсутствуют необходимые параметры URL или элементы DOM.');
        document.getElementById('payment-container').innerHTML = `
            <h3 class="reg-font size-5">Ошибка</h3>
            <p class="light-font">Не удалось получить данные для оплаты. Пожалуйста, вернитесь в профиль и попробуйте снова.</p>
            <a href="/profile" class="state-btn" style="text-decoration: none; display: inline-block; margin-top: 1rem;">Вернуться в профиль</a>
        `;
    }
});
function showCopyNotification() {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="checkmark">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    <span data-lang="copied">Скопировано</span>
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

const walletContainers = document.querySelectorAll('.wallet-address-container');
walletContainers.forEach(container => {
    container.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            await navigator.clipboard.writeText(textToCopy);
            window.getSelection().removeAllRanges();
            showCopyNotification();
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    });
});


