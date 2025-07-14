async function initializeAuth(LIFF_ID) {
    try {
        await liff.init({ liffId: LIFF_ID });
        return liff.isLoggedIn();
    } catch (error) {
        console.error('Failed to initialize LIFF:', error);
        throw error;
    }
}

async function getUserProfile() {
    if (!liff.isLoggedIn()) return null;
    return liff.getProfile();
}

function updateNavbar(profile) {
    const userProfileNav = document.getElementById('userProfileNav');
    const loginButtons = document.getElementById('loginButtons');
    if (profile) {
        userProfileNav.querySelector('#userAvatarNav').src = profile.pictureUrl;
        userProfileNav.querySelector('#userNameNav').textContent = profile.displayName;
        userProfileNav.classList.remove('d-none');
        loginButtons.classList.add('d-none');
    } else {
        userProfileNav.classList.add('d-none');
        loginButtons.classList.remove('d-none');
    }
}
