import React, { useState, useEffect } from 'react';
import { businessService, serviceService } from '../services';
import './MyBusiness.css';

const MyBusiness = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    type: 'berber',
    description: '',
    address: '',
    phone: '',
    image_url: '',
    opening_time: '09:00',
    closing_time: '18:00'
  });
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30'
  });
  const [error, setError] = useState('');

  const businessTypes = [
    { value: 'berber', label: 'Berber' },
    { value: 'kuafor', label: 'Kuaför' },
    { value: 'dovmeci', label: 'Dövmeci' },
    { value: 'guzellik', label: 'Güzellik Merkezi' }
  ];

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await businessService.getMyBusinesses();
      setBusinesses(response.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await businessService.create(businessFormData);
      setShowBusinessForm(false);
      setBusinessFormData({
        name: '',
        type: 'berber',
        description: '',
        address: '',
        phone: '',
        image_url: '',
        opening_time: '09:00',
        closing_time: '18:00'
      });
      fetchBusinesses();
    } catch (error) {
      setError(error.response?.data?.error || 'İşletme oluşturulamadı');
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await serviceService.create({
        ...serviceFormData,
        business_id: selectedBusiness,
        price: parseFloat(serviceFormData.price),
        duration: parseInt(serviceFormData.duration)
      });
      setShowServiceForm(false);
      setServiceFormData({
        name: '',
        description: '',
        price: '',
        duration: '30'
      });
      setSelectedBusiness(null);
      fetchBusinesses();
    } catch (error) {
      setError(error.response?.data?.error || 'Hizmet eklenemedi');
    }
  };

  const handleDeleteBusiness = async (id) => {
    if (window.confirm('Bu işletmeyi silmek istediğinizden emin misiniz?')) {
      try {
        await businessService.delete(id);
        fetchBusinesses();
      } catch (error) {
        alert('İşletme silinemedi');
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      try {
        await serviceService.delete(serviceId);
        fetchBusinesses();
      } catch (error) {
        alert('Hizmet silinemedi');
      }
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="my-business-container">
      <div className="page-header">
        <h1>İşletmelerim</h1>
        <button 
          onClick={() => setShowBusinessForm(true)} 
          className="btn-primary"
        >
          + Yeni İşletme Ekle
        </button>
      </div>

      {showBusinessForm && (
        <div className="modal-overlay" onClick={() => setShowBusinessForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni İşletme Ekle</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleBusinessSubmit}>
              <div className="form-group">
                <label>İşletme Adı *</label>
                <input
                  type="text"
                  value={businessFormData.name}
                  onChange={(e) => setBusinessFormData({...businessFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tür *</label>
                <select
                  value={businessFormData.type}
                  onChange={(e) => setBusinessFormData({...businessFormData, type: e.target.value})}
                  required
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={businessFormData.description}
                  onChange={(e) => setBusinessFormData({...businessFormData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Adres</label>
                <input
                  type="text"
                  value={businessFormData.address}
                  onChange={(e) => setBusinessFormData({...businessFormData, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={businessFormData.phone}
                  onChange={(e) => setBusinessFormData({...businessFormData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Görsel URL</label>
                <input
                  type="url"
                  value={businessFormData.image_url}
                  onChange={(e) => setBusinessFormData({...businessFormData, image_url: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Açılış Saati</label>
                  <input
                    type="time"
                    value={businessFormData.opening_time}
                    onChange={(e) => setBusinessFormData({...businessFormData, opening_time: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Kapanış Saati</label>
                  <input
                    type="time"
                    value={businessFormData.closing_time}
                    onChange={(e) => setBusinessFormData({...businessFormData, closing_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowBusinessForm(false)} className="btn-secondary">
                  İptal
                </button>
                <button type="submit" className="btn-primary">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showServiceForm && (
        <div className="modal-overlay" onClick={() => setShowServiceForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni Hizmet Ekle</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleServiceSubmit}>
              <div className="form-group">
                <label>Hizmet Adı *</label>
                <input
                  type="text"
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({...serviceFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Fiyat (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={serviceFormData.price}
                  onChange={(e) => setServiceFormData({...serviceFormData, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Süre (dakika) *</label>
                <input
                  type="number"
                  value={serviceFormData.duration}
                  onChange={(e) => setServiceFormData({...serviceFormData, duration: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowServiceForm(false)} className="btn-secondary">
                  İptal
                </button>
                <button type="submit" className="btn-primary">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="no-businesses">
          <p>Henüz işletme eklemediniz. Başlamak için yukarıdaki butona tıklayın.</p>
        </div>
      ) : (
        <div className="businesses-list">
          {businesses.map(business => (
            <div key={business.id} className="business-card">
              <div className="business-card-header">
                <h3>{business.name}</h3>
                <button 
                  onClick={() => handleDeleteBusiness(business.id)} 
                  className="btn-delete"
                >
                  Sil
                </button>
              </div>
              <p className="business-type">{business.type}</p>
              <p className="business-description">{business.description}</p>
              <div className="business-rating">
                <span className="stars">{'⭐'.repeat(Math.round(business.average_rating))}</span>
                <span className="rating-value">
                  {business.average_rating > 0 ? business.average_rating.toFixed(1) : 'Henüz değerlendirme yok'}
                </span>
                <span className="review-count">({business.review_count} yorum)</span>
              </div>

              <div className="services-section">
                <div className="services-header">
                  <h4>Hizmetler</h4>
                  <button 
                    onClick={() => {
                      setSelectedBusiness(business.id);
                      setShowServiceForm(true);
                    }}
                    className="btn-add-service"
                  >
                    + Hizmet Ekle
                  </button>
                </div>
                {business.services && business.services.length > 0 ? (
                  <div className="services-list">
                    {business.services.map(service => (
                      <div key={service.id} className="service-item">
                        <div className="service-info">
                          <strong>{service.name}</strong>
                          <span className="service-details">
                            {service.price} TL • {service.duration} dakika
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="btn-delete-small"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-services">Henüz hizmet eklenmemiş</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBusiness;
