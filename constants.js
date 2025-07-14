// constants.js
const API_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';
const LIFF_ID = '2006490627-0zX7PemZ';

// Export constants
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_URL, LIFF_ID };
} else {
    window.constants = { API_URL, LIFF_ID };
}