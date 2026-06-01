const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const REGISTRATION_CHANNEL_ID = "1510975110775832666";
const SLOT_CHANNEL_ID = "1510975256632758272";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let slots = [];

if (fs.existsSync("slots.json")) {
  slots = JSON.parse(fs.readFileSync("slots.json", "utf8"));
}

function saveSlots() {
  fs.writeFileSync("slots.json", JSON.stringify(slots, null, 2));
}

async function updateSlotChannel() {
  const channel = await client.channels.fetch(SLOT_CHANNEL_ID);
  if (!channel) return;

  let text = "🏆 GT ESPORTS SLOT LIST 🏆\n\n";

  for (let i = 0; i < 24; i++) {
    text += `${i + 1}. ${slots[i] || "EMPTY"}\n`;
  }

  const messages = await channel.messages.fetch({ limit: 20 });

  const botMsg = messages.find(
    m => m.author.id === client.user.id
  );

  if (botMsg) {
    await botMsg.edit(text);
  } else {
    await channel.send(text);
  }
}

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateSlotChannel();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "/resetslots") {

  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Only Admin can use this command.");
  }

  slots = [];
  saveSlots();

  await updateSlotChannel();

  return message.reply("✅ All 24 slots have been reset successfully.");
  }

  if (message.channel.id !== REGISTRATION_CHANNEL_ID) return;

  if (slots.length >= 24) {
    return message.reply(
      "❌ Registration Closed!\n\nAll 24 slots have been filled."
    );
  }

  const content = message.content;

  const teamName = content.match(/Team Name:\s*(.+)/i);
  const iglName = content.match(/IGL Name:\s*(.+)/i);
  const iglUid = content.match(/IGL UID:\s*(.+)/i);
  const discordTag = content.match(/IGL Discord Tag:\s*(.+)/i);

  let missing = [];

  if (!teamName) missing.push("Team Name");
  if (!iglName) missing.push("IGL Name");
  if (!iglUid) missing.push("IGL UID");
  if (!discordTag) missing.push("IGL Discord Tag");

  if (missing.length > 0) {
    return message.reply(
      `❌ Registration Rejected!\n\nMissing:\n${missing
        .map(x => `• ${x}`)
        .join("\n")}`
    );
  }

  const team = teamName[1].trim();

  if (slots.includes(team)) {
    return message.reply(
      "❌ Registration Rejected!\n\nTeam already registered."
    );
  }

  const slotNumber = slots.length + 1;

  slots.push(team);
  saveSlots();

  await message.reply(
    `✅ Registration Successful!\n\n🎯 Slot Number: ${slotNumber}`
  );

  await updateSlotChannel();
});

client.login(process.env.BOT_TOKEN);
