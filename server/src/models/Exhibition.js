import mongoose from 'mongoose';

const exhibitionArtifactSchema = new mongoose.Schema(
  {
    artifact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artifact',
      required: true,
    },
    display_order: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const exhibitionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exhibition title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    start_date: {
      type: String,
      required: true,
    },
    end_date: {
      type: String,
      required: true,
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    curator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'ended', 'cancelled'],
      default: 'upcoming',
    },
    cover_image_url: {
      type: String,
      default: null,
    },
    exhibition_artifacts: [exhibitionArtifactSchema],
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

exhibitionSchema.virtual('location', {
  ref: 'Location',
  localField: 'location_id',
  foreignField: '_id',
  justOne: true,
});

exhibitionSchema.virtual('curator', {
  ref: 'User',
  localField: 'curator_id',
  foreignField: '_id',
  justOne: true,
});

export const Exhibition = mongoose.model('Exhibition', exhibitionSchema);
export default Exhibition;
