import mongoose from 'mongoose';

const bracketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  game: { type: String, required: true },
  playerCount: { type: Number, required: true },
  bracketType: { type: String, required: true }, // 'single', 'double', 'winner-only', 'loser-only'
  playerNames: [{ type: String }],
  matchResults: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

const Bracket = mongoose.model('Bracket', bracketSchema);

export default Bracket;
