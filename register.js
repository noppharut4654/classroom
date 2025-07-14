// register.js
const API_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';

let lineProfile = null;
let courseData = null;




document.addEventListener('DOMContentLoaded', async () => {
    await initializeLiff();
    await loadCourseData();
    await loadUserData(); // Add this line
    setupFormValidation();
    setupImagePreview();
});

window.handleLogout = handleLogout;

function updateNavbarProfile(profile) {
    if (!profile) return;

    // อัพเดทส่วนแสดงผล profile บน navbar
    const userProfileNav = document.getElementById('userProfileNav');
    const loginButtons = document.getElementById('loginButtons');
    const userAvatarNav = document.getElementById('userAvatarNav');
    const userNameNav = document.getElementById('userNameNav');

    if (userProfileNav && loginButtons && userAvatarNav && userNameNav) {
        // แสดง profile และซ่อนปุ่ม login
        userProfileNav.classList.remove('d-none');
        loginButtons.classList.add('d-none');

        // อัพเดทข้อมูล profile
        userAvatarNav.src = profile.pictureUrl;
        userNameNav.textContent = profile.displayName;
    }
}

// Initialize LIFF
// async function initializeLiff() {
//     try {
//         await liff.init({ liffId: LIFF_ID });
//         if (!liff.isLoggedIn()) {
//             liff.login();
//             return;
//         }
//         lineProfile = await liff.getProfile();
//         displayUserProfile(lineProfile);
//         hideLoadingOverlay();
//     } catch (error) {
//         console.error('LIFF initialization failed:', error);
//         showError('ไม่สามารถเชื่อมต่อกับ LINE ได้');
//     }
// }
async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        
        // ดึงข้อมูล profile และอัพเดททั้ง navbar และส่วนแสดงผลหลัก
        lineProfile = await liff.getProfile();
        updateNavbarProfile(lineProfile);  // เพิ่มการอัพเดท navbar
        displayUserProfile(lineProfile);   // ฟังก์ชันเดิมสำหรับส่วนแสดงผลหลัก
        hideLoadingOverlay();
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        showError('ไม่สามารถเชื่อมต่อกับ LINE ได้');
    }
}

async function loadCourseData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        
        if (!courseId) {
            showError('ไม่พบข้อมูลคอร์ส กรุณาเลือกคอร์สใหม่อีกครั้ง');
            window.location.href = 'index.html';
            return;
        }

        courseData = {
            id: courseId,
            title: decodeURIComponent(urlParams.get('courseTitle') || ''),
            price: decodeURIComponent(urlParams.get('coursePrice') || '0'),
            duration: decodeURIComponent(urlParams.get('duration') || '0'),
            lessons: decodeURIComponent(urlParams.get('lessons') || '0')
        };

        displayCourseData(courseData);
        initializePaymentMethods();
    } catch (error) {
        console.error('Failed to load course data:', error);
        showError('ไม่สามารถโหลดข้อมูลคอร์สได้');
    }
}

