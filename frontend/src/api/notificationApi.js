import axiosClient from './axiosClient';

const notificationApi = {
    // Lấy danh sách thông báo (phân trang)
    getNotifications(params) {
        return axiosClient.get('/notifications', { params });
    },

    // Đánh dấu 1 thông báo là đã đọc
    markAsRead(id) {
        return axiosClient.patch(`/notifications/${id}/read`);
    },

    // Đánh dấu tất cả là đã đọc
    markAllAsRead() {
        return axiosClient.patch('/notifications/read-all');
    }
};

export default notificationApi;
