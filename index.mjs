import { createServer } from "http";
import { Server } from "socket.io";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
} from "unique-names-generator";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [/localhost:(\d)+$/, /riledigital.com$/, /\.local$/],
    methods: ["GET", "POST"],
  },
});

// How often to send ticks
const UPDATE_INTERVAL = 60;
const PORT = process.env.PORT || 3000;

console.log("Realtime server started on port:", PORT);
console.log("options:", { UPDATE_INTERVAL, PORT });

// Model: a map of all clients by ID
const clients = new Map();

io.on("connection", (socket) => {
  // Generate a name
  const { id } = socket;
  const displayName = generateNewName();
  // Keep track of all IDs we have
  // Generate and store displayName
  const clientMeta = new Map();
  clientMeta.set("id", id);
  clientMeta.set("displayName", displayName);
  console.log("Connected:", displayName, id);
  clients.set(id, clientMeta);

  // Send the displayName to the client...
  socket.emit("getDisplayName", { displayName });

  socket.on("mouseUpdate", (args) => {
    const { id } = socket;
    // Get metadata from mouse and path
    const { x, y, path, localTime } = args;

    clients.get(id).set("position", { id, displayName, x, y, path, localTime });
  });

  socket.on("disconnect", (reason) => {
    console.log(`Disconnected.`, reason, id);
    clients.delete(id);
    console.log("data:", clients.get(id));
  });
});

// Connect
// mousemove
// Update: emit regular state throttled to 12fps
const intervalId = setInterval(() => {
  console.log("Sending update...");
  // Emit updates for each
  let payload = [...clients.keys()].map((key) =>
    Object.fromEntries(clients.get(key).entries())
  );
  payload = payload.filter((d) => d.position);
  console.log(payload);
  io.emit("tick", payload);
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
