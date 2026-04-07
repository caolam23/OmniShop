import axiosClient from './axiosClient';

const orderApi = {
    // Khách hàng đặt hàng (gọi API Transaction)
    checkout: (data) => {
        return axiosClient.post('/orders/checkout', data);
    },

    // Khách hàng xem lịch sử đơn của mình
    getMyOrders: () => {
        return axiosClient.get('/orders/my-orders');
    },

    // Admin/Staff xem tất cả đơn hàng (có filter, phân trang)
    getAllOrders: (params) => {
        return axiosClient.get('/orders', { params });
    },

    // Xem chi tiết 1 đơn hàng (kèm danh sách sản phẩm)
    getOrderById: (id) => {
        return axiosClient.get(`/orders/${id}`);
    },

    // Admin/Staff cập nhật trạng thái đơn
    updateStatus: (id, status) => {
        return axiosClient.patch(`/orders/${id}/status`, { status });
    },

    // Admin xuất Excel — trả về blob để tải file
    exportExcel: () => {
        return axiosClient.get('/orders/export', { responseType: 'blob' });
    },
};

export default orderApi;
