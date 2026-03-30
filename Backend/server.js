import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { YSocketIO } from 'y-socket.io/dist/server';

const app = express();
app.use(express.static('public')); // serve static files from the 'public' directory
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const ysocketio = new YSocketIO(io);
// initialize documents
ysocketio.initialize();


app.get('/health', (req, res) => {
  res.status(200).json({
    message: 'ok',
    success: true
  });
});

httpServer.listen(3000, () => {
  console.log('Server is running on port 3000');
});