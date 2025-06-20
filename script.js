import { saveGameResult } from './firebase-setup.js';


let players = [];
let scores = {};
let games = [];
let gameNumber = 1;

const gameArea = document.getElementById("gameArea");
const playerInputs = document.getElementById("playerInputs");
const resultsArea = document.getElementById("resultsArea");
const gameLog = document.getElementById("gameLog");
const gameNumSpan = document.getElementById("gameNumber");
const winnerMessage = document.getElementById("winnerMessage");

// Start a new match
document.getElementById("startMatchBtn").onclick = () => {
  const input = document.getElementById("playerNames").value.trim();
  if (!input) return alert("Please enter player names");

  players = input.split(",").map(name => name.trim());
  if (players.length < 2) return alert("At least 2 players needed");

  players.forEach(p => scores[p] = 0);
  gameNumber = 1;
  games = [];

  gameNumSpan.textContent = gameNumber;
  updatePlayerInputs();
  gameArea.style.display = "block";
  resultsArea.style.display = "none";
};

// Render input fields for players
function updatePlayerInputs() {
  playerInputs.innerHTML = "";
  players.forEach(player => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `<span>${player}</span><input type="number" min="1" max="${players.length}" id="place-${player}" placeholder="Rank" />`;
    playerInputs.appendChild(row);
  });
}

// Submit a game
document.getElementById("submitGameBtn").onclick = () => {
  const placements = {};
  for (let p of players) {
    const val = parseInt(document.getElementById(`place-${p}`).value);
    if (!val || val < 1 || val > players.length) {
      return alert(`Enter valid place (1-${players.length}) for ${p}`);
    }
    placements[p] = val;
  }

  players.forEach(p => {
    scores[p] += placements[p]; // lower score = better
  });

  games.push({ game: gameNumber, placements });
  gameNumber++;
  gameNumSpan.textContent = gameNumber;
  updatePlayerInputs();
};

// End match & show results
document.getElementById("endMatchBtn").onclick = () => {
  gameArea.style.display = "none";
  resultsArea.style.display = "block";

  const ranked = [...players].sort((a, b) => scores[a] - scores[b]);
  const winner = ranked[0];
  const loser = ranked[ranked.length - 1];

let rankText = `<div>🏆 <strong>${winner}</strong> is the overall winner!</div><ol>`;
ranked.forEach(player => {
  rankText += `<li>${player} – ${scores[player]} pts</li>`;
});
rankText += `</ol>`;
winnerMessage.innerHTML = rankText;


saveGameResult({
  timestamp: new Date().toISOString(),
  gameCount: games.length,
  scores: scores,
  history: games,
  winner: winner,
  loser: ranked[ranked.length - 1]
});


  // Generate roast
  fetchRoast(loser);

  // Show game history
  gameLog.innerHTML = games.map(g => {
    const scores = Object.entries(g.placements)
      .map(([name, place]) => `${name}: ${place}`)
      .join(", ");
    return `<div class="game-entry">Game ${g.game}: ${scores}</div>`;
  }).join("");
};

// Reset game
document.getElementById("resetMatchBtn").onclick = () => {
  players = [];
  scores = {};
  games = [];
  document.getElementById("playerNames").value = "";
  gameArea.style.display = "none";
  resultsArea.style.display = "none";
};

// Fetch roast quote using OpenAI function
function fetchRoast(loser) {
  const tone = document.getElementById("roastTone").value;
  fetch("/.netlify/functions/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loserName: loser, tone })
  })
  .then(res => res.json())
  .then(data => {
    winnerMessage.innerHTML += `<br><br><strong>💬 Roast for ${loser}:</strong> ${data.quote}`;
    document.getElementById("hearRoastBtn").onclick = () => playRoastVoice(data.quote);
  })
  .catch(err => console.error("Roast error:", err));
}

// Play voiceover using OpenAI TTS
function playRoastVoice(text) {
  fetch("/.netlify/functions/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  })
  .then(res => res.blob())
  .then(blob => {
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  })
  .catch(err => console.error("TTS error:", err));
}

// Dark mode toggle
document.getElementById("darkModeToggle").onchange = (e) => {
  document.body.classList.toggle("dark", e.target.checked);
};
