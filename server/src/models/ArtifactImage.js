import mongoose from 'mongoose';

const artifactImageSchema = new mongoose.Schema(
  {
    artifact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artifact',
      required: true,
      index: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: '',
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
    uploaded_by: {
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
  }
);

export const ArtifactImage = mongoose.model('ArtifactImage', artifactImageSchema);
export default ArtifactImage;
