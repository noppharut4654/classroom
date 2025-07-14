// index.js
const API_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';

// API Service
class CourseAPI {
    // Ensure fetchAPI is a static method
    static async fetchAPI(action, params = {}) {
        const queryString = new URLSearchParams({ action, ...params }).toString();
        try {
            const response = await fetch(`${API_URL}?${queryString}`);
            return response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async getAllCourses() {
        return this.fetchAPI('getAllCourses');
    }

    static async getPopularCourses() {
        return this.fetchAPI('getPopularCourses');
    }

    static async getNewCourses() {
        return this.fetchAPI('getNewCourses');
    }

    static async searchCourses(params) {
        return this.fetchAPI('searchCourses', params);
    }

    static async getFilterOptions() {
        return this.fetchAPI('filterCourses');
    }

    static async getEnrollmentStats(courseId) {
        return this.fetchAPI('getEnrollmentStats', { courseId });
    }
}





// LIFF Helpers
async function ensureLoggedIn() {
    if (!liff.isLoggedIn()) {
        await liff.login();
    }
    return liff.getProfile();
}

function updateNavbarProfile(profile) {
    if (!profile) return;

    const userProfileNav = document.getElementById('userProfileNav');
    const loginButtons = document.getElementById('loginButtons');
    const userAvatarNav = document.getElementById('userAvatarNav');
    const userNameNav = document.getElementById('userNameNav');

    if (userProfileNav && loginButtons && userAvatarNav && userNameNav) {
        userProfileNav.classList.remove('d-none');
        loginButtons.classList.add('d-none');
        userAvatarNav.src = profile.pictureUrl;
        userNameNav.textContent = profile.displayName;
    }
}


async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        
        // ตรวจสอบว่าเปิดจาก LINE หรือไม่
        const isInClientLine = liff.isInClient();
        
        // ถ้าเปิดจาก LINE หรือล็อกอินอยู่แล้ว ให้ดึงข้อมูลโปรไฟล์
        if (isInClientLine || liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            updateNavbarProfile(profile);
            sessionStorage.setItem('lineProfile', JSON.stringify(profile));
        }
        // ถ้าเปิดจาก LINE แต่ยังไม่ได้ล็อกอิน ให้ล็อกอินอัตโนมัติ
        else if (isInClientLine && !liff.isLoggedIn()) {
            await liff.login();
        }
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        showToast('ไม่สามารถเชื่อมต่อกับ LINE ได้', 'danger');
    }
}

// Handlers
async function handleLogin() {
    try {
        const profile = await ensureLoggedIn();
        updateNavbarProfile(profile);
    } catch (error) {
        console.error('Login failed:', error);
        showToast('ไม่สามารถเข้าสู่ระบบได้', 'danger');
    }
}


async function handleLogout() {
    try {
        await liff.logout();
        document.getElementById('userProfileNav').classList.add('d-none');
        document.getElementById('loginButtons').classList.remove('d-none');
        // ถ้าเปิดจาก LINE ให้ปิดหน้าต่าง LIFF
        if (liff.isInClient()) {
            liff.closeWindow();
        } else {
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout failed:', error);
        showToast('ไม่สามารถออกจากระบบได้', 'danger');
    }
}

function setupSearchEffects() {
    const searchSection = document.querySelector('.search-section');
    const searchInputs = document.querySelectorAll('.search-input');

    searchInputs.forEach(input => {
        input.addEventListener('focus', () => {
            searchSection.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (!document.activeElement.classList.contains('search-input')) {
                searchSection.classList.remove('focused');
            }
        });
    });

    const searchInput = document.querySelector('#search-input');
    searchInput.addEventListener('input', debounce((e) => {
        if (e.target.value.length >= 2) {
            document.querySelector('#search-form').dispatchEvent(new Event('submit'));
        }
    }, 500));

    const filterInputs = document.querySelectorAll('#category-filter, #level-filter, #min-price, #max-price');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            document.querySelector('#search-form').dispatchEvent(new Event('submit'));
        });
    });
}

// Utility: debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Starting LIFF initialization...');
        showLoadingSpinner();
        await initializeLiff();
        console.log('LIFF initialized');
        
        // โหลดข้อมูลคอร์สพร้อมกัน
        await Promise.all([
            loadPopularCourses(),
            loadNewCourses(),
            initializeFilters()
        ]);
        
        setupSearchEffects();
    } catch (error) {
        console.error('Error initializing page:', error);
        showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    } finally {
        hideLoadingSpinner();
        loadFooter();
    }
});

