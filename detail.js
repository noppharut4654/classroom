// detail.js
const API_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';

let currentUserRating = 0;
let currentReviews = [];
let userEnrollment = null;
let learningProgress = null;
let autoRefreshInterval;



let isLoading = false;

function showLoadingOverlay() {
    if (!isLoading) {
        isLoading = true;
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    if (isLoading) {
        isLoading = false;
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
}


// async function initializeData() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const courseId = urlParams.get('id');
    
//     if (!courseId) {
//         showError('ไม่พบรหัสคอร์ส');
//         return;
//     }

//     try {
//         // Load course data first
//         const courseData = await loadCourseDetail(courseId);
//         if (!courseData) return;

//         // Then load other data in parallel
//         await Promise.all([
//             checkAuthAndEnrollment(),
//             loadReviews(courseId)
//         ]);

//         // Setup UI components after data is loaded
//         setupReviewControls();
//         setupReviewForm();
//         setupInfiniteScroll();
//         startAutoRefresh(courseId);

//     } catch (error) {
//         console.error('Error initializing data:', error);
//         showError('ไม่สามารถโหลดข้อมูลได้');
//     }
// }
async function initializeData() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        showError('ไม่พบรหัสคอร์ส');
        return;
    }

    try {
        // Load course data first
        const courseData = await loadCourseDetail(courseId);
        if (!courseData) return;

        // Initialize enroll button
        initializeEnrollButton();

        // Then load other data in parallel
        await Promise.all([
            checkAuthAndEnrollment(),
            loadReviews(courseId)
        ]);

        // Setup UI components after data is loaded
        setupReviewControls();
        setupReviewForm();
        setupInfiniteScroll();
        startAutoRefresh(courseId);

    } catch (error) {
        console.error('Error initializing data:', error);
        showError('ไม่สามารถโหลดข้อมูลได้');
    }
}


async function handleLogout() {
    try {
        showLoadingOverlay();
        await liff.logout();
        
        // เคลียร์ข้อมูลใน sessionStorage และตัวแปรที่เกี่ยวข้อง
        sessionStorage.clear(); // ลบข้อมูลทั้งหมดใน sessionStorage
        userEnrollment = null;
        learningProgress = null;
        
        // อัปเดต UI หลังจากออกจากระบบ
        toggleAuthUI(false);
        resetEnrollButton();
        setEnrollButtonLoading(false); // รีเซ็ตสถานะการโหลด
        
        // รีเฟรชหน้าเว็บเพื่อให้แน่ใจว่า UI ถูกรีเซ็ต
        window.location.reload();
    } catch (error) {
        console.error('Logout failed:', error);
        showError('ไม่สามารถออกจากระบบได้');
    } finally {
        hideLoadingOverlay();
    }
}





function resetEnrollButton() {
    const enrollButton = document.getElementById('enrollButton');
    if (enrollButton) {
        enrollButton.textContent = 'ลงทะเบียนเรียน';
        enrollButton.classList.remove('btn-warning');
        enrollButton.classList.add('btn-primary');
        enrollButton.disabled = false;
        enrollButton.onclick = handleEnrollment;
    }
}



// อัพเดทฟังก์ชันตรวจสอบสถานะการเข้าสู่ระบบและการลงทะเบียน
function updateReviewFormAccess() {
    const reviewForm = document.getElementById('reviewForm');
    const reviewAuthMessage = document.getElementById('reviewAuthMessage');
    const reviewEnrollMessage = document.getElementById('reviewEnrollMessage');

    // เริ่มต้นซ่อนทุกส่วน
    reviewForm.classList.add('d-none');
    reviewAuthMessage.classList.add('d-none');
    reviewEnrollMessage.classList.add('d-none');

    if (!liff.isLoggedIn()) {
        // ถ้ายังไม่ได้เข้าสู่ระบบ
        reviewAuthMessage.classList.remove('d-none');
    } else if (!userEnrollment) {
        // ถ้าเข้าสู่ระบบแล้วแต่ยังไม่ได้ลงทะเบียน
        reviewEnrollMessage.classList.remove('d-none');
    } else if (userEnrollment.status !== 'approved') {
        // ถ้าลงทะเบียนแล้วแต่ยังไม่ได้รับการอนุมัติ
        reviewEnrollMessage.classList.remove('d-none');
    } else {
        // ถ้ามีสิทธิ์เขียนรีวิว
        reviewForm.classList.remove('d-none');
    }
}


// async function checkAuthAndEnrollment() {
//     try {
//         await liff.init({ liffId: LIFF_ID });
        
//         if (!liff.isLoggedIn()) {
//             toggleAuthUI(false);
//             updateReviewFormAccess();
//             return;
//         }
        
//         const profile = await liff.getProfile();
//         const courseId = new URLSearchParams(window.location.search).get('id');
//         toggleAuthUI(true, profile);

//         try {
//             // เช็คสถานะการลงทะเบียน
//             const enrollmentData = await fetchJSON(`${API_URL}?action=getEnrollmentStatus&lineUserId=${profile.userId}&courseId=${courseId}`);
//             if (enrollmentData && enrollmentData.status === 'success' && enrollmentData.data) {
//                 userEnrollment = enrollmentData.data;
//                 if (userEnrollment && userEnrollment.enrollment_id) { // เพิ่มการตรวจสอบ
//                     await loadLearningProgress(userEnrollment.enrollment_id);
//                 }
//                 initializeEnrollButton();
//             }
//         } catch (error) {
//             console.log('No enrollment found or error checking enrollment:', error);
//             // ไม่ต้อง throw error เพราะถือว่าเป็นกรณีปกติที่ผู้ใช้อาจยังไม่ได้ลงทะเบียน
//         }
        
//         updateReviewFormAccess();
//     } catch (error) {
//         console.error('Auth check failed:', error);
//         // ไม่ต้อง throw error เพื่อให้โปรแกรมทำงานต่อได้
//     }
// }
async function checkAuthAndEnrollment() {
    try {
        await liff.init({ liffId: LIFF_ID });
        
        if (!liff.isLoggedIn()) {
            toggleAuthUI(false);
            updateReviewFormAccess();
            return;
        }
        
        const profile = await liff.getProfile();
        const courseId = new URLSearchParams(window.location.search).get('id');
        toggleAuthUI(true, profile);

        try {
            // เช็คสถานะการลงทะเบียน
            const enrollmentData = await fetchJSON(`${API_URL}?action=getEnrollmentStatus&lineUserId=${profile.userId}&courseId=${courseId}`);
            if (enrollmentData && enrollmentData.status === 'success' && enrollmentData.data) {
                userEnrollment = enrollmentData.data;
                if (userEnrollment && userEnrollment.enrollment_id) { // เพิ่มการตรวจสอบ
                    await loadLearningProgress(userEnrollment.enrollment_id);
                }
                initializeEnrollButton();
            }
        } catch (error) {
            console.log('No enrollment found or error checking enrollment:', error);
            // ไม่ต้อง throw error เพราะถือว่าเป็นกรณีปกติที่ผู้ใช้อาจยังไม่ได้ลงทะเบียน
        }
        
        updateReviewFormAccess();
    } catch (error) {
        console.error('Auth check failed:', error);
        // ไม่ต้อง throw error เพื่อให้โปรแกรมทำงานต่อได้
    }
}




async function loadCourseDetail(courseId) {
    try {
        const cachedData = cacheUtils.getCourseData();
        if (cachedData) {
            console.log('Using cached course data');
            updateCourseDetail(cachedData);
            return cachedData;
        }

        showLoadingOverlay();
        const courseData = await fetchJSON(`${API_URL}?action=getCourseDetail&courseId=${courseId}`);
        
        if (courseData?.status === 'success' && courseData.data) {
            const courseDataWithId = {
                ...courseData.data,
                course_id: courseId
            };
            
            // Cache the data before updating UI
            cacheUtils.setCourseData(courseDataWithId);
            
            // Update UI in background
            requestAnimationFrame(() => {
                updateCourseDetail(courseDataWithId);
            });
            
            return courseDataWithId;
        } else {
            throw new Error('Invalid course data');
        }
    } catch (error) {
        console.error('Error loading course:', error);
        showError('ไม่สามารถโหลดข้อมูลคอร์สได้');
        return null;
    } finally {
        hideLoadingOverlay();
    }
}


