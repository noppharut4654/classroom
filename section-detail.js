// section-detail.js

const API_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';
let courseId;
let courseData;
let userEnrolled = false;
let userEnrollment = null;

async function initializePage() {
    try {
        showLoadingOverlay('กำลังเริ่มต้นระบบ...');
        await liff.init({ liffId: '2006490627-0zX7PemZ' });

        // ตรวจสอบการล็อกอิน
        if (liff.isInClient() || liff.isLoggedIn()) {
            showLoadingOverlay('กำลังโหลดข้อมูลผู้ใช้...');
            const profile = await liff.getProfile();
            document.getElementById('userProfilePicture').src = profile.pictureUrl;
            document.getElementById('userDisplayName').textContent = profile.displayName;
        } else {
            document.getElementById('userProfilePicture').src = 'user.png';
            document.getElementById('userDisplayName').textContent = 'ผู้เยี่ยมชม';
        }

        await loadSectionDetail();
    } catch (error) {
        console.error('Error initializing:', error);
        showError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
        hideLoadingOverlay();
    }
}

async function loadSectionDetail() {
    const params = new URLSearchParams(window.location.search);
    courseId = params.get('courseId');
    const sectionNumber = params.get('sectionNumber');

    try {
        showLoadingOverlay('กำลังโหลดข้อมูลคอร์ส...');

        // ตรวจสอบการลงทะเบียน
        await checkAuthAndEnrollment();

        // โหลดข้อมูลคอร์ส
        courseData = cacheUtils.getCourseData(courseId);
        if (!courseData) {
            showLoadingOverlay('กำลังดึงข้อมูลคอร์สจากเซิร์ฟเวอร์...');
            const response = await fetchJSON(`${API_URL}?action=getCourseDetail&courseId=${courseId}`);
            if (response?.status === 'success' && response.data) {
                courseData = response.data;
                courseData.course_id = courseId;
                cacheUtils.setCourseData(courseData);
            } else {
                throw new Error('ไม่สามารถโหลดข้อมูลคอร์สได้');
            }
        }

        showLoadingOverlay('กำลังเตรียมข้อมูลบทเรียน...');

        const sectionLessons = courseData.curriculum.filter(
            lesson => lesson.section_number.toString() === sectionNumber
        );

        if (!sectionLessons.length) throw new Error('ไม่พบข้อมูล Section');

        updateUI(courseData, sectionLessons, sectionNumber);

        // ตั้งค่าลิงก์สำหรับปุ่มดูรายละเอียดคอร์ส
        document.querySelector('.course-detail-btn').href = `detail.html?id=${courseId}`;

        console.log('Data loaded successfully');

        // เพิ่ม event listener สำหรับปุ่ม "ลงทะเบียนเรียน"
        document.getElementById('enrollButton').addEventListener('click', function() {
            // ปิด Modal
            const enrollModal = bootstrap.Modal.getInstance(document.getElementById('enrollModal'));
            enrollModal.hide();

            // ดึงข้อมูลเพิ่มเติมจาก courseData
            const courseTitle = encodeURIComponent(courseData.title_th || '');
            const coursePrice = encodeURIComponent(courseData.price || '0');
            const duration = encodeURIComponent(courseData.duration_hours || '0');
            const lessons = encodeURIComponent(courseData.total_lessons || '0');

            // นำผู้ใช้ไปยังหน้าลงทะเบียนเรียนพร้อมพารามิเตอร์เพิ่มเติม
            window.location.href = `register.html?courseId=${courseId}&courseTitle=${courseTitle}&coursePrice=${coursePrice}&duration=${duration}&lessons=${lessons}`;
        });

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}


// เพิ่มฟังก์ชันแสดงและซ่อน Loading Overlay
function showLoadingOverlay(message = 'กำลังโหลด...') {
    document.getElementById('loadingOverlay').classList.remove('d-none');
    document.getElementById('loadingStatus').textContent = message;
}


function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('d-none');
}


async function checkAuthAndEnrollment() {
    try {
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            const response = await fetchJSON(`${API_URL}?action=getEnrollmentStatus&lineUserId=${profile.userId}&courseId=${courseId}`);
            if (response?.status === 'success' && response.data) {
                userEnrollment = response.data;
                if (userEnrollment.status === 'approved') {
                    userEnrolled = true;
                }
            }
        }
    } catch (error) {
        console.error('Error checking enrollment:', error);
    }
}

