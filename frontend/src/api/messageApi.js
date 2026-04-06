/**
 * api/messageApi.js
 * 
 * Tập trung toàn bộ API call liên quan tới Messages tại đây.
 * Sử dụng axiosClient đã cấu hình sẵn baseURL và token interceptor.
 * Frontend component không bao giờ gọi axios.get('http://...') trực tiếp.
 */

import axiosClient from './axiosClient';

const messageApi = {
    /**
     * Tải lịch sử tin nhắn của 1 phòng chat
     * @param {string} roomId - userId của Khách hàng
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    getMessagesByRoom: (roomId) => {
        return axiosClient.get(`/messages/${roomId}`);
    },

    /**
     * Tải danh sách tất cả phòng chat (dành cho Staff)
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    getChatRooms: () => {
        return axiosClient.get('/messages/rooms/latest');
    },
};

export default messageApi;
