// donation-buttons-complete.js

// Create and append styles
const style = document.createElement('style');
style.textContent = `
    .support-buttons {
        position: fixed;
        bottom: 80px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 999;
    }

    .support-button {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        position: relative;
        overflow: hidden;
    }

    .support-button::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }

    .support-button:hover::before {
        transform: translateX(0);
    }

    .support-button:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    .coffee-button {
        background: #2B1B7E;
        color: white;
        animation: slideIn 0.5s ease-out;
        animation-fill-mode: backwards;
        animation-delay: 0.2s;
    }

    .donation-button {
        background: #27AE60;
        color: white;
        animation: slideIn 0.5s ease-out;
        animation-fill-mode: backwards;
        animation-delay: 0.4s;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .support-button .tooltip {
        position: absolute;
        right: 60px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .support-button:hover .tooltip {
        opacity: 1;
        visibility: visible;
    }

    .support-modal .modal-content {
        border: none;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .support-modal .modal-header {
        border-bottom: none;
        padding: 20px 25px;
    }

    .support-modal .modal-body {
        padding: 20px 25px 30px;
    }

    .support-modal .qr-code-container,
    .support-modal .bank-info {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .support-modal .qr-code-container:hover,
    .support-modal .bank-info:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .bank-btn, .qr-btn {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        margin-bottom: 8px;
        transition: all 0.3s ease;
    }

    .bank-btn:hover, .qr-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .bank-btn img, .qr-btn img {
        width: 30px;
        height: 30px;
        object-fit: contain;
        margin-right: 10px;
    }

    .copy-account, .copy-promptpay {
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .copy-account:hover, .copy-promptpay:hover {
        color: #0d6efd;
    }

    @media (max-width: 768px) {
        .support-buttons.hide {
            transform: translateX(100px);
            opacity: 0;
        }
    }

    .store-badge {
        height: 40px;
        margin: 5px;
        transition: transform 0.2s ease;
    }

    .store-badge:hover {
        transform: scale(1.05);
    }

    .app-stores {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 15px;
    }

    .download-prompt {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
        text-align: center;
    }
`;
document.head.appendChild(style);

// Create and append buttons
const buttonsContainer = document.createElement('div');
buttonsContainer.className = 'support-buttons';
buttonsContainer.innerHTML = `
    <button class="support-button coffee-button" title="สนับสนุนค่ากาแฟ">
        <i class="bi bi-cup-hot"></i>
        <span class="tooltip">สนับสนุนค่ากาแฟ</span>
    </button>
    <button class="support-button donation-button" title="บริจาคให้โรงเรียน">
        <i class="bi bi-heart-fill"></i>
        <span class="tooltip">บริจาคให้โรงเรียน</span>
    </button>
`;
document.body.appendChild(buttonsContainer);

// Payment app configurations
const paymentApps = {
    promptpay: {
        truemoney: {
            name: 'True Money Wallet',
            scheme: 'tmw://pay/merchant/',
            playStore: 'https://play.google.com/store/apps/details?id=com.tdcm.truemoneywallet',
            appStore: 'https://apps.apple.com/th/app/truemoney-wallet/id851837846',
            icon: 'truemoney.png'
        },
        linepay: {
            name: 'LINE Pay',
            scheme: 'line://pay/payment',
            playStore: 'https://play.google.com/store/apps/details?id=com.linecorp.linepay.android',
            appStore: 'https://apps.apple.com/th/app/line-pay/id1449817412',
            icon: 'linepay.png'
        },
        shopeepay: {
            name: 'ShopeePay',
            scheme: 'shopeeth://home',
            playStore: 'https://play.google.com/store/apps/details?id=com.shopee.th',
            appStore: 'https://apps.apple.com/th/app/shopee/id959841453',
            icon: 'shopeepay.png'
        }
    },
    banks: {
        ktb: {
            name: 'กรุงไทย',
            scheme: 'krungthai://x-callback-url/payment',
            playStore: 'https://play.google.com/store/apps/details?id=com.ktb.next',
            appStore: 'https://apps.apple.com/th/app/krungthai-next/id1455621162',
            icon: 'ktb.png'
        },
        kbank: {
            name: 'กสิกรไทย',
            scheme: 'kplus://payment',
            playStore: 'https://play.google.com/store/apps/details?id=com.kasikornbank.kplus',
            appStore: 'https://apps.apple.com/th/app/k-plus/id361170631',
            icon: 'kbank.png'
        },
        scb: {
            name: 'ไทยพาณิชย์',
            scheme: 'scbeasy://payment',
            playStore: 'https://play.google.com/store/apps/details?id=com.scb.phone',
            appStore: 'https://apps.apple.com/th/app/scb-easy/id369729869',
            icon: 'scb.png'
        },
        bbl: {
            name: 'กรุงเทพ',
            scheme: 'bbl://payment',
            playStore: 'https://play.google.com/store/apps/details?id=com.bbl.mobilebanking',
            appStore: 'https://apps.apple.com/th/app/bangkok-bank-mobile-banking/id554166020',
            icon: 'bbl.png'
        },
        bay: {
            name: 'กรุงศรี',
            scheme: 'krungsri://payment',
            playStore: 'https://play.google.com/store/apps/details?id=com.krungsri.kma',
            appStore: 'https://apps.apple.com/th/app/krungsri-mobile-app/id426843410',
            icon: 'bay.png'
        }
    }
};

