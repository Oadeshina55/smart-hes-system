import mongoose, { Document, Schema } from 'mongoose';

export interface IConsumption extends Document {
  meter: mongoose.Types.ObjectId;
  area: mongoose.Types.ObjectId;
  timestamp: Date;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  energy: {
    activeEnergy: number;       // kWh
    reactiveEnergy: number;     // kVArh
    apparentEnergy: number;     // kVAh
    exportedEnergy: number;     // kWh
  };
  power: {
    activePower: number;        // kW
    reactivePower: number;      // kVAr
    apparentPower: number;      // kVA
    maxDemand: number;         // kW
  };
  voltage: {
    phaseA: number;
    phaseB: number;
    phaseC: number;
    average: number;
  };
  current: {
    phaseA: number;
    phaseB: number;
    phaseC: number;
    neutral: number;
    average: number;
  };
  powerFactor: {
    phaseA: number;
    phaseB: number;
    phaseC: number;
    average: number;
  };
  frequency: number;
  thd: {                       // Total Harmonic Distortion
    voltageThd: number;
    currentThd: number;
  };
  readingType: 'automatic' | 'manual' | 'estimated';
  cost?: number;
  tariffRate?: number;
  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const consumptionSchema = new Schema<IConsumption>(
  {
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      required: true
    },
    area: {
      type: Schema.Types.ObjectId,
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
      of: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
consumptionSchema.index({ meter: 1, timestamp: -1 });
consumptionSchema.index({ area: 1, timestamp: -1 });
consumptionSchema.index({ timestamp: -1 });
consumptionSchema.index({ interval: 1 });
consumptionSchema.index({ meter: 1, interval: 1, timestamp: -1 });

// Static method to calculate consumption difference
consumptionSchema.statics.calculateDifference = function(current: IConsumption, previous: IConsumption) {
  return {
    energyDifference: current.energy.activeEnergy - previous.energy.activeEnergy,
    timeDifference: (current.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60), // in hours
    averagePower: (current.energy.activeEnergy - previous.energy.activeEnergy) / 
                  ((current.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60))
  };
};

export const Consumption = mongoose.model<IConsumption>('Consumption', consumptionSchema);
