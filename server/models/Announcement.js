import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      default: 'FREE SUNGLASSES WORTH RS 949 ABOVE A PURCHASE OF RS 2000',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Announcement', announcementSchema);
