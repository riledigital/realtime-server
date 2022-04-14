import { createServer } from "http";
import { Server } from "socket.io";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
} from "unique-names-generator";

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

// How often to send ticks
const UPDATE_INTERVAL = 5000;
const PORT = 80;

console.log("Realtime server started on port:", PORT);

// Model: a map of all clients by ID
const clients = new Map();

io.on("connection", (socket) => {
  // Generate a name
  const { id } = socket;
  const displayName = generateNewName();
  // Keep track of all IDs we have
  clients.add(id);
  // Generate and store displayName
  if (!clients.get(id)) {
    clients.set(id, new Map());
  }
  clients.get(id).set("displayName", displayName);
  console.log("Connected:", displayName, id);

  socket.on("mouseUpdate", (args) => {
    const { id } = socket;
    // Get metadata from mouse and router
    const { x, y, route, localTime } = args;

    clients
      .get(id)
      .set("position", { id, displayName, x, y, route, localTime });
  });

  socket.on("disconnect", (reason) => {
    console.log(`Disconnected.`, reason);

    //   Cleanup:
    clients.delete(id);
  });
});

// Connect
// mousemove
// Update: emit regular state throttled to 12fps
const intervalId = setInterval(() => {
  console.log("Sending update...");
  // Emit updates for each
  io.emit("tick", [
    [...clients.keys()].map((key) =>
      Object.fromEntries(clients.get(key).entries())
    ),
  ]);
}, UPDATE_INTERVAL);

//

function generateNewName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors], // colors can be omitted here as not used
    length: 2,
    style: "capital",
    separator: " ",
  });
}

httpServer.listen(PORT);
