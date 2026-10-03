import mongoose from 'mongoose';

const conservationRecordSchema = new mongoose.Schema(
  {
    artifact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artifact',
      required: true,
      index: true,
    },
    assessment_date: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical', 'restored'],
      default: 'fair',
    },
    treatment_description: {
      type: String,
      default: '',
    },
    conservator_name: {
      type: String,
      default: '',
    },
    cost: {
      type: Number,
      default: 0,
    },
    next_assessment_date: {
      type: String,
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

export const ConservationRecord = mongoose.model('ConservationRecord', conservationRecordSchema);
export default ConservationRecord;
