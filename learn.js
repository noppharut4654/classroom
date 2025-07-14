// Constants & Global Variables
const API_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';

let currentEnrollment = null;
let courseData = null;
let currentLesson = null;
let videoPlayer = null;
let progressUpdateTimeout = null;
let isVideoPlaying = false;

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoadingOverlay();
        await initializeLIFF();
        await loadEnrollmentData();
        setupEventListeners();
        setupMobileNavigation();
        setupProgressTracking();
    } catch (error) {
        console.error('Initialization failed:', error);
        showError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
        hideLoadingOverlay();
    }
});

// LIFF Initialization
async function initializeLIFF() {
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        const profile = await liff.getProfile();
        updateNavbarProfile(profile);
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        throw error;
    }
}

// Navbar Profile Update
function updateNavbarProfile(profile) {
    if (!profile) return;

    const userProfileNav = document.getElementById('userProfileNav');
    const userAvatarNav = document.getElementById('userAvatarNav');
    const userNameNav = document.getElementById('userNameNav');

    if (userProfileNav && userAvatarNav && userNameNav) {
        userProfileNav.classList.remove('d-none');
        userAvatarNav.src = profile.pictureUrl;
        userNameNav.textContent = profile.displayName;
    }
}

// Load Enrollment Data
async function loadEnrollmentData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const enrollmentId = urlParams.get('enrollmentId');
        
        if (!enrollmentId) {
            throw new Error('ไม่พบรหัสการลงทะเบียน');
        }

        const response = await fetch(`${API_URL}?action=getLearningDetail&enrollmentId=${enrollmentId}`);
        const data = await response.json();

        if (data.status === 'success') {
            currentEnrollment = data.data.enrollment;
            courseData = data.data.course;
            updateUI();
            loadFirstOrLastLesson();
            return data;
        } else {
            throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลการลงทะเบียน');
        }
    } catch (error) {
        console.error('Failed to load enrollment data:', error);
        showError('ไม่สามารถโหลดข้อมูลการลงทะเบียน');
        throw error;
    }
}

// UI Updates
function updateUI() {
    const courseTitle = courseData.title_th;
    document.getElementById('courseTitle').textContent = courseTitle;
    document.getElementById('mobileCourseTitle').textContent = courseTitle;
    document.title = `เรียน: ${courseTitle}`;
    
    updateCurriculumList();
    updateProgress();
}

