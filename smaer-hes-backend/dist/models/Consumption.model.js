"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consumption = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const consumptionSchema = new mongoose_1.Schema({
    meter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter',
        required: true
    },
    area: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    interval: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly'],
        required: true
    },
    energy: {
        activeEnergy: {
            type: Number,
            required: true,
            default: 0
        },
        reactiveEnergy: {
            type: Number,
            default: 0
        },
        apparentEnergy: {
            type: Number,
            default: 0
        },
        exportedEnergy: {
            type: Number,
            default: 0
        }
    },
    power: {
        activePower: {
            type: Number,
            default: 0
        },
        reactivePower: {
            type: Number,
            default: 0
        },
        apparentPower: {
            type: Number,
            default: 0
        },
        maxDemand: {
            type: Number,
            default: 0
        }
    },
    voltage: {
        phaseA: {
            type: Number,
            default: 0
        },
        phaseB: {
            type: Number,
            default: 0
        },
        phaseC: {
            type: Number,
            default: 0
        },
        average: {
            type: Number,
            default: 0
        }
    },
    current: {
        phaseA: {
            type: Number,
            default: 0
        },
        phaseB: {
            type: Number,
            default: 0
        },
        phaseC: {
            type: Number,
            default: 0
        },
        neutral: {
            type: Number,
            default: 0
        },
        average: {
            type: Number,
            default: 0
        }
    },
    powerFactor: {
        phaseA: {
            type: Number,
            default: 0
        },
        phaseB: {
            type: Number,
            default: 0
        },
        phaseC: {
            type: Number,
            default: 0
        },
        average: {
            type: Number,
            default: 0
        }
    },
    frequency: {
        type: Number,
        default: 50 // Hz
    },
    thd: {
        voltageThd: {
            type: Number,
            default: 0
        },
        currentThd: {
            type: Number,
            default: 0
        }
    },
    readingType: {
        type: String,
        enum: ['automatic', 'manual', 'estimated'],
        default: 'automatic'
    },
    cost: {
        type: Number,
        default: 0
    },
    tariffRate: {
        type: Number,
        default: 0
    },
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true
});
// Create indexes
consumptionSchema.index({ meter: 1, timestamp: -1 });
consumptionSchema.index({ area: 1, timestamp: -1 });
consumptionSchema.index({ timestamp: -1 });
consumptionSchema.index({ interval: 1 });
consumptionSchema.index({ meter: 1, interval: 1, timestamp: -1 });
// Static method to calculate consumption difference
consumptionSchema.statics.calculateDifference = function (current, previous) {
    return {
        energyDifference: current.energy.activeEnergy - previous.energy.activeEnergy,
        timeDifference: (current.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60), // in hours
        averagePower: (current.energy.activeEnergy - previous.energy.activeEnergy) /
            ((current.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60))
    };
};
exports.Consumption = mongoose_1.default.model('Consumption', consumptionSchema);
//# sourceMappingURL=Consumption.model.js.map