// Helper function to create modals
function createModal({ title, content, footer = '' }) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">${content}</div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modalElement);
    const modal = new bootstrap.Modal(modalElement);
    modalElement.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modalElement);
    });

    return { modal, element: modalElement };
}

// Function to show error toast
function showError(message) {
    const toast = createToast(message, 'danger');
    toast.show();
}

// Function to create toast
function createToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-50 start-50 translate-middle';
    toastContainer.style.zIndex = '9999';
    
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastElement);
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastElement, {
        delay: 2000
    });
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
    
    return toast;
}

// Function to handle app opening
async function openApp(scheme, playStore, appStore) {
    try {
        // Try to open the app
        window.location.href = scheme;
        
        // Set timeout to show store links if app doesn't open
        setTimeout(() => {
            const { modal } = createModal({
                title: 'ไม่พบแอพที่ต้องการ',
                content: `
                    <div class="download-prompt">
                        <p>กรุณาติดตั้งแอพก่อนใช้งาน</p>
                        <div class="app-stores">
                            <a href="${playStore}" target="_blank">
                                <img src="https://play.google.com/intl/en_us/badges/images/generic/th_badge_web_generic.png" 
                                     alt="Get it on Google Play" 
                                     class="store-badge">
                            </a>
                            <a href="${appStore}" target="_blank">
                                <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/th-th"
                                     alt="Download on the App Store"
                                     class="store-badge">
                            </a>
                        </div>
                    </div>
                `
            });
            modal.show();
        }, 2500);
    } catch (error) {
        console.error('Error opening app:', error);
        showError('ไม่สามารถเปิดแอพได้ กรุณาลองใหม่อีกครั้ง');
    }
}

// Function to open banking apps
function openBankingApp() {
    const { modal, element } = createModal({
        title: 'เลือกแอพธนาคารที่ต้องการ',
        content: `
            <div class="d-grid gap-2">
                ${Object.entries(paymentApps.banks).map(([key, bank]) => `
                    <button class="btn btn-outline-primary bank-btn" data-bank="${key}">
                        <img src="https://raw.githubusercontent.com/infobwd/STUDENT-CARE/main/${bank.icon}" 
                             alt="${bank.name}">
                        ${bank.name}
                    </button>
                `).join('')}
            </div>
        `,
        footer: '<small class="text-muted">หมายเหตุ: ต้องติดตั้งแอพธนาคารที่ต้องการในเครื่องก่อน</small>'
    });

    element.querySelectorAll('.bank-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const bank = paymentApps.banks[btn.dataset.bank];
            openApp(bank.scheme, bank.playStore, bank.appStore);
            setTimeout(() => modal.hide(), 500);
        });
    });

    modal.show();
}

// Function to open prompt pay apps
function openPromptPay() {
    const { modal, element } = createModal({
        title: 'เลือกวิธีการชำระเงิน',
        content: `
            <div class="qr-options d-grid gap-2">
${Object.entries(paymentApps.promptpay).map(([key, app]) => `
                    <button class="btn btn-outline-primary qr-btn" data-app="${key}">
                        <img src="https://raw.githubusercontent.com/infobwd/STUDENT-CARE/main/${app.icon}" 
                             alt="${app.name}">
                        ${app.name}
                    </button>
                `).join('')}
                <hr>
                <div class="text-center">
                    <button class="btn btn-outline-primary" onclick="window.open('https://promptpay.io/0836645989.png', '_blank')">
                        <i class="bi bi-qr-code me-2"></i>
                        แสดง QR Code แบบเต็ม
                    </button>
                </div>
            </div>
        `,
        footer: '<small class="text-muted">หมายเหตุ: ต้องติดตั้งแอพที่ต้องการในเครื่องก่อน</small>'
    });

    element.querySelectorAll('.qr-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const app = paymentApps.promptpay[btn.dataset.app];
            openApp(app.scheme, app.playStore, app.appStore);
            setTimeout(() => modal.hide(), 500);
        });
    });

    modal.show();
}