function updateCurriculumList() {
    const generateCurriculumHTML = (containerId) => {
        const container = document.getElementById(containerId);
        let currentSection = null;
        let html = '';

        courseData.curriculum.forEach(lesson => {
            if (currentSection !== lesson.section_number) {
                if (currentSection !== null) html += '</div>';
                currentSection = lesson.section_number;
                html += `
                    <div class="section mb-3">
                        <h6 class="mb-2">Section ${lesson.section_number}: ${lesson.section_title}</h6>
                `;
            }

            const progress = currentEnrollment.progress.find(p => p.curriculum_id === lesson.curriculum_id);
            const isCompleted = progress?.status === 'completed';
            const isInProgress = progress?.status === 'in_progress';
            const progressPercentage = progress?.last_position || 0;

            html += `
                <div class="lesson-item ${isCompleted ? 'completed' : ''} ${isInProgress ? 'active' : ''}"
                     data-lesson-id="${lesson.curriculum_id}"
                     onclick="loadLesson('${lesson.curriculum_id}')">
                    <div class="lesson-info">
                        <span class="lesson-title">
                            <i class="bi ${isCompleted ? 'bi-check-circle-fill text-success' : 
                                        isInProgress ? 'bi-play-circle-fill text-primary' : 
                                        'bi-circle'}"></i>
                            ${lesson.lesson_title}
                        </span>
                        <span class="lesson-duration">
                            <i class="bi bi-clock"></i> ${lesson.duration_minutes} นาที
                        </span>
                    </div>
                    ${isInProgress ? `
                        <div class="progress mt-2" style="height: 4px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${progressPercentage}%">
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        if (currentSection !== null) html += '</div>';
        container.innerHTML = html;
    };

    // Generate for both desktop and mobile
    generateCurriculumHTML('curriculumList');
    generateCurriculumHTML('mobileCurriculumList');
}

// Lesson Loading & Navigation
async function loadLesson(lessonId) {
    try {
        showLoadingOverlay();
        const lesson = courseData.curriculum.find(l => l.curriculum_id === lessonId);
        if (!lesson) throw new Error('ไม่พบบทเรียน');

        currentLesson = lesson;
        updateVideoPlayer(lesson.video_url);
        updateLessonInfo(lesson);
        updateNavigationButtons();
        await updateLearningProgress(lessonId, 'in_progress');
        
        // Scroll to top on mobile
        if (window.innerWidth < 992) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Failed to load lesson:', error);
        showError('ไม่สามารถโหลดบทเรียนได้');
    } finally {
        hideLoadingOverlay();
    }
}

function updateVideoPlayer(videoUrl) {
    const container = document.getElementById('videoContainer');
    
    // Cleanup existing player
    if (videoPlayer) {
        videoPlayer.destroy?.();
        videoPlayer = null;
    }
    
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = videoUrl.includes('youtu.be') 
            ? videoUrl.split('/').pop()
            : new URLSearchParams(new URL(videoUrl).search).get('v');
        container.innerHTML = `
            <iframe id="youtubePlayer"
                    src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
            </iframe>
        `;
        setupYouTubeAPI();
    } else if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.split('/').pop();
        container.innerHTML = `
            <iframe id="vimeoPlayer"
                    src="https://player.vimeo.com/video/${videoId}?api=1&badge=0&byline=0&portrait=0&title=0"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen>
            </iframe>
        `;
        setupVimeoAPI();
    } else {
        container.innerHTML = `
            <video id="videoElement" 
                   controls
                   playsinline
                   controlsList="nodownload"
                   onended="handleVideoComplete()"
                   ontimeupdate="handleVideoProgress(event)">
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
        videoPlayer = document.getElementById('videoElement');
        setupNativeVideoPlayer();
    }
}

function updateLessonInfo(lesson) {
    document.getElementById('currentLessonTitle').textContent = lesson.lesson_title;
    document.getElementById('sectionInfo').textContent = 
        `Section ${lesson.section_number}: ${lesson.section_title}`;
    document.getElementById('lessonDescription').innerHTML = 
        lesson.description || 'ไม่มีคำอธิบายบทเรียน';
    
    // Update active state in curriculum lists
    ['curriculumList', 'mobileCurriculumList'].forEach(listId => {
        const items = document.querySelectorAll(`#${listId} .lesson-item`);
        items.forEach(item => {
            item.classList.toggle('active', item.dataset.lessonId === lesson.curriculum_id);
        });
    });
}

function updateNavigationButtons() {
    const currentIndex = courseData.curriculum.findIndex(l => l.curriculum_id === currentLesson.curriculum_id);
    const prevButton = document.getElementById('prevLesson');
    const nextButton = document.getElementById('nextLesson');

    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === courseData.curriculum.length - 1;

    prevButton.onclick = () => {
        if (currentIndex > 0) {
            loadLesson(courseData.curriculum[currentIndex - 1].curriculum_id);
        }
    };
    nextButton.onclick = () => {
        if (currentIndex < courseData.curriculum.length - 1) {
            loadLesson(courseData.curriculum[currentIndex + 1].curriculum_id);
        }
    };
}

// Progress Tracking
async function updateLearningProgress(lessonId, status, lastPosition = 0) {
    try {
        // Clear existing timeout
        if (progressUpdateTimeout) {
            clearTimeout(progressUpdateTimeout);
        }

        // Debounce progress updates
        progressUpdateTimeout = setTimeout(async () => {
            const url = new URL(API_URL);
            url.searchParams.append('action', 'updateProgress');
            url.searchParams.append('enrollment_id', currentEnrollment.enrollment_id);
            url.searchParams.append('curriculum_id', lessonId);
            url.searchParams.append('status', status);
            url.searchParams.append('last_position', lastPosition);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                mode: 'no-cors'
            });

            // Update local state
            const progressIndex = currentEnrollment.progress.findIndex(p => 
                p.curriculum_id === lessonId
            );
            
            if (progressIndex === -1) {
                currentEnrollment.progress.push({
                    curriculum_id: lessonId,
                    status: status,
                    last_position: lastPosition,
                    updated_at: new Date().toISOString()
                });
            } else {
                currentEnrollment.progress[progressIndex] = {
                    ...currentEnrollment.progress[progressIndex],
                    status: status,
                    last_position: lastPosition,
                    updated_at: new Date().toISOString()
                };
            }

            updateProgress();
            updateCurriculumList();

        }, 1000); // Debounce for 1 second

    } catch (error) {
        console.error('Failed to update progress:', error);
        showError('ไม่สามารถบันทึกความก้าวหน้าได้');
    }
}

