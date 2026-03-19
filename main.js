const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const TOKEN = process.env.TOKEN;

// ===== CONFIG =====
const NEAR = 45;
const MID = 100;

const VC_NEAR = "PUT_NEAR_CHANNEL_ID";
const VC_MID = "PUT_MID_CHANNEL_ID";
const VC_FAR = "PUT_FAR_CHANNEL_ID";

// ===== DATA FILES =====
const POS_FILE = './positions.json';
const LINK_FILE = './links.json';
const LOG_FILE = './server.log'; // change if needed

// ===== LOAD/SAVE =====
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return {};
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let positions = loadJSON(POS_FILE);
let playerMap = loadJSON(LINK_FILE);

// ===== DISTANCE =====
function getDistance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}

function getChannel(dist) {
  if (dist <= NEAR) return VC_NEAR;
  if (dist <= MID) return VC_MID;
  return VC_FAR;
}

// ===== PARSE LOG =====
function parseLine(line) {
  if (!line.includes("Teleported")) return;

  const match = line.match(/Teleported (.+) to ([\d\.-]+), ([\d\.-]+), ([\d\.-]+)/);

  if (match) {
    const name = match[1];
    const x = parseFloat(match[2]);
    const y = parseFloat(match[3]);
    const z = parseFloat(match[4]);

    positions[name] = { x, y, z };
    saveJSON(POS_FILE, positions);

    console.log(`📍 ${name}: ${x}, ${y}, ${z}`);
  }
}

// watch log
fs.watchFile(LOG_FILE, () => {
  const data = fs.readFileSync(LOG_FILE, 'utf-8');
  const lines = data.split("\n");
  lines.forEach(parseLine);
});

// ===== BOT START =====
client.once('ready', () => {
  console.log(`✅ Bot online`);

  setInterval(async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const players = Object.keys(positions);

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {

        const p1 = players[i];
        const p2 = players[j];

        if (!playerMap[p1] || !playerMap[p2]) continue;

        const dist = getDistance(positions[p1], positions[p2]);

        const m1 = await guild.members.fetch(playerMap[p1]).catch(() => null);
        const m2 = await guild.members.fetch(playerMap[p2]).catch(() => null);

        if (!m1 || !m2) continue;
        if (!m1.voice.channel || !m2.voice.channel) continue;

        const target = getChannel(dist);

        await m1.voice.setChannel(target).catch(() => {});
        await m2.voice.setChannel(target).catch(() => {});
      }
    }

  }, 3000);
});

// ===== LINK COMMAND =====
client.on('messageCreate', (msg) => {
  if (msg.content.startsWith("!link")) {
    const args = msg.content.split(" ");
    const mcName = args[1];

    if (!mcName) return msg.reply("Usage: !link MinecraftName");

    playerMap[mcName] = msg.author.id;
    saveJSON(LINK_FILE, playerMap);

    msg.reply(`✅ Linked ${mcName}`);
  }
});

client.login(TOKEN);