function updateUI(courseData, lessons, sectionNumber) {
    try {
        document.getElementById('courseBreadcrumb').textContent = courseData.title_th;
        document.getElementById('courseBreadcrumb').href = `detail.html?id=${courseData.course_id}`;
        document.getElementById('courseTitle').textContent = courseData.title_th;
        document.getElementById('sectionBreadcrumb').textContent = `Section ${sectionNumber}`;
        document.getElementById('sectionTitle').textContent = lessons[0].section_title;
        document.title = `Section ${sectionNumber}: ${lessons[0].section_title} - ${courseData.title_th}`;

        document.getElementById('totalLessons').textContent = lessons.length;
        document.getElementById('totalDuration').textContent = calculateTotalDuration(lessons);
        const freeLessons = lessons.filter(l => l.is_preview).length;
        document.getElementById('freeLessons').textContent = freeLessons;

        const lessonsList = document.getElementById('lessonsList');
        lessonsList.innerHTML = lessons.map((lesson, index) => {
            const videoInfo = getVideoInfo(lesson.video_url);
            const isPreview = lesson.is_preview;
            const isLocked = !isPreview && !userEnrolled;
            const hasVideo = lesson.video_url && lesson.video_url.trim() !== '';

            let lessonStatusIcon = '';
            if (!hasVideo) {
                // กรณีไม่มีลิงก์วิดีโอ
                lessonStatusIcon = '<span class="text-warning">กำลังอัปเดต</span>';
            } else {
                lessonStatusIcon = `<i class="bi bi-${!isLocked ? 'play-circle-fill text-success' : 'lock-fill text-secondary'}"></i>`;
            }

            return `
                <div class="card lesson-card ${isLocked ? 'locked-lesson' : ''}" onclick="${hasVideo && !isLocked ? `playVideo('${lesson.video_url}', '${lesson.lesson_title}', true)` : ''}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center gap-2">
                                <h5 class="card-title mb-0">
                                    ${index + 1}. ${lesson.lesson_title}
                                </h5>
                                ${isPreview ? '<span class="free-badge">ฟรี</span>' : ''}
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <span class="duration-badge">
                                    <i class="bi bi-clock"></i> ${lesson.duration_minutes} นาที
                                </span>
                                ${lessonStatusIcon}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // ใช้ Lazy Loading สำหรับรูปภาพในบทเรียน
        const images = document.querySelectorAll('img[data-src]');
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => {
            observer.observe(img);
        });

    } catch (error) {
        console.error('Error in updateUI:', error);
        showError('เกิดข้อผิดพลาดในการแสดงผลข้อมูล');
    }
}

function calculateTotalDuration(lessons) {
    let totalSeconds = 0;

    lessons.forEach((lesson) => {
        const durationStr = lesson.duration_minutes.toString();
        const [minStr, secStr] = durationStr.split('.');

        const minutes = parseInt(minStr) || 0;
        const seconds = parseInt(secStr?.padEnd(2, '0')) || 0;

        totalSeconds += (minutes * 60) + seconds;
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`;
    } else if (minutes > 0) {
        return `${minutes} นาที ${seconds} วินาที`;
    } else {
        return `${seconds} วินาที`;
    }
}

function getVideoInfo(videoUrl) {
    if (!videoUrl) return null;

    try {
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoId = videoUrl.includes('youtu.be') 
                ? videoUrl.split('/').pop()
                : new URLSearchParams(new URL(videoUrl).search).get('v');
            return { type: 'youtube', id: videoId };
        } else if (videoUrl.includes('vimeo.com')) {
            const videoId = videoUrl.split('/').pop();
            return { type: 'vimeo', id: videoId };
        } else if (videoUrl.includes('loom.com')) {
            const loomId = videoUrl.match(/(?:share|embed)\/([a-zA-Z0-9]+)/)?.[1];
            if (loomId) return { type: 'loom', id: loomId };
        }
    } catch (error) {
        console.error('Error processing video URL:', error);
    }
    return null;
}

function playVideo(videoUrl, title, isAccessible) {
    if (isAccessible) {
        const videoInfo = getVideoInfo(videoUrl);
        if (videoInfo) {
            window.location.href = `video.html?type=${videoInfo.type}&id=${videoInfo.id}&title=${encodeURIComponent(title)}`;
        }
    } else {
        // แสดง Modal แจ้งเตือน
        const enrollModal = new bootstrap.Modal(document.getElementById('enrollModal'));
        enrollModal.show();
    }
}

function showError(message) {
    // แสดงข้อความแจ้งเตือนด้วย Bootstrap Toast
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';

    const toastElement = document.createElement('div');
    toastElement.className = 'toast align-items-center text-bg-danger border-0';
    toastElement.setAttribute('role', 'alert');
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toastElement);
    document.body.appendChild(toastContainer);

    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // ลบ toast เมื่อหมดเวลา
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}

// ฟังก์ชันสำหรับเรียก API แบบ JSON
async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('Fetch JSON error:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', initializePage);
