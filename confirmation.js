// Global variables
let lineProfile = null;

// Loading functions
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Initialize LIFF
async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        lineProfile = await liff.getProfile();
        displayUserProfile(lineProfile);
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        showError('ไม่สามารถเชื่อมต่อกับ LINE ได้');
    }
}

// Display user profile
function displayUserProfile(profile) {
    const userProfile = document.getElementById('userProfileNav');
    const loginButtons = document.getElementById('loginButtons');
    
    if (profile) {
        userProfile.classList.remove('d-none');
        loginButtons.classList.add('d-none');
        document.getElementById('userAvatarNav').src = profile.pictureUrl;
        document.getElementById('userNameNav').textContent = profile.displayName;
    } else {
        userProfile.classList.add('d-none');
        loginButtons.classList.remove('d-none');
    }
}

// Error handling
function showError(message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';
    
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.innerHTML = `
        <div class="toast-header bg-danger text-white">
            <strong class="me-auto">แจ้งเตือน</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toastElement);
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}

// Load confirmation data
async function loadConfirmationData() {
    try {
        // ดึง registrationId จาก URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const registrationId = urlParams.get('registrationId');

        if (!registrationId) {
            showError('ไม่พบข้อมูลการลงทะเบียน');
            return;
        }

        // ดึงข้อมูลจาก sessionStorage
        const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));
        
        if (!registrationData) {
            showError('ไม่พบข้อมูลการลงทะเบียน');
            return;
        }

        // แสดงข้อมูลการลงทะเบียน
        displayRegistrationDetails(registrationId, registrationData);

        // แสดงข้อมูลการชำระเงิน
        displayPaymentDetails(registrationData);

        // แสดงสถานะและขั้นตอนต่อไป
        displayStatusAndNextSteps(registrationData);

        // ตั้งค่าปุ่มดำเนินการ
        setupActionButtons(registrationData);

    } catch (error) {
        console.error('Error loading confirmation data:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}


// Display registration details
function displayRegistrationDetails(registrationId, data) {
    document.getElementById('registrationId').textContent = registrationId;
    document.getElementById('courseTitle').textContent = data.courseTitle;
    document.getElementById('registrationDate').textContent = 
        new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
}

// Display payment details
function displayPaymentDetails(data) {
    const paymentInfo = document.getElementById('paymentInfo');
    
    if (data.paymentMethod === 'free') {
        paymentInfo.innerHTML = `
            <div class="payment-status free">
                <i class="bi bi-check-circle-fill me-2"></i>
                คอร์สเรียนฟรี ไม่มีค่าใช้จ่าย
                ${data.transferAmount > 0 ? `
                    <div class="mt-2">
                        <small class="text-success">
                            <i class="bi bi-heart-fill me-1"></i>
                            ขอบคุณที่ร่วมสนับสนุนค่ากาแฟ จำนวน ${Number(data.transferAmount).toLocaleString()} บาท
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        paymentInfo.innerHTML = `
            <div class="payment-status pending">
                <i class="bi bi-clock-fill me-2"></i>
                รอตรวจสอบการชำระเงิน
            </div>
            <div class="payment-details">
                <p><strong>วิธีการชำระเงิน:</strong> ${data.paymentMethod === 'bank_transfer' ? 'โอนเงิน' : 'สนับสนุนค่ากาแฟ'}</p>
                <p><strong>จำนวนเงิน:</strong> ${Number(data.transferAmount).toLocaleString()} บาท</p>
            </div>
        `;
    }
}

// Display status and next steps
function displayStatusAndNextSteps(data) {
    const statusInfo = document.getElementById('statusInfo');
    const nextSteps = document.getElementById('nextSteps');

    if (data.paymentMethod === 'free') {
        statusInfo.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle-fill me-2"></i>
                พร้อมเริ่มเรียนได้ทันที
            </div>
        `;
        nextSteps.innerHTML = `
            <ul class="next-steps">
                <li><i class="bi bi-play-circle"></i> คลิกปุ่ม "เริ่มเรียน" เพื่อเข้าสู่บทเรียน</li>
                <li><i class="bi bi-bookmark"></i> ศึกษาเนื้อหาบทเรียนตามลำดับ</li>
                <li><i class="bi bi-chat"></i> สามารถร่วมพูดคุยในห้องสนทนาได้</li>
            </ul>
        `;
    } else {
        statusInfo.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-clock-fill me-2"></i>
                รอการตรวจสอบการชำระเงิน
            </div>
        `;
        nextSteps.innerHTML = `
            <ul class="next-steps">
                <li><i class="bi bi-envelope"></i> เราจะส่งอีเมลแจ้งเตือนเมื่อตรวจสอบการชำระเงินเรียบร้อย</li>
                <li><i class="bi bi-clock"></i> ใช้เวลาตรวจสอบไม่เกิน 24 ชั่วโมง</li>
                <li><i class="bi bi-exclamation-circle"></i> หากมีข้อสงสัยสามารถติดต่อเราได้ที่ปุ่ม "ติดต่อผู้ดูแล"</li>
            </ul>
        `;
    }
}

// Setup action buttons
function setupActionButtons(data) {
    const goToCourseBtn = document.getElementById('goToCourse');
    
    if (data.paymentMethod === 'free') {
        goToCourseBtn.onclick = () => {
            window.location.href = `learn.html?enrollmentId=${data.registrationId}`;
        };
    } else {
        goToCourseBtn.classList.add('disabled');
        goToCourseBtn.innerHTML = '<i class="bi bi-clock me-2"></i>รอการตรวจสอบ';
    }
}

// Logout handler
async function handleLogout() {
    try {
        showLoadingOverlay();
        await liff.logout();
        window.location.reload();
    } catch (error) {
        console.error('Logout failed:', error);
        showError('ไม่สามารถออกจากระบบได้');
    } finally {
        hideLoadingOverlay();
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initializePage();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
});

async function initializePage() {
    showLoadingOverlay();
    try {
        await initializeLiff();
        await loadConfirmationData();
    } finally {
        hideLoadingOverlay();
    }
}