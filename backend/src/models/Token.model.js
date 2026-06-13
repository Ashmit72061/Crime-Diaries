import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    family: {
      type: String, // Token rotation family — invalidate whole family on reuse
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — auto-delete expired docs
    },
    userAgent: String,
    ip: String,
  },
  { timestamps: true }
);

TokenSchema.index({ user: 1, isRevoked: 1 });

export const Token = mongoose.model('Token', TokenSchema);
