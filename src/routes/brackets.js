import express from 'express';
import Bracket from '../model/bracket.js';
import { adminAuth, anyAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all brackets (accessible by admin and app users)
router.get('/', anyAuth, async (req, res) => {
  try {
    const brackets = await Bracket.find().sort({ createdAt: -1 });
    return res.status(200).json(brackets);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load brackets' });
  }
});

// Create a bracket
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, game, playerCount, bracketType, playerNames, matchResults } = req.body;

    if (!title || !game || !playerCount || !bracketType) {
      return res.status(400).json({ message: 'Title, game, playerCount, and bracketType are required' });
    }

    const bracket = new Bracket({
      title,
      game,
      playerCount,
      bracketType,
      playerNames: playerNames || [],
      matchResults: matchResults || {},
    });

    await bracket.save();
    return res.status(201).json(bracket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create bracket' });
  }
});

// Update a bracket
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, game, playerCount, bracketType, playerNames, matchResults } = req.body;

    const bracket = await Bracket.findById(id);
    if (!bracket) {
      return res.status(404).json({ message: 'Bracket not found' });
    }

    if (title !== undefined) bracket.title = title;
    if (game !== undefined) bracket.game = game;
    if (playerCount !== undefined) bracket.playerCount = playerCount;
    if (bracketType !== undefined) bracket.bracketType = bracketType;
    if (playerNames !== undefined) bracket.playerNames = playerNames;
    if (matchResults !== undefined) {
      // Mark as modified if it is a Map/nested object
      bracket.matchResults = matchResults;
      bracket.markModified('matchResults');
    }

    await bracket.save();
    return res.status(200).json(bracket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update bracket' });
  }
});

// Delete a bracket
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Bracket.findByIdAndDelete(id);
    if (!removed) {
      return res.status(404).json({ message: 'Bracket not found' });
    }
    return res.status(200).json({ message: 'Bracket deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete bracket' });
  }
});

export default router;
