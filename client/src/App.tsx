import React, { useEffect, useRef, useState } from "react";
import generate from "generate-maze";
import {
  Box,
  Button,
  Flex,
  Input,
  SimpleGrid,
  Spinner,
  Square,
} from "@chakra-ui/react";
import { Socket, io } from "socket.io-client";

type Game = {
  id: string;
  seed: number;
};

type Cell = {
  x: number;
  y: number;
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

const App = (): JSX.Element => {
  const socket = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [numPlayers, setNumPlayers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    socket.current = io("localhost:4000")
      .on("connect", () => setConnected(true))
      .on("numPlayers", setNumPlayers)
      .on("loading", setLoading)
      .on("joining", setJoining)
      .on("game", setGame)
      .on("join_error", (message) => {
        console.log(message);
      });
    return () => {
      socket.current?.close();
    };
  }, []);

  if (!connected) {
    return <Spinner />;
  }

  if (game) {
    // TODO: set loading=false and game together to avoid double render
    console.log(game);
    const maze = generate(7, 7, true, game.seed);
    return (
      <>
        {game.id}
        <Button onClick={() => socket.current?.emit("leave", game.id)}>
          Disconnect
        </Button>
        <Flex>
          <Box borderWidth={1}>
            {maze.map((cells: Cell[], index) => (
              <Flex key={index}>
                {cells.map((cell, index) => (
                  <Square
                    key={index}
                    size="16"
                    borderTopWidth={Number(cell.top)}
                    borderRightWidth={Number(cell.right)}
                    borderBottomWidth={Number(cell.bottom)}
                    borderLeftWidth={Number(cell.left)}
                    onClick={() => {
                      socket.current?.emit("move", cell.x, cell.y);
                    }}
                  >
                    {cell.x},{cell.y}
                  </Square>
                ))}
              </Flex>
            ))}
          </Box>
        </Flex>
      </>
    );
  }

  return (
    <SimpleGrid columns={2} minH="100vh">
      <Box>
        <div>game config</div>
        <div>
          {numPlayers} player{numPlayers === 1 ? "" : "s"} online
        </div>
      </Box>
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
        <Button type="submit" isLoading={joining}>
          Join room
        </Button>
      </form>
      <Button
        isLoading={loading}
        variant="ghost"
        onClick={() => socket.current?.emit("new")}
      >
        Start game
      </Button>
    </SimpleGrid>
  );
};

export default App;
