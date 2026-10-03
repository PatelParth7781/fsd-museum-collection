import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
    },
    biography: {
      type: String,
      default: '',
      trim: true,
    },
    birth_year: {
      type: Number,
      default: null,
    },
    death_year: {
      type: Number,
      default: null,
    },
    nationality: {
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

export const Artist = mongoose.model('Artist', artistSchema);
export default Artist;
