import TournamentRegistration from '../model/tournamentRegistration.js';

const tournamentsFormController = {
  submitForm: async (req, res) => {
    try {
      console.log("📩 BODY RECEIVED:", req.body);

      const {
        eventTitle,
        fullName,
        ign,
        whatsapp,
        gameTitle,
        teamName,
        participationType,
      } = req.body;

      const tournamentForm = new TournamentRegistration({
        tournamentTitle: eventTitle,
        fullName,
        ign,
        whatsApp: whatsapp,
        game: gameTitle,
        teamName: teamName || "",
        participationType,
      });

      await tournamentForm.save();

      console.log("✅ Saved Successfully");

      return res.status(201).json({
        message: "Form submitted successfully",
      });

    } catch (error) {
      console.log("🔥 ERROR:", error.message);

      return res.status(500).json({
        error: error.message,
      });
    }
  },

  getRegistrations: async (req, res) => {
    try {
      const { game } = req.query;
      let filter = {};
      if (game) {
        // Allow case insensitive and partial match e.g. "FC 26", "FC26", "Tekken"
        const cleanGame = game.replace(/\s+/g, '').toLowerCase(); // e.g. "fc26", "tekken8"
        // Let's query using regex or custom matches. Regex is simple:
        filter = {
          $or: [
            { game: { $regex: new RegExp(game, 'i') } },
            { game: { $regex: new RegExp(cleanGame, 'i') } }
          ]
        };
      }
      const list = await TournamentRegistration.find(filter).sort({ createdAt: -1 });
      return res.status(200).json(list);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
};

export default tournamentsFormController;