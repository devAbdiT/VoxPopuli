import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // In-memory data store for the polls
  let polls = [
    {
      id: '1',
      question: 'What is your favorite frontend framework?',
      description: 'Help us decide which framework rules the web in 2024.',
      createdAt: Date.now(),
      totalVotes: 150,
      category: 'Technology',
      comments: [],
      options: [
        { id: 'opt_1', text: 'React', votes: 85 },
        { id: 'opt_2', text: 'Vue', votes: 30 },
        { id: 'opt_3', text: 'Angular', votes: 20 },
        { id: 'opt_4', text: 'Svelte', votes: 15 },
      ]
    },
    {
      id: '2',
      question: 'Coffee or Tea?',
      description: 'The ultimate morning beverage showdown.',
      createdAt: Date.now() - 100000,
      totalVotes: 82,
      category: 'Lifestyle',
      comments: [],
      options: [
        { id: 'opt_c', text: 'Coffee', votes: 50 },
        { id: 'opt_t', text: 'Tea', votes: 32 },
      ]
    }
  ];

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    // Send current polls state to the newly connected client
    socket.emit("initial_state", polls);

    // Handle vote
    socket.on("vote_poll", (data: { pollId: string, optionId: string | string[] }) => {
      const { pollId, optionId } = data;
      const pollIndex = polls.findIndex(p => p.id === pollId);
      
      if (pollIndex !== -1) {
        const poll = polls[pollIndex];
        const isExpired = poll.expiresAt ? Date.now() > poll.expiresAt : false;
        
        if (!isExpired) {
          const options = Array.isArray(optionId) ? optionId : [optionId];
          let updated = false;
          options.forEach(optId => {
            const optionIndex = poll.options.findIndex(o => o.id === optId);
            if (optionIndex !== -1) {
              poll.options[optionIndex].votes += 1;
              updated = true;
            }
          });
          
          if (updated) {
            poll.totalVotes += 1;
            // Broadcast to all clients including the sender
            io.emit("poll_voted", { pollId, optionId, poll });
          }
        }
      }
    });

    // Handle add poll
    socket.on("create_poll", (newPoll: any) => {
      polls.unshift(newPoll); // Add to beginning
      io.emit("poll_created", newPoll);
    });

    // Handle delete poll
    socket.on("delete_poll", (pollId: string) => {
      polls = polls.filter(p => p.id !== pollId);
      io.emit("poll_deleted", pollId);
    });

    // Handle add comment
    socket.on("add_comment", (data: { pollId: string, comment: any }) => {
      const { pollId, comment } = data;
      const pollIndex = polls.findIndex(p => p.id === pollId);
      if (pollIndex !== -1) {
        if (!polls[pollIndex].comments) {
          polls[pollIndex].comments = [];
        }
        polls[pollIndex].comments!.push(comment);
        io.emit("poll_updated", polls[pollIndex]);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
