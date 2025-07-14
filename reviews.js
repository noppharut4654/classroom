// reviews.js
let currentUserRating = 0;
let currentReviews = [];
let reviewState = {
    originalReviews: [],
    filteredReviews: [],
    sortBy: 'newest',
    filterRating: 'all',
    isRefreshing: false
};

// Review Functions
async function setupReviewForm() {
    const form = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('.rating-input .stars i');
    
    if (!form || !stars.length) return;

    try {
        const courseId = new URLSearchParams(window.location.search).get('id');
        const profile = await liff.getProfile();
        
        const existingReview = currentReviews.find(review => review.user_id === profile.userId);
        
        if (existingReview) {
            currentUserRating = existingReview.rating;
            form.querySelector('textarea[name="comment"]').value = existingReview.comment;
            highlightStars(currentUserRating);
            
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
                    console.error('Error parsing image URLs:', error);
                }
            }
            
            form.querySelector('button[type="submit"]').innerHTML = '<i class="bi bi-pencil"></i> แก้ไขรีวิว';
        }

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

        const imageInput = form.querySelector('input[type="file"]');
        if (imageInput) {
            imageInput.addEventListener('change', handleImageUpload);
        }

        form.addEventListener('submit', handleReviewSubmit);

    } catch (error) {
        console.error('Error setting up review form:', error);
        showError('ไม่สามารถโหลดข้อมูลรีวิว');
    }
}

async function handleImageUpload(e) {
    const files = Array.from(e.target.files).slice(0, 2);
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
            console.error('Error processing image:', error);
            showError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
        }
    }
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    
    if (!currentUserRating) {
        showError('กรุณาให้คะแนน');
        return;
    }

    const comment = e.target.querySelector('textarea[name="comment"]').value.trim();
    if (!comment) {
        showError('กรุณาเขียนความคิดเห็น');
        return;
    }

    try {
        showLoadingOverlay();
        
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

        const courseId = new URLSearchParams(window.location.search).get('id');
        const profile = await liff.getProfile();

        await submitReviewData({
            courseId,
            userId: profile.userId,
            rating: currentUserRating,
            comment,
            images
        });

        // Reset form
        e.target.reset();
        currentUserRating = 0;
        highlightStars(0);
        document.getElementById('imagePreview').innerHTML = '';
        e.target.querySelector('button[type="submit"]').innerHTML = '<i class="bi bi-send"></i> ส่งรีวิว';
        
        await loadReviews(courseId);
        showSuccess('ส่งรีวิวเรียบร้อยแล้ว');

    } catch (error) {
        console.error('Error submitting review:', error);
        showError('ไม่สามารถส่งรีวิวได้');
    } finally {
        hideLoadingOverlay();
    }
}