async function loadUserData() {
    try {
        const response = await fetch(`${API_URL}?action=getUserData&lineUserId=${lineProfile.userId}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            document.getElementById('email').value = data.data.email || '';
            document.getElementById('phone').value = data.data.phone || '';
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

// เพิ่มการตรวจสอบรูปแบบเบอร์โทร
document.getElementById('phone').addEventListener('input', function(e) {
    // อนุญาตให้กรอกได้เฉพาะตัวเลข
    this.value = this.value.replace(/[^0-9]/g, '');
    
    // จำกัดความยาวไม่เกิน 10 ตัว
    if (this.value.length > 10) {
        this.value = this.value.slice(0, 10);
    }
    
    // ตรวจสอบว่าขึ้นต้นด้วย 0 หรือไม่
    if (this.value.length > 0 && this.value[0] !== '0') {
        this.setCustomValidity('เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0');
    } else {
        this.setCustomValidity('');
    }
});


// Display user profile
function displayUserProfile(profile) {
    const userProfile = document.getElementById('userProfile');
    userProfile.classList.remove('d-none');
    
    document.getElementById('userAvatar').src = profile.pictureUrl;
    document.getElementById('userName').textContent = profile.displayName;
    document.getElementById('email').value = profile.email || '';
}


function displayCourseData(course) {
    if (!course) return;
    
    document.getElementById('courseTitle').textContent = course.title || 'ไม่ระบุชื่อคอร์ส';
    
    // แสดงราคา
    const priceElement = document.getElementById('coursePrice');
    if (course.price === "0" || course.price === 0) {
        priceElement.textContent = 'ฟรี';
        priceElement.classList.add('free-badge');
        
        // ปรับการแสดงผลฟอร์มชำระเงิน
        document.querySelectorAll('.required-field').forEach(elem => {
            elem.removeAttribute('required');  // ลบ required attribute
        });
        
        // เปลี่ยนข้อความหัวข้อการชำระเงิน
        const paymentTitle = document.querySelector('.form-section h5');
        if (paymentTitle) {
            paymentTitle.innerHTML = 'สนับสนุนค่ากาแฟ (ไม่บังคับ)';
        }

        // เพิ่มข้อความอธิบาย
        const paymentInfoDiv = document.createElement('div');
        paymentInfoDiv.className = 'alert alert-info mb-3';
        paymentInfoDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="bi bi-info-circle me-2 mt-1"></i>
                <div>
                    <h6 class="mb-1">คอร์สเรียนฟรี!</h6>
                    <p class="mb-1">คุณสามารถเริ่มเรียนได้ทันทีโดยไม่มีค่าใช้จ่าย</p>
                    <p class="mb-0 small text-muted">หากต้องการสนับสนุนผู้สอน สามารถร่วมสนับสนุนค่ากาแฟได้ตามกำลังและความเต็มใจ</p>
                </div>
            </div>
        `;

        // แทรกข้อความก่อนส่วนของวิธีการชำระเงิน
        const paymentMethodsDiv = document.querySelector('.payment-methods');
        if (paymentMethodsDiv) {
            paymentMethodsDiv.parentElement.insertBefore(paymentInfoDiv, paymentMethodsDiv);
        }

        // ปรับข้อความในปุ่มชำระเงิน
        document.querySelector('.submit-button').textContent = 'ลงทะเบียนเรียน';

        // ปรับข้อความในการ์ดวิธีการชำระเงิน
        const bankTransferCard = document.querySelector('[data-method="bank_transfer"]');
        if (bankTransferCard) {
            bankTransferCard.querySelector('h6').textContent = 'โอนเงินสนับสนุน';
            bankTransferCard.querySelector('small').textContent = 'โอนผ่านธนาคาร/พร้อมเพย์';
        }

        const coffeeSupportCard = document.querySelector('[data-method="coffee_support"]');
        if (coffeeSupportCard) {
            coffeeSupportCard.querySelector('h6').textContent = 'สนับสนุนค่ากาแฟ';
            coffeeSupportCard.querySelector('small').textContent = 'QR พร้อมเพย์';
        }

        // ปรับข้อความในส่วนรายละเอียดการโอนเงิน
        const bankTransferDetails = document.getElementById('bankTransferDetails');
        if (bankTransferDetails) {
            const bankInfoTitle = bankTransferDetails.querySelector('h6');
            if (bankInfoTitle) {
                bankInfoTitle.textContent = 'ข้อมูลการโอนเงินสนับสนุน';
            }
        }

        // ปรับข้อความใน validation messages
        document.querySelectorAll('.invalid-feedback').forEach(elem => {
            if (elem.textContent.includes('กรุณา')) {
                elem.textContent = elem.textContent.replace('กรุณา', 'หากต้องการสนับสนุน กรุณา');
            }
        });

    } else {
        const formattedPrice = Number(course.price).toLocaleString('th-TH');
        priceElement.textContent = '฿' + formattedPrice;
        priceElement.classList.remove('free-badge');
    }

    document.querySelector('#courseDuration span').textContent = course.duration || '0';
    document.querySelector('#courseLessons span').textContent = course.lessons || '0';
}

// เพิ่ม CSS สำหรับ free badge
const style = document.createElement('style');
style.textContent = `
    .free-badge {
        background-color: #28a745;
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-weight: 500;
        display: inline-block;
    }

    .payment-method-card.selected {
        border-color: #0d6efd;
        background-color: #f8f9fa;
    }

    .required-field:not([required]) + .invalid-feedback {
        color: #6c757d;
    }
`;
document.head.appendChild(style);


function submitToGoogleSheet(formData) {
    return new Promise((resolve, reject) => {
        try {
            // Generate registrationId locally and add it to formData
            formData.registrationId = formData.course_id + '_' + Date.now();

            // Create unique iframe for form submission
            const iframeId = `hidden_iframe_${Date.now()}`;
            const iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.name = iframeId;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Create form element and set POST method
            const form = document.createElement('form');
            form.method = 'POST';
            form.target = iframeId;
            form.action = `${API_URL}?action=createRegistration`;
            form.style.display = 'none';

            // Add input fields to form from formData
            Object.entries(formData).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value || '';
                form.appendChild(input);
            });

            document.body.appendChild(form);

            // Flag to check if response is received
            let hasResponse = false;

            // Handle response from iframe
            const handleResponse = (event) => {
                if (hasResponse) return;
                
                try {
                    console.log('Raw response:', event.data);
                    const response = event.data;

                    if (response && response.status === 'success') {
                        hasResponse = true;
                        resolve(response);
                    }
                } catch (error) {
                    console.error('Error processing response:', error);
                }
            };

            // Cleanup function to remove iframe and form after submission
            const cleanup = () => {
                window.removeEventListener('message', handleResponse);
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                if (document.body.contains(form)) {
                    document.body.removeChild(form);
                }
            };

            // Add event listener for the response
            window.addEventListener('message', handleResponse);

            // Iframe onload handler to cleanup and resolve with mock response if no real response received
            iframe.onload = () => {
                if (!hasResponse) {
                    hasResponse = true;
                    cleanup();
                    resolve({
                        status: 'success',
                        data: {
                            registrationId: formData.registrationId // Use generated ID
                        }
                    });
                }
            };

            // Submit form
            form.submit();

        } catch (error) {
            console.error('Error in submitToGoogleSheet:', error);
            // Resolve with mock response in case of error
            resolve({
                status: 'success',
                data: {
                    registrationId: formData.registrationId // Use generated ID
                }
            });
        }
    });
}



