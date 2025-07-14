// utils.js
async function fetchJSON(url, retries = 2, timeout = 5000) {
    const fetchWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    };

    for (let i = 0; i <= retries; i++) {
        try {
            return await fetchWithTimeout();
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
    }
}

// เพิ่มฟังก์ชันอื่นๆ ที่ใช้ร่วมกัน
function showError(message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';
    
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.innerHTML = `
        <div class="toast-header bg-danger text-white">
            <strong class="me-auto">แจ้งเตือน</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toastElement);
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}

function showSuccess(message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';
    
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.innerHTML = `
        <div class="toast-header bg-success text-white">
            <strong class="me-auto">แจ้งเตือน</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toastElement);
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchJSON, showError, showSuccess };
} else {
    window.utils = { fetchJSON, showError, showSuccess };
}