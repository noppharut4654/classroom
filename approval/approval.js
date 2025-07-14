// approval.js
const LIFF_ID = '2006490627-jqPEBboK';
// เปลี่ยนเป็น URL ของ Google Apps Script Web App ของคุณ
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';
let registrationData = null; // เพิ่มตัวแปร global
let isAdmin = false;
let lineUserId = null;


async function initializeLIFF() {
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        const profile = await liff.getProfile();
        lineUserId = profile.userId; // เก็บ lineUserId
        console.log('LINE Profile:', profile); // Debug log
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        throw new Error('LIFF initialization failed');
    }
}



function getGoogleDriveDirectLink(url) {
    // ดึง file ID จาก URL
    const match = url.match(/\/d\/(.*?)\/view/);
    if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
}


async function loadEnrollmentData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const registrationId = urlParams.get('registrationId');

        if (!registrationId || !lineUserId) {
            throw new Error('ข้อมูลไม่ครบถ้วน');
        }

        console.log('Loading data with:', { registrationId, lineUserId }); // Debug log

        const callbackName = 'jsonpCallback' + Date.now();
        const response = await new Promise((resolve, reject) => {
            window[callbackName] = function(response) {
                try {
                    if (response.status === 'success') {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || 'Failed to fetch data'));
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    document.body.removeChild(script);
                    delete window[callbackName];
                }
            };

            const script = document.createElement('script');
            script.src = `${GAS_URL}?action=getEnrollmentDetail&registrationId=${registrationId}&lineUserId=${lineUserId}&callback=${callbackName}`;
            script.onerror = () => {
                reject(new Error('Failed to load data'));
                document.body.removeChild(script);
                delete window[callbackName];
            };
            document.body.appendChild(script);
        });

        registrationData = response.data;
        isAdmin = response.data.isAdmin;

        updateUI(registrationData);

        // อัพเดทปุ่มตามสิทธิ์และสถานะ
        const approveBtn = document.getElementById('approveBtn');
        if (!isAdmin) {
            approveBtn.style.display = 'none';
        } else if (registrationData.status === 'approved') {
            disableApproveButton();
        }

    } catch (error) {
        console.error('Error loading data:', error);
        showError('ไม่สามารถโหลดข้อมูลได้: ' + error.message);
    }
}

function updateUI(data) {
    // ข้อมูลผู้ใช้
    document.getElementById('userName').textContent = data.userName || 'ไม่ระบุชื่อ';
    document.getElementById('profileImg').src = data.userPicture || 'https://raw.githubusercontent.com/infobwd/STUDENT-CARE/refs/heads/main/user-page.gif';

    // ข้อมูลการลงทะเบียน
    document.getElementById('registrationDetails').innerHTML = `
        <div class="details-row">
            <span class="details-label">
                <i class="bi bi-hash"></i>
                รหัสการลงทะเบียน
            </span>
            <span class="details-value">${data.enrollment_id || data.course_id}</span>
        </div>
        <div class="details-row">
            <span class="details-label">
                <i class="bi bi-book"></i>
                คอร์ส
            </span>
            <span class="details-value">${data.course_name || 'ไม่ระบุ'}</span>
        </div>
        <div class="details-row">
            <span class="details-label">
                <i class="bi bi-calendar-event"></i>
                วันที่ลงทะเบียน
            </span>
            <span class="details-value">${formatDate(data.enrolled_date)}</span>
        </div>
        <div class="details-row">
            <span class="details-label">
                <i class="bi bi-tag"></i>
                สถานะ
            </span>
            <span class="status-badge ${data.status}">
                <i class="bi ${data.status === 'approved' ? 'bi-check-circle' : 'bi-clock'}"></i>
                ${getStatusText(data.status)}
            </span>
        </div>
    `;

    // ข้อมูลการชำระเงิน
    document.getElementById('paymentDetails').innerHTML = `
        <div class="details-row">
            <span class="details-label">
                <i class="bi bi-wallet2"></i>
                วิธีการชำระเงิน
            </span>
            <span class="details-value">${getPaymentMethodText(data.payment_method)}</span>
        </div>
        <div class="details-row">
            <span class="details-label">
                <i class="bi bi-cash"></i>
                จำนวนเงิน
            </span>
            <span class="details-value">${formatAmount(data.amount)} บาท</span>
        </div>
        <div class="details-row">
            <span class="details-label">
                <i class="bi bi-clock-history"></i>
                สถานะการชำระเงิน
            </span>
            <span class="status-badge ${data.payment_status}">
                <i class="bi ${data.payment_status === 'completed' ? 'bi-check-circle' : 'bi-clock'}"></i>
                ${getPaymentStatusText(data.payment_status)}
            </span>
        </div>
    `;

    // จัดการรูปสลิป
    const slipPreview = document.getElementById('slipPreview');
    if (data.slip_file_url) {
        const directLink = getGoogleDriveDirectLink(data.slip_file_url);
        document.getElementById('slipImage').src = directLink;
        slipPreview.style.display = 'block';
    } else {
        slipPreview.style.display = 'none';
    }
}

