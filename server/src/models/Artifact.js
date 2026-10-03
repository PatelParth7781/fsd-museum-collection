import mongoose from 'mongoose';

const artifactSchema = new mongoose.Schema(
  {
    accession_number: {
      type: String,
      required: [true, 'Accession number is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Artifact name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    artist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      default: null,
    },
    historical_period_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HistoricalPeriod',
      default: null,
    },
    origin: {
      type: String,
      default: '',
      trim: true,
    },
    creation_date: {
      type: String,
      default: '',
      trim: true,
    },
    material: {
      type: String,
      default: '',
      trim: true,
    },
    dimensions: {
      type: String,
      default: '',
      trim: true,
    },
    weight: {
      type: String,
      default: '',
      trim: true,
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical', 'restored'],
      default: 'good',
    },
    acquisition_date: {
      type: String,
      default: null,
    },
    acquisition_method: {
      type: String,
      enum: ['', 'purchase', 'donation', 'bequest', 'excavation', 'field_collection', 'exchange'],
      default: '',
    },
    ownership_status: {
      type: String,
      enum: ['owned', 'on_loan', 'borrowed', 'joint_ownership'],
      default: 'owned',
    },
    current_location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'on_loan', 'in_conservation', 'archived'],
      default: 'active',
    },
    is_public: {
      type: Boolean,
      default: true,
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
    toObject: { virtuals: true },
  }
);

// Virtual populates
artifactSchema.virtual('category', {
  ref: 'Category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true,
});

artifactSchema.virtual('artist', {
  ref: 'Artist',
  localField: 'artist_id',
  foreignField: '_id',
  justOne: true,
});

artifactSchema.virtual('historical_period', {
  ref: 'HistoricalPeriod',
  localField: 'historical_period_id',
  foreignField: '_id',
  justOne: true,
});

artifactSchema.virtual('location', {
  ref: 'Location',
  localField: 'current_location_id',
  foreignField: '_id',
  justOne: true,
});

artifactSchema.virtual('artifact_images', {
  ref: 'ArtifactImage',
  localField: '_id',
  foreignField: 'artifact_id',
});

// Text index for search
artifactSchema.index({ name: 'text', description: 'text', accession_number: 'text', origin: 'text', material: 'text' });

export const Artifact = mongoose.model('Artifact', artifactSchema);
export default Artifact;
