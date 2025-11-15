import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Customer } from '../models/Customer.model';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get customers with optional filters
router.get('/', authenticate, async (req, res) => {
	try {
		const { search, page = 1, limit = 20 } = req.query;
		const filter: any = { isActive: true };

		if (search) {
			filter.$or = [
				{ customerName: { $regex: search, $options: 'i' } },
				{ accountNumber: { $regex: search, $options: 'i' } },
				{ phoneNumber: { $regex: search, $options: 'i' } }
			];
		}

		const customers = await Customer.find(filter)
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit))
			.sort('-createdAt');

		const total = await Customer.countDocuments(filter);

		res.json({ success: true, data: customers, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
	}
});

// Create customer
router.post('/', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
	try {
		const customer = await Customer.create({ ...req.body, createdBy: req.user._id });
		res.status(201).json({ success: true, message: 'Customer created', data: customer });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to create customer', error: error.message });
	}
});

// Update customer
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
	try {
		const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
		res.json({ success: true, message: 'Customer updated', data: customer });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to update customer', error: error.message });
	}
});

// Delete (soft) customer
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
	try {
		const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
		if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
		res.json({ success: true, message: 'Customer deleted' });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
	}
});

// Import customers via CSV
router.post('/import', authenticate, authorize('admin', 'operator'), upload.single('file'), async (req: any, res) => {
	try {
		if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });

		const results: any[] = [];
		const filePath = req.file.path;

		fs.createReadStream(filePath)
			.pipe(csv())
			.on('data', (data) => results.push(data))
			.on('end', async () => {
				// Map and create customers with per-row results
				const rowResults: any[] = [];
				for (let i = 0; i < results.length; i++) {
					const row = results[i];
					try {
						const customer = await Customer.create({
							customerName: row.customerName || row.name || '',
							accountNumber: row.accountNumber || row.account || `${Date.now()}-${i}`,
							email: row.email,
							phoneNumber: row.phoneNumber || row.phone,
							address: {
								street: row.street || '',
								city: row.city || '',
								state: row.state || '',
								postalCode: row.postalCode || '',
								country: row.country || 'Nigeria'
							},
							meterNumber: row.meterNumber || '',
							simNumber: row.simNumber || '',
							createdBy: req.user._id
						});
						rowResults.push({ index: i, success: true, data: customer });
					} catch (err: any) {
						rowResults.push({ index: i, success: false, error: err.message || String(err), row });
					}
				}

				// remove uploaded file
				try {
					fs.unlinkSync(filePath);
				} catch (e) {
					// ignore
				}

				const successCount = rowResults.filter(r => r.success).length;
				const failures = rowResults.filter(r => !r.success).map(r => ({ index: r.index, error: r.error, row: r.row }));

				res.json({ success: true, message: `Processed ${results.length} rows`, total: results.length, successCount, failures, details: rowResults });
			});
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to import CSV', error: error.message });
	}
});

export default router;
