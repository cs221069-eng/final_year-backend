import express from 'express';
import multer from 'multer';
import path from 'path';
import Tournament from '../model/tournament.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Use memory storage so we can persist the binary into the DB
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
  },
});

router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 });

    // Convert image buffer to data URL for clients
    const payload = tournaments.map((t) => {
      const obj = t.toObject();
      if (t.imageData && t.imageType) {
        try {
          obj.imageUrl = `data:${t.imageType};base64,${t.imageData.toString('base64')}`;
        } catch (err) {
          obj.imageUrl = '';
        }
      }
      return obj;
    });

    return res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load tournaments' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, game, status, schedule, prize, attendance, streamUrl, actionText } = req.body;

    if (!title || !game || !status || !schedule || !prize || !attendance || !actionText) {
      return res.status(400).json({ message: 'Title, game, status, schedule, prize, attendance and action text are required' });
    }

    const tournamentData = {
      title,
      game,
      status,
      schedule,
      prize,
      attendance,
      streamUrl,
      actionText,
    };

    if (req.file && req.file.buffer) {
      tournamentData.imageData = req.file.buffer;
      tournamentData.imageType = req.file.mimetype;
    }

    const tournament = new Tournament(tournamentData);
    await tournament.save();

    // prepare response with data URL if image present
    const out = tournament.toObject();
    if (tournament.imageData && tournament.imageType) {
      out.imageUrl = `data:${tournament.imageType};base64,${tournament.imageData.toString('base64')}`;
    }

    return res.status(201).json(out);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create tournament' });
  }
});

// Update tournament (admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, game, status, schedule, prize, attendance, streamUrl, actionText } = req.body;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // update fields if provided
    if (title) tournament.title = title;
    if (game) tournament.game = game;
    if (status) tournament.status = status;
    if (schedule) tournament.schedule = schedule;
    if (prize) tournament.prize = prize;
    if (attendance) tournament.attendance = attendance;
    if (streamUrl !== undefined) tournament.streamUrl = streamUrl;
    if (actionText !== undefined) tournament.actionText = actionText;

    // replace image if provided
    if (req.file && req.file.buffer) {
      tournament.imageData = req.file.buffer;
      tournament.imageType = req.file.mimetype;
    }

    await tournament.save();

    const out = tournament.toObject();
    if (tournament.imageData && tournament.imageType) {
      out.imageUrl = `data:${tournament.imageType};base64,${tournament.imageData.toString('base64')}`;
    }

    return res.status(200).json(out);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update tournament' });
  }
});

// Delete tournament (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Tournament.findByIdAndDelete(id);
    if (!removed) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    return res.status(200).json({ message: 'Tournament deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete tournament' });
  }
});

export default router;

