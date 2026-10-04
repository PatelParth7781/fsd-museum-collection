import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    artifact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artifact',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    body: {
      type: String,
      default: '',
      trim: true,
    },
    is_flagged: {
      type: Boolean,
      default: false,
    },
    moderation_status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    status: {
      type: String,
      enum: ['published', 'hidden', 'pending'],
      default: 'published',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.body = ret.body || ret.comment || '';
        ret.comment = ret.comment || ret.body || '';
        if (ret.status === 'published') ret.moderation_status = 'approved';
        else if (ret.status === 'hidden') ret.moderation_status = 'rejected';
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre('save', function (next) {
  if (this.body && !this.comment) this.comment = this.body;
  if (this.comment && !this.body) this.body = this.comment;
  if (this.status === 'published') this.moderation_status = 'approved';
  else if (this.status === 'hidden') this.moderation_status = 'rejected';
  else if (this.status === 'pending') this.moderation_status = 'pending';
  next();
});

reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

reviewSchema.virtual('artifact', {
  ref: 'Artifact',
  localField: 'artifact_id',
  foreignField: '_id',
  justOne: true,
});

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