// Course Loading
async function loadCourses(containerSelector, fetchFunction, emptyMessage) {
    try {
        const container = document.querySelector(containerSelector);
        const response = await fetchFunction();

        if (response.status === 'success' && response.data?.length > 0) {
            container.innerHTML = response.data.map(createCourseCard).join('');
        } else {
            container.innerHTML = `<div class="col-12">${emptyMessage}</div>`;
        }
    } catch (error) {
        console.error(`Error loading courses for ${containerSelector}:`, error);
        document.querySelector(containerSelector).innerHTML = 
            `<div class="col-12">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>`;
    }
}

async function loadPopularCourses() {
    await loadCourses(
        '#popular-courses', 
        () => CourseAPI.getPopularCourses(),
        'ไม่พบข้อมูลคอร์สยอดนิยม'
    );
}

async function loadNewCourses() {
    await loadCourses(
        '#new-courses', 
        () => CourseAPI.getNewCourses(),
        'ไม่พบข้อมูลคอร์สใหม่'
    );
}

async function initializeFilters() {
    try {
        const response = await CourseAPI.getFilterOptions();
        if (response.status === 'success') {
            populateFilterOptions(response.data);
        }
    } catch (error) {
        console.error('Error initializing filters:', error);
    }
}

// Helpers
function renderBadge(condition, label, className) {
    return condition ? `<span class="badge ${className}">${label}</span>` : '';
}

function truncateText(text, maxLength = 100) {
    return text?.length > maxLength ? text.substring(0, maxLength) + '...' : text || 'ไม่มีคำอธิบาย';
}


// function createCourseCard(course) {
//     // คำนวณส่วนลด
//     const hasDiscount = course.original_price > course.price;
//     const discountPercent = hasDiscount ? 
//         calculateDiscount(course.original_price, course.price) : 0;

//     // จัดการข้อมูลรีวิว
//     const rating = parseFloat(course.rating || 0);
//     const formattedRating = rating.toFixed(1);
//     const fullStars = Math.floor(rating);
//     const hasHalfStar = rating % 1 >= 0.5;

//     // จัดการข้อมูลอาจารย์
//     const instructors = course.instructors || [];
//     const primaryInstructor = instructors.find(ins => ins.is_primary) || instructors[0] || {
//         display_name: 'อาจารย์',
//         profile_image: '/api/placeholder/24/24'
//     };

//     // นับจำนวนบทเรียน
//     const curriculum = course.curriculum || [];
//     const totalLessons = curriculum.length;

//     // สร้าง rating stars
//     let starsHtml = '';
//     for (let i = 0; i < 5; i++) {
//         if (i < fullStars) {
//             starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
//         } else if (i === fullStars && hasHalfStar) {
//             starsHtml += '<i class="bi bi-star-half text-warning"></i>';
//         } else {
//             starsHtml += '<i class="bi bi-star text-warning"></i>';
//         }
//     }

//     return `
//         <div class="col-12 col-md-6 col-lg-4 mb-4">
//             <div class="card course-card h-100">
//                 <div class="position-relative">
//                     <img src="${course.thumbnail_url || '/api/placeholder/400/200'}" 
//                          class="card-img-top course-image" 
//                          alt="${course.title_th}">
//                     <div class="position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
//                         ${course.is_popular ? 
//                             `<span class="badge bg-danger">ยอดนิยม</span>` : ''}
//                         ${course.is_new ? 
//                             `<span class="badge bg-success">ใหม่</span>` : ''}
//                         ${hasDiscount ? 
//                             `<span class="badge bg-warning text-dark">ลด ${discountPercent}%</span>` : ''}
//                     </div>
//                 </div>
//                 <div class="card-body d-flex flex-column">
//                     <!-- Instructor Info -->
//                     <div class="d-flex align-items-center mb-2">
//                         <div class="instructor-avatar rounded-circle overflow-hidden me-2">
//                             <img src="${primaryInstructor.profile_image}" 
//                                  class="w-100 h-100 object-fit-cover" 
//                                  alt="${primaryInstructor.display_name}"
//                                  onerror="this.src='/api/placeholder/24/24'">
//                         </div>
//                         <div>
//                             <small class="text-muted">${primaryInstructor.display_name}</small>
//                             ${instructors.length > 1 ? 
//                                 `<small class="text-muted ms-1">และอีก ${instructors.length - 1} ท่าน</small>` : 
//                                 ''}
//                         </div>
//                     </div>

