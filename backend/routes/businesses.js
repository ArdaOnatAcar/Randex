const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

// Get all businesses (public)
router.get('/', (req, res) => {
  const { type, search } = req.query;
  let query = `
    SELECT b.*, 
           COALESCE(AVG(r.rating), 0) as average_rating,
           COUNT(DISTINCT r.id) as review_count
    FROM businesses b
    LEFT JOIN reviews r ON b.id = r.business_id
  `;
  const params = [];

  const conditions = [];
  if (type) {
    conditions.push('b.type = ?');
    params.push(type);
  }
  if (search) {
    conditions.push('(b.name LIKE ? OR b.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY b.id ORDER BY b.created_at DESC';

  db.all(query, params, (err, businesses) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(businesses);
  });
});

// Get single business with details (public)
router.get('/:id', (req, res) => {
  const businessId = req.params.id;

  db.get(
    `SELECT b.*, 
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as review_count
     FROM businesses b
     LEFT JOIN reviews r ON b.id = r.business_id
     WHERE b.id = ?
     GROUP BY b.id`,
    [businessId],
    (err, business) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // Get services
      db.all(
        'SELECT * FROM services WHERE business_id = ? ORDER BY price',
        [businessId],
        (err, services) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get reviews
          db.all(
            `SELECT r.*, u.name as customer_name 
             FROM reviews r 
             JOIN users u ON r.customer_id = u.id 
             WHERE r.business_id = ? 
             ORDER BY r.created_at DESC`,
            [businessId],
            (err, reviews) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.json({
                ...business,
                services,
                reviews
              });
            }
          );
        }
      );
    }
  );
});

// Create business (business owner only)
router.post('/', auth, requireRole('business_owner'), (req, res) => {
  const {
    name,
    type,
    description,
    address,
    phone,
    image_url,
    opening_time,
    closing_time
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  db.run(
    `INSERT INTO businesses (owner_id, name, type, description, address, phone, image_url, opening_time, closing_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, type, description, address, phone, image_url, opening_time, closing_time],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM businesses WHERE id = ?', [this.lastID], (err, business) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(business);
      });
    }
  );
});

// Update business (business owner only)
router.put('/:id', auth, requireRole('business_owner'), (req, res) => {
  const businessId = req.params.id;
  const {
    name,
    type,
    description,
    address,
    phone,
    image_url,
    opening_time,
    closing_time
  } = req.body;

  // Verify ownership
  db.get('SELECT * FROM businesses WHERE id = ? AND owner_id = ?', [businessId, req.user.id], (err, business) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!business) {
      return res.status(404).json({ error: 'Business not found or access denied' });
    }

    db.run(
      `UPDATE businesses 
       SET name = ?, type = ?, description = ?, address = ?, phone = ?, 
           image_url = ?, opening_time = ?, closing_time = ?
       WHERE id = ?`,
      [name, type, description, address, phone, image_url, opening_time, closing_time, businessId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT * FROM businesses WHERE id = ?', [businessId], (err, updatedBusiness) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(updatedBusiness);
        });
      }
    );
  });
});

// Delete business (business owner only)
router.delete('/:id', auth, requireRole('business_owner'), (req, res) => {
  const businessId = req.params.id;

  db.get('SELECT * FROM businesses WHERE id = ? AND owner_id = ?', [businessId, req.user.id], (err, business) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!business) {
      return res.status(404).json({ error: 'Business not found or access denied' });
    }

    db.run('DELETE FROM businesses WHERE id = ?', [businessId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Business deleted successfully' });
    });
  });
});

// Get businesses owned by current user
router.get('/owner/my-businesses', auth, requireRole('business_owner'), (req, res) => {
  db.all(
    `SELECT b.*, 
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as review_count
     FROM businesses b
     LEFT JOIN reviews r ON b.id = r.business_id
     WHERE b.owner_id = ?
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [req.user.id],
    (err, businesses) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(businesses);
    }
  );
});

module.exports = router;
