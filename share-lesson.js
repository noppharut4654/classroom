const shareLesson = {
    async init() {
        try {
            await liffInitializer.init();
            this.addShareButtonsToLessons();
            this.handleShareEvents();
        } catch (error) {
            console.error('Error initializing LIFF:', error);
        }
    },

    addShareButtonsToLessons() {
        const lessonItems = document.querySelectorAll('.lesson-item');
        lessonItems.forEach(item => {
            if (item.querySelector('.lesson-actions') && !item.querySelector('.share-lesson-btn')) {
                const shareBtn = document.createElement('button');
                shareBtn.className = 'btn btn-sm btn-outline-secondary share-lesson-btn ms-2';
                shareBtn.innerHTML = '<i class="bi bi-share"></i>';
                shareBtn.title = 'แชร์บทเรียนนี้';
                shareBtn.setAttribute('data-lesson-id', item.dataset.lessonId);
                
                const actionsDiv = item.querySelector('.lesson-actions');
                actionsDiv.insertBefore(shareBtn, actionsDiv.firstChild);
            }
        });
    },

    handleShareEvents() {
        document.addEventListener('click', async (event) => {
            const shareBtn = event.target.closest('.share-lesson-btn');
            if (!shareBtn) return;

            try {
                const btn = shareBtn;
                const originalContent = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

                const lessonId = btn.getAttribute('data-lesson-id');
                await this.handleShare(lessonId);

                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }, 1000);

            } catch (error) {
                console.error('Share lesson error:', error);
                showError('ไม่สามารถแชร์บทเรียนได้ ' + error.message);
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="bi bi-share"></i>';
            }
        });
    },

    async handleShare(lessonId) {
        try {
            const courseData = cacheUtils.getCourseData();
            if (!courseData) {
                throw new Error('ไม่พบข้อมูลคอร์ส กรุณารีเฟรชหน้าเว็บ');
            }

            const lesson = this.findLessonById(courseData.curriculum, lessonId);
            if (!lesson) {
                throw new Error('ไม่พบข้อมูลบทเรียน');
            }

            const flexMessage = this.createLessonFlexMessage(lesson, courseData);
            await liffInitializer.share(flexMessage);

        } catch (error) {
            console.error('Error sharing lesson:', error);
            throw error;
        }
    },

    findLessonById(curriculum, lessonId) {
        return curriculum.find(lesson => lesson.curriculum_id === lessonId) || null;
    },

    getVideoEmbedUrl(videoUrl) {
        try {
            if (!videoUrl) return null;

            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                const videoId = videoUrl.includes('youtu.be') 
                    ? videoUrl.split('/').pop()
                    : new URLSearchParams(new URL(videoUrl).search).get('v');
                return {
                    type: 'youtube',
                    id: videoId,
                    url: `https://www.youtube.com/embed/${videoId}?autoplay=1`
                };
            } else if (videoUrl.includes('vimeo.com')) {
                const videoId = videoUrl.split('/').pop();
                return {
                    type: 'vimeo',
                    id: videoId,
                    url: `https://player.vimeo.com/video/${videoId}?autoplay=1`
                };
            } else if (videoUrl.includes('loom.com')) {
                // ตรวจจับ Loom video ID จาก URL
                const loomId = videoUrl.match(/(?:share|embed)\/([a-zA-Z0-9]+)/)?.[1];
                if (loomId) {
                    return {
                        type: 'loom',
                        id: loomId,
                        url: `https://www.loom.com/embed/${loomId}`
                    };
                }
            }
            return {
                type: 'other',
                url: videoUrl
            };
        } catch (error) {
            console.error('Error processing video URL:', error);
            return null;
        }
    },

    createLessonFlexMessage(lesson, courseData) {
        const courseUrl = `https://liff.line.me/2006490627-0zX7PemZ/detail.html?id=${courseData.course_id}`;
        const videoInfo = lesson.is_preview ? this.getVideoEmbedUrl(lesson.video_url) : null;

        // ปรับ URI ของปุ่มตามประเภทวิดีโอ
        const actionButton = lesson.is_preview && videoInfo ? {
            type: "button",
            action: {
                type: "uri",
                label: "ดูบทเรียนฟรี",
                uri: videoInfo.type === 'other' 
                    ? courseUrl 
                    : `https://liff.line.me/2006490627-0zX7PemZ/video.html?type=${videoInfo.type}&id=${videoInfo.id}&title=${encodeURIComponent(lesson.lesson_title)}`
            },
            style: "primary",
            color: "#27AE60"
        } : {
            type: "button",
            action: {
                type: "uri",
                label: "ดูรายละเอียด",
                uri: courseUrl
            },
            style: "primary",
            color: "#2B1B7E"
        };

        return {
            type: "flex",
            altText: `${lesson.lesson_title} - ${courseData.title_th}`,
            contents: {
                type: "bubble",
                header: {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#2B1B7E",
                    paddingAll: "15px",
                    contents: [
                        {
                            type: "text",
                            text: "บทเรียน",
                            weight: "bold",
                            color: "#ffffff",
                            size: "lg"
                        }
                    ]
                },
                hero: {
                    type: "box",
                    layout: "vertical",
                    paddingAll: "15px",
                    backgroundColor: "#2B1B7E",
                    contents: [
                        {
                            type: "text",
                            text: courseData.title_th,
                            weight: "regular",
                            color: "#ffffff",
                            size: "sm",
                            wrap: true
                        }
                    ]
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    paddingAll: "15px",
                    contents: [
                        {
                            type: "text",
                            text: lesson.lesson_title,
                            weight: "bold",
                            color: "#1A1A1A",
                            size: "md",
                            wrap: true
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            margin: "md",
                            contents: [
                                {
                                    type: "text",
                                    text: "ระยะเวลา",
                                    size: "sm",
                                    color: "#999999",
                                    flex: 1
                                },
                                {
                                    type: "text",
                                    text: `${lesson.duration_minutes} นาที`,
                                    size: "sm",
                                    color: "#666666",
                                    align: "end"
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            contents: [
                                {
                                    type: "text",
                                    text: lesson.is_preview ? "ดูได้ฟรี" : "สมาชิกเท่านั้น",
                                    size: "sm",
                                    color: lesson.is_preview ? "#27AE60" : "#EC4C47",
                                    weight: "bold",
                                    align: "start"
                                }
                            ],
                            margin: "md"
                        },
                        videoInfo && lesson.is_preview ? {
                            type: "text",
                            text: `แหล่งที่มา: ${videoInfo.type.toUpperCase()}`,
                            size: "xs",
                            color: "#999999",
                            margin: "md"
                        } : null
                    ].filter(Boolean)
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [actionButton],
                    paddingAll: "15px"
                }
            }
        };
    }
};

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = shareLesson;
} else {
    window.shareLesson = shareLesson;
}