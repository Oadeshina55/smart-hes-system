"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const Alert_model_1 = require("../models/Alert.model");
const Event_model_1 = require("../models/Event.model");
const server_1 = require("../server");
const moment_1 = __importDefault(require("moment"));
class AlertService {
    // Get active alerts count by category
    static async getActiveAlertsCount() {
        try {
            const counts = await Alert_model_1.Alert.aggregate([
                {
                    $match: { status: 'active' }
                },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]);
            const result = {
                total: 0,
                tamper: 0,
                anomaly: 0,
                revenue: 0,
                technical: 0,
                communication: 0
            };
            counts.forEach(item => {
                result[item._id] = item.count;
                result.total += item.count;
            });
            return result;
        }
        catch (error) {
            console.error('Error getting active alerts count:', error);
            throw error;
        }
    }
    // Create a new alert
    static async createAlert(alertData) {
        try {
            const alert = await Alert_model_1.Alert.create(alertData);
            // Create corresponding event
            await Event_model_1.Event.create({
                meter: alert.meter,
                eventType: alert.alertType,
                eventCode: alert.alertCode,
                severity: alert.priority === 'critical' ? 'critical' :
                    alert.priority === 'high' ? 'error' :
                        alert.priority === 'medium' ? 'warning' : 'info',
                category: alert.category === 'anomaly' ? 'technical' : alert.category,
                description: alert.description,
                timestamp: alert.triggeredAt
            });
            // Emit alert via socket
            server_1.socketIO.emit('new-alert', {
                alertId: alert._id,
                ...alertData
            });
            return alert;
        }
        catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }
    // Acknowledge an alert
    static async acknowledgeAlert(alertId, userId) {
        try {
            const alert = await Alert_model_1.Alert.findByIdAndUpdate(alertId, {
                status: 'acknowledged',
                acknowledgedBy: userId,
                acknowledgedAt: new Date()
            }, { new: true });
            if (alert) {
                // Emit status change
                server_1.socketIO.emit('alert-acknowledged', {
                    alertId: alert._id,
                    acknowledgedBy: userId
                });
            }
            return alert;
        }
        catch (error) {
            console.error('Error acknowledging alert:', error);
            throw error;
        }
    }
    // Resolve an alert
    static async resolveAlert(alertId, userId, resolutionNotes) {
        try {
            const alert = await Alert_model_1.Alert.findByIdAndUpdate(alertId, {
                status: 'resolved',
                resolvedBy: userId,
                resolvedAt: new Date(),
                resolutionNotes
            }, { new: true });
            if (alert) {
                // Create resolution event
                await Event_model_1.Event.create({
                    meter: alert.meter,
                    eventType: 'ALERT_RESOLVED',
                    eventCode: 'RESOLVED',
                    severity: 'info',
                    category: 'other',
                    description: `Alert ${alert.alertCode} resolved: ${resolutionNotes}`,
                    timestamp: new Date()
                });
                // Emit status change
                server_1.socketIO.emit('alert-resolved', {
                    alertId: alert._id,
                    resolvedBy: userId
                });
            }
            return alert;
        }
        catch (error) {
            console.error('Error resolving alert:', error);
            throw error;
        }
    }
    // Escalate an alert
    static async escalateAlert(alertId, escalateToUserId) {
        try {
            const alert = await Alert_model_1.Alert.findByIdAndUpdate(alertId, {
                status: 'escalated',
                escalatedTo: escalateToUserId,
                escalatedAt: new Date()
            }, { new: true });
            if (alert) {
                // Emit escalation
                server_1.socketIO.emit('alert-escalated', {
                    alertId: alert._id,
                    escalatedTo: escalateToUserId
                });
            }
            return alert;
        }
        catch (error) {
            console.error('Error escalating alert:', error);
            throw error;
        }
    }
    // Get revenue loss summary
    static async getRevenueLossSummary(startDate, endDate) {
        try {
            const match = { isRevenueLoss: true };
            if (startDate && endDate) {
                match.triggeredAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
            const summary = await Alert_model_1.Alert.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        totalAlerts: { $sum: 1 },
                        totalEstimatedLoss: { $sum: '$estimatedLoss' },
                        byCategory: {
                            $push: {
                                category: '$category',
                                loss: '$estimatedLoss'
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalAlerts: 1,
                        totalEstimatedLoss: 1,
                        categories: {
                            $arrayToObject: {
                                $map: {
                                    input: { $setUnion: ['$byCategory.category'] },
                                    as: 'cat',
                                    in: {
                                        k: '$$cat',
                                        v: {
                                            $sum: {
                                                $map: {
                                                    input: {
                                                        $filter: {
                                                            input: '$byCategory',
                                                            cond: { $eq: ['$$this.category', '$$cat'] }
                                                        }
                                                    },
                                                    in: '$$this.loss'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]);
            return summary[0] || {
                totalAlerts: 0,
                totalEstimatedLoss: 0,
                categories: {}
            };
        }
        catch (error) {
            console.error('Error getting revenue loss summary:', error);
            throw error;
        }
    }
    // Clean old alerts (older than 90 days and resolved)
    static async cleanOldAlerts() {
        try {
            const ninetyDaysAgo = (0, moment_1.default)().subtract(90, 'days').toDate();
            const result = await Alert_model_1.Alert.deleteMany({
                status: 'resolved',
                resolvedAt: { $lt: ninetyDaysAgo }
            });
            console.log(`Cleaned ${result.deletedCount} old resolved alerts`);
            return result;
        }
        catch (error) {
            console.error('Error cleaning old alerts:', error);
            throw error;
        }
    }
}
exports.AlertService = AlertService;
//# sourceMappingURL=alert.service.js.map