import { Box, Button, Input, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Game = {
  id: number;
};

export default function App() {
  const socket = useRef<Socket | null>(null);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    socket.current = io("localhost:4000")
      .on("game", setGame)
      .on("join_error", (message) => {
        console.log(message);
      });
    return () => {
      socket.current?.close();
    };
  }, []);

  if (game) {
    return (
      <>
        {game.id}
        <Button onClick={() => setGame(null)}>Disconnect</Button>
      </>
    );
  }

  return (
    <SimpleGrid columns={2} minH="100vh">
      <Box>game config</Box>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          socket.current?.emit(
            "join",
            (event.target as HTMLFormElement).room.value
          );
        }}
      >
        <Input name="room" placeholder="Room code" isRequired />
        <Button type="submit">Join room</Button>
      </form>
      <Button variant="ghost" onClick={() => socket.current?.emit("new")}>
        Start game
      </Button>
    </SimpleGrid>
  );
}
