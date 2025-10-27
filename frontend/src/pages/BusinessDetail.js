import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { businessService, appointmentService, reviewService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import './BusinessDetail.css';

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  useEffect(() => {
    if (appointmentDate && business) {
      fetchAvailableSlots();
    }
  }, [appointmentDate]);

  const fetchBusiness = async () => {
    try {
      const response = await businessService.getById(id);
      setBusiness(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await appointmentService.getAvailableSlots(id, appointmentDate);
      setAvailableSlots(response.data.slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedService || !appointmentDate || !appointmentTime) {
      setBookingError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      await appointmentService.create({
        business_id: parseInt(id),
        service_id: selectedService,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes
      });

      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (error) {
      setBookingError(error.response?.data?.error || 'Randevu oluşturulamadı');
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (!business) return <div className="error">İşletme bulunamadı</div>;

  return (
    <div className="business-detail-container">
      <div className="business-header">
        <div className="business-header-image">
          {business.image_url ? (
            <img src={business.image_url} alt={business.name} />
          ) : (
            <div className="placeholder-header">{business.name.charAt(0)}</div>
          )}
        </div>
        <div className="business-header-info">
          <h1>{business.name}</h1>
          <p className="business-type">{business.type}</p>
          <p className="business-description">{business.description}</p>
          <div className="business-details">
            <p><strong>📍</strong> {business.address}</p>
            <p><strong>📞</strong> {business.phone}</p>
            <p><strong>🕐</strong> {business.opening_time} - {business.closing_time}</p>
          </div>
          <div className="business-rating">
            <span className="stars">{'⭐'.repeat(Math.round(business.average_rating))}</span>
            <span className="rating-value">{business.average_rating > 0 ? business.average_rating.toFixed(1) : 'Henüz değerlendirme yok'}</span>
            <span className="review-count">({business.review_count} yorum)</span>
          </div>
        </div>
      </div>

      <div className="business-content">
        <div className="services-section">
          <h2>Hizmetler</h2>
          {business.services && business.services.length > 0 ? (
            <div className="services-list">
              {business.services.map(service => (
                <div key={service.id} className="service-item">
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="service-details">
                      <span className="service-price">{service.price} TL</span>
                      <span className="service-duration">{service.duration} dakika</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Henüz hizmet eklenmemiş</p>
          )}
        </div>

        <div className="booking-section">
          <h2>Randevu Al</h2>
          {bookingSuccess ? (
            <div className="success-message">
              Randevunuz başarıyla oluşturuldu! Yönlendiriliyorsunuz...
            </div>
          ) : (
            <form onSubmit={handleBookAppointment} className="booking-form">
              {bookingError && <div className="error-message">{bookingError}</div>}
              
              <div className="form-group">
                <label>Hizmet Seçin</label>
                <select 
                  value={selectedService || ''} 
                  onChange={(e) => setSelectedService(parseInt(e.target.value))}
                  required
                >
                  <option value="">Hizmet seçin</option>
                  {business.services?.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.price} TL ({service.duration} dk)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tarih</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {appointmentDate && (
                <div className="form-group">
                  <label>Saat</label>
                  <select 
                    value={appointmentTime} 
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                  >
                    <option value="">Saat seçin</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Notlar (İsteğe bağlı)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Özel isteklerinizi yazabilirsiniz..."
                  rows="3"
                />
              </div>

              <button type="submit" className="btn-primary">
                Randevu Oluştur
              </button>
            </form>
          )}
        </div>

        <div className="reviews-section">
          <h2>Yorumlar</h2>
          {business.reviews && business.reviews.length > 0 ? (
            <div className="reviews-list">
              {business.reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.customer_name}</span>
                    <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>Henüz yorum yok</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
