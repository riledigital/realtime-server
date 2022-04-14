import engine from "engine.io";

import {
  uniqueNamesGenerator,
  adjectives,
  colors,
} from "unique-names-generator";

// How often to send ticks
const UPDATE_INTERVAL = 5000;
const server = engine.listen(80);

// Model: a map of all clients by ID
const clientPositions = new Map();
// const clientNames = new Map();

// A set of all clients
const clients = new Map();

server.on("connection", (socket) => {
  // Generate a name
  const { id } = socket;
  console.log("Connected:", id);
  // Keep track of all IDs we have
  clients.add(id);
  // Generate and store displayName
  if (!clients.get(id)) {
    clients.set(id, new Map());
  }
  clients.get(id).set("displayName", generateNewName());

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
  // Emit updates for each
  server.emit("tick", [
    clients.keys().map((key) => Object.fromEntries(clients.get(key).entries())),
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