function updateProgress() {
    const totalLessons = courseData.curriculum.length;
    const completedLessons = currentEnrollment.progress.filter(p => p.status === 'completed').length;
    const progressPercentage = (completedLessons / totalLessons * 100).toFixed(1);

    // Update both desktop and mobile progress bars
    ['overallProgress', 'mobileOverallProgress'].forEach(id => {
        const progressBar = document.getElementById(id);
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.setAttribute('aria-valuenow', progressPercentage);
        }
    });

    // Update lesson counts
    ['completedLessons', 'mobileCompletedLessons'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = completedLessons;
    });

    ['totalLessons', 'mobileTotalLessons'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = totalLessons;
    });
}

// Video Player Setup & Event Handlers
function setupYouTubeAPI() {
    window.onYouTubeIframeAPIReady = function() {
        videoPlayer = new YT.Player('youtubePlayer', {
            events: {
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        handleVideoComplete();
                    } else if (event.data === YT.PlayerState.PLAYING) {
                        startProgressTracking();
                    } else if (event.data === YT.PlayerState.PAUSED) {
                        stopProgressTracking();
                    }
                }
            }
        });
    };
}

function setupVimeoAPI() {
    const iframe = document.querySelector('#vimeoPlayer');
    videoPlayer = new Vimeo.Player(iframe);

    videoPlayer.on('ended', handleVideoComplete);
    videoPlayer.on('play', startProgressTracking);
    videoPlayer.on('pause', stopProgressTracking);
    videoPlayer.on('timeupdate', data => {
        const progress = (data.seconds / data.duration * 100).toFixed(2);
        handleVideoProgress(progress);
    });
}

function setupNativeVideoPlayer() {
    if (!videoPlayer) return;
    videoPlayer.addEventListener('play', startProgressTracking);
    videoPlayer.addEventListener('pause', stopProgressTracking);
    videoPlayer.addEventListener('ended', handleVideoComplete);
    videoPlayer.addEventListener('timeupdate', (event) => {
        const progress = (event.target.currentTime / event.target.duration * 100).toFixed(2);
        handleVideoProgress(progress);
    });
}

// Progress Tracking Functions
function startProgressTracking() {
    isVideoPlaying = true;
}

function stopProgressTracking() {
    isVideoPlaying = false;
}

function handleVideoProgress(progress) {
    if (!isVideoPlaying) return;

const progressValue = typeof progress === 'number' ? progress : 
        typeof progress === 'object' ? (progress.target.currentTime / progress.target.duration * 100) : 0;

    if (progressValue >= 95) {
        handleVideoComplete();
    } else {
        updateLearningProgress(currentLesson.curriculum_id, 'in_progress', progressValue);
    }
}

function handleVideoComplete() {
    stopProgressTracking();
    updateLearningProgress(currentLesson.curriculum_id, 'completed', 100);

    // Show completion message
    const toast = new bootstrap.Toast(createToast('บทเรียนเสร็จสิ้น', 'success'));
    toast.show();

    // Auto-play next lesson if available
    const currentIndex = courseData.curriculum.findIndex(l => l.curriculum_id === currentLesson.curriculum_id);
    if (currentIndex < courseData.curriculum.length - 1) {
        setTimeout(() => {
            loadLesson(courseData.curriculum[currentIndex + 1].curriculum_id);
        }, 2000);
    }
}

// Mobile Navigation Setup
function setupMobileNavigation() {
    const sidebarToggle = document.querySelector('[data-bs-toggle="offcanvas"]');
    const sidebar = document.getElementById('sidebarMenu');
    
    if (sidebar) {
        const bsOffcanvas = new bootstrap.Offcanvas(sidebar);
        
        // Close sidebar when lesson is selected on mobile
        document.querySelectorAll('.lesson-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth < 992) {
                    bsOffcanvas.hide();
                }
            });
        });

        // Update progress when sidebar is shown
        sidebar.addEventListener('shown.bs.offcanvas', () => {
            updateProgress();
            updateCurriculumList();
        });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) {
            const offcanvas = bootstrap.Offcanvas.getInstance(sidebar);
            if (offcanvas) {
                offcanvas.hide();
            }
        }
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isVideoPlaying) {
            stopProgressTracking();
        }
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
        if (videoPlayer && currentLesson) {
            let progress = 0;
            
            if (videoPlayer.getCurrentTime) { // YouTube
                progress = (videoPlayer.getCurrentTime() / videoPlayer.getDuration() * 100);
            } else if (videoPlayer.currentTime) { // Native video
                progress = (videoPlayer.currentTime / videoPlayer.duration * 100);
            }
            
            updateLearningProgress(currentLesson.curriculum_id, 'in_progress', progress);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName.toLowerCase() === 'input') return;
        
        switch(e.key) {
            case 'ArrowLeft':
                document.getElementById('prevLesson')?.click();
                break;
            case 'ArrowRight':
                document.getElementById('nextLesson')?.click();
                break;
            case ' ':
                if (videoPlayer && videoPlayer.paused !== undefined) {
                    if (videoPlayer.paused) {
                        videoPlayer.play();
                    } else {
                        videoPlayer.pause();
                    }
                    e.preventDefault();
                }
                break;
        }
    });
}

