import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  game: { type: String, required: true },
  status: {
    type: String,
    enum: ['Upcoming', 'Live', 'Completed'],
    default: 'Upcoming',
  },
  schedule: { type: String, required: true },
  prize: { type: String, required: true },
  attendance: { type: String, required: true },
  streamUrl: { type: String, default: '' },
  actionText: { type: String, default: 'Register' },
  // Store image as binary buffer in DB and keep MIME type
  imageData: { type: Buffer },
  imageType: { type: String, default: '' },
  // `imageUrl` remains for clients but is computed at response time (not persisted)
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