// เพิ่มฟังก์ชันแปลงข้อความ
function getPaymentMethodText(method) {
    const methodMap = {
        'bank_transfer': 'โอนเงินผ่านธนาคาร',
        'promptpay': 'พร้อมเพย์',
        'credit_card': 'บัตรเครดิต',
        'free': 'ไม่มีค่าใช้จ่าย'
    };
    return methodMap[method] || method;
}

function getPaymentStatusText(status) {
    const statusMap = {
        'pending': 'รอตรวจสอบ',
        'completed': 'ชำระเงินแล้ว',
        'failed': 'การชำระเงินล้มเหลว',
        'free': 'ไม่มีค่าใช้จ่าย'
    };
    return statusMap[status] || status;
}


async function approveRegistration() {
    if (!registrationData || !lineUserId) {
        showError('ไม่สามารถอนุมัติได้: ไม่พบข้อมูลผู้ใช้');
        return;
    }

    if (!confirm('คุณต้องการอนุมัติการลงทะเบียนนี้ใช่หรือไม่?')) {
        return;
    }

    showLoading();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const registrationId = urlParams.get('registrationId');
        
        if (!lineUserId) {
            // Re-initialize LIFF เพื่อให้แน่ใจว่า lineUserId ถูกกำหนดค่า
            await initializeLIFF();
            if (!lineUserId) {
                throw new Error('ไม่สามารถระบุตัวตนผู้ใช้ได้');
            }
        }

        console.log('Approving with:', { registrationId, lineUserId }); // Debug log

        const callbackName = 'approveCallback' + Date.now();
        const result = await new Promise((resolve, reject) => {
            window[callbackName] = function(response) {
                try {
                    if (response.status === 'success') {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || 'Approval failed'));
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    document.body.removeChild(script);
                    delete window[callbackName];
                }
            };

            const script = document.createElement('script');
            script.src = `${GAS_URL}?action=approveRegistration&registrationId=${registrationId}&lineUserId=${lineUserId}&callback=${callbackName}`;
            script.onerror = () => {
                reject(new Error('Failed to approve'));
                document.body.removeChild(script);
                delete window[callbackName];
            };
            document.body.appendChild(script);
        });

        showToast('อนุมัติการลงทะเบียนเรียบร้อยแล้ว', 'success');
        disableApproveButton();
        await loadEnrollmentData(); // โหลดข้อมูลใหม่

    } catch (error) {
        console.error('Error approving:', error);
        showError('เกิดข้อผิดพลาดในการอนุมัติ: ' + error.message);
    } finally {
        hideLoading();
    }
}


// Utility functions
function formatDate(dateStr) {
    if (!dateStr) return 'ไม่ระบุ';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatAmount(amount) {
    if (!amount) return '0';
    return Number(amount).toLocaleString();
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'รอการอนุมัติ',
        'approved': 'อนุมัติแล้ว',
        'rejected': 'ปฏิเสธแล้ว'
    };
    return statusMap[status] || status;
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function disableApproveButton() {
    const approveBtn = document.getElementById('approveBtn');
    approveBtn.disabled = true;
    approveBtn.textContent = 'อนุมัติแล้ว';
}


function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <i class="toast-icon bi bi-${type === 'success' ? 'check-circle' : 'x-circle'}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
            if (toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
            }
        }, 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Update error handling
