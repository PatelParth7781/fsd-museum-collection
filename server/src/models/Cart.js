import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    artifact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artifact',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    notes: {
      type: String,
      default: '',
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id ? ret._id.toString() : '';
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

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'checked_out', 'abandoned'],
      default: 'active',
    },
    notes: {
      type: String,
      default: '',
    },
    cart_items: [cartItemSchema],
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

cartSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
