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
      id: '5',
      question: 'Will humanoid robots become common household items by 2030?',
      description: 'Evaluating rapid advancements in personal robotics, AI actuators, and consumer pricing.',
      createdAt: Date.now() - 50000,
      totalVotes: 188,
      votesLast24h: 122,
      voteVelocity: 9.8,
      hourlyVotes24h: [3, 2, 1, 1, 2, 3, 4, 7, 8, 10, 12, 11, 8, 7, 9, 8, 6, 5, 4, 4, 3, 2, 1, 2],
      category: 'Technology',
      comments: [],
      options: [
        { id: 'opt_r1', text: 'Yes, personal robotics are imminent', votes: 56 },
        { id: 'opt_r2', text: 'No, too expensive and mechanically complex', votes: 78 },
        { id: 'opt_r3', text: 'Only in specialized healthcare / eldercare', votes: 54 },
      ]
    },
    {
      id: '1',
      question: 'What is your favorite frontend framework?',
      description: 'Help us decide which framework rules the web in 2024.',
      createdAt: Date.now(),
      totalVotes: 150,
      votesLast24h: 94,
      voteVelocity: 7.2,
      hourlyVotes24h: [2, 1, 0, 1, 0, 1, 2, 4, 6, 8, 9, 7, 5, 6, 8, 10, 7, 5, 4, 3, 2, 1, 2, 1],
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
      id: '3',
      question: 'Should AI-generated campaign ads require mandatory disclosures?',
      description: 'Debating digital election transparency and safeguards in modern politics.',
      createdAt: Date.now() - 200000,
      totalVotes: 114,
      votesLast24h: 68,
      voteVelocity: 5.4,
      hourlyVotes24h: [1, 0, 1, 0, 0, 1, 3, 5, 6, 4, 5, 7, 6, 5, 4, 3, 4, 5, 3, 2, 1, 1, 1, 1],
      category: 'Politics',
      comments: [],
      options: [
        { id: 'opt_p1', text: 'Yes, mandatory for all campaign media', votes: 78 },
        { id: 'opt_p2', text: 'Only for realistic audio/video deepfakes', votes: 26 },
        { id: 'opt_p3', text: 'No, let platform guidelines handle it', votes: 10 },
      ]
    },
    {
      id: '2',
      question: 'Coffee or Tea?',
      description: 'The ultimate morning beverage showdown.',
      createdAt: Date.now() - 100000,
      totalVotes: 82,
      votesLast24h: 46,
      voteVelocity: 3.8,
      hourlyVotes24h: [0, 0, 0, 0, 1, 2, 6, 8, 7, 4, 3, 2, 2, 1, 2, 1, 2, 1, 1, 1, 0, 1, 0, 1],
      category: 'Lifestyle',
      comments: [],
      options: [
        { id: 'opt_c', text: 'Coffee', votes: 50 },
        { id: 'opt_t', text: 'Tea', votes: 32 },
      ]
    },
    {
      id: '4',
      question: 'Best cuisine for a Friday night gathering?',
      description: 'Vote on the ultimate crowd-pleaser for dinner with friends.',
      createdAt: Date.now() - 300000,
      totalVotes: 64,
      votesLast24h: 36,
      voteVelocity: 2.9,
      hourlyVotes24h: [0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 3, 2, 3, 4, 3, 2, 2, 1, 1, 1, 1, 0],
      category: 'Food',
      comments: [],
      options: [
        { id: 'opt_f1', text: 'Neapolitan Pizza', votes: 28 },
        { id: 'opt_f2', text: 'Street Tacos', votes: 22 },
        { id: 'opt_f3', text: 'Sushi & Ramen', votes: 14 },
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
            poll.votesLast24h = (poll.votesLast24h || 0) + 1;
            if (!poll.hourlyVotes24h || poll.hourlyVotes24h.length !== 24) {
              poll.hourlyVotes24h = new Array(24).fill(0);
            }
            poll.hourlyVotes24h[23] = (poll.hourlyVotes24h[23] || 0) + 1;
            const recent3h = poll.hourlyVotes24h.slice(-3).reduce((a: number, b: number) => a + b, 0);
            poll.voteVelocity = Number((recent3h / 3).toFixed(1));

            // Broadcast to all clients including the sender
            io.emit("poll_voted", { pollId, optionId, poll });
          }
        }
      }
    });

    // Handle add poll
    socket.on("create_poll", (newPoll: any) => {
      if (!newPoll.votesLast24h) newPoll.votesLast24h = 0;
      if (!newPoll.hourlyVotes24h) newPoll.hourlyVotes24h = new Array(24).fill(0);
      if (!newPoll.voteVelocity) newPoll.voteVelocity = 0;
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
