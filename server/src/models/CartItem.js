import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    artifact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artifact',
      required: true,
    },
    added_at: {
      type: Date,
      default: Date.now,
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

cartItemSchema.virtual('artifact', {
  ref: 'Artifact',
  localField: 'artifact_id',
  foreignField: '_id',
  justOne: true,
});

// Prevent duplicate items in same user's cart
cartItemSchema.index({ user_id: 1, artifact_id: 1 }, { unique: true });

export const CartItem = mongoose.model('CartItem', cartItemSchema);
export default CartItem;
