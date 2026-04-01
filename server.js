import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9119;

// Request logging to verify the server is receiving traffic
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all other routes by serving 'index.html' (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error: dist/index.html not found. Did you run npm run build?');
      }
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> Production server is running!`);
  console.log(`>>> Internal Port: ${PORT}`);
  console.log(`>>> Listening on: http://0.0.0.0:${PORT}`);
});
