import mongoose from 'mongoose';

const historicalPeriodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Period name is required'],
      unique: true,
      trim: true,
    },
    start_year: {
      type: Number,
      default: null,
    },
    end_year: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const HistoricalPeriod = mongoose.model('HistoricalPeriod', historicalPeriodSchema);
export default HistoricalPeriod;
