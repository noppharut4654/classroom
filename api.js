// api.js
const API_URL = 'https://script.google.com/macros/s/AKfycbwqMSPtREoUDM4Nn6hGy_AcmcoHy4dB4tjeX5Fj3VZ5buL2t_YWPuNAbu0nxyKDqqVI/exec';

class CourseAPI {
    static async getAllCourses() {
        try {
            const response = await fetch(`${API_URL}?action=getAllCourses`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching courses:', error);
            throw error;
        }
    }

    static async getCourseDetail(courseId) {
        try {
            const response = await fetch(`${API_URL}?action=getCourseDetail&courseId=${courseId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching course detail:', error);
            throw error;
        }
    }

    static async getPopularCourses() {
        try {
            const response = await fetch(`${API_URL}?action=getPopularCourses`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching popular courses:', error);
            throw error;
        }
    }

    static async getNewCourses() {
        try {
            const response = await fetch(`${API_URL}?action=getNewCourses`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching new courses:', error);
            throw error;
        }
    }

    static async searchCourses(params) {
        try {
            const queryString = new URLSearchParams({
                action: 'searchCourses',
                ...params
            }).toString();
            const response = await fetch(`${API_URL}?${queryString}`);
            return await response.json();
        } catch (error) {
            console.error('Error searching courses:', error);
            throw error;
        }
    }

    static async getFilterOptions() {
        try {
            const response = await fetch(`${API_URL}?action=filterCourses`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching filter options:', error);
            throw error;
        }
    }
}