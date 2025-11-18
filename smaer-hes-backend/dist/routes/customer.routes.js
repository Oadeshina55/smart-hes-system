"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const Customer_model_1 = require("../models/Customer.model");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Get customers with optional filters
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const filter = { isActive: true };
        if (search) {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }
        const customers = await Customer_model_1.Customer.find(filter)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort('-createdAt');
        const total = await Customer_model_1.Customer.countDocuments(filter);
        res.json({ success: true, data: customers, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
    }
});
// Create customer
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const customer = await Customer_model_1.Customer.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, message: 'Customer created', data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create customer', error: error.message });
    }
});
// Update customer
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const customer = await Customer_model_1.Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!customer)
            return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, message: 'Customer updated', data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update customer', error: error.message });
    }
});
// Delete (soft) customer
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const customer = await Customer_model_1.Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!customer)
            return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, message: 'Customer deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
    }
});
// Import customers via CSV
router.post('/import', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, message: 'CSV file is required' });
        const results = [];
        const filePath = req.file.path;
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
            // Map and create customers with per-row results
            const rowResults = [];
            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                try {
                    const customer = await Customer_model_1.Customer.create({
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
                }
                catch (err) {
                    rowResults.push({ index: i, success: false, error: err.message || String(err), row });
                }
            }
            // remove uploaded file
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (e) {
                // ignore
            }
            const successCount = rowResults.filter(r => r.success).length;
            const failures = rowResults.filter(r => !r.success).map(r => ({ index: r.index, error: r.error, row: r.row }));
            res.json({ success: true, message: `Processed ${results.length} rows`, total: results.length, successCount, failures, details: rowResults });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to import CSV', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=customer.routes.js.map