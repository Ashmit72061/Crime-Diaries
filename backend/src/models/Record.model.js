import mongoose from 'mongoose';

const RecordSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      required: true,
      enum: ['CASE', 'ARREST', 'PCR', 'MISSING', 'UIDB'],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    policeStation: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Record = mongoose.model('Record', RecordSchema);
