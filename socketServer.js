let users = [];

const EditData = (data, id, call) => {
  const newData = data.map((item) =>
    item.id === id ? { ...item, call } : item
  );
  return newData;
};

const SocketServer = (socket) => {
  // Connect - Disconnect
  socket.on('joinUser', (user) => {
    users.push({
      id: user._id,
      socketId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    const data = users.find((user) => user.socketId === socket.id);
    if (data) {
      if (data.call) {
        const callUser = users.find((user) => user.id === data.call);
        if (callUser) {
          users = EditData(users, callUser.id, null);
          socket.to(`${callUser.socketId}`).emit('callerDisconnect');
        }
      }
    }

    users = users.filter((user) => user.socketId !== socket.id);
  });

  // Notification
  socket.on('createNotify', (msgs) => {
    const client = users.find((user) => msgs.recipients.includes(user.id));
    client &&
      socket.to(`${client.socketId}`).emit('createNotifyToClient', msgs);
  });

  socket.on('removeNotify', (msg) => {
    const client = users.find((user) => msg.recipients.includes(user.id));
    client && socket.to(`${client.socketId}`).emit('removeNotifyToClient', msg);
  });

  // Message
  socket.on('addMessage', (msg) => {
    const user = users.find((user) => user.id === msg.recipient);
    user && socket.to(`${user.socketId}`).emit('addMessageToClient', msg);
  });

  // Check User Online / Offline
  socket.on('checkUserOnline', (data) => {
    const following = users.filter((user) => {
      return user.id;
    });

    socket.emit('checkUserOnlineToMe', following);

    const clients = users.filter((user) => user.id);

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket
          .to(`${client.socketId}`)
          .emit('checkUserOnlineToClient', data._id);
      });
    }
  });

  // Call User
  socket.on('callUser', (data) => {
    users = EditData(users, data.sender, data.recipient);

    const client = users.find((user) => user.id === data.recipient);

    if (client) {
      if (client.call) {
        socket.emit('userBusy', data);
        users = EditData(users, data.sender, null);
      } else {
        users = EditData(users, data.recipient, data.sender);
        socket.to(`${client.socketId}`).emit('callUserToClient', data);
      }
    }
  });

  socket.on('endCall', (data) => {
    const client = users.find((user) => user.id === data.sender);

    if (client) {
      socket.to(`${client.socketId}`).emit('endCallToClient', data);
      users = EditData(users, client.id, null);

      if (client.call) {
        const clientCall = users.find((user) => user.id === client.call);
        clientCall &&
          socket.to(`${clientCall.socketId}`).emit('endCallToClient', data);

        users = EditData(users, client.call, null);
      }
    }
  });
};

module.exports = SocketServer;
