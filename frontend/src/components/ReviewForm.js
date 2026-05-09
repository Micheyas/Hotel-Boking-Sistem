import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReviewForm = ({ roomId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviews, setReviews] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/reviews?roomId=${roomId}`
      );
      setReviews(response.data);
    } catch (err) {
      console.error('Failed to fetch reviews');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Please login to submit a review');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/api/reviews',
        { roomId: parseInt(roomId), rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Review submitted successfully!');
      setRating(5);
      setComment('');
      setTimeout(() => {
        fetchReviews();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="review-form">
      <h3>Guest Reviews</h3>
      <div className="reviews-stats">
        <p className="average-rating">⭐ {averageRating} / 5.0 ({reviews.length} reviews)</p>
      </div>

      <form onSubmit={handleSubmitReview}>
        <div>
          <label>Rating:</label>
          <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
            <option value="1">⭐ Poor</option>
            <option value="2">⭐⭐ Fair</option>
            <option value="3">⭐⭐⭐ Good</option>
            <option value="4">⭐⭐⭐⭐ Very Good</option>
            <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
          </select>
        </div>
        <div>
          <label>Comment:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            rows="4"
          />
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      <div className="reviews-list">
        <h4>Recent Reviews</h4>
        {reviews.length === 0 ? (
          <p>No reviews yet</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <p className="review-rating">{'⭐'.repeat(review.rating)}</p>
              <p className="review-comment">{review.comment || 'No comment'}</p>
              <p className="review-date">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewForm;