import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;

const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "FaceTime Signaling Server",
        timestamp: new Date().toISOString()
      })
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connected users storage
// Map<socketId, User>
const socketToUser = new Map();
// Map<userId, socketId>
const userToSocket = new Map();

function broadcastUsersList() {
  const onlineUsers = Array.from(socketToUser.values());
  io.emit("users-update", onlineUsers);
}

io.on("connection", (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // User registers their profile
  socket.on("register-user", (userData) => {
    if (!userData || !userData.id) return;

    const user = {
      id: userData.id,
      name: userData.name || userData.id,
      avatar: userData.avatar || "",
      status: "online",
      socketId: socket.id
    };

    // If this userId was previously connected on another socket, cleanup old mapping
    const oldSocketId = userToSocket.get(user.id);
    if (oldSocketId && oldSocketId !== socket.id) {
      socketToUser.delete(oldSocketId);
    }

    socketToUser.set(socket.id, user);
    userToSocket.set(user.id, socket.id);

    console.log(`[User Registered] ${user.name} (${user.id}) -> socket ${socket.id}`);
    broadcastUsersList();
  });

  // Request list of online users
  socket.on("get-users", (callback) => {
    const onlineUsers = Array.from(socketToUser.values());
    if (typeof callback === "function") {
      callback(onlineUsers);
    }
  });

  // Initiate call
  socket.on("call-user", ({ toUserId, fromUser, callType = "video" }) => {
    console.log(
      `[Call Initiate] From ${fromUser?.name || fromUser?.id} to user ${toUserId}`
    );
    const targetSocketId = userToSocket.get(toUserId);

    if (!targetSocketId) {
      console.log(`[Call Failed] Target user ${toUserId} is offline`);
      socket.emit("call-failed", {
        reason: "offline",
        message: "User is currently offline."
      });
      return;
    }

    io.to(targetSocketId).emit("incoming-call", {
      fromUser: fromUser || socketToUser.get(socket.id),
      callType
    });
  });

  // Accept call
  socket.on("accept-call", ({ toUserId, fromUser }) => {
    console.log(
      `[Call Accepted] By ${fromUser?.name || fromUser?.id} for caller ${toUserId}`
    );
    const callerSocketId = userToSocket.get(toUserId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", {
        fromUser: fromUser || socketToUser.get(socket.id)
      });
    }
  });

  // Reject call
  socket.on("reject-call", ({ toUserId, reason = "busy" }) => {
    console.log(`[Call Rejected] For caller ${toUserId}, reason: ${reason}`);
    const callerSocketId = userToSocket.get(toUserId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected", { reason });
    }
  });

  // End call
  socket.on("end-call", ({ toUserId }) => {
    console.log(`[Call Ended] With ${toUserId}`);
    const peerSocketId = userToSocket.get(toUserId);
    if (peerSocketId) {
      io.to(peerSocketId).emit("call-ended", {
        fromUserId: socketToUser.get(socket.id)?.id
      });
    }
  });

  // WebRTC Offer relay
  socket.on("webrtc-offer", ({ toUserId, offer, fromUserId }) => {
    const targetSocketId = userToSocket.get(toUserId);
    const sender = socketToUser.get(socket.id);
    const senderId = fromUserId || sender?.id;
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-offer", {
        fromUserId: senderId,
        offer
      });
    }
  });

  // WebRTC Answer relay
  socket.on("webrtc-answer", ({ toUserId, answer, fromUserId }) => {
    const targetSocketId = userToSocket.get(toUserId);
    const sender = socketToUser.get(socket.id);
    const senderId = fromUserId || sender?.id;
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-answer", {
        fromUserId: senderId,
        answer
      });
    }
  });

  // WebRTC ICE Candidate relay
  socket.on("ice-candidate", ({ toUserId, candidate, fromUserId }) => {
    const targetSocketId = userToSocket.get(toUserId);
    const sender = socketToUser.get(socket.id);
    const senderId = fromUserId || sender?.id;
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        fromUserId: senderId,
        candidate
      });
    }
  });

  // FaceTime Reactions Relay (emotions / hand gestures / manual reactions)
  socket.on(
    "send-reaction",
    ({ toUserId, reaction, gesture, x, y, timestamp, fromUserId }) => {
      const targetSocketId = userToSocket.get(toUserId);
      const sender = socketToUser.get(socket.id);
      const senderId = fromUserId || sender?.id;
      if (targetSocketId) {
        console.log(
          `[Reaction] From ${senderId} to ${toUserId}: ${reaction} (${gesture || "manual"}) at (${x}, ${y})`
        );
        io.to(targetSocketId).emit("receive-reaction", {
          fromUserId: senderId,
          reaction,
          gesture,
          x,
          y,
          timestamp: timestamp || Date.now()
        });
      }
    }
  );

  // Disconnect handler
  socket.on("disconnect", () => {
    const user = socketToUser.get(socket.id);
    if (user) {
      console.log(`[User Disconnected] ${user.name} (${user.id})`);
      userToSocket.delete(user.id);
      socketToUser.delete(socket.id);
      broadcastUsersList();
    } else {
      console.log(`[Socket Disconnected] ${socket.id}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`FaceTime Signaling Server running on http://localhost:${PORT}`);
});
