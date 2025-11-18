import express from 'express';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Download CSV template for customers
router.get('/customers', authenticate, authorize('admin', 'operator'), (req, res) => {
  const filePath = path.join(__dirname, '../../templates/customers_import_template.csv');
  res.download(filePath, 'customers_import_template.csv', (err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Failed to download template', error: err.message });
    }
  });
});

// Download CSV template for meters
router.get('/meters', authenticate, authorize('admin', 'operator'), (req, res) => {
  const filePath = path.join(__dirname, '../../templates/meters_import_template.csv');
  res.download(filePath, 'meters_import_template.csv', (err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Failed to download template', error: err.message });
    }
  });
});

// Download CSV template for sim cards
router.get('/simcards', authenticate, authorize('admin', 'operator'), (req, res) => {
  const filePath = path.join(__dirname, '../../templates/simcards_import_template.csv');
  res.download(filePath, 'simcards_import_template.csv', (err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Failed to download template', error: err.message });
    }
  });
});

export default router;
