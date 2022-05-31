import nid from "nid";
import { Server } from "socket.io";
import { createClient } from "redis";

const io = new Server({
  cors: {
    origin: /^http:\/\/localhost:\d{4}/,
  },
});

const client = createClient();

io.of("/").adapter.on("leave-room", async (room, id) => {
  const game = await client.get(room).then(JSON.parse);
  console.log("leaving room");
  if (game) {
    game.players = game.players.filter((playerId) => playerId !== id);
    await client.set(room, JSON.stringify(game));
    io.to(room).emit("game", game);
  }
});

io.on("connection", (socket) => {
  const broadcastNumPlayers = () =>
    io.emit("numPlayers", io.engine.clientsCount);

  broadcastNumPlayers();
  socket.on("disconnect", broadcastNumPlayers);

  socket.on("new", async () => {
    socket.emit("loading", true);

    const id = nid(4);

    const response = await fetch(
      "https://the-trivia-api.com/api/questions?limit=5"
    );

    if (response.ok) {
      const game = {
        id,
        players: [socket.id],
        questions: await response.json(),
        seed: Math.floor(Math.random() * 1000),
      };

      // save game in redis
      await client.set(id, JSON.stringify(game));

      socket.join(id);
      socket.emit("game", game);
    }

    // TODO: add error state

    socket.emit("loading", false);
  });

  socket.on("join", async (id) => {
    socket.emit("joining", true);

    // FIXME: this might error if client.get resovles null
    const game = await client.get(id).then(JSON.parse);

    if (game) {
      game.players.push(socket.id);
      await client.set(id, JSON.stringify(game));

      socket.join(id);
      io.to(id).emit("game", game);
    }

    // TODO: handle errors

    socket.emit("joining", false);
  });

  socket.on("leave", (id) => {
    socket.leave(id);
    socket.emit("game", null);
  });
});

client.connect().then(() => {
  io.listen(4000);
});
