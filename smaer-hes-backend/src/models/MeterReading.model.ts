import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Individual OBIS parameter reading
 */
export interface IObisReading {
  obisCode: string;        // e.g., "1-0:15.8.0.255"
  name?: string;           // e.g., "Total Active Energy"
  value: any;              // Raw value from meter
  unit?: string;           // e.g., "Wh", "V", "A"
  scaler?: number;         // DLMS scaler (e.g., -3 means divide by 1000)
  actualValue?: number;    // value * 10^scaler
  dataType?: string;       // e.g., "double-long-unsigned"
  classId?: string;        // DLMS class ID
  attributeId?: number;    // DLMS attribute ID
  quality?: string;        // Reading quality (good, suspect, error)
}

/**
 * Complete meter reading with all OBIS parameters
 */
export interface IMeterReading extends Document {
  meter: mongoose.Types.ObjectId;        // Reference to Meter
  meterNumber: string;                   // Denormalized for quick lookup
  timestamp: Date;                       // When the reading was taken
  readings: IObisReading[];              // Array of OBIS parameter readings
  readingType: 'scheduled' | 'on-demand' | 'push' | 'billing';
  source: 'meter-push' | 'system-poll' | 'manual' | 'billing-cycle';

  // Metadata
  communicationStatus: 'success' | 'partial' | 'failed';
  failedParameters?: string[];           // List of OBIS codes that failed to read
  errorMessage?: string;
  responseTime?: number;                 // Time taken to read in milliseconds

  // Grouping for quick queries
  energyValues?: Map<string, number>;    // Quick access to energy readings
  instantaneousValues?: Map<string, number>; // Quick access to voltage, current, power

  createdAt: Date;
  updatedAt: Date;
}

/**
 * MeterReading model with static methods
 */
export interface IMeterReadingModel extends Model<IMeterReading> {
  getLatestReading(meterId: string | mongoose.Types.ObjectId): Promise<IMeterReading | null>;
  getReadingsInRange(
    meterId: string | mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<IMeterReading[]>;
  getObisTimeSeries(
    meterId: string | mongoose.Types.ObjectId,
    obisCode: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ timestamp: Date; value: any; actualValue?: number }>>;
}

const ObisReadingSchema = new Schema({
  obisCode: { type: String, required: true },
  name: { type: String },
  value: { type: Schema.Types.Mixed, required: true },
  unit: { type: String },
  scaler: { type: Number },
  actualValue: { type: Number },
  dataType: { type: String },
  classId: { type: String },
  attributeId: { type: Number },
  quality: {
    type: String,
    enum: ['good', 'suspect', 'error'],
    default: 'good'
  }
}, { _id: false });

const MeterReadingSchema = new Schema({
  meter: {
    type: Schema.Types.ObjectId,
    ref: 'Meter',
    required: true,
    index: true
  },
  meterNumber: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  readings: [ObisReadingSchema],
  readingType: {
    type: String,
    enum: ['scheduled', 'on-demand', 'push', 'billing'],
    default: 'scheduled',
    index: true
  },
  source: {
    type: String,
    enum: ['meter-push', 'system-poll', 'manual', 'billing-cycle'],
    default: 'system-poll'
  },
  communicationStatus: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  failedParameters: [{ type: String }],
  errorMessage: { type: String },
  responseTime: { type: Number },
  energyValues: {
    type: Map,
    of: Number
  },
  instantaneousValues: {
    type: Map,
    of: Number
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
MeterReadingSchema.index({ meter: 1, timestamp: -1 });
MeterReadingSchema.index({ meterNumber: 1, timestamp: -1 });
MeterReadingSchema.index({ timestamp: -1 });
MeterReadingSchema.index({ readingType: 1, timestamp: -1 });

// TTL index to automatically delete old readings (optional - keep last 90 days)
MeterReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Helper method to get a specific OBIS reading
MeterReadingSchema.methods.getObisValue = function(obisCode: string): IObisReading | undefined {
  return this.readings.find((r: IObisReading) => r.obisCode === obisCode);
};

// Helper method to get all readings by group
MeterReadingSchema.methods.getReadingsByGroup = function(group: string): IObisReading[] {
  // This would require OBIS function database lookup
  // Placeholder for now
  return this.readings;
};

// Static method to get latest reading for a meter
MeterReadingSchema.statics.getLatestReading = async function(
  meterId: string | mongoose.Types.ObjectId
): Promise<IMeterReading | null> {
  return this.findOne({ meter: meterId })
    .sort({ timestamp: -1 })
    .exec();
};

// Static method to get readings in time range
MeterReadingSchema.statics.getReadingsInRange = async function(
  meterId: string | mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
): Promise<IMeterReading[]> {
  return this.find({
    meter: meterId,
    timestamp: { $gte: startDate, $lte: endDate }
  })
  .sort({ timestamp: -1 })
  .exec();
};

// Static method to get specific OBIS values over time
MeterReadingSchema.statics.getObisTimeSeries = async function(
  meterId: string | mongoose.Types.ObjectId,
  obisCode: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ timestamp: Date; value: any; actualValue?: number }>> {
  const readings = await this.find({
    meter: meterId,
    timestamp: { $gte: startDate, $lte: endDate },
    'readings.obisCode': obisCode
  })
  .select('timestamp readings.$')
  .sort({ timestamp: 1 })
  .exec();

  return readings.map((r: IMeterReading) => {
    const obisReading = r.readings[0];
    return {
      timestamp: r.timestamp,
      value: obisReading?.value,
      actualValue: obisReading?.actualValue
    };
  });
};

export const MeterReading = mongoose.model<IMeterReading, IMeterReadingModel>('MeterReading', MeterReadingSchema);
