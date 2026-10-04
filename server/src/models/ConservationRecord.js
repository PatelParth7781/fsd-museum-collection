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
    treatment: {
      type: String,
      default: '',
    },
    treatment_description: {
      type: String,
      default: '',
    },
    conservator: {
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
    treatment_date: {
      type: String,
      default: null,
    },
    next_inspection_date: {
      type: String,
      default: null,
    },
    next_assessment_date: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    before_image_url: {
      type: String,
      default: null,
    },
    after_image_url: {
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
        ret.treatment = ret.treatment || ret.treatment_description || '';
        ret.treatment_description = ret.treatment_description || ret.treatment || '';
        ret.conservator = ret.conservator || ret.conservator_name || '';
        ret.conservator_name = ret.conservator_name || ret.conservator || '';
        ret.next_inspection_date = ret.next_inspection_date || ret.next_assessment_date || null;
        ret.next_assessment_date = ret.next_assessment_date || ret.next_inspection_date || null;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

conservationRecordSchema.pre('save', function (next) {
  if (this.treatment && !this.treatment_description) this.treatment_description = this.treatment;
  if (this.treatment_description && !this.treatment) this.treatment = this.treatment_description;
  if (this.conservator && !this.conservator_name) this.conservator_name = this.conservator;
  if (this.conservator_name && !this.conservator) this.conservator = this.conservator_name;
  if (this.next_inspection_date && !this.next_assessment_date) this.next_assessment_date = this.next_inspection_date;
  if (this.next_assessment_date && !this.next_inspection_date) this.next_inspection_date = this.next_assessment_date;
  next();
});

conservationRecordSchema.virtual('artifact', {
  ref: 'Artifact',
  localField: 'artifact_id',
  foreignField: '_id',
  justOne: true,
});

export const ConservationRecord = mongoose.model('ConservationRecord', conservationRecordSchema);
export default ConservationRecord;
