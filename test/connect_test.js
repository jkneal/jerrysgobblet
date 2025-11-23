const io = require("socket.io-client");
const assert = require("assert");

const socket1 = io("http://127.0.0.1:3000", { transports: ["websocket"] });
const socket2 = io("http://127.0.0.1:3000", { transports: ["websocket"] });

let socket1Joined = false;
let socket2Joined = false;

console.log("Starting connection test...");

socket1.on("connect", () => {
    console.log("Socket 1 connected with ID:", socket1.id);
    socket1.emit("join_game");
});
socket1.on("connect_error", (err) => {
    console.log("Socket 1 connection error:", err.message);
});

socket2.on("connect", () => {
    console.log("Socket 2 connected with ID:", socket2.id);
    socket2.emit("join_game");
});
socket2.on("connect_error", (err) => {
    console.log("Socket 2 connection error:", err.message);
});

socket1.on("game_update", (gameState) => {
    console.log("Socket 1 received game update:", gameState.id, gameState.state);
    if (gameState.players.find(p => p.id === socket1.id)) {
        socket1Joined = true;
    }
    checkDone();
});

socket2.on("game_update", (gameState) => {
    console.log("Socket 2 received game update:", gameState.id, gameState.state);
    if (gameState.players.find(p => p.id === socket2.id)) {
        socket2Joined = true;
    }
    checkDone();
});

function checkDone() {
    if (socket1Joined && socket2Joined) {
        console.log("SUCCESS: Both players joined the game!");
        socket1.disconnect();
        socket2.disconnect();
        process.exit(0);
    }
}

setTimeout(() => {
    console.log("TIMEOUT: Test failed to complete in time.");
    process.exit(1);
}, 5000);
