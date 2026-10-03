import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    gallery: {
      type: String,
      required: [true, 'Gallery is required'],
      trim: true,
    },
    room: {
      type: String,
      default: null,
      trim: true,
    },
    shelf_or_display: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
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
  }
);

export const Location = mongoose.model('Location', locationSchema);
export default Location;
