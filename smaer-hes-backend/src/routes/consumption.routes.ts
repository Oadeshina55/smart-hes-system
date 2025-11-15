import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Consumption } from '../models/Consumption.model';
import { Meter } from '../models/Meter.model';
// lightweight CSV serializer (no external dependency)

const router = express.Router();

// Query consumption by meter or area and date range
router.get('/', authenticate, async (req, res) => {
	try {
		const { meterId, areaId, startDate, endDate, interval = 'daily', page = 1, limit = 100 } = req.query;
		const filter: any = { interval };

		if (meterId) filter.meter = meterId;
		if (areaId) filter.area = areaId;
		if (startDate || endDate) filter.timestamp = {};
		if (startDate) filter.timestamp.$gte = new Date(startDate as string);
		if (endDate) filter.timestamp.$lte = new Date(endDate as string);

		const data = await Consumption.find(filter)
			.sort('-timestamp')
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit));

		const total = await Consumption.countDocuments(filter);

		res.json({ success: true, data, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to query consumption', error: error.message });
	}
});

// Export consumption as CSV
router.get('/export', authenticate, async (req, res) => {
	try {
		const { meterId, areaId, startDate, endDate, interval = 'daily' } = req.query;
		const filter: any = { interval };
		if (meterId) filter.meter = meterId;
		if (areaId) filter.area = areaId;
		if (startDate || endDate) filter.timestamp = {};
		if (startDate) filter.timestamp.$gte = new Date(startDate as string);
		if (endDate) filter.timestamp.$lte = new Date(endDate as string);

		const data = await Consumption.find(filter).sort('-timestamp').limit(10000);

		const records = data.map((d: any) => ({
			meter: d.meter?.toString?.() || d.meter,
			area: d.area?.toString?.() || d.area,
			timestamp: d.timestamp,
			interval: d.interval,
			activeEnergy: d.energy.activeEnergy,
			reactiveEnergy: d.energy.reactiveEnergy,
			apparentEnergy: d.energy.apparentEnergy,
			exportedEnergy: d.energy.exportedEnergy,
			activePower: d.power.activePower,
			maxDemand: d.power.maxDemand,
			voltageAvg: d.voltage.average,
			currentAvg: d.current.average,
			powerFactorAvg: d.powerFactor.average,
			frequency: d.frequency,
			readingType: d.readingType
		}));

			// build CSV manually
			if (records.length === 0) {
				res.header('Content-Type', 'text/csv');
				res.attachment(`consumption_${Date.now()}.csv`);
				return res.send('');
			}

			const headers = Object.keys(records[0]);
			const csvLines = [headers.join(',')];
				for (const r of records) {
					const line = headers.map(h => {
						const v = (r as any)[h];
					if (v === null || v === undefined) return '';
					const s = typeof v === 'string' ? v : (v instanceof Date ? v.toISOString() : String(v));
					// escape double quotes
					return `"${s.replace(/"/g, '""')}"`;
				}).join(',');
				csvLines.push(line);
			}

			const csv = csvLines.join('\n');
			res.header('Content-Type', 'text/csv');
			res.attachment(`consumption_${Date.now()}.csv`);
			return res.send(csv);
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to export consumption', error: error.message });
	}
});

// Export consumption as simple PDF
router.get('/export/pdf', authenticate, async (req, res) => {
	try {
		const { meterId, areaId, startDate, endDate, interval = 'daily' } = req.query as any;
		const filter: any = { interval };
		if (meterId) filter.meter = meterId;
		if (areaId) filter.area = areaId;
		if (startDate || endDate) filter.timestamp = {};
		if (startDate) filter.timestamp.$gte = new Date(startDate as string);
		if (endDate) filter.timestamp.$lte = new Date(endDate as string);

		const data = await Consumption.find(filter).sort('timestamp').limit(10000).populate('meter', 'meterNumber').populate('area', 'name');

		// generate pdf using pdfkit
		// @ts-ignore
		const PDFDocument = require('pdfkit');
		const doc = new PDFDocument({ margin: 40 });

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename=consumption_${Date.now()}.pdf`);

		doc.pipe(res as any);

		doc.fontSize(16).text('Energy Consumption Report', { align: 'center' });
		doc.moveDown();

		doc.fontSize(10);

		const headers = ['Meter', 'Area', 'Timestamp', 'Interval', 'ActiveEnergy', 'ActivePower', 'VoltageAvg', 'CurrentAvg', 'PowerFactor', 'Frequency'];
		const columnWidths = [80, 80, 110, 50, 70, 60, 60, 60, 60, 50];

		// header
		headers.forEach((h, i) => {
			doc.text(h, { continued: i !== headers.length - 1, width: columnWidths[i] });
		});
		doc.moveDown(0.5);

		for (const d of data) {
			const meter = d.meter as any;
			const area = d.area as any;
			const row = [meter?.meterNumber || '', area?.name || '', (d.timestamp || '').toString(), d.interval, String(d.energy?.activeEnergy || ''), String(d.power?.activePower || ''), String(d.voltage?.average || ''), String(d.current?.average || ''), String(d.powerFactor?.average || ''), String(d.frequency || '')];
			row.forEach((c: any, i: number) => {
				doc.text(c, { continued: i !== row.length - 1, width: columnWidths[i] });
			});
			doc.moveDown(0.2);
		}

		doc.end();
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to export consumption PDF', error: error.message });
	}
});

export default router;

