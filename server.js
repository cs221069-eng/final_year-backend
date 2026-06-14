import app from './src/app.js';
import connectDB from './src/DB/db.js';

connectDB();

const PORT = process.env.PORT || 3000;
console .log('Starting server...');
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


