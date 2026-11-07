require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, REST, Routes } = require('discord.js');
const { handleDeobfuscateMessage, handleDetectMessage, handleSlash, slashCommands } = require('./commands');
const { container, V2_FLAG } = require('./utils/discordComponents');

const PREFIXES = ['.', '/'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const body = slashCommands.map((c) => c.toJSON());
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body });
      console.log('Registered guild slash commands.');
    } else {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body });
      console.log('Registered global slash commands.');
    }
  } catch (e) {
    console.error('Command registration failed:', e);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const content = message.content || '';
  const prefix = PREFIXES.find((p) => content.startsWith(p));
  if (!prefix) return;
  // strip prefix
  const without = content.slice(prefix.length).trim();
  const [cmd, ...rest] = without.split(/\s+/);
  const command = (cmd || '').toLowerCase();
  // reconstruct message content without prefix for handlers (they expect full content)
  if (command === 'deobfuscate' || command === 'deob' || command === 'deobf') {
    await handleDeobfuscateMessage(message);
  } else if (command === 'detect') {
    await handleDetectMessage(message);
  } else if (command === 'ping') {
    const comp = container('Pong', `Latency: ${client.ws.ping}ms`, 0x5865F2);
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else if (command === 'help') {
    const comp = container('MommyDeob Help', [
      '**Commands (prefix `.` or `/`):**',
      '• `deobfuscate` — deobfuscate a script',
      '• `detect` — detect obfuscator type',
      '• `ping` — bot latency',
      '',
      '**Supported:** WeAreDevs / Prometheus-style.'
    ].join('\n'), 0x5865F2);
    await message.reply({ components: [comp], flags: V2_FLAG });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleSlash(interaction);
});

client.login(process.env.DISCORD_TOKEN);