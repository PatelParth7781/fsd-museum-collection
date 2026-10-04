import mongoose from 'mongoose';

const categoryLikeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
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

categoryLikeSchema.virtual('category', {
  ref: 'Category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true,
});

categoryLikeSchema.index({ user_id: 1, category_id: 1 }, { unique: true });

export const CategoryLike = mongoose.model('CategoryLike', categoryLikeSchema);
export default CategoryLike;
