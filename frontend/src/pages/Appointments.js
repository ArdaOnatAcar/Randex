import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getMyAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Durum güncellenirken hata oluştu');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Beklemede', class: 'status-pending' },
      confirmed: { label: 'Onaylandı', class: 'status-confirmed' },
      cancelled: { label: 'İptal Edildi', class: 'status-cancelled' },
      completed: { label: 'Tamamlandı', class: 'status-completed' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="appointments-container">
      <h1>Randevularım</h1>
      
      {appointments.length === 0 ? (
        <div className="no-appointments">
          <p>Henüz randevunuz bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <h3>{appointment.business_name}</h3>
                {getStatusBadge(appointment.status)}
              </div>
              
              <div className="appointment-details">
                <p><strong>Hizmet:</strong> {appointment.service_name}</p>
                <p><strong>Tarih:</strong> {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}</p>
                <p><strong>Saat:</strong> {appointment.appointment_time}</p>
                <p><strong>Süre:</strong> {appointment.duration} dakika</p>
                <p><strong>Fiyat:</strong> {appointment.price} TL</p>
                {appointment.notes && (
                  <p><strong>Notlar:</strong> {appointment.notes}</p>
                )}
                
                {user.role === 'business_owner' && (
                  <>
                    <p><strong>Müşteri:</strong> {appointment.customer_name}</p>
                    <p><strong>E-posta:</strong> {appointment.customer_email}</p>
                    <p><strong>Telefon:</strong> {appointment.customer_phone}</p>
                  </>
                )}
              </div>

              <div className="appointment-actions">
                {appointment.status === 'pending' && (
                  <>
                    {user.role === 'business_owner' && (
                      <button 
                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                        className="btn-confirm"
                      >
                        Onayla
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      className="btn-cancel"
                    >
                      İptal Et
                    </button>
                  </>
                )}
                {appointment.status === 'confirmed' && user.role === 'business_owner' && (
                  <button 
                    onClick={() => handleStatusChange(appointment.id, 'completed')}
                    className="btn-complete"
                  >
                    Tamamlandı Olarak İşaretle
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
