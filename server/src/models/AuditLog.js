import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity_type: {
      type: String,
      required: true,
      index: true,
    },
    entity_id: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    ip_address: {
      type: String,
      default: '',
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.description = ret.description || ret.details || '';
        ret.details = ret.details || ret.description || '';
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

auditLogSchema.pre('save', function (next) {
  if (this.description && !this.details) this.details = this.description;
  if (this.details && !this.description) this.description = this.details;
  next();
});

auditLogSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