async function loadReviews(courseId) {
    const cachedReviews = sessionStorage.getItem(`reviews_${courseId}`);
    if (cachedReviews) {
        const cachedData = JSON.parse(cachedReviews);
        renderReviews(cachedData);

        // Fetch new data to check for updates
        const reviewData = await fetchJSON(`${API_URL}?action=getCourseReviews&courseId=${courseId}`);
        if (reviewData && reviewData.status === 'success') {
            const newData = reviewData.data.reviews;
            if (JSON.stringify(newData) !== JSON.stringify(cachedData)) { // Check for changes
                sessionStorage.setItem(`reviews_${courseId}`, JSON.stringify(newData)); // Update cache
                renderReviews(newData); // Update UI
            }
        }
    } else {
        // If no cached data, fetch from API
        const reviewData = await fetchJSON(`${API_URL}?action=getCourseReviews&courseId=${courseId}`);
        if (reviewData && reviewData.status === 'success') {
            sessionStorage.setItem(`reviews_${courseId}`, JSON.stringify(reviewData.data.reviews)); // Cache data
            renderReviews(reviewData.data.reviews); // Render data
        } else {
            showError('ไม่สามารถโหลดรีวิวได้');
        }
    }
}








// Debounce function to optimize search input handling
function debounce(func, delay = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Throttle function for infinite scroll to optimize scroll events
function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

function toggleAuthUI(isLoggedIn, profile = null) {
    document.getElementById('loginButtons').classList.toggle('d-none', isLoggedIn);
    document.getElementById('userProfileNav').classList.toggle('d-none', !isLoggedIn);

    if (isLoggedIn && profile) {
        document.getElementById('userAvatarNav').src = profile.pictureUrl;
        document.getElementById('userNameNav').textContent = profile.displayName;
    } else {
        // รีเซ็ตข้อมูลเมื่อออกจากระบบ
        document.getElementById('userAvatarNav').src = '';
        document.getElementById('userNameNav').textContent = '';
    }
}





// async function loadLearningProgress(enrollmentId) {
//     try {
//         const response = await fetch(
//             `${API_URL}?action=getLearningProgress&enrollmentId=${enrollmentId}`
//         );
//         const data = await response.json();
        
//         if (data.status === 'success') {
//             learningProgress = data.data;
//             updateProgressUI();
//         }
//     } catch (error) {
//         console.error('Failed to load progress:', error);
//     }
// }
async function loadLearningProgress(enrollmentId) {
    try {
        const response = await fetch(
            `${API_URL}?action=getLearningProgress&enrollmentId=${enrollmentId}`
        );
        const data = await response.json();
        
        if (data.status === 'success') {
            learningProgress = data.data;
            updateLearningProgressUI();
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
}



// async function initializeEnrollButton() {
//     const enrollButton = document.getElementById('enrollButton');
//     if (!enrollButton) return;

//     try {
//         // ตรวจสอบ cache ก่อน
//         const cachedEnrollment = sessionStorage.getItem('userEnrollment');
//         if (cachedEnrollment) {
//             const enrollment = JSON.parse(cachedEnrollment);
//             updateEnrollButtonState(enrollButton, enrollment);
//             return;
//         }

//         // ถ้าไม่มี cache และ user ล็อกอินแล้ว
//         if (liff.isLoggedIn()) {
//             const profile = await liff.getProfile();
//             const courseId = new URLSearchParams(window.location.search).get('id');
            
//             // ดึงข้อมูลการลงทะเบียน
//             const response = await fetchJSON(
//                 `${API_URL}?action=getEnrollmentStatus&lineUserId=${profile.userId}&courseId=${courseId}`
//             );

//             if (response?.status === 'success' && response.data) {
//                 // เก็บข้อมูลลง cache
//                 sessionStorage.setItem('userEnrollment', JSON.stringify(response.data));
//                 updateEnrollButtonState(enrollButton, response.data);

//                 // อัปเดตตัวแปร global
//                 userEnrollment = response.data;

//                 // โหลดข้อมูลความก้าวหน้าถ้ามี enrollment_id
//                 if (response.data.enrollment_id) {
//                     loadLearningProgress(response.data.enrollment_id);
//                 }
//             }
//         }
//     } catch (error) {
//         console.error('Error initializing enroll button:', error);
//     }
// }

async function initializeEnrollButton() {
    const enrollButton = document.getElementById('enrollButton');
    if (!enrollButton) return;

    // ตั้งค่าสถานะเริ่มต้นของปุ่ม
    resetEnrollButton();

    // ถ้าผู้ใช้ล็อกอินอยู่
    if (liff.isLoggedIn()) {
        // แสดงสถานะการโหลดบนปุ่ม
        setEnrollButtonLoading(true);

        // ตรวจสอบข้อมูลแคชก่อน
        const cachedEnrollment = sessionStorage.getItem('userEnrollment');
        if (cachedEnrollment) {
            const enrollment = JSON.parse(cachedEnrollment);
            updateEnrollButtonState(enrollButton, enrollment);
            setEnrollButtonLoading(false);
        } else {
            // ดึงข้อมูลสถานะการลงทะเบียนจากเซิร์ฟเวอร์
            await updateEnrollmentStatus(enrollButton);
            setEnrollButtonLoading(false);
        }
    }
}



function setEnrollButtonLoading(isLoading) {
    const enrollButton = document.getElementById('enrollButton');
    if (!enrollButton) return;

    if (isLoading) {
        enrollButton.disabled = true;
        enrollButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังโหลด...';
    } else {
        enrollButton.disabled = false;
        // อัปเดตข้อความบนปุ่มตามสถานะปัจจุบัน
        if (userEnrollment && userEnrollment.status === 'approved') {
            enrollButton.textContent = 'เข้าสู่บทเรียน';
        } else {
            enrollButton.textContent = 'ลงทะเบียนเรียน';
        }
    }
}





async function updateEnrollmentStatus(enrollButton) {
    try {
        // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือไม่
        if (!liff.isLoggedIn()) {
            // ถ้าผู้ใช้ยังไม่ได้ล็อกอิน ไม่ต้องทำอะไร
            return;
        }

        const profile = await liff.getProfile();
        const courseId = new URLSearchParams(window.location.search).get('id');

        // แสดงสถานะการโหลดบนปุ่ม
        setEnrollButtonLoading(true);

        // ตรวจสอบแคชก่อน
        const cachedEnrollment = cacheUtils.getUserEnrollment(profile.userId, courseId);
        if (cachedEnrollment) {
            userEnrollment = cachedEnrollment;
            updateEnrollButtonState(enrollButton, cachedEnrollment);
            setEnrollButtonLoading(false);
        } else {
            // ดึงข้อมูลการลงทะเบียนจากเซิร์ฟเวอร์
            const response = await fetchJSON(
                `${API_URL}?action=getEnrollmentStatus&lineUserId=${profile.userId}&courseId=${courseId}`
            );

            if (response?.status === 'success' && response.data) {
                // เก็บข้อมูลลงแคช
                cacheUtils.setUserEnrollment(profile.userId, courseId, response.data);
                userEnrollment = response.data;
                updateEnrollButtonState(enrollButton, response.data);

                // โหลดข้อมูลความก้าวหน้า ถ้ามี enrollment_id
                if (response.data.enrollment_id) {
                    await loadLearningProgress(response.data.enrollment_id);
                }
            }
        }

    } catch (error) {
        console.error('Error updating enrollment status:', error);
        showError('ไม่สามารถตรวจสอบสถานะการลงทะเบียนได้');
    } finally {
        // ปิดสถานะการโหลดบนปุ่ม
        setEnrollButtonLoading(false);
    }
}






// // ฟังก์ชันอัปเดตสถานะปุ่มลงทะเบียน
// function updateEnrollButtonState(button, enrollment) {
//     if (!enrollment) return;

//     switch (enrollment.status) {
//         case 'pending':
//             button.textContent = 'รอการตรวจสอบการชำระเงิน';
//             button.classList.remove('btn-primary');
//             button.classList.add('btn-warning');
//             button.disabled = true;
//             break;
            
//         case 'approved':
//             button.textContent = 'เข้าสู่บทเรียน';
//             button.classList.remove('btn-warning');
//             button.classList.add('btn-primary');
//             button.disabled = false;
//             button.onclick = () => {
//                 if (enrollment.enrollment_id) {
//                     window.location.href = `learn.html?enrollmentId=${enrollment.enrollment_id}`;
//                 } else {
//                     console.error('No enrollment ID available');
//                     showError('ไม่พบข้อมูลการลงทะเบียน');
//                 }
//             };
//             break;
            
//         default:
//             // กรณีไม่ได้ลงทะเบียน ให้คงสถานะปุ่มเป็นปกติ
//             button.textContent = 'ลงทะเบียนเรียน';
//             button.classList.remove('btn-warning');
//             button.classList.add('btn-primary');
//             button.disabled = false;
//             button.onclick = handleEnrollment;
//     }
// }
function updateEnrollButtonState(button, enrollment) {
    if (!enrollment) return;

    switch (enrollment.status) {
        case 'pending':
            button.textContent = 'รอการตรวจสอบการชำระเงิน';
            button.classList.remove('btn-primary');
            button.classList.add('btn-warning');
            button.disabled = true;
            button.onclick = null; // ปิดการคลิก
            break;

        case 'approved':
            button.textContent = 'เข้าสู่บทเรียน';
            button.classList.remove('btn-warning');
            button.classList.add('btn-primary');
            button.disabled = false;
            button.onclick = () => {
                if (enrollment.enrollment_id) {
                    window.location.href = `learn.html?enrollmentId=${enrollment.enrollment_id}`;
                } else {
                    console.error('No enrollment ID available');
                    showError('ไม่พบข้อมูลการลงทะเบียน');
                }
            };
            break;

        default:
            // กรณีไม่ได้ลงทะเบียน ให้คงสถานะปุ่มเป็นปกติ
            button.textContent = 'ลงทะเบียนเรียน';
            button.classList.remove('btn-warning');
            button.classList.add('btn-primary');
            button.disabled = false;
            button.onclick = handleEnrollment;
    }
}





// function updateUIForEnrolledUser() {
  
//   // เรียกใช้ฟังก์ชันอัปเดตปุ่มก่อน
//     initializeEnrollButton();
    
//     // ถ้าไม่มีข้อมูล enrollment ให้จบการทำงาน
//     if (!userEnrollment) return;

//     // อัพเดทปุ่มลงทะเบียน
//     const enrollButton = document.getElementById('enrollButton');
//     if (!enrollButton) {
//         console.log('Enroll button not found');
//         return;
//     }
    
//     // อัพเดทปุ่มตามสถานะการลงทะเบียน
//     if (userEnrollment.status === 'pending') {
//         enrollButton.textContent = 'รอการตรวจสอบการชำระเงิน';
//         enrollButton.classList.remove('btn-primary');
//         enrollButton.classList.add('btn-warning');
//         enrollButton.disabled = true;
//     } else if (userEnrollment.status === 'approved') {
//         enrollButton.textContent = 'เข้าสู่บทเรียน';
//         enrollButton.onclick = () => {
//             if (userEnrollment.enrollment_id) {
//                 window.location.href = `learn.html?enrollmentId=${userEnrollment.enrollment_id}`;
//             } else {
//                 console.error('No enrollment ID available');
//                 showError('ไม่พบข้อมูลการลงทะเบียน');
//             }
//         };
//     }

//     // อัพเดทแสดงความก้าวหน้าในแต่ละบทเรียน
//     const courseTab = document.getElementById('curriculum');
//     if (!courseTab) {
//         console.log('Curriculum tab not found');
//         return;
//     }

//     if (learningProgress && userEnrollment.status === 'approved') {
//         updateLearningProgressUI();
//     }
// }

// ฟังก์ชันอัปเดตส่วนแสดงความก้าวหน้าในการเรียน
function updateLearningProgressUI() {
    const courseTab = document.getElementById('curriculum');
    if (!courseTab) return;

    // อัปเดตสถานะของแต่ละบทเรียน
    const lessonItems = document.querySelectorAll('.lesson-item');
    if (lessonItems.length > 0) {
        lessonItems.forEach(updateLessonProgress);
    }

    // คำนวณและแสดงความก้าวหน้ารวม
    updateOverallProgress(courseTab, lessonItems);
}


async function handleEnrollment() {
    try {
        showLoadingOverlay();

        const params = new URLSearchParams(window.location.search);
        const courseId = params.get('id');
        
        if (!courseId) {
            throw new Error('Course ID not found');
        }

        // ตรวจสอบว่า liff ถูก initialize แล้วหรือยัง
        if (!liff.isLoggedIn()) {
            try {
                await liff.init({ liffId: LIFF_ID });
                // หลังจาก init สำเร็จ ให้ login
                liff.login();
                return;
            } catch (error) {
                console.error('LIFF initialization failed:', error);
                throw new Error('ไม่สามารถเชื่อมต่อกับ LINE ได้');
            }
        }

        // พยายามดึงข้อมูลผู้ใช้ก่อนไปหน้าลงทะเบียน
        try {
            const profile = await liff.getProfile();
            sessionStorage.setItem('lineProfile', JSON.stringify(profile));
        } catch (error) {
            console.warn('Could not fetch LINE profile:', error);
        }

        // redirect ไปหน้าลงทะเบียน
        redirectToRegister(courseId);
        
    } catch (error) {
        console.error('Error handling enrollment:', error);
        showError('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
    } finally {
        hideLoadingOverlay();
    }
}



function redirectToRegister(courseId) {
    try {
        // ดึงข้อมูลคอร์สจาก session storage ก่อน
        const cachedCourse = sessionStorage.getItem(`course_${courseId}`);
        if (cachedCourse) {
            const courseData = JSON.parse(cachedCourse);
            const registerUrl = new URL('register.html', window.location.origin);
            registerUrl.searchParams.set('courseId', courseId);
            registerUrl.searchParams.set('courseTitle', encodeURIComponent(courseData.title_th || ''));
            registerUrl.searchParams.set('coursePrice', encodeURIComponent(courseData.price || '0'));
            registerUrl.searchParams.set('duration', encodeURIComponent(courseData.duration_hours || '0'));
            registerUrl.searchParams.set('lessons', encodeURIComponent(courseData.total_lessons || '0'));
            
            window.location.href = registerUrl.toString();
            return;
        }

        // ถ้าไม่มีข้อมูลใน session storage ให้ดึงจาก elements
        const courseTitleElem = document.getElementById('course-title');
        const coursePriceElem = document.getElementById('course-price');
        const durationElem = document.getElementById('duration');
        const lessonsElem = document.getElementById('lessons');

        // ถ้าไม่พบ elements ให้ลองดึงข้อมูลจาก API
        if (!courseTitleElem || !coursePriceElem || !durationElem || !lessonsElem) {
            fetchCourseDataAndRedirect(courseId);
            return;
        }

        const courseTitle = courseTitleElem.textContent || '';
        const coursePrice = coursePriceElem.textContent || '0';
        const duration = durationElem.textContent || '0';
        const lessons = lessonsElem.textContent || '0';
        
        const registerUrl = new URL('register.html', window.location.origin);
        registerUrl.searchParams.set('courseId', courseId);
        registerUrl.searchParams.set('courseTitle', encodeURIComponent(courseTitle));
        registerUrl.searchParams.set('coursePrice', encodeURIComponent(coursePrice));
        registerUrl.searchParams.set('duration', encodeURIComponent(duration));
        registerUrl.searchParams.set('lessons', encodeURIComponent(lessons));
        
        window.location.href = registerUrl.toString();
    } catch (error) {
        console.error('Error redirecting to register:', error);
        showError('ไม่สามารถเปิดหน้าลงทะเบียนได้');
    }
}

// เพิ่มฟังก์ชันใหม่สำหรับดึงข้อมูลคอร์สจาก API
async function fetchCourseDataAndRedirect(courseId) {
    try {
        showLoadingOverlay();
        const response = await fetch(`${API_URL}?action=getCourseDetail&courseId=${courseId}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            const course = data.data;
            const registerUrl = new URL('register.html', window.location.origin);
            registerUrl.searchParams.set('courseId', courseId);
            registerUrl.searchParams.set('courseTitle', encodeURIComponent(course.title_th || ''));
            registerUrl.searchParams.set('coursePrice', encodeURIComponent(course.price || '0'));
            registerUrl.searchParams.set('duration', encodeURIComponent(course.duration_hours || '0'));
            registerUrl.searchParams.set('lessons', encodeURIComponent(course.total_lessons || '0'));
            
            window.location.href = registerUrl.toString();
        } else {
            throw new Error('Failed to fetch course data');
        }
    } catch (error) {
        console.error('Error fetching course data:', error);
        showError('ไม่สามารถดึงข้อมูลคอร์สได้');
    } finally {
        hideLoadingOverlay();
    }
}

function updateCourseDetail(course) {
    try {
        console.log('Updating course detail with data:', course);
        
        // Update header section
        document.querySelector('#course-title').textContent = course.title_th || 'ไม่พบชื่อคอร์ส';
        document.title = `${course.title_th} - Course Platform`;

        // Update preview image
        const previewImage = document.querySelector('.course-preview img');
        if (course.preview_url) {
            previewImage.src = course.preview_url;
        } else {
            previewImage.src = 'https://placehold.co/800x450/lightgray/white?text=No+Preview';
        }

        // Update price
        const priceElement = document.querySelector('.price');
        if (course.price === 0 || course.price === "0") {
            priceElement.innerHTML = '<span class="badge bg-success">ฟรี</span>';
        } else if (course.price) {
            priceElement.textContent = `฿${Number(course.price).toLocaleString()}`;
        } else {
            priceElement.textContent = 'ฟรี';
        }

        // Update course features
        document.querySelector('#duration').textContent = course.duration_hours || '0';
        document.querySelector('#lessons').textContent = course.total_lessons || '0';

        // อัพเดท description tab ใช้ innerHTML แทน outerHTML
        const descriptionTab = document.querySelector('#description');
        if (descriptionTab) {
            const descriptionHtml = `
                <h3>รายละเอียดคอร์ส</h3>
                <div class="course-description mt-3">
                    ${course.full_description || 'ไม่มีคำอธิบายคอร์ส'}
                </div>
                
                <h4 class="mt-4">สิ่งที่คุณจะได้เรียนรู้</h4>
                <ul class="list-unstyled benefits-list">
                    ${course.benefits && course.benefits.length > 0 ? 
                        course.benefits.map(benefit => 
                            `<li><i class="bi bi-check-circle text-success"></i> ${benefit.benefit}</li>`
                        ).join('') : 
                        '<li>ไม่มีข้อมูล</li>'
                    }
                </ul>

                <h4 class="mt-4">ความต้องการหรือความรู้พื้นฐาน</h4>
                <ul class="list-unstyled requirements-list">
                    ${course.requirements && course.requirements.length > 0 ? 
                        course.requirements.map(req => 
                            `<li><i class="bi bi-dot"></i> ${req.requirement}</li>`
                        ).join('') : 
                        '<li>ไม่มีข้อมูล</li>'
                    }
                </ul>
            `;
            descriptionTab.innerHTML = descriptionHtml;
        }

        // อัพเดท curriculum tab
        const curriculumTab = document.querySelector('#curriculum');
        if (curriculumTab) {
            if (course.curriculum && course.curriculum.length > 0) {
                curriculumTab.innerHTML = generateCurriculum(course.curriculum);
            } else {
                curriculumTab.innerHTML = '<p>ไม่พบข้อมูลบทเรียน</p>';
            }
        }

        // อัพเดท instructor tab
        const instructorTab = document.querySelector('#instructor');
        if (instructorTab) {
            if (course.instructors && course.instructors.length > 0) {
                instructorTab.innerHTML = course.instructors.map(instructor => `
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="d-flex gap-3">
                                <img src="${instructor.avatar_url || 'https://placehold.co/64x64/lightgray/white?text=Instructor'}" 
                                     alt="${instructor.name_th}" 
                                     class="instructor-avatar">
                                <div>
                                    <h4>${instructor.name_th || 'ไม่ระบุชื่อ'}</h4>
                                    <p class="text-muted">${instructor.title || 'ไม่ระบุตำแหน่ง'}</p>
                                    <p>${instructor.bio || 'ไม่มีข้อมูล'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                instructorTab.innerHTML = '<p>ไม่พบข้อมูลผู้สอน</p>';
            }
        }

    } catch (error) {
        console.error('Error in updateCourseDetail:', error);
        showError('เกิดข้อผิดพลาดในการแสดงข้อมูล');
    }
}


function generateCurriculum(curriculum) {
    let html = '';
    let currentSection = null;

    curriculum.forEach(item => {
        if (currentSection !== item.section_number) {
            if (currentSection !== null) {
                html += '</div>';
            }
            currentSection = item.section_number;
            html += `
                <div class="curriculum-section mb-4">
                    <div class="section-header d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">Section ${item.section_number}: ${item.section_title}</h4>
                        <button class="btn btn-sm btn-outline-primary share-section-btn" 
                                data-section="${item.section_number}"
                                title="แชร์ Section นี้">
                            <i class="bi bi-share"></i> แชร์
                        </button>
                    </div>
            `;
        }

        const previewButton = item.is_preview ? `
            <button class="btn btn-sm btn-outline-primary preview-btn" 
                    onclick="playPreview('${item.video_url || '#'}', '${item.lesson_title}')">
                <i class="bi bi-play-circle"></i> ดูตัวอย่าง
            </button>
        ` : `
            <span class="badge bg-secondary">
                <i class="bi bi-lock"></i> สมาชิกเท่านั้น
            </span>
        `;

        html += `
            <div class="lesson-item" data-lesson-id="${item.curriculum_id}">
                <div class="lesson-info">
                    <span class="lesson-title">
                        ${item.is_preview ? '<i class="bi bi-play-circle text-primary"></i>' : '<i class="bi bi-lock"></i>'}
                        ${item.lesson_title}
                    </span>
                    ${item.is_preview ? '<span class="badge bg-success ms-2">ดูฟรี</span>' : ''}
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-outline-secondary share-lesson-btn" 
                            data-lesson-id="${item.curriculum_id}"
                            title="แชร์บทเรียนนี้">
                        <i class="bi bi-share"></i>
                    </button>
                    ${previewButton}
                    <span class="lesson-duration">
                        <i class="bi bi-clock"></i> ${item.duration_minutes} นาที
                    </span>
                </div>
            </div>
        `;
    });

    if (currentSection !== null) {
        html += '</div>';
    }

    // เพิ่ม style สำหรับ section header
    const style = `
        <style>
            .section-header {
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
            }
            
            .share-section-btn {
                padding: 4px 12px;
                font-size: 0.875rem;
            }
            
            .share-section-btn i {
                font-size: 0.875rem;
            }
        </style>
    `;

    return style + html + generatePreviewModal();
}

// แยกฟังก์ชัน generatePreviewModal
function generatePreviewModal() {
    return `
        <div class="modal fade" id="previewModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">ตัวอย่างบทเรียน</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="videoContainer" class="ratio ratio-16x9">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Play preview video
async function playPreview(videoUrl, lessonTitle) {
    try {
        showLoadingOverlay();
        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        const videoContainer = document.getElementById('videoContainer');
        const modalTitle = document.querySelector('#previewModal .modal-title');
        
        modalTitle.textContent = `ตัวอย่างบทเรียน: ${lessonTitle}`;

        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoId = videoUrl.includes('youtu.be') 
                ? videoUrl.split('/').pop()
                : new URLSearchParams(new URL(videoUrl).search).get('v');
            videoContainer.innerHTML = `
                <iframe src="https://www.youtube.com/embed/${videoId}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                </iframe>
            `;
        } else if (videoUrl.includes('vimeo.com')) {
            const videoId = videoUrl.split('/').pop();
            videoContainer.innerHTML = `
                <iframe src="https://player.vimeo.com/video/${videoId}"
                        frameborder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowfullscreen>
                </iframe>
            `;
        } else {
            videoContainer.innerHTML = `
                <video controls class="w-100">
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }

        modal.show();

        // Clean up when modal is hidden
        document.getElementById('previewModal').addEventListener('hidden.bs.modal', function () {
            videoContainer.innerHTML = '';
        });
    } catch (error) {
        console.error('Error playing preview:', error);
        showError('ไม่สามารถเล่นวิดีโอตัวอย่างได้');
    } finally {
        hideLoadingOverlay();
    }
}

// Show error message
function showError(message) {
    hideLoadingOverlay();

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




// อัพเดท UI ตามสถานะการ login
function updateAuthUI() {
    const isLoggedIn = liff.isLoggedIn();
    const authMessages = document.querySelectorAll('.auth-check-message');
    const forms = document.querySelectorAll('.review-form-content, .discussion-form form');

    authMessages.forEach(msg => {
        msg.classList.toggle('d-none', isLoggedIn);
    });

    forms.forEach(form => {
        form.classList.toggle('d-none', !isLoggedIn);
    });
}






// เพิ่มตัวแปร Global
let reviewState = {
    originalReviews: [],
    filteredReviews: [],
    sortBy: 'newest',
    filterRating: 'all',
    isRefreshing: false
};

// เพิ่มฟังก์ชันจัดการ Loading Indicator
function showRefreshIndicator(message = 'กำลังอัพเดทข้อมูล...') {
    let indicator = document.querySelector('.refresh-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'refresh-indicator';
        indicator.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
            <span class="indicator-text"></span>
        `;
        document.body.appendChild(indicator);
    }
    indicator.querySelector('.indicator-text').textContent = message;
    setTimeout(() => indicator.classList.add('show'), 0);
}

function hideRefreshIndicator() {
    const indicator = document.querySelector('.refresh-indicator');
    if (indicator) {
        indicator.classList.remove('show');
    }
}


async function refreshReviews(courseId) {
    if (reviewState.isRefreshing) return false;
    
    reviewState.isRefreshing = true;
    showRefreshIndicator();

    try {
        const response = await fetch(`${API_URL}?action=getCourseReviews&courseId=${courseId}`);
        const data = await response.json();

        if (data.status === 'success' && data.data) {
            const newReviews = data.data.reviews.map(review => ({
                ...review,
                created_at: new Date(review.created_at)
            }));

            // ตรวจสอบการเปลี่ยนแปลง
            const hasChanges = JSON.stringify(reviewState.originalReviews) !== JSON.stringify(newReviews);

            if (hasChanges) {
                // อัพเดทคะแนนภาพรวม
                if (data.data.stats) {
                    renderReviewStats(data.data.stats);
                    updateOverallRating(data.data.stats);
                }

                // แจ้งเตือนรีวิวใหม่
                const newReviewsCount = newReviews.filter(review => 
                    !reviewState.originalReviews.some(r => r.review_id === review.review_id)
                ).length;

                if (newReviewsCount > 0) {
                    showNewReviewNotification(newReviewsCount);
                }

                reviewState.originalReviews = newReviews;
                applyReviewFilters();
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error refreshing reviews:', error);
        return false;
    } finally {
        reviewState.isRefreshing = false;
        hideRefreshIndicator();
    }
}

// เพิ่มฟังก์ชันอัพเดทคะแนนภาพรวม
function updateOverallRating(stats) {
    const overallRatingElem = document.querySelector('.course-rating');
    if (overallRatingElem) {
        overallRatingElem.innerHTML = `
            <div class="rating-number display-4">${stats.average_rating}</div>
            <div class="stars h4 mb-2">
                ${generateStarRating(parseFloat(stats.average_rating))}
            </div>
            <div class="total-reviews text-muted">
                จาก ${stats.total_reviews} รีวิว
            </div>
        `;
    }
}

// ฟังก์ชันแจ้งเตือนรีวิวใหม่
function showNewReviewNotification(count) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    new Notification("มีรีวิวใหม่", {
        body: `มีรีวิวใหม่เพิ่มเข้ามา ${count} รายการ`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>'
    });
}

// เพิ่มฟังก์ชันแสดงรูปภาพแบบ Preview
function showImagePreview(url) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body p-0">
                    <button type="button" class="btn-close position-absolute end-0 top-0 m-2" data-bs-dismiss="modal"></button>
                    <img src="${url}" class="img-fluid" alt="รูปประกอบรีวิว">
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}


// ฟังก์ชันจัดการการกรองและเรียงลำดับ
function applyReviewFilters() {
    let filtered = [...reviewState.originalReviews];

    // กรองตามคะแนน
    if (reviewState.filterRating !== 'all') {
        filtered = filtered.filter(review => 
            review.rating === parseInt(reviewState.filterRating)
        );
    }

    // จัดเรียงลำดับ
    switch (reviewState.sortBy) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'rating-high':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'rating-low':
            filtered.sort((a, b) => a.rating - b.rating);
            break;
    }

    reviewState.filteredReviews = filtered;
    renderReviews(filtered);
    updateActiveFilters();
}

// ฟังก์ชันอัพเดทการแสดงผล Active Filters
function updateActiveFilters() {
    const activeFilters = document.getElementById('activeFilters');
    if (!activeFilters) return;

    const filters = [];
    
    if (reviewState.filterRating !== 'all') {
        filters.push(`${reviewState.filterRating} ดาว`);
    }

    const sortTexts = {
        'newest': 'ล่าสุด',
        'oldest': 'เก่าสุด',
        'rating-high': 'คะแนนมาก-น้อย',
        'rating-low': 'คะแนนน้อย-มาก'
    };
    filters.push(`เรียงตาม: ${sortTexts[reviewState.sortBy]}`);

    activeFilters.innerHTML = filters.map(filter => 
        `<span class="badge bg-primary">${filter}</span>`
    ).join('');
}

// เพิ่ม Event Listeners
function setupReviewControls() {
    // Sort
    document.getElementById('reviewSort')?.addEventListener('change', (e) => {
        reviewState.sortBy = e.target.value;
        applyReviewFilters();
    });

    // Filter
    document.querySelectorAll('.filter-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
            const rating = e.target.dataset.rating;
            document.querySelectorAll('.filter-badge').forEach(b => 
                b.classList.remove('active')
            );
            e.target.classList.add('active');
            reviewState.filterRating = rating;
            applyReviewFilters();
        });
    });
}


// ฟังก์ชันใหม่สำหรับจัดการการแสดงเวลาในรูปแบบที่เหมาะสม
function formatReviewTime(date) {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffInSeconds = Math.floor((now - reviewDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) {
        return 'เมื่อสักครู่';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInHours < 24) {
        return `${diffInHours} ชั่วโมงที่แล้ว`;
    } else if (diffInDays < 30) {
        return `${diffInDays} วันที่แล้ว`;
    } else {
        // แสดงวันที่และเวลาแบบเต็ม
        return reviewDate.toLocaleString('th-TH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        });
    }
}


function renderReviewStats(stats) {
    const statsContainer = document.querySelector('.rating-summary');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="average-rating">
            <div class="rating-number">${Number(stats.average_rating).toFixed(1)}</div>
            <div class="stars">
                ${generateStarRating(stats.average_rating)}
            </div>
            <div class="total-reviews">${stats.total_reviews} รีวิว</div>
        </div>
        <div class="rating-distribution">
            ${Object.entries(stats.rating_distribution)
                .reverse()
                .map(([rating, count]) => {
                    const percentage = (count / stats.total_reviews * 100).toFixed(1);
                    return `
                        <div class="rating-bar">
                            <span class="rating-label">${rating} ดาว</span>
                            <div class="progress">
                                <div class="progress-bar" 
                                     style="width: ${percentage}%" 
                                     title="${percentage}%">
                                </div>
                            </div>
                            <span class="rating-count">${count}</span>
                        </div>
                    `;
                }).join('')}
        </div>
    `;
}



// เพิ่มการบันทึกการตั้งค่าใน localStorage
const STORAGE_KEY = 'review_preferences';

function savePreferences() {
    const preferences = {
        sortBy: reviewState.sortBy,
        filterRating: reviewState.filterRating
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function loadPreferences() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const preferences = JSON.parse(saved);
            reviewState.sortBy = preferences.sortBy;
            reviewState.filterRating = preferences.filterRating;
            
            // อัพเดท UI
            const sortSelect = document.getElementById('reviewSort');
            if (sortSelect) sortSelect.value = preferences.sortBy;
            
            const filterBadge = document.querySelector(`.filter-badge[data-rating="${preferences.filterRating}"]`);
            if (filterBadge) filterBadge.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}



// ฟังก์ชันอัพโหลดรูปไปยัง Google Drive
function uploadReviewImage(data) {
    try {
        const FOLDER_ID = '1gUC7JpG7u496A4e_815Jp0L1E7fels1I';
        const folder = DriveApp.getFolderById(FOLDER_ID);

        // แยก mime type และ base64 data
        const matches = data.file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 data');
        }

        const mimeType = matches[1];
        const imageData = Utilities.base64Decode(matches[2]);
        const blob = Utilities.newBlob(imageData, mimeType, data.fileName);

        // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
        const timestamp = new Date().getTime();
        const uniqueFileName = `review_image_${timestamp}_${data.fileName}`;

        const file = folder.createFile(blob);
        file.setName(uniqueFileName);
        file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

        return {
            status: 'success',
            data: {
                fileId: file.getId(),
                fileUrl: file.getUrl()
            }
        };
    } catch (error) {
        Logger.log('Error uploading review image:', error);
        return {
            status: 'error',
            message: error.toString()
        };
    }
}


function renderReviews(reviews, append = false) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) {
        console.error('Reviews list element not found');
        return;
    }

    if (!Array.isArray(reviews)) {
        console.error('Reviews data is not an array:', reviews);
        reviews = [];
    }

    const reviewsHTML = reviews.map(async review => {
        let imageUrls = [];
        try {
            if (review.image_urls) {
                imageUrls = JSON.parse(review.image_urls);
            }
        } catch (error) {
            console.error('Error parsing image URLs:', error);
        }

        // เช็คว่าเป็นรีวิวของตัวเองหรือไม่
        let isOwnReview = false;
        try {
            if (liff.isLoggedIn()) {
                const profile = await liff.getProfile();
                isOwnReview = profile.userId === review.user_id;
            }
        } catch (error) {
            console.error('Error checking user:', error);
        }

        // สร้าง HTML สำหรับรูปภาพ
        const imagesHTML = imageUrls.length ? `
            <div class="review-images mt-2 mb-2">
                <div class="d-flex gap-2 flex-wrap">
                    ${imageUrls.map(img => `
                        <div class="review-image-container">
                            <img src="${img.url}" 
                                 alt="รูปประกอบรีวิว" 
                                 class="review-image"
                                 onclick="showImagePreview('${img.url}')"
                                 style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;">
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        // สร้างปุ่มแก้ไข/ลบสำหรับรีวิวของตัวเอง
        const actionButtons = isOwnReview ? `
            <div class="review-actions mt-2">
                <button class="btn btn-sm btn-outline-primary" onclick="editReview('${review.review_id}')">
                    <i class="bi bi-pencil"></i> แก้ไข
                </button>
                <button class="btn btn-sm btn-outline-danger ms-2" 
                        onclick="confirmDeleteReview('${review.review_id}')">
                    <i class="bi bi-trash"></i> ลบ
                </button>
            </div>
        ` : '';

        return `
            <div class="review-item mb-4 fade-in" data-review-id="${review.review_id}">
            
                <!-- ส่วนหัวรีวิว -->
                <div class="d-flex align-items-center mb-2">
                    <img src="${review.user_avatar || 'https://via.placeholder.com/40'}" 
                         alt="${review.user_name}" 
                         class="rounded-circle me-2" 
                         style="width: 40px; height: 40px; object-fit: cover;">
                    <div>
                        <div class="fw-bold">${review.user_name}</div>
                        <div class="text-muted small d-flex align-items-center">
                            <i class="bi bi-clock me-1"></i>
                            <span title="${new Date(review.created_at).toLocaleString('th-TH')}">
                                ${formatReviewTime(review.created_at)}
                            </span>
                            ${review.updated_at ? `
                                <span class="ms-2 text-muted small">
                                    <i class="bi bi-pencil-square"></i> แก้ไขล่าสุด ${formatReviewTime(review.updated_at)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- คะแนนดาว -->
                <div class="review-rating mb-3">
                    <div class="stars">
                        ${generateStarRating(review.rating)}
                        <span class="rating-value">${review.rating.toFixed(1)}</span>
                    </div>
                </div>

                <!-- เนื้อหารีวิว -->
                <div class="review-content">
                    <p class="mb-2">${review.comment}</p>
                    ${imagesHTML}
                </div>

                <!-- ปุ่มแก้ไข/ลบ -->
                ${actionButtons}

                <!-- เส้นคั่น -->
                <hr class="my-3">
            </div>
        `;
    });

    // รวมรีวิวทั้งหมดและอัพเดท DOM
    Promise.all(reviewsHTML).then(renderedReviews => {
        const finalHTML = renderedReviews.join('');
        if (append) {
            reviewsList.insertAdjacentHTML('beforeend', finalHTML);
        } else {
            reviewsList.innerHTML = reviews.length ? finalHTML : 
                '<p class="text-center text-muted">ยังไม่มีรีวิว</p>';
        }

        // เพิ่ม animation
        const newReviews = reviewsList.querySelectorAll('.review-item:not(.animated)');
        newReviews.forEach((review, index) => {
            setTimeout(() => {
                review.classList.add('animated', 'fadeInUp');
            }, index * 100);
        });
    });
}

// ฟังก์ชันยืนยันการลบรีวิว
function confirmDeleteReview(reviewId) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.setAttribute('data-bs-backdrop', 'static'); // ป้องกันการปิดโดยคลิกพื้นหลัง
    modalElement.setAttribute('data-bs-keyboard', 'false'); // ป้องกันการปิดโดยกด ESC
    modalElement.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">ยืนยันการลบรีวิว</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>คุณแน่ใจหรือไม่ที่จะลบรีวิวนี้?</p>
                    <p class="text-muted small">หมายเหตุ: การลบรีวิวไม่สามารถเรียกคืนได้</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                    <button type="button" class="btn btn-danger" onclick="deleteReview('${reviewId}')">
                        ลบรีวิว
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalElement);
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}


async function editReview(reviewId) {
    const review = currentReviews.find(r => r.review_id === reviewId);
    if (!review) return;

    // เลื่อนไปที่ฟอร์มรีวิว
    document.getElementById('reviewForm').scrollIntoView({ behavior: 'smooth' });

    // กรอกข้อมูลเดิม
    currentUserRating = review.rating;
    highlightStars(currentUserRating);
    document.querySelector('textarea[name="comment"]').value = review.comment;

    // แสดงรูปภาพเดิม
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '';
    
    if (review.image_urls) {
        const urls = JSON.parse(review.image_urls);
        urls.forEach(img => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'position-relative';
            imgContainer.innerHTML = `
                <img src="${img.url}" 
                     class="img-thumbnail" 
                     style="width: 100px; height: 100px; object-fit: cover;">
                <button type="button" 
                        class="btn-close position-absolute top-0 end-0"
                        onclick="removeImage('${img.id}')"></button>
            `;
            imagePreview.appendChild(imgContainer);
        });
    }

    // เปลี่ยนข้อความปุ่ม
    const submitButton = document.querySelector('#reviewForm button[type="submit"]');
    submitButton.innerHTML = '<i class="bi bi-pencil"></i> แก้ไขรีวิว';
}

// เพิ่มฟังก์ชันลบรีวิว
async function deleteReview(reviewId) {
    try {
        // ปิด modal ทันทีที่กดปุ่มลบ
        const modalElement = document.querySelector('.modal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
                document.body.removeChild(modalElement);
            }
        }

        const profile = await liff.getProfile();
        showLoadingOverlay();

        const iframeId = `hidden_iframe_${Date.now()}`;
        const iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.name = iframeId;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const submitForm = document.createElement('form');
        submitForm.method = 'post';
        submitForm.target = iframeId;
        submitForm.action = `${API_URL}?action=deleteReview`;
        submitForm.style.display = 'none';

        const formFields = {
            'action': 'deleteReview',
            'reviewId': reviewId,
            'userId': profile.userId
        };

        Object.entries(formFields).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            submitForm.appendChild(input);
        });

        document.body.appendChild(submitForm);

        iframe.onload = async () => {
            try {
                const courseId = new URLSearchParams(window.location.search).get('id');
                await loadReviews(courseId);
                showSuccess('ลบรีวิวเรียบร้อยแล้ว');

                // Reset form และ rating
                const reviewForm = document.getElementById('reviewForm');
                if (reviewForm) {
                    reviewForm.reset();
                    currentUserRating = 0;
                    highlightStars(0);
                }

                const imagePreview = document.getElementById('imagePreview');
                if (imagePreview) {
                    imagePreview.innerHTML = '';
                }

                const submitButton = reviewForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.innerHTML = '<i class="bi bi-send"></i> ส่งรีวิว';
                }

            } catch (error) {
                console.error('Error processing delete response:', error);
                showError('เกิดข้อผิดพลาดในการลบรีวิว');
            } finally {
                if (iframe && document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                if (submitForm && document.body.contains(submitForm)) {
                    document.body.removeChild(submitForm);
                }
                hideLoadingOverlay();
            }
        };

        submitForm.submit();

    } catch (error) {
        console.error('Error deleting review:', error);
        showError('ไม่สามารถลบรีวิวได้');
        hideLoadingOverlay();
    }
}


// ฟังก์ชันลบรูปภาพรีวิว
function deleteReviewImage(data) {
    try {
        const file = DriveApp.getFileById(data.fileId);
        file.setTrashed(true);
        return {
            status: 'success'
        };
    } catch (error) {
        Logger.log('Error deleting review image:', error);
        return {
            status: 'error',
            message: error.toString()
        };
    }
}

// ปรับปรุงฟังก์ชัน setupInfiniteScroll
function setupInfiniteScroll() {
    let page = 1;
    const PER_PAGE = 10;
    let loading = false;

    function loadMore() {
        const startIndex = page * PER_PAGE;
        const endIndex = startIndex + PER_PAGE;
        const nextPage = reviewState.filteredReviews.slice(startIndex, endIndex);

        if (nextPage.length > 0) {
            renderReviews(nextPage, true); // true = append mode
            page++;
            loading = false;
        }
    }

    // เพิ่ม scroll listener
    const reviewsContainer = document.querySelector('.reviews-container');
    if (reviewsContainer) {
        reviewsContainer.addEventListener('scroll', debounce(() => {
            if (loading) return;

            const { scrollTop, scrollHeight, clientHeight } = reviewsContainer;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loading = true;
                loadMore();
            }
        }, 100));
    }
}


async function loadReviews(courseId) {
    try {
        //showLoadingOverlay();
        console.log('Loading reviews for course:', courseId);
        
        const response = await fetch(`${API_URL}?action=getCourseReviews&courseId=${courseId}`);
        const data = await response.json();
        console.log('Review data received:', data);

        if (data.status === 'success' && data.data) {
            // แปลงวันที่ให้เป็น Date object
            currentReviews = data.data.reviews.map(review => ({
                ...review,
                created_at: new Date(review.created_at)
            }));
            
            // อัพเดทการแสดงผลสถิติ
            if (data.data.stats) {
                renderReviewStats(data.data.stats);
            }
            
            // อัพเดทการแสดงผลรีวิว
            renderReviews(currentReviews);
        } else {
            console.error('Failed to load reviews:', data);
            throw new Error(data.message || 'Failed to load reviews');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        showError('ไม่สามารถโหลดรีวิวได้');
    } finally {
        hideLoadingOverlay();
    }
}



// Utility function
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


function generateStarRating(rating) {
    const stars = [];
    const roundedRating = Math.round(rating * 10) / 10;
    
    for (let i = 1; i <= 5; i++) {
        const distanceFromPrevStar = roundedRating - (i - 1);
        
        if (distanceFromPrevStar >= 1) {
            // ดาวเต็ม
            stars.push('<i class="bi bi-star-fill"></i>');
        } else if (distanceFromPrevStar > 0) {
            // คำนวณเปอร์เซ็นต์สำหรับดาวที่ไม่เต็ม
            const percentage = distanceFromPrevStar * 100;
            
            if (percentage >= 80) {
                // เกือบเต็ม (80% ขึ้นไป)
                stars.push('<i class="bi bi-star-fill" style="opacity: 0.8"></i>');
            } else if (percentage >= 60) {
                // มากกว่าครึ่ง (60-79%)
                stars.push('<i class="bi bi-star-fill" style="opacity: 0.6"></i>');
            } else if (percentage >= 40) {
                // ครึ่งดาว (40-59%)
                stars.push('<i class="bi bi-star-half"></i>');
            } else if (percentage >= 20) {
                // น้อยกว่าครึ่ง (20-39%)
                stars.push('<i class="bi bi-star" style="opacity: 0.6"></i>');
            } else {
                // เกือบว่าง (1-19%)
                stars.push('<i class="bi bi-star" style="opacity: 0.8"></i>');
            }
        } else {
            // ดาวว่าง
            stars.push('<i class="bi bi-star"></i>');
        }
    }

    return stars.join('');
}


async function setupReviewForm() {
    const form = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('.rating-input .stars i');
    
    if (!form || !stars.length) return;

    // Set up basic star rating UI handlers regardless of auth state
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });

        star.addEventListener('click', function() {
            currentUserRating = parseInt(this.dataset.rating);
            highlightStars(currentUserRating);
        });

        star.addEventListener('mouseout', function() {
            highlightStars(currentUserRating);
        });
    });

    try {
        const courseId = new URLSearchParams(window.location.search).get('id');

        // Only proceed with authenticated features if logged in
        if (!liff.isLoggedIn()) {
            updateReviewFormAccess(); // Show login prompt UI
            return;
        }

        // Get user profile for authenticated features
        let profile;
        try {
            profile = await liff.getProfile();
        } catch (error) {
            console.warn('Could not fetch LINE profile:', error);
            return;
        }

        // Try to find existing review
        const existingReview = currentReviews.find(review => review.user_id === profile.userId);
        
        if (existingReview) {
            // Pre-fill form with existing review data
            currentUserRating = existingReview.rating;
            form.querySelector('textarea[name="comment"]').value = existingReview.comment;
            highlightStars(currentUserRating);
            
            // Show existing images
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview && existingReview.image_urls) {
                try {
                    const urls = JSON.parse(existingReview.image_urls);
                    urls.forEach(url => {
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'position-relative d-inline-block me-2 mb-2';
                        imgContainer.innerHTML = `
                            <img src="${url}" 
                                 class="img-thumbnail" 
                                 style="width: 150px; height: 150px; object-fit: cover;">
                            <button type="button" 
                                    class="btn-close position-absolute top-0 end-0 bg-white rounded-circle"
                                    style="margin: 5px;"
                                    onclick="this.parentElement.remove()"></button>
                        `;
                        imagePreview.appendChild(imgContainer);
                    });
                } catch (error) {
                    console.warn('Error parsing image URLs:', error);
                }
            }
            
            // Update submit button to show edit mode
            form.querySelector('button[type="submit"]').innerHTML = '<i class="bi bi-pencil"></i> แก้ไขรีวิว';
        }

        // Set up image upload handling
        const imageInput = form.querySelector('input[type="file"]');
        if (imageInput) {
            imageInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files).slice(0, 2); // Limit to 2 images
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = '';

                for (const file of files) {
                    if (!file.type.startsWith('image/')) {
                        showError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
                        continue;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                        showError(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 5MB)`);
                        continue;
                    }

                    try {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const imgContainer = document.createElement('div');
                            imgContainer.className = 'position-relative d-inline-block me-2 mb-2';
                            imgContainer.innerHTML = `
                                <img src="${e.target.result}" 
                                     class="img-thumbnail" 
                                     style="width: 150px; height: 150px; object-fit: cover;">
                                <button type="button" 
                                        class="btn-close position-absolute top-0 end-0 bg-white rounded-circle"
                                        style="margin: 5px;"
                                        onclick="this.parentElement.remove()"></button>
                            `;
                            imagePreview.appendChild(imgContainer);
                        };
                        reader.readAsDataURL(file);
                    } catch (error) {
                        console.warn('Error processing image:', error);
                        showError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
                    }
                }
            });
        }

        // Set up form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUserRating) {
                showError('กรุณาให้คะแนน');
                return;
            }

            const comment = form.querySelector('textarea[name="comment"]').value.trim();
            if (!comment) {
                showError('กรุณาเขียนความคิดเห็น');
                return;
            }

            try {
                showLoadingOverlay();
                
                // Collect images
                const images = [];
                const imagePreviews = document.querySelectorAll('#imagePreview img');
                for (const img of imagePreviews) {
                    if (img.src.startsWith('data:image')) {
                        images.push({
                            data: img.src,
                            name: `review_image_${Date.now()}.jpg`
                        });
                    }
                }

                const iframeId = `hidden_iframe_${Date.now()}`;
                const iframe = document.createElement('iframe');
                iframe.id = iframeId;
                iframe.name = iframeId;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);

                const submitForm = document.createElement('form');
                submitForm.method = 'post';
                submitForm.target = iframeId;
                submitForm.action = `${API_URL}?action=submitReview`;
                submitForm.style.display = 'none';

                const formFields = {
                    'action': 'submitReview',
                    'courseId': courseId,
                    'userId': profile.userId,
                    'rating': currentUserRating,
                    'comment': comment,
                    'images': JSON.stringify(images)
                };

                Object.entries(formFields).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    submitForm.appendChild(input);
                });

                document.body.appendChild(submitForm);

                iframe.onload = async () => {
                    try {
                        await loadReviews(courseId);
                        // Reset form
                        form.reset();
                        currentUserRating = 0;
                        highlightStars(0);
                        document.getElementById('imagePreview').innerHTML = '';
                        
                        // Reset submit button text
                        form.querySelector('button[type="submit"]').innerHTML = '<i class="bi bi-send"></i> ส่งรีวิว';
                        
                        showSuccess(existingReview ? 'แก้ไขรีวิวเรียบร้อยแล้ว' : 'ส่งรีวิวเรียบร้อยแล้ว');
                    } catch (error) {
                        console.error('Error processing response:', error);
                        showError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                    } finally {
                        if (iframe && document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                        if (submitForm && document.body.contains(submitForm)) {
                            document.body.removeChild(submitForm);
                        }
                        hideLoadingOverlay();
                    }
                };

                submitForm.submit();

            } catch (error) {
                console.error('Error submitting review:', error);
                showError('ไม่สามารถส่งรีวิวได้');
                hideLoadingOverlay();
            }
        });

    } catch (error) {
        console.warn('Setup review form incomplete:', error);
        updateReviewFormAccess(); // Ensure proper UI state even if setup fails
    }
}


