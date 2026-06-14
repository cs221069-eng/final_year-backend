import mongoose from 'mongoose';

const tournamentRegistrationSchema = new mongoose.Schema({
  tournamentTitle: { type: String, required: true },
  fullName: { type: String, required: true },
  ign: { type: String, required: true },
  whatsApp: { type: String, required: true },
  game: { type: String, required: true }, // e.g. FC26, Tekken 8
  teamName: { type: String, default: '' },
  participationType: { type: String, required: true, enum: ['Solo', 'Team'] },
  createdAt: { type: Date, default: Date.now },
});

const TournamentRegistration = mongoose.model(
  'TournamentRegistration',
  tournamentRegistrationSchema
);

export default TournamentRegistration;
