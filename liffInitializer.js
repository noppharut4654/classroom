const liffInitializer = {
    isInitialized: false,
    LIFF_ID: "2006490627-0zX7PemZ",
    
    async init() {
        if (this.isInitialized) return true;
        
        try {
            await liff.init({ liffId: this.LIFF_ID });
            this.isInitialized = true;
            console.log('LIFF initialized successfully');
            return true;
        } catch (error) {
            console.error('LIFF initialization failed:', error);
            this.isInitialized = false;
            throw error;
        }
    },

    async share(message) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            if (!liff.isLoggedIn()) {
                await liff.login();
                return;
            }

            const result = await liff.shareTargetPicker([message]);
            if (result) {
                showSuccess('แชร์ข้อมูลเรียบร้อยแล้ว');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Sharing failed:', error);
            showError('ไม่สามารถแชร์ข้อมูลได้: ' + error.message);
            throw error;
        }
    },

    isReady() {
        return this.isInitialized && liff.isLoggedIn();
    }
};

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = liffInitializer;
} else {
    window.liffInitializer = liffInitializer;
}