//                     <h5 class="card-title line-clamp-2">${course.title_th}</h5>
//                     <p class="card-text line-clamp-3">${course.short_description || 'ไม่มีคำอธิบาย'}</p>

//                     <!-- Stats Row -->
//                     <div class="stats-row d-flex align-items-center flex-wrap gap-3 mb-3">
//                         <div class="d-flex align-items-center">
//                             <i class="bi bi-people-fill me-1 text-muted"></i>
//                             <small>${(course.student_count || 0).toLocaleString()} ผู้เรียน</small>
//                         </div>
//                         <div class="d-flex align-items-center">
//                             <i class="bi bi-book me-1 text-muted"></i>
//                             <small>${totalLessons} บทเรียน</small>
//                         </div>
//                         <div class="d-flex align-items-center">
//                             <i class="bi bi-clock-fill me-1 text-muted"></i>
//                             <small>${course.duration_hours || 0} ชั่วโมง</small>
//                         </div>
//                     </div>

//                     <!-- Price and Rating Section -->
//                     <div class="mt-auto">
//                         <div class="d-flex justify-content-between align-items-baseline mb-2">
//                             <div class="price-block">
//                                 ${hasDiscount ? `
//                                     <small class="text-decoration-line-through text-muted d-block">
//                                         ${formatPrice(course.original_price)}
//                                     </small>
//                                 ` : ''}
//                                 <span class="current-price fw-bold ${course.price > 0 ? 'text-danger' : 'text-success'}">
//                                     ${course.price > 0 ? formatPrice(course.price) : 'ฟรี'}
//                                 </span>
//                             </div>
//                             <div class="review-section text-end">
//                                 <div class="stars">
//                                     ${starsHtml}
//                                 </div>
//                                 <small class="text-muted">
//                                     ${formattedRating} (${course.review_count || 0} รีวิว)
//                                 </small>
//                             </div>
//                         </div>

//                         <a href="detail.html?id=${course.course_id}" 
//                            class="btn btn-primary w-100">
//                             ดูรายละเอียด
//                         </a>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;
// }
function createCourseCard(course) {
    // คำนวณส่วนลด
    const hasDiscount = course.original_price > course.price;
    const discountPercent = hasDiscount ? 
        calculateDiscount(course.original_price, course.price) : 0;

    // จัดการข้อมูลรีวิว
    const rating = parseFloat(course.rating || 0);
    const formattedRating = rating.toFixed(1);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // จัดการข้อมูลอาจารย์
    const primaryInstructor = course.instructors?.find(ins => ins.is_primary) || course.instructors?.[0];
    const instructorName = primaryInstructor?.name_th || 'อาจารย์';
    const instructorAvatar = primaryInstructor?.avatar_url || 'https://raw.githubusercontent.com/infobwd/STUDENT-CARE/refs/heads/main/user.png';
    const otherInstructors = course.instructors?.length > 1 
        ? `และอีก ${course.instructors.length - 1} ท่าน` 
        : '';

    // สร้าง rating stars
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<i class="bi bi-star-half text-warning"></i>';
        } else {
            starsHtml += '<i class="bi bi-star text-warning"></i>';
        }
    }

    return `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
            <div class="card course-card h-100">
                <div class="position-relative">
                    <img src="${course.thumbnail_url || '/api/placeholder/400/200'}" 
                         class="card-img-top course-image" 
                         alt="${course.title_th}">
                    <div class="position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
                        ${course.is_popular ? 
                            `<span class="badge bg-danger">ยอดนิยม</span>` : ''}
                        ${course.is_new ? 
                            `<span class="badge bg-success">ใหม่</span>` : ''}
                        ${hasDiscount ? 
                            `<span class="badge bg-warning text-dark">ลด ${discountPercent}%</span>` : ''}
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <!-- Instructor Info -->
                    <div class="d-flex align-items-center mb-2">
                        <div class="instructor-avatar rounded-circle overflow-hidden me-2">
                            <img src="${instructorAvatar}" 
                                 class="w-100 h-100 object-fit-cover" 
                                 alt="${instructorName}"
                                 onerror="this.src='/api/placeholder/24/24'">
                        </div>
                        <div>
                            <small class="text-muted">${instructorName}</small>
                            ${otherInstructors ? `<small class="text-muted ms-1">${otherInstructors}</small>` : ''}
                        </div>
                    </div>

                    <h5 class="card-title line-clamp-2">${course.title_th}</h5>
                    <p class="card-text line-clamp-3">${course.short_description || 'ไม่มีคำอธิบาย'}</p>

                    <!-- Stats Row -->
                    <div class="stats-row d-flex align-items-center flex-wrap gap-3 mb-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-people-fill me-1 text-muted"></i>
                            <small>${(course.student_count || 0).toLocaleString()} ผู้เรียน</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-book me-1 text-muted"></i>
                            <small>${course.curriculum?.length || 0} บทเรียน</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-clock-fill me-1 text-muted"></i>
                            <small>${course.duration_hours || 0} ชั่วโมง</small>
                        </div>
                    </div>

                    <!-- Price and Rating Section -->
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-baseline mb-2">
                            <div class="price-block">
                                ${hasDiscount ? `
                                    <small class="text-decoration-line-through text-muted d-block">
                                        ${formatPrice(course.original_price)}
                                    </small>
                                ` : ''}
                                <span class="current-price fw-bold ${course.price > 0 ? 'text-danger' : 'text-success'}">
                                    ${course.price > 0 ? formatPrice(course.price) : 'ฟรี'}
                                </span>
                            </div>
                            <div class="review-section text-end">
                                <div class="stars">
                                    ${starsHtml}
                                </div>
                                <small class="text-muted">
                                    ${formattedRating} (${course.review_count || 0} รีวิว)
                                </small>
                            </div>
                        </div>

                        <a href="detail.html?id=${course.course_id}" 
                           class="btn btn-primary w-100">
                            ดูรายละเอียด
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// CSS ที่จำเป็น
const style = document.createElement('style');
style.textContent = `
    .instructor-avatar {
        width: 24px;
        height: 24px;
        min-width: 24px;
    }

    .current-price {
        font-size: 1.25rem;
    }

    .stars {
        font-size: 0.9rem;
        line-height: 1;
    }

    .stats-row i {
        font-size: 1rem;
    }

    .stats-row small {
        color: #6c757d;
    }

    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 3rem;
    }

    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 4.5rem;
    }

    .course-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .course-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    }

    .course-image {
        height: 200px;
        object-fit: cover;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }
`;
document.head.appendChild(style);

// ฟังก์ชัน Helper
function formatPrice(price) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function calculateDiscount(originalPrice, discountedPrice) {
    if (!originalPrice || originalPrice <= 0) return 0;
    if (discountedPrice === 0) return 100;
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return Math.min(Math.round(discount), 100);
}




function populateFilterOptions(filters) {
    const categorySelect = document.querySelector('#category-filter');
    const levelSelect = document.querySelector('#level-filter');

    if (categorySelect && filters.categories) {
        categorySelect.innerHTML = createOptions(filters.categories, 'ทุกหมวดหมู่');
    }

    if (levelSelect && filters.levels) {
        levelSelect.innerHTML = createOptions(filters.levels, 'ทุกระดับ');
    }
}

function createOptions(options, defaultLabel = '') {
    return `
        <option value="">${defaultLabel}</option>
        ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
    `;
}

// Toast Notifications
function showToast(message, type = 'danger') {
    const toastElement = `
        <div class="toast">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">แจ้งเตือน</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastElement);
    const toast = new bootstrap.Toast(document.querySelector('.toast:last-child'), { autohide: true, delay: 5000 });
    toast.show();
    toast._element.addEventListener('hidden.bs.toast', () => toast._element.remove());
}

// Loading Spinner
function toggleLoadingSpinner(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function showLoadingSpinner() {
    toggleLoadingSpinner(true);
}

function hideLoadingSpinner() {
    toggleLoadingSpinner(false);
}

// Footer
function loadFooter() {
    fetch('footer.html')
        .then(response => response.text())
        .then(data => document.getElementById('footer-placeholder').innerHTML = data)
        .catch(error => console.error('Error loading footer:', error));
}

// Export functions
window.CourseAPI = CourseAPI;

window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.createCourseCard = createCourseCard;