// First/Last Lesson Loading
function loadFirstOrLastLesson() {
    // หาบทเรียนที่กำลังเรียนอยู่
    const inProgressLesson = currentEnrollment.progress.find(p => p.status === 'in_progress');
    
    if (inProgressLesson) {
        loadLesson(inProgressLesson.curriculum_id);
        return;
    }

    // หาบทเรียนที่เรียนจบล่าสุด
    const lastCompleted = currentEnrollment.progress
        .filter(p => p.status === 'completed')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

    if (lastCompleted) {
        const nextLesson = findNextLesson(lastCompleted.curriculum_id);
        if (nextLesson) {
            loadLesson(nextLesson.curriculum_id);
            return;
        }
    }

    // ถ้าไม่มีบทเรียนที่กำลังเรียนหรือเรียนจบ ให้เริ่มจากบทแรก
    loadLesson(courseData.curriculum[0].curriculum_id);
}

// Utility Functions
function findNextLesson(currentLessonId) {
    const currentIndex = courseData.curriculum.findIndex(l => l.curriculum_id === currentLessonId);
    return courseData.curriculum[currentIndex + 1];
}

function createToast(message, type = 'info') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';
    
    toastContainer.innerHTML = `
        <div class="toast" role="alert">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">แจ้งเตือน</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    return toastContainer.querySelector('.toast');
}

// Progress Tracking Setup
function setupProgressTracking() {
    // Set up auto-save interval
    setInterval(() => {
        if (isVideoPlaying && videoPlayer && currentLesson) {
            let progress = 0;
            
            // Get current progress based on player type
            if (videoPlayer.getCurrentTime) { // YouTube
                progress = (videoPlayer.getCurrentTime() / videoPlayer.getDuration() * 100);
            } else if (videoPlayer.currentTime) { // Native video
                progress = (videoPlayer.currentTime / videoPlayer.duration * 100);
            }
            
            // Update progress if playing
            if (progress > 0) {
                updateLearningProgress(
                    currentLesson.curriculum_id,
                    progress >= 95 ? 'completed' : 'in_progress',
                    progress
                );
            }
        }
    }, 30000); // บันทึกทุก 30 วินาที

    // Setup visibility change handler
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopProgressTracking();
        } else if (videoPlayer && !videoPlayer.paused) {
            startProgressTracking();
        }
    });

    // Setup before unload handler
    window.addEventListener('beforeunload', () => {
        if (isVideoPlaying && videoPlayer && currentLesson) {
            let progress = 0;
            
            if (videoPlayer.getCurrentTime) {
                progress = (videoPlayer.getCurrentTime() / videoPlayer.getDuration() * 100);
            } else if (videoPlayer.currentTime) {
                progress = (videoPlayer.currentTime / videoPlayer.duration * 100);
            }
            
            if (progress > 0) {
                // Sync progress before page unload
                updateLearningProgress(
                    currentLesson.curriculum_id,
                    'in_progress',
                    progress
                );
            }
        }
    });
}

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    const toast = bootstrap.Toast.getOrCreateInstance(
        createToast(message, 'danger')
    );
    toast.show();
}

// Handle Logout
async function handleLogout() {
    try {
        showLoadingOverlay();
        await liff.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
        showError('ไม่สามารถออกจากระบบได้');
    } finally {
        hideLoadingOverlay();
    }
}

// Export necessary functions
window.handleLogout = handleLogout;
window.loadLesson = loadLesson;
window.handleVideoComplete = handleVideoComplete;
window.handleVideoProgress = handleVideoProgress;