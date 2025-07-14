document.addEventListener('DOMContentLoaded', async () => {
    const courseId = new URLSearchParams(window.location.search).get('id');
    if (!courseId) {
        console.error('Course ID not found');
        return;
    }

    try {
        toggleLoading(true);

        const isLoggedIn = await initializeAuth(LIFF_ID);
        const profile = isLoggedIn ? await getUserProfile() : null;

        updateNavbar(profile);
        await Promise.all([loadReviews(courseId), loadDiscussions(courseId)]);
    } catch (error) {
        console.error('Error initializing app:', error);
    } finally {
        toggleLoading(false);
    }
});
