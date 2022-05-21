import { Server } from "socket.io";
import { createClient } from "redis";
import { nanoid } from "nanoid";

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
  },
});

const client = createClient();

io.on("connection", (socket) => {
  socket.on("new", async () => {
    const id = nanoid();
    await client.set(id, "test");

    socket.join(id);
    socket.emit("game", {
      id,
      questions: [{ id: 321 }],
    });
  });

  socket.on("join", async (room) => {
    const value = await client.get(room);

    if (value) {
      socket.join(room);
      socket.emit("game", {
        id: room,
        questions: [],
      });
    } else {
      socket.emit("join_error", "Room not found");
    }
  });
});

client.connect().then(() => {
  io.listen(4000);
});
