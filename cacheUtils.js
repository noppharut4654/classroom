// cacheUtils.js

const CACHE_DURATION = 60 * 60 * 1000; // 5 นาที

const cacheUtils = {
    getCache(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > CACHE_DURATION) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    },

    setCache(key, data) {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Cache write error:', error);
        }
    },

    getCourseData(courseId = null) {
        try {
            if (!courseId) {
                courseId = new URLSearchParams(window.location.search).get('id');
            }
            if (!courseId) return null;
            return this.getCache(`course_${courseId}`);
        } catch (error) {
            console.error('Error getting course data:', error);
            return null;
        }
    },

    setCourseData(courseData) {
        if (!courseData) return;
        try {
            const courseId = courseData.course_id;
            if (!courseId) return;
            const cacheKey = `course_${courseId}`;
            console.log('Setting cache for:', cacheKey);
            this.setCache(cacheKey, courseData);
        } catch (error) {
            console.error('Error setting course data:', error);
        }
    },
  
  
  
  getUserEnrollment(lineUserId, courseId) {
        try {
            const key = `enrollment_${lineUserId}_${courseId}`;
            return this.getCache(key);
        } catch (error) {
            console.error('Error getting user enrollment:', error);
            return null;
        }
    },

    setUserEnrollment(lineUserId, courseId, data) {
        try {
            const key = `enrollment_${lineUserId}_${courseId}`;
            this.setCache(key, data);
        } catch (error) {
            console.error('Error setting user enrollment:', error);
        }
    }

  
};



if (typeof module !== 'undefined' && module.exports) {
    module.exports = cacheUtils;
} else {
    window.cacheUtils = cacheUtils;
}
