const shareSection = {
    async init() {
        try {
            await liffInitializer.init();
            this.addShareButtonsToSections();
            this.handleShareEvents();
        } catch (error) {
            console.error('Error initializing share course:', error);
        }
    },

    addShareButtonsToSections() {
        const sections = document.querySelectorAll('.curriculum-section');
        sections.forEach(section => {
            if (!section.querySelector('.share-section-btn')) {
                const shareBtn = document.createElement('button');
                shareBtn.className = 'btn btn-sm btn-outline-primary share-section-btn ms-2';
                shareBtn.innerHTML = '<i class="bi bi-share"></i> แชร์';
                
                // เก็บ section number จาก header
                const sectionHeader = section.querySelector('h4');
                const sectionNumber = sectionHeader?.textContent.match(/Section (\d+):/)?.[1];
                if (sectionNumber) {
                    shareBtn.setAttribute('data-section', sectionNumber);
                    sectionHeader.appendChild(shareBtn);
                }
            }
        });
    },

    handleShareEvents() {
        document.addEventListener('click', async (event) => {
            const shareBtn = event.target.closest('.share-section-btn');
            if (!shareBtn) return;

            try {
                const btn = shareBtn;
                const originalContent = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

                const sectionNumber = btn.getAttribute('data-section');
                await this.handleShare(sectionNumber);

                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }, 1000);

            } catch (error) {
                console.error('Share section error:', error);
                showError('ไม่สามารถแชร์ Section ได้ ' + error.message);
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="bi bi-share"></i> แชร์';
            }
        });
    },

//     async handleShare(sectionNumber) {
//         try {
//             const courseData = cacheUtils.getCourseData();
//             if (!courseData) {
//                 throw new Error('ไม่พบข้อมูลคอร์ส กรุณารีเฟรชหน้าเว็บ');
//             }

//             const sectionLessons = this.getSectionLessons(courseData.curriculum, sectionNumber);
//             if (!sectionLessons.length) {
//                 throw new Error('ไม่พบข้อมูล Section');
//             }

//             const flexMessage = this.createSectionFlexMessage(sectionLessons, courseData, sectionNumber);
//             await liffInitializer.share(flexMessage);

//         } catch (error) {
//             console.error('Error sharing section:', error);
//             throw error;
//         }
//     },
  
  async handleShare(sectionNumber) {
    try {
        const courseData = cacheUtils.getCourseData();
        if (!courseData) {
            throw new Error('ไม่พบข้อมูลคอร์ส กรุณารีเฟรชหน้าเว็บ');
        }

        // แทนที่การใช้ `sectionNumber` ที่ส่งเข้ามา
        const sectionLessons = this.getSectionLessons(courseData.curriculum, sectionNumber);
        if (!sectionLessons.length) {
            throw new Error('ไม่พบข้อมูล Section');
        }

        // ปรับปรุงการเรียกใช้ฟังก์ชัน
        const flexMessage = this.createSectionFlexMessage(sectionLessons, courseData);
        await liffInitializer.share(flexMessage);

    } catch (error) {
        console.error('Error sharing section:', error);
        throw error;
    }
},


    getSectionLessons(curriculum, sectionNumber) {
        return curriculum.filter(lesson => lesson.section_number.toString() === sectionNumber);
    },

    truncateText(text, maxLength = 40) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
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
                    id: videoId
                };
            } else if (videoUrl.includes('vimeo.com')) {
                const videoId = videoUrl.split('/').pop();
                return {
                    type: 'vimeo',
                    id: videoId
                };
            } else if (videoUrl.includes('loom.com')) {
                const loomId = videoUrl.match(/(?:share|embed)\/([a-zA-Z0-9]+)/)?.[1];
                if (loomId) {
                    return {
                        type: 'loom',
                        id: loomId
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error processing video URL:', error);
            return null;
        }
    },

    calculateSectionDuration(lessons) {
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
    },

  createSectionFlexMessage(lessons, courseData) {
    // ดึงค่า sectionNumber และ sectionTitle จาก lessons[0]
    const sectionNumber = lessons[0]?.section_number || '';
    const sectionTitle = lessons[0]?.section_title || `Section ${sectionNumber}`;
    
    const courseUrl = `https://liff.line.me/2006490627-0zX7PemZ/section-detail.html?courseId=${courseData.course_id}&sectionNumber=${sectionNumber}`;
    
    // คำนวณเวลารวมของ Section
    const totalDuration = this.calculateSectionDuration(lessons);
    
    // นับจำนวนบทเรียนฟรีที่มีวิดีโอ
    const freeVideos = lessons.filter(lesson => lesson.is_preview && this.getVideoEmbedUrl(lesson.video_url)).length;
  
    const maxLessons = 5;
    const displayLessons = lessons.slice(0, maxLessons);
    const remainingCount = lessons.length - maxLessons;

    // สร้าง contents สำหรับแต่ละบทเรียน
    const lessonContents = displayLessons.map((lesson, index) => {
        // ตรวจสอบวิดีโอสำหรับบทเรียนฟรี
        const videoInfo = lesson.is_preview ? this.getVideoEmbedUrl(lesson.video_url) : null;
        const videoUrl = videoInfo ? 
            `https://liff.line.me/2006490627-0zX7PemZ/video.html?type=${videoInfo.type}&id=${videoInfo.id}&title=${encodeURIComponent(lesson.lesson_title)}` : 
            null;

        // สร้างส่วนประกอบของบทเรียน
        const lessonContent = {
            type: "box",
            layout: "horizontal",
            contents: [
                {
                    type: "text",
                    text: `${index + 1}.`,
                    size: "sm",
                    color: "#999999",
                    flex: 0,
                    margin: "sm"
                },
                {
                    type: "text",
                    text: this.truncateText(lesson.lesson_title),
                    size: "sm",
                    color: "#666666",
                    flex: 5,
                    wrap: true,
                    margin: "sm"
                }
            ],
            margin: "md"
        };

        // เพิ่มปุ่ม "ดูฟรี" หรือไอคอนล็อก
        if (lesson.is_preview) {
            if (videoUrl) {
                // มี videoUrl ให้สร้างปุ่มที่คลิกได้
                lessonContent.contents.push({
                    type: "box",
                    layout: "vertical",
                    flex: 1,
                    contents: [{
                        type: "text",
                        text: "ดูฟรี",
                        size: "sm",
                        color: "#27AE60",
                        align: "end",
                        weight: "bold",
                        decoration: "underline",
                        action: {
                            type: "uri",
                            label: "ดูฟรี",
                            uri: videoUrl
                        }
                    }]
                });
            } else {
                // ไม่มี videoUrl แต่เป็นบทเรียนฟรี แสดงข้อความ "ฟรี"
                lessonContent.contents.push({
                    type: "text",
                    text: "ฟรี",
                    size: "sm",
                    color: "#27AE60",
                    flex: 1,
                    align: "end",
                    weight: "bold"
                });
            }
        } else {
            // บทเรียนที่ไม่ฟรี แสดงไอคอนล็อก
            lessonContent.contents.push({
                type: "text",
                text: "⚿",
                size: "sm",
                color: "#EC4C47",
                flex: 1,
                align: "end"
            });
        }

        return lessonContent;
    });

    // เพิ่มข้อความแสดงจำนวนบทเรียนที่เหลือ
    if (remainingCount > 0) {
        lessonContents.push({
            type: "text",
            text: `และอีก ${remainingCount} บทเรียน...`,
            size: "sm",
            color: "#999999",
            margin: "md",
            align: "center",
            style: "italic"
        });
    }

    // สร้าง Flex Message
    return {
        type: "flex",
        altText: `${sectionTitle} - ${courseData.title_th}`,
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
                        text: courseData.title_th,
                        weight: "bold",
                        color: "#ffffff",
                        size: "md",
                        wrap: true
                    }
                ]
            },
            hero: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#2B1B7E",
                paddingAll: "15px",
                contents: [
                    {
                        type: "text",
                        text: `Section ${sectionNumber}: ${sectionTitle}`,
                        weight: "regular",
                        color: "#ffffff",
                        size: "sm",
                        wrap: true
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        margin: "md",
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                flex: 1,
                                contents: [
                                    {
                                        type: "text",
                                        text: "จำนวนบทเรียน",
                                        color: "#ffffff",
                                        size: "xs",
                                        weight: "regular"
                                    },
                                    {
                                        type: "text",
                                        text: `${lessons.length} บท`,
                                        color: "#ffffff",
                                        size: "sm",
                                        weight: "bold",
                                        margin: "sm"
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                flex: 1,
                                contents: [
                                    {
                                        type: "text",
                                        text: "ระยะเวลารวม",
                                        color: "#ffffff",
                                        size: "xs",
                                        weight: "regular"
                                    },
                                    {
                                        type: "text",
                                        text: totalDuration,
                                        color: "#ffffff",
                                        size: "sm",
                                        weight: "bold",
                                        margin: "sm"
                                    }
                                ]
                            }
                        ]
                    },
                    freeVideos > 0 ? {
                        type: "text",
                        text: `มีบทเรียนที่ดูฟรีได้ ${freeVideos} บท`,
                        color: "#9FE870",
                        size: "xs",
                        weight: "bold",
                        margin: "md"
                    } : undefined
                ].filter(Boolean)
            },
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "15px",
                contents: lessonContents
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                    {
                        type: "button",
                        action: {
                            type: "uri",
                            label: "ดูรายละเอียดทั้งหมด",
                            uri: courseUrl
                        },
                        style: "primary",
                        color: "#2B1B7E"
                    }
                ],
                paddingAll: "15px"
            }
        }
    };
},


};

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = shareSection;
} else {
    window.shareSection = shareSection;
}