// ฟังก์ชันลบรูปภาพ
function removeImage(button, url) {
    const container = button.closest('.position-relative');
    if (container) {
        container.remove();
        // อาจจะต้องเพิ่มโลจิกสำหรับการลบรูปจากฐานข้อมูลด้วย
    }
}

function showSuccess(message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';
    
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.innerHTML = `
        <div class="toast-header bg-success text-white">
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
        delay: 3000
    });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}

// ปรับปรุงฟังก์ชัน updateReviewStats
function updateReviewStats() {
    if (!currentReviews.length) return;

    let totalRating = 0;
    const ratingDistribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

    currentReviews.forEach(review => {
        totalRating += review.rating;
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    const stats = {
        average_rating: (totalRating / currentReviews.length).toFixed(1),
        total_reviews: currentReviews.length,
        rating_distribution: ratingDistribution
    };

    renderReviewStats(stats);
}






// เพิ่มฟังก์ชันสำหรับรีเฟรชข้อมูลหลังจากส่งรีวิวหรือสนทนา
async function refreshData(courseId) {
    try {
        await Promise.all([
            loadReviews(courseId),
        ]);
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

// ฟังก์ชันสำหรับส่งข้อมูลผ่าน hidden iframe
function submitFormWithIframeAndCallback(action, data, callback) {
    return new Promise((resolve, reject) => {
        try {
            // สร้าง unique ID
            const uniqueId = 'form_' + Date.now();
            const iframeId = 'iframe_' + uniqueId;

            // สร้าง iframe
            const iframe = document.createElement('iframe');
            iframe.setAttribute('id', iframeId);
            iframe.setAttribute('name', iframeId);
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // สร้าง form
            const form = document.createElement('form');
            form.setAttribute('id', uniqueId);
            form.setAttribute('method', 'post');
            form.setAttribute('target', iframeId);
            form.setAttribute('action', `${API_URL}?action=${action}`);

            // เพิ่ม input fields
            Object.keys(data).forEach(key => {
                const input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', key);
                input.setAttribute('value', data[key]);
                form.appendChild(input);
            });

            // เพิ่ม action field
            const actionInput = document.createElement('input');
            actionInput.setAttribute('type', 'hidden');
            actionInput.setAttribute('name', 'action');
            actionInput.setAttribute('value', action);
            form.appendChild(actionInput);

            // จัดการ response
            iframe.onload = () => {
                try {
                    // รอให้ iframe load เสร็จก่อนเรียก callback
                    setTimeout(() => {
                        try {
                            const iframeContent = iframe.contentWindow.document.body.textContent;
                            const result = JSON.parse(iframeContent);
                            resolve(result);
                            if (callback) callback(result);
                        } catch (error) {
                            console.error('Error parsing response:', error);
                            reject(error);
                        }
                        // ลบ elements
                        document.body.removeChild(form);
                        document.body.removeChild(iframe);
                    }, 500);
                } catch (error) {
                    console.error('Error in iframe onload:', error);
                    reject(error);
                }
            };

            // ส่ง form
            document.body.appendChild(form);
            form.submit();

        } catch (error) {
            console.error('Error in submitFormWithIframeAndCallback:', error);
            reject(error);
        }
    });
}




// Initializing app function
function initializeApp() {
    document.addEventListener('DOMContentLoaded', async () => {
          await shareSection.init();
          await shareCourse.init();
          await shareLesson.init();


        showLoadingOverlay();
        checkAuthAndEnrollment();
        initializeEnrollButton();

      
        try {
            await initializeData();
        } catch (error) {
            console.error('Error initializing app:', error);
            showError('ไม่สามารถโหลดข้อมูลคอร์สได้');
        } finally {
            hideLoadingOverlay();
        }
    });
  
}


async function fetchJSON(url, retries = 2, timeout = 5000) {
    const fetchWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    };

    for (let i = 0; i <= retries; i++) {
        try {
            return await fetchWithTimeout();
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
    }
}

function loadCurriculumProgressively(curriculum) {
    const curriculumTab = document.querySelector('#curriculum');
    if (!curriculumTab) return;

    // แสดง skeleton loading
    curriculumTab.innerHTML = generateSkeletonLoading();

    // แบ่งการโหลดเป็นชุด
    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < curriculum.length; i += chunkSize) {
        chunks.push(curriculum.slice(i, i + chunkSize));
    }

    // โหลดทีละชุด
    let currentChunk = 0;
    function loadNextChunk() {
        if (currentChunk >= chunks.length) return;
        
        const section = document.createElement('div');
        section.innerHTML = generateCurriculum(chunks[currentChunk]);
        curriculumTab.appendChild(section);
        
        currentChunk++;
        if (currentChunk < chunks.length) {
            requestAnimationFrame(loadNextChunk);
        }
    }

    requestAnimationFrame(loadNextChunk);
}

// Skeleton loading template
function generateSkeletonLoading() {
    return `
        <div class="skeleton-loading">
            <div class="skeleton-section mb-4">
                <div class="skeleton-header"></div>
                <div class="skeleton-item"></div>
                <div class="skeleton-item"></div>
                <div class="skeleton-item"></div>
            </div>
        </div>
    `;
}


// Error handling function
function handleError(error, userMessage) {
    console.error(error);
    showError(userMessage || 'เกิดข้อผิดพลาดบางอย่าง');
}
// Auto-refresh function with conditional visibility check
function startAutoRefresh(courseId) {
    stopAutoRefresh();
    autoRefreshInterval = setInterval(async () => {
        if (document.visibilityState === 'visible') {
            try {
                await refreshData(courseId);
            } catch (error) {
                handleError(error, 'ไม่สามารถรีเฟรชข้อมูลได้');
            }
        }
    }, 30000);  // Every 30 seconds
}

// Data refreshing function to call both reviews and discussions
async function refreshData(courseId) {
    const [reviewUpdated, discussionUpdated] = await Promise.all([
        refreshReviews(courseId),
    ]);

    if (reviewUpdated) console.log('Reviews updated');
}

// Run app initializer
initializeApp();

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}






function updateSubmitButton(button, isSubmitting) {
    if (!button) return;
    
    button.disabled = isSubmitting;
    button.innerHTML = isSubmitting ? 
        '<span class="spinner-border spinner-border-sm me-2"></span>กำลังส่ง...' : 
        '<i class="bi bi-send"></i> ส่งข้อความ';
}



async function showNotification(data, isReply = false) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    try {
        const notification = new Notification(
            isReply ? "มีการตอบกลับใหม่" : "มีกระทู้ใหม่",
            {
                body: `${data.user_name}: ${data.message.substring(0, 100)}...`,
                icon: data.user_avatar || '/path/to/default-avatar.png',
                tag: `discussion-${data.discussion_id}`
            }
        );

        notification.onclick = () => {
            window.focus();
            const element = document.querySelector(`[data-discussion-id="${data.discussion_id}"]`);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        };
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// เพิ่ม Event Listener สำหรับเมื่อออกจากหน้า
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});





// Helper functions
function highlightStars(rating) {
    document.querySelectorAll('.rating-input .stars i').forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('bi-star');
            star.classList.add('bi-star-fill');
        } else {
            star.classList.remove('bi-star-fill');
            star.classList.add('bi-star');
        }
    });
}


