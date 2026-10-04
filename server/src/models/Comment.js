import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
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
    body: {
      type: String,
      required: true,
      trim: true,
    },
    is_approved: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['published', 'hidden', 'pending'],
      default: 'published',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
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

commentSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

commentSchema.virtual('artifact', {
  ref: 'Artifact',
  localField: 'artifact_id',
  foreignField: '_id',
  justOne: true,
});

export const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