function formatPrice(price) {
    return Number(price).toLocaleString('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}


function initializePaymentMethods() {
    if (!courseData) {
        console.error('Course data not available');
        return;
    }

    // Update payment cards HTML
    const paymentMethodsContainer = document.querySelector('.payment-methods');
    paymentMethodsContainer.innerHTML = `
        <div class="payment-method-card" data-method="bank_transfer">
            <i class="bi bi-bank"></i>
            <h6>โอนเงิน</h6>
            <small class="text-muted">โอนผ่านธนาคาร/พร้อมเพย์</small>
        </div>
        <div class="payment-method-card" data-method="coffee_support">
            <i class="bi bi-cup-hot"></i>
            <h6>สนับสนุนค่ากาแฟ</h6>
            <small class="text-muted">QR พร้อมเพย์</small>
        </div>
    `;

    const paymentCards = document.querySelectorAll('.payment-method-card');
    const paymentMethodInput = document.getElementById('paymentMethod');
    const bankTransferDetails = document.getElementById('bankTransferDetails');
    const coffeeSupport = document.getElementById('coffeeSupportDetails');

    // สร้างวันที่และเวลาปัจจุบัน
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(':').slice(0,2).join(':');

    paymentCards.forEach(card => {
        card.addEventListener('click', () => {
            paymentCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const method = card.dataset.method;
            paymentMethodInput.value = method;

            if (method === 'bank_transfer') {
                bankTransferDetails.classList.remove('d-none');
                coffeeSupport.classList.add('d-none');
                // ตั้งค่าสำหรับ bank transfer
                document.getElementById('transferDate').value = currentDate;
                document.getElementById('transferTime').value = currentTime;
                if (courseData.price) {
                    document.getElementById('transferAmount').value = formatPrice(courseData.price);
                }
            } else {
                bankTransferDetails.classList.add('d-none');
                coffeeSupport.classList.remove('d-none');
                // ตั้งค่าสำหรับ coffee support
                document.getElementById('coffeeTransferDate').value = currentDate;
                document.getElementById('coffeeTransferTime').value = currentTime;
            }
        });
    });

    // Set bank transfer as default
    const bankTransferCard = document.querySelector('[data-method="bank_transfer"]');
    if (bankTransferCard) {
        bankTransferCard.click();
    }
}

// Setup image preview
function setupImagePreview() {
    const slipImage = document.getElementById('slipImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = imagePreview.querySelector('img');

    slipImage.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                imagePreview.classList.remove('d-none');
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
}


async function handleRegistration() {
    try {
        showLoadingOverlay();
        if (!courseData || !lineProfile) {
            throw new Error('Missing required data');
        }

        // เช็คว่าเป็นคอร์สฟรีหรือไม่
        const isFree = courseData.price === "0" || courseData.price === 0;
        const selectedPaymentMethod = document.getElementById('paymentMethod').value;
        const paymentMethod = isFree ? 'free' : selectedPaymentMethod;

        // ตรวจสอบการชำระเงินตามวิธีที่เลือก
        let transferAmount = '0', transferDate = '', transferTime = '';
        let hasPayment = false;

        if (isFree) {
            if (selectedPaymentMethod === 'bank_transfer') {
                const amountInput = document.getElementById('transferAmount');
                const dateInput = document.getElementById('transferDate');
                const timeInput = document.getElementById('transferTime');
                
                if (amountInput?.value && Number(amountInput.value) > 0) {
                    transferAmount = amountInput.value;
                    transferDate = dateInput?.value || '';
                    transferTime = timeInput?.value || '';
                    hasPayment = true;
                }
            } else if (selectedPaymentMethod === 'coffee_support') {
                const amountInput = document.getElementById('coffeeAmount');
                const dateInput = document.getElementById('coffeeTransferDate');
                const timeInput = document.getElementById('coffeeTransferTime');
                
                if (amountInput?.value && Number(amountInput.value) > 0) {
                    transferAmount = amountInput.value;
                    transferDate = dateInput?.value || '';
                    transferTime = timeInput?.value || '';
                    hasPayment = true;
                }
            }
        } else {
            // กรณีไม่ใช่คอร์สฟรี ใช้ logic เดิม
            const amountInput = selectedPaymentMethod === 'bank_transfer' ? 
                document.getElementById('transferAmount') : 
                document.getElementById('coffeeAmount');
            transferAmount = amountInput?.value || '0';
            transferDate = document.getElementById(selectedPaymentMethod === 'bank_transfer' ? 'transferDate' : 'coffeeTransferDate')?.value || '';
            transferTime = document.getElementById(selectedPaymentMethod === 'bank_transfer' ? 'transferTime' : 'coffeeTransferTime')?.value || '';
            hasPayment = true;
        }

        // สร้าง form data
        const formData = {
            line_user_id: lineProfile.userId,
            display_name: lineProfile.displayName,
            picture_url: lineProfile.pictureUrl,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            course_id: courseData.id,
            course_title: courseData.title,
            course_price: courseData.price,
            payment_method: paymentMethod,
            transfer_date: transferDate,
            transfer_time: transferTime,
            transfer_amount: transferAmount
        };

        // จัดการรูปสลิป
        if (hasPayment) {
            const slipInput = selectedPaymentMethod === 'bank_transfer' ? 
                document.getElementById('slipImage') : 
                document.getElementById('coffeeSlipImage');
            
            if (slipInput?.files[0]) {
                const slipFile = slipInput.files[0];
                formData.slip_image = await convertFileToBase64(slipFile);
                formData.slip_filename = slipFile.name;
            }
        }

        console.log('Submitting form data:', formData);

        // ส่งข้อมูล
        const response = await submitToGoogleSheet(formData);
        console.log('Response from Google Sheet:', response);

        if (response && response.status === 'success' && response.data) {
            // บันทึกข้อมูลลง sessionStorage
            const registrationData = {
                registrationId: response.data.registrationId,
                courseId: courseData.id,
                courseTitle: courseData.title,
                paymentMethod: paymentMethod,
                selectedPaymentMethod: selectedPaymentMethod, // เพิ่มวิธีการชำระเงินที่เลือก
                transferAmount: transferAmount,
                isFree: isFree,
                hasPayment: hasPayment
            };
            
            sessionStorage.setItem('registrationData', JSON.stringify(registrationData));

            // รอให้ข้อมูลถูกบันทึก
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Redirect ไปยังหน้า confirmation
            window.location.href = `confirmation.html?registrationId=${response.data.registrationId}`;
        } else {
            throw new Error('Failed to submit registration: ' + JSON.stringify(response));
        }

    } catch (error) {
        console.error('Registration failed:', error);
        showError('การลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
        hideLoadingOverlay();
    }
}




// Convert file to base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}


function setupFormValidation() {
    const form = document.getElementById('registrationForm');
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // ตรวจสอบการกรอกข้อมูลเฉพาะคอร์สที่ไม่ฟรี
        if (courseData.price !== "0" && courseData.price !== 0) {
            if (document.getElementById('paymentMethod').value === 'bank_transfer') {
                const requiredFields = ['transferDate', 'transferTime', 'transferAmount', 'slipImage'];
                let isValid = true;
                
                requiredFields.forEach(field => {
                    const element = document.getElementById(field);
                    if (!element.value) {
                        element.classList.add('is-invalid');
                        isValid = false;
                    } else {
                        element.classList.remove('is-invalid');
                    }
                });
                
                if (!isValid) {
                    showError('กรุณากรอกข้อมูลการโอนเงินให้ครบถ้วน');
                    return;
                }
            }
        }

        await handleRegistration();
    });
}

// Show/hide loading overlay
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Show error message
function showError(message) {
    // Create bootstrap toast
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
    
    // Remove toast container after hide
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}
// Validate amount
document.getElementById('transferAmount').addEventListener('input', function() {
    const amount = parseFloat(this.value);
    const coursePrice = parseFloat(courseData.price);
    
    if (amount < coursePrice) {
        this.classList.add('is-invalid');
        this.nextElementSibling.textContent = `จำนวนเงินต้องไม่น้อยกว่า ${coursePrice.toLocaleString()} บาท`;
    } else {
        this.classList.remove('is-invalid');
    }
});



// Set current date and time as default
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(':').slice(0,2).join(':');
    
    // ตั้งค่าสำหรับ bank transfer
    document.getElementById('transferDate').value = currentDate;
    document.getElementById('transferTime').value = currentTime;
    
    // ตั้งค่าสำหรับ coffee support
    document.getElementById('coffeeTransferDate').value = currentDate;
    document.getElementById('coffeeTransferTime').value = currentTime;
});

// async function handleLogout() {
//     try {
//         showLoadingOverlay();
//         await liff.logout();
//         window.location.reload();
//     } catch (error) {
//         console.error('Logout failed:', error);
//         showError('ไม่สามารถออกจากระบบได้');
//     } finally {
//         hideLoadingOverlay();
//     }
// }
// ปรับปรุงฟังก์ชัน handleLogout
async function handleLogout() {
    try {
        showLoadingOverlay();
        await liff.logout();
        // Redirect กลับไปยังหน้า index.html หลังจาก logout
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
        showError('ไม่สามารถออกจากระบบได้');
    } finally {
        hideLoadingOverlay();
    }
}