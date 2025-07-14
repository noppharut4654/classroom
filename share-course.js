const shareCourse = {
async init() {
        try {
            await liffInitializer.init();
            this.addShareButton();
            this.handleShareEvents();
        } catch (error) {
            console.error('Error initializing share course:', error);
        }
    },

    // เพิ่มปุ่มแชร์
    addShareButton() {
        const courseActions = document.querySelector('.card-body');
        if (courseActions) {
            const shareBtnContainer = document.createElement('div');
            shareBtnContainer.className = 'share-btn-container';
            
            const shareBtn = document.createElement('button');
            shareBtn.className = 'btn btn-outline-primary w-100 mb-3 share-btn';
            shareBtn.id = 'shareBtn';
            shareBtn.innerHTML = `
                <i class="bi bi-share"></i>
                <span class="ms-2">แชร์คอร์สนี้</span>
            `;
            
            shareBtnContainer.appendChild(shareBtn);
            
            // แทรกหลังปุ่ม enrollButton
            const enrollButton = document.getElementById('enrollButton');
            if (enrollButton) {
                enrollButton.insertAdjacentElement('afterend', shareBtnContainer);
            } else {
                courseActions.appendChild(shareBtnContainer);
            }
        }
    },

    // จัดการ events สำหรับปุ่มแชร์
    handleShareEvents() {
        document.getElementById('shareBtn')?.addEventListener('click', async (event) => {
            try {
                // เพิ่ม loading state
                const btn = event.target.closest('button');
                const originalContent = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    กำลังแชร์...
                `;

                await this.handleShare();

                // คืนค่าปุ่มเดิม
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }, 1000);

            } catch (error) {
                console.error('Share button error:', error);
                // คืนค่าปุ่มเดิมในกรณีที่เกิดข้อผิดพลาด
                const btn = document.getElementById('shareBtn');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `
                        <i class="bi bi-share"></i>
                        <span class="ms-2">แชร์คอร์สนี้</span>
                    `;
                }
                showError('ไม่สามารถแชร์คอร์สได้ ' + error.message);
            }
        });
    },

    // จัดการการแชร์
//     async handleShare() {
//         try {
//             const courseId = new URLSearchParams(window.location.search).get('id');
//             const cachedCourse = sessionStorage.getItem(`course_${courseId}`);
            
//             if (!cachedCourse) {
//                 showError('ไม่พบข้อมูลคอร์ส');
//                 return;
//             }

//             const courseData = JSON.parse(cachedCourse);
//             courseData.course_id = courseId;

//             // สร้าง Flex Message
//             const flexMessage = this.createFlexMessage(courseData);

//             // เช็คว่า LIFF พร้อมใช้งานหรือไม่
//             if (!liff.isLoggedIn()) {
//                 await liff.login();
//                 return;
//             }

//             // ใช้ Share Target Picker
//             const result = await liff.shareTargetPicker([flexMessage]);
//             if (result) {
//                 showSuccess('แชร์คอร์สเรียบร้อยแล้ว');
//             }
//         } catch (error) {
//             console.error('Error sharing course:', error);
//             showError('ไม่สามารถแชร์คอร์สได้: ' + error.message);
//         }
//     },
  
  async handleShare() {
        try {
            const courseData = cacheUtils.getCourseData();
            if (!courseData) {
                throw new Error('ไม่พบข้อมูลคอร์ส กรุณารีเฟรชหน้าเว็บ');
            }

            const flexMessage = this.createFlexMessage(courseData);
            await liffInitializer.share(flexMessage);

        } catch (error) {
            console.error('Error sharing course:', error);
            showError('ไม่สามารถแชร์คอร์สได้: ' + error.message);
        }
    },

    // สร้าง Flex Message
      createFlexMessage(courseData) {
        const courseUrl = `https://liff.line.me/2006490627-0zX7PemZ/detail.html?id=${courseData.course_id}`;
        
        return {
            type: "flex",
            altText: `${courseData.title_th} - เรียนรู้ออนไลน์`,
            contents: {
                type: "bubble",
                size: "mega",
               
                hero: {
                    type: "image",
                    url: courseData.preview_url || "https://placehold.co/600x400",
                    size: "full",
                    aspectRatio: "20:13",
                    aspectMode: "cover",
                    action: {
                        type: "uri",
                        uri: courseUrl
                    }
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "lg",
                    contents: [
                        {
                            type: "text",
                            text: courseData.title_th,
                            size: "xl",
                            weight: "bold",
                            wrap: true,
                            color: "#2B2B2B"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ราคา",
                                            size: "sm",
                                            color: "#AAAAAA",
                                            flex: 1
                                        },
                                        {
                                            type: "text",
                                            text: `฿${Number(courseData.price).toLocaleString()}`,
                                            size: "lg",
                                            color: "#EC4C47",
                                            flex: 4,
                                            weight: "bold"
                                        }
                                    ]
                                },
                                {
                                    type: "separator",
                                    margin: "lg"
                                },
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    contents: [
                                        {
                                            type: "box",
                                            layout: "vertical",
                                            contents: [
                                                {
                                                    type: "text",
                                                    text: "ระยะเวลา",
                                                    size: "sm",
                                                    color: "#AAAAAA"
                                                },
                                                {
                                                    type: "text",
                                                    text: `${courseData.duration_hours} ชั่วโมง`,
                                                    size: "sm",
                                                    color: "#2B2B2B",
                                                    weight: "bold",
                                                    margin: "sm"
                                                }
                                            ]
                                        },
                                        {
                                            type: "box",
                                            layout: "vertical",
                                            contents: [
                                                {
                                                    type: "text",
                                                    text: "จำนวนบทเรียน",
                                                    size: "sm",
                                                    color: "#AAAAAA"
                                                },
                                                {
                                                    type: "text",
                                                    text: `${courseData.total_lessons} บท`,
                                                    size: "sm",
                                                    color: "#2B2B2B",
                                                    weight: "bold",
                                                    margin: "sm"
                                                }
                                            ]
                                        }
                                    ],
                                    margin: "lg",
                                    spacing: "lg"
                                }
                            ]
                        }
                    ],
                    paddingAll: "lg"
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "button",
                            action: {
                                type: "uri",
                                label: "ดูรายละเอียดคอร์ส",
                                uri: courseUrl
                            },
                            style: "primary",
                            color: "#EC4C47",
                            height: "md"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "เรียนได้ตลอดชีพ ไม่มีหมดอายุ",
                                    size: "xs",
                                    color: "#AAAAAA",
                                    align: "center",
                                    margin: "md"
                                }
                            ]
                        }
                    ],
                    paddingAll: "lg"
                },
                styles: {
                    footer: {
                        separator: false
                    }
                }
            }
        };
    }
};

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = shareCourse;
} else {
    window.shareCourse = shareCourse;
}