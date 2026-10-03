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
    comment: {
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

reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
