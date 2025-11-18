"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Download CSV template for customers
router.get('/customers', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), (req, res) => {
    const filePath = path_1.default.join(__dirname, '../../templates/customers_import_template.csv');
    res.download(filePath, 'customers_import_template.csv', (err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Failed to download template', error: err.message });
        }
    });
});
// Download CSV template for meters
router.get('/meters', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), (req, res) => {
    const filePath = path_1.default.join(__dirname, '../../templates/meters_import_template.csv');
    res.download(filePath, 'meters_import_template.csv', (err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Failed to download template', error: err.message });
        }
    });
});
// Download CSV template for sim cards
router.get('/simcards', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), (req, res) => {
    const filePath = path_1.default.join(__dirname, '../../templates/simcards_import_template.csv');
    res.download(filePath, 'simcards_import_template.csv', (err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Failed to download template', error: err.message });
        }
    });
});
exports.default = router;
//# sourceMappingURL=template.routes.js.map