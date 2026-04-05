import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import styles from './Review.module.css';

const ReviewForm = ({ productId, onReviewAdded }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Vui lòng chọn số sao để đánh giá!');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axiosClient.post('/reviews', {
                productId,
                rating,
                comment
            });
            setRating(0);
            setComment('');
            if (onReviewAdded) onReviewAdded(response.data);
        } catch (err) {
            setError(err?.message || 'Có lỗi xảy ra khi gởi đánh giá. Bạn đã đánh giá sản phẩm này chưa?');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className={styles.loginPrompt}>Vui lòng đăng nhập để đánh giá sản phẩm.</div>;
    }

    return (
        <div className={styles.formContainer}>
            <h4>Đánh giá sản phẩm này</h4>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.starRating}>
                    {[...Array(5)].map((star, index) => {
                        index += 1;
                        return (
                            <button
                                type="button"
                                key={index}
                                className={index <= (hover || rating) ? styles.on : styles.off}
                                onClick={() => setRating(index)}
                                onMouseEnter={() => setHover(index)}
                                onMouseLeave={() => setHover(rating)}
                            >
                                <span className={styles.star}>&#9733;</span>
                            </button>
                        );
                    })}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <textarea
                    className={styles.textarea}
                    rows="4"
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={loading}
                />

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || rating === 0}
                >
                    {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
            </form>
        </div>
    );
};

export default ReviewForm;
