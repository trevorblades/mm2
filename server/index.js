import { Server } from "socket.io";
import { createClient } from "redis";
import nid from "nid";

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
  },
});

const client = createClient();

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

    const game = await client.get(id);

    if (game) {
      socket.join(id);
      socket.emit("game", JSON.parse(game));
    }

    // TODO: handle errors

    socket.emit("joining", false);
  });
});

client.connect().then(() => {
  io.listen(4000);
});
