import React, { useState, useEffect } from "react";
import axios from "axios";
import { useI18n } from "../LanguageContext";

const ReviewForm = ({ roomId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviews, setReviews] = useState([]);
  const token = localStorage.getItem("token");
  const { t } = useI18n();

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/reviews?roomId=${roomId}`,
      );
      setReviews(response.data);
    } catch (err) {
      console.error("Failed to fetch reviews");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      setError(t("review.errorLogin"));
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/reviews",
        { roomId: parseInt(roomId), rating, comment },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(t("review.success"));
      setRating(5);
      setComment("");
      setTimeout(() => {
        fetchReviews();
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t("review.errorLogin"));
    } finally {
      setLoading(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  return (
    <div className="review-form">
      <h3>{t("review.title")}</h3>
      <div className="reviews-stats">
        <p className="average-rating">
          ⭐ {averageRating} / 5.0 ({reviews.length} {t("review.ratingsCount")})
        </p>
      </div>

      <form onSubmit={handleSubmitReview}>
        <div>
          <label>{t("review.ratingLabel")}</label>
          <select
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
          >
            <option value="1">{t("review.poor")}</option>
            <option value="2">{t("review.fair")}</option>
            <option value="3">{t("review.good")}</option>
            <option value="4">{t("review.veryGood")}</option>
            <option value="5">{t("review.excellent")}</option>
          </select>
        </div>
        <div>
          <label>{t("review.commentLabel")}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("review.commentPlaceholder")}
            rows="4"
          />
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? t("review.submitting") : t("review.submit")}
        </button>
      </form>

      <div className="reviews-list">
        <h4>{t("review.recentTitle")}</h4>
        {reviews.length === 0 ? (
          <p>{t("review.noReviews")}</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <p className="review-rating">{"⭐".repeat(review.rating)}</p>
              <p className="review-comment">
                {review.comment || t("review.noComment")}
              </p>
              <p className="review-date">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewForm;
