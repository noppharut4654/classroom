// donation-buttons-simplified.js

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
        animation-delay: 0.4s;
    }

    .donation-button {
        background: #27AE60;
        color: white;
        animation: slideIn 0.5s ease-out;
        animation-fill-mode: backwards;
        animation-delay: 0.2s;
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

    .copy-text {
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .copy-text:hover {
        background-color: #f0f0f0;
    }

    .copy-text i.copy-icon {
        font-size: 1.2em;
        color: #6c757d;
    }

    .copy-text:hover i.copy-icon {
        color: #0d6efd;
    }

    @media (max-width: 768px) {
        .support-buttons.hide {
            transform: translateX(100px);
            opacity: 0;
        }
    }

    .success-animation {
        animation: successPulse 0.5s ease-in-out;
    }

    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Create and append buttons
const buttonsContainer = document.createElement('div');
buttonsContainer.className = 'support-buttons';
buttonsContainer.innerHTML = `
    <button class="support-button donation-button" title="บริจาคให้โรงเรียน">
        <i class="bi bi-heart-fill"></i>
        <span class="tooltip">บริจาคให้โรงเรียน</span>
    </button>
    <button class="support-button coffee-button" title="สนับสนุนค่ากาแฟ">
        <i class="bi bi-cup-hot"></i>
        <span class="tooltip">สนับสนุนค่ากาแฟ</span>
    </button>
`;
document.body.appendChild(buttonsContainer);

// Function to create modal
function createModal({ title, content }) {
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

// Create donation modal
const donationModal = createModal({
    title: '<i class="bi bi-heart-fill text-danger me-2"></i>บริจาคให้โรงเรียน',
    content: `
        <div class="bank-info p-3 bg-light rounded">
            <h6 class="mb-3">
                <i class="bi bi-bank me-2"></i>
                ข้อมูลการโอนเงิน 
                <span class="badge bg-info ms-2">
                    <i class="bi bi-receipt me-1"></i>
                    ลดหย่อนภาษีได้ 2 เท่า
                </span>
            </h6>
            <div class="copy-text" onclick="copyToClipboard('743-042-2462', 'เลขบัญชี', event)">
                <i class="bi bi-credit-card"></i>
                <div class="flex-grow-1">
                    <div>เลขบัญชี: <strong>743-042-2462</strong></div>
                    <div class="text-muted small">ธนาคารกรุงไทย</div>
                </div>
                <i class="bi bi-copy copy-icon"></i>
            </div>
            <div class="copy-text mt-2" onclick="copyToClipboard('เงินรายได้สถานศึกษา โรงเรียนบ้านวังด้ง', 'ชื่อบัญชี', event)">
                <i class="bi bi-person"></i>
                <div class="flex-grow-1">ชื่อบัญชี: <strong>เงินรายได้สถานศึกษา โรงเรียนบ้านวังด้ง</strong></div>
                <i class="bi bi-copy copy-icon"></i>
            </div>
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
        <div class="qr-code-container text-center">
            <img src="https://promptpay.io/0836645989.png" alt="QR Code" class="img-fluid mb-3" 
                 style="max-width: 200px;">
            <div class="copy-text mt-3" onclick="copyToClipboard('0836645989', 'เบอร์พร้อมเพย์', event)">
                <i class="bi bi-phone"></i>
                <div class="flex-grow-1">พร้อมเพย์: <strong>083-664-5989</strong></div>
                <i class="bi bi-copy copy-icon"></i>
            </div>
            <p class="text-muted small mt-3">
                <i class="bi bi-heart-fill text-danger me-1"></i>
                ขอบคุณสำหรับกำลังใจที่มอบให้ผู้พัฒนา
            </p>
        </div>
    `
});

// Function to copy text
function copyToClipboard(text, label, event) {
    navigator.clipboard.writeText(text).then(() => {
        // Create success feedback element
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'position-fixed top-50 start-50 translate-middle badge bg-success py-2 px-3';
        feedbackEl.style.zIndex = '9999';
        feedbackEl.innerHTML = `
            <i class="bi bi-check2 me-1"></i>
            คัดลอก${label}แล้ว
        `;
        document.body.appendChild(feedbackEl);
        
        // Remove feedback after animation
        setTimeout(() => {
            feedbackEl.style.transition = 'opacity 0.3s ease';
            feedbackEl.style.opacity = '0';
            setTimeout(() => document.body.removeChild(feedbackEl), 300);
        }, 1000);

        // Add animation to clicked element if available
        if (event && event.currentTarget) {
            const element = event.currentTarget;
            element.classList.add('success-animation');
            setTimeout(() => element.classList.remove('success-animation'), 500);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Show error feedback
        const errorEl = document.createElement('div');
        errorEl.className = 'position-fixed top-50 start-50 translate-middle badge bg-danger py-2 px-3';
        errorEl.style.zIndex = '9999';
        errorEl.innerHTML = `
            <i class="bi bi-exclamation-triangle me-1"></i>
            ไม่สามารถคัดลอกข้อความได้
        `;
        document.body.appendChild(errorEl);
        setTimeout(() => document.body.removeChild(errorEl), 2000);
    });
}

// Add click handlers to buttons
document.querySelector('.donation-button').addEventListener('click', () => {
    donationModal.modal.show();
});

document.querySelector('.coffee-button').addEventListener('click', () => {
    coffeeModal.modal.show();
});

// Handle mobile scroll
let lastScroll = 0;
const buttonsContainerElement = document.querySelector('.support-buttons');

function handleScroll() {
    if (window.innerWidth <= 768) {
        const currentScroll = window.pageYOffset;
        buttonsContainerElement.classList.toggle('hide', currentScroll > lastScroll);
        lastScroll = currentScroll;
    }
}

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

// Export function for external use
window.copyToClipboard = copyToClipboard;