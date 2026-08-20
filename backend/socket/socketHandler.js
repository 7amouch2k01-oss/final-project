/**
 * Socket.io handler — manages all real-time events
 * io is passed in from server.js
 */

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // ── Join personal room on connect ────────────────────────
    // Frontend sends: socket.emit('join', userId)
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`📌 User ${userId} joined their room`);
      }
    });

    // ── Join admin room ───────────────────────────────────────
    socket.on('join:admin', () => {
      socket.join('admin');
      console.log(`🛡️  Admin joined admin room`);
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  // ── Exported emitters (called from controllers) ───────────
  // Usage in controller: req.io.to(userId).emit('event', data)
  //
  // Events:
  //  application:status_changed  → applicant
  //  application:new             → recruiter (citizen who posted listing)
  //  recruit:approved            → citizen
  //  recruit:rejected            → citizen
  //  recruit:request_received    → admin room
  //  graduation:confirmed        → student
  //  notification:broadcast      → all
};

module.exports = initSocket;
