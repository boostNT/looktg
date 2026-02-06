const CHANNEL_TAG = 'lookgifts';
const LS_HELPER_TAG = 'bxxst';
const BOT_TAG = 'look_tg_bot';


function showCopyNotificationHa() {
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


document.addEventListener('DOMContentLoaded', () => {
  const channelLink = document.getElementById('channel-link');
  const lsLink = document.getElementById('ls-link');
  const botLink = document.getElementById('bot-link');


  channelLink.href = `https://t.me/${CHANNEL_TAG}`;
  lsLink.href = `https://t.me/${LS_HELPER_TAG}`;
  botLink.href = `https://t.me/${BOT_TAG}`;




  const deployElements = document.querySelectorAll('.deploy');

  deployElements.forEach(deployElement => {
    const header = deployElement.querySelector('.deploy-header');
    if (header) {
      header.addEventListener('click', () => {
        deployElement.classList.toggle('open');
        const content = deployElement.querySelector('.deploy-content');
        const arrow = header.querySelector('svg');

        if (deployElement.classList.contains('open')) {
          content.style.maxHeight = content.scrollHeight + "px";
          if (arrow) arrow.style.transform = 'rotate(180deg)';
        } else {
          content.style.maxHeight = null;
          if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
      });
    }
  });
});



const walletContainer = document.querySelector('.wallet-address-container');
walletContainer.addEventListener('click', async (e) => {
  e.preventDefault();
  const walletAddress = document.getElementById('wallet-address').textContent;
  try {
    await navigator.clipboard.writeText(walletAddress);
    window.getSelection().removeAllRanges();
    showCopyNotificationHa();
  } catch (err) {
    console.error('Ошибка при копировании:', err);
  }
});


