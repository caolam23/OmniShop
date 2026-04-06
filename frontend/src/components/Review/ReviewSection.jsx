import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Review.module.css';

export default function ReviewSection({ productId }) {
    const [reviews, setReviews] = useState([]);
    const [user, setUser] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { setUser(JSON.parse(userStr)); } catch (err) { }
        }
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/v1/reviews/product/${productId}?limit=10`);
            if (res.data.success) {
                setReviews(res.data.data);
            }
        } catch (error) {
            console.error('Không tải được đánh giá', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(''); // Reset error
        if (rating === 0) {
            setErrorMsg('Vui lòng chọn số sao đánh giá!');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                'http://localhost:3000/api/v1/reviews',
                { product: productId, rating, comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setComment('');
                setRating(0);
                setErrorMsg('');
                // Nạp lại danh sách đánh giá liền mạch
                fetchReviews();
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.reviewSection}>
            <h2 className={styles.sectionTitle}>
                <MessageSquare size={24} color="#4f46e5" />
                Đánh giá sản phẩm ({reviews.length})
            </h2>

            {user ? (
                <form className={styles.reviewForm} onSubmit={handleSubmit}>
                    <div className={styles.ratingInput}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.starBtn} ${(hoverRating || rating) >= star ? styles.starActive : ''}`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                <Star size={28} fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} />
                            </button>
                        ))}
                    </div>
                    <textarea
                        className={styles.commentInput}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        maxLength={500}
                    />

                    {errorMsg && (
                        <div className={styles.errorMsg}>
                            {errorMsg}
                        </div>
                    )}

                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !comment.trim()}>
                        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </form>
            ) : (
                <div className={styles.pleaseLogin}>
                    Vui lòng <Link to="/login" className={styles.loginLink}>đăng nhập</Link> để để lại đánh giá của bạn.
                </div>
            )}

            <div className={styles.reviewList}>
                {reviews.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className={styles.reviewItem}>
                            <div className={styles.avatar}>
                                {review.user?.username ? review.user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className={styles.reviewContent}>
                                <div className={styles.reviewHeader}>
                                    <div className={styles.reviewerName}>{review.user?.username || 'Người dùng ẩn danh'}</div>
                                    <div className={styles.reviewDate}>
                                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                                <div className={styles.stars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={star <= review.rating ? styles.starIcon : styles.starIconEmpty}
                                            fill={star <= review.rating ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                                <div className={styles.comment}>{review.comment}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