function showError(message) {
    console.error('Error:', message);
    showToast(message, 'error');
}


// เพิ่มฟังก์ชัน shareFlexMessage
async function shareFlexMessage() {
    if (!registrationData) {
        showError('ไม่พบข้อมูลสำหรับแชร์');
        return;
    }

    try {
        const message = {
            type: "flex",
            altText: "รายละเอียดการลงทะเบียน",
            contents: {
                type: "bubble",
                header: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: "รายละเอียดการลงทะเบียน",
                            weight: "bold",
                            size: "xl",
                            color: "#ffffff"
                        }
                    ],
                    backgroundColor: "#2196F3"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    contents: [
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "ผู้ลงทะเบียน",
                                    size: "sm",
                                    color: "#666666"
                                },
                                {
                                    type: "text",
                                    text: registrationData.userName || 'ไม่ระบุชื่อ',
                                    size: "md",
                                    weight: "bold"
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "คอร์ส",
                                    size: "sm",
                                    color: "#666666"
                                },
                                {
                                    type: "text",
                                    text: registrationData.course_name || 'ไม่ระบุคอร์ส',
                                    size: "md",
                                    weight: "bold"
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "จำนวนเงิน",
                                    size: "sm",
                                    color: "#666666"
                                },
                                {
                                    type: "text",
                                    text: `${formatAmount(registrationData.amount)} บาท`,
                                    size: "md",
                                    weight: "bold"
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "สถานะ",
                                    size: "sm",
                                    color: "#666666"
                                },
                                {
                                    type: "text",
                                    text: getStatusText(registrationData.status),
                                    size: "md",
                                    weight: "bold",
                                    color: registrationData.status === 'approved' ? '#4CAF50' : '#FFC107'
                                }
                            ]
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: formatDate(registrationData.enrolled_date),
                            size: "xs",
                            color: "#666666",
                            align: "center"
                        }
                    ]
                },
                styles: {
                    header: {
                        backgroundColor: "#2196F3"
                    }
                }
            }
        };

        if (!liff.isInClient()) {
            await liff.shareTargetPicker([message]);
        } else {
            await liff.sendMessages([message]);
        }
        showToast('แชร์ข้อมูลสำเร็จ');
    } catch (error) {
        console.error('Share error:', error);
        showError('ไม่สามารถแชร์ข้อมูลได้: ' + error.message);
    }
}

function viewSlipFullscreen() {
    const modal = document.getElementById('slipModal');
    const modalImg = document.getElementById('slipModalImage');
    const slipImg = document.getElementById('slipImage');
    
    if (slipImg && slipImg.src) {
        modalImg.src = slipImg.src;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeSlipModal() {
    const modal = document.getElementById('slipModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// เพิ่มฟังก์ชัน initializePage
async function initializePage() {
    showLoading();
    try {
        // เริ่มต้นด้วยการ initialize LIFF
        await initializeLIFF();
        
        // หลังจากได้ lineUserId แล้วค่อยโหลดข้อมูล
        if (lineUserId) {
            await loadEnrollmentData();
        } else {
            throw new Error('ไม่สามารถระบุตัวตนผู้ใช้ได้');
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
    } finally {
        hideLoading();
    }
}

// อัพเดทการ initialize เมื่อ DOM พร้อม
document.addEventListener('DOMContentLoaded', initializePage);

// ฟังก์ชันแสดง/ซ่อน loading
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// ฟังก์ชันแสดง error
function showError(message) {
    console.error('Error:', message);
    showToast(message, 'error');
}

// เพิ่มฟังก์ชัน disableApproveButton ถ้ายังไม่มี
function disableApproveButton() {
    const approveBtn = document.getElementById('approveBtn');
    if (approveBtn) {
        approveBtn.disabled = true;
        approveBtn.textContent = 'อนุมัติแล้ว';
        approveBtn.classList.add('disabled');
    }
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('slipModal');
    window.onclick = function(event) {
        if (event.target === modal) {
            closeSlipModal();
        }
    };

    // Add escape key support
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeSlipModal();
        }
    });
});
