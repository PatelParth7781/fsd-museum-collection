import mongoose from 'mongoose';

const provenanceRecordSchema = new mongoose.Schema(
  {
    artifact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artifact',
      required: true,
      index: true,
    },
    era_or_date: {
      type: String,
      default: '',
    },
    start_date: {
      type: String,
      default: null,
    },
    end_date: {
      type: String,
      default: null,
    },
    owner_name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    ownership_type: {
      type: String,
      enum: ['private', 'institutional', 'government', 'religious', 'unknown'],
      default: 'unknown',
    },
    transfer_method: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    supporting_documentation: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
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
        ret.description = ret.description || ret.notes || '';
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

provenanceRecordSchema.virtual('artifact', {
  ref: 'Artifact',
  localField: 'artifact_id',
  foreignField: '_id',
  justOne: true,
});

export const ProvenanceRecord = mongoose.model('ProvenanceRecord', provenanceRecordSchema);
export default ProvenanceRecord;
