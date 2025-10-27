const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// Get all appointments for current user
router.get('/my-appointments', auth, (req, res) => {
  let query;
  let params = [req.user.id];

  if (req.user.role === 'customer') {
    query = `
      SELECT a.*, b.name as business_name, s.name as service_name, s.duration, s.price
      FROM appointments a
      JOIN businesses b ON a.business_id = b.id
      JOIN services s ON a.service_id = s.id
      WHERE a.customer_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
  } else if (req.user.role === 'business_owner') {
    query = `
      SELECT a.*, b.name as business_name, s.name as service_name, 
             s.duration, s.price, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM appointments a
      JOIN businesses b ON a.business_id = b.id
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.customer_id = u.id
      WHERE b.owner_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
  }

  db.all(query, params, (err, appointments) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(appointments);
  });
});

// Get available time slots for a business on a specific date
router.get('/available-slots/:businessId/:date', (req, res) => {
  const { businessId, date } = req.params;

  // Get business hours
  db.get('SELECT opening_time, closing_time FROM businesses WHERE id = ?', [businessId], (err, business) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Get booked appointments for the date
    db.all(
      'SELECT appointment_time, s.duration FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.business_id = ? AND a.appointment_date = ? AND a.status != ?',
      [businessId, date, 'cancelled'],
      (err, bookedAppointments) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Generate available slots (simplified - every hour)
        const slots = [];
        const opening = business.opening_time || '09:00';
        const closing = business.closing_time || '18:00';
        
        let currentHour = parseInt(opening.split(':')[0]);
        const closingHour = parseInt(closing.split(':')[0]);
        
        while (currentHour < closingHour) {
          const timeSlot = `${String(currentHour).padStart(2, '0')}:00`;
          const isBooked = bookedAppointments.some(apt => apt.appointment_time === timeSlot);
          
          if (!isBooked) {
            slots.push(timeSlot);
          }
          
          currentHour++;
        }

        res.json({ slots });
      }
    );
  });
});

// Create appointment (customer only)
router.post('/', auth, (req, res) => {
  const { business_id, service_id, appointment_date, appointment_time, notes } = req.body;

  if (!business_id || !service_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Check if slot is available
  db.get(
    'SELECT * FROM appointments WHERE business_id = ? AND appointment_date = ? AND appointment_time = ? AND status != ?',
    [business_id, appointment_date, appointment_time, 'cancelled'],
    (err, existingAppointment) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (existingAppointment) {
        return res.status(400).json({ error: 'Time slot is already booked' });
      }

      db.run(
        'INSERT INTO appointments (business_id, service_id, customer_id, appointment_date, appointment_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [business_id, service_id, req.user.id, appointment_date, appointment_time, notes],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.get(
            `SELECT a.*, b.name as business_name, s.name as service_name, s.duration, s.price
             FROM appointments a
             JOIN businesses b ON a.business_id = b.id
             JOIN services s ON a.service_id = s.id
             WHERE a.id = ?`,
            [this.lastID],
            (err, appointment) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.status(201).json(appointment);
            }
          );
        }
      );
    }
  );
});

// Update appointment status
router.put('/:id/status', auth, (req, res) => {
  const appointmentId = req.params.id;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Verify access
  let query;
  if (req.user.role === 'customer') {
    query = 'SELECT * FROM appointments WHERE id = ? AND customer_id = ?';
  } else if (req.user.role === 'business_owner') {
    query = `SELECT a.* FROM appointments a 
             JOIN businesses b ON a.business_id = b.id 
             WHERE a.id = ? AND b.owner_id = ?`;
  }

  db.get(query, [appointmentId, req.user.id], (err, appointment) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or access denied' });
    }

    db.run(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, appointmentId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT * FROM appointments WHERE id = ?', [appointmentId], (err, updatedAppointment) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(updatedAppointment);
        });
      }
    );
  });
});

module.exports = router;