// Create and initialize modals
const donationModal = createModal({
    title: '<i class="bi bi-heart-fill text-danger me-2"></i>บริจาคให้โรงเรียน',
    content: `
        <div class="bank-info">
            <h6 class="mb-3">
                <i class="bi bi-bank me-2"></i>
                ข้อมูลการโอนเงิน 
                <span class="badge bg-info ms-2">
                    <i class="bi bi-receipt me-1"></i>
                    ลดหย่อนภาษีได้ 2 เท่า
                </span>
            </h6>
            <p class="mb-2">
                <i class="bi bi-building me-2"></i>
                ธนาคารกรุงไทย
            </p>
            <p class="mb-2 copy-account" onclick="openBankingApp()">
                <i class="bi bi-credit-card me-2"></i>
                เลขที่บัญชี: 743-042-2462
                <small class="text-primary ms-2">(คลิกเพื่อเปิดแอพธนาคาร)</small>
            </p>
            <p class="mb-0">
                <i class="bi bi-person me-2"></i>
                ชื่อบัญชี: เงินรายได้สถานศึกษา โรงเรียนบ้านวังด้ง
            </p>
        </div>
        <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle me-2"></i>
            เงินบริจาคทั้งหมดจะนำไปพัฒนาการศึกษาของนักเรียน
        </div>
    `
});

const coffeeModal = createModal({
    title: '<i class="bi bi-cup-hot me-2"></i>สนับสนุนค่ากาแฟ',
    content: `
        <div class="qr-code-container">
            <h6 class="mb-3">สแกน QR Code หรือคลิกที่เบอร์พร้อมเพย์</h6>
            <img src="https://promptpay.io/0836645989.png" alt="QR Code" class="img-fluid mb-3"
                 style="max-width: 200px; display: block; margin: 0 auto;">
            <div class="d-flex align-items-center justify-content-center mb-2">
                <i class="bi bi-phone me-2"></i>
                <span class="copy-promptpay" onclick="openPromptPay()">
                    พร้อมเพย์: 083-664-5989
                    <small class="text-primary ms-2">(คลิกเพื่อเปิดแอพชำระเงิน)</small>
                </span>
            </div>
            <p class="text-muted small mb-2 text-center">สนับสนุนเท่าไหร่ก็ได้ตามกำลังและความเต็มใจ</p>
            <p class="text-muted small mt-2 text-center">
                <i class="bi bi-heart-fill text-danger me-1"></i>
                ขอบคุณสำหรับกำลังใจที่มอบให้ผู้พัฒนา
            </p>
        </div>
    `
});

// Add click handlers to buttons
document.querySelector('.coffee-button').addEventListener('click', () => {
    coffeeModal.modal.show();
});

document.querySelector('.donation-button').addEventListener('click', () => {
    donationModal.modal.show();
});

// Handle mobile scroll behavior
let lastScroll = 0;
const buttonsContainerElement = document.querySelector('.support-buttons');

function handleScroll() {
    if (window.innerWidth <= 768) {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll) {
            buttonsContainerElement.classList.add('hide');
        } else {
            buttonsContainerElement.classList.remove('hide');
        }
        lastScroll = currentScroll;
    }
}

// Throttle scroll event
let ticking = false;
document.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// Copy to clipboard functionality
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text).then(() => {
        createToast('คัดลอกแล้ว').show();
    }).catch(err => {
        console.error('Failed to copy:', err);
        showError('ไม่สามารถคัดลอกได้');
    });
}

// Add copy functionality to account numbers
document.addEventListener('DOMContentLoaded', () => {
    const copyableElements = document.querySelectorAll('.copy-account:not([onclick]), .copy-promptpay:not([onclick])');
    copyableElements.forEach(element => {
        element.addEventListener('click', () => {
            const text = element.textContent.split(':')[1]?.trim() || element.textContent;
            copyToClipboard(text);
        });
    });
});

// Export functions for external use
window.openBankingApp = openBankingApp;
window.openPromptPay = openPromptPay;
window.copyToClipboard = copyToClipboard;