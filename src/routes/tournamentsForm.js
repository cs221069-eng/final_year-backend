import express from 'express';
import tournamentController from '../controllers/tournamentform.js';
import { anyAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', tournamentController.submitForm );
router.get('/registrations', anyAuth, tournamentController.getRegistrations);

export default router;


