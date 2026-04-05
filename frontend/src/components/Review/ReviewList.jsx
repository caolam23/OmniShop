import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { socket } from '../../api/socketClient';
import styles from './Review.module.css';

const ReviewList = ({ productId, newReview }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await axiosClient.get(`/reviews/product/${productId}`);
                setReviews(response.data || []);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setLoading(false);
            }
        };
        if (productId) {
            fetchReviews();
        }
    }, [productId]);

    useEffect(() => {
        if (newReview) {
            setReviews(prev => [newReview, ...prev]);
        }
    }, [newReview]);

    // Listen for realtime new reviews via Socket.io
    useEffect(() => {
        const handleNewReview = (review) => {
            console.log('Received new review via Socket:', review);
            // Only add if it belongs to this product
            if (String(review.product) === String(productId)) {
                setReviews(prev => {
                    // Avoid duplicates
                    if (prev.some(r => r._id === review._id)) return prev;
                    return [review, ...prev];
                });
            }
        };

        socket.on('new_review', handleNewReview);
        return () => socket.off('new_review', handleNewReview);
    }, [productId]);

    if (loading) return <div className={styles.loading}>Đang tải đánh giá...</div>;

    return (
        <div className={styles.listContainer}>
            <h4>Khách hàng đánh giá ({reviews.length})</h4>
            {reviews.length === 0 ? (
                <div className={styles.empty}>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</div>
            ) : (
                <div className={styles.reviewsList}>
                    {reviews.map((review) => (
                        <div key={review._id} className={styles.reviewItem}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.userInfo}>
                                    <div className={styles.avatar}>
                                        {review.user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className={styles.username}>{review.user?.username || 'Khách hàng'}</span>
                                </div>
                                <div className={styles.date}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className={styles.starsDisplay}>
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < review.rating ? styles.starOn : styles.starOff}>
                                        &#9733;
                                    </span>
                                ))}
                            </div>
                            {review.comment && <p className={styles.comment}>{review.comment}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewList;
