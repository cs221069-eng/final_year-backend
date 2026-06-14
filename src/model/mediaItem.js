import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['live', 'highlight'],
    required: true,
  },
  title: { type: String, required: true },
  streamer: { type: String, default: '' },
  viewers: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Live', 'Scheduled', 'Offline'],
    default: 'Live',
  },
  embedUrl: { type: String, required: true },
  thumbnail: { type: String, required: true },
  category: { type: String, default: '' },
  duration: { type: String, default: '' },
  published: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const MediaItem = mongoose.model('MediaItem', mediaItemSchema);

export default MediaItem;
