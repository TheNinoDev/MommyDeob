require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes
} = require('discord.js');

const {
  handleDeobfCommand,
  handleDumpCommand,
  handleSpyCommand,
  handleDetectCommand,
  handleGetCommand,
  handleBypassCommand,
  handleRenameCommand,
  handleBeautifyCommand,
  handleMinifyCommand,
  handlePasteCommand,
  handleSupportedCommand,
  handleGetKeyCommand,
  handleRedeemCommand,
  handleStatusCommand,
  handleSlash,
  slashCommands
} = require('./commands');

const { handleDeobSelectMenu } = require('./features/deobfInteractive');
const { container, replyError, V2_FLAG, ACCENT_COLOR } = require('./utils/discordComponents');

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
  console.log(`[MommyDeob] Online and hunting skids as ${c.user.tag}`);

  if (!process.env.CLIENT_ID || process.env.CLIENT_ID.includes('KEEP_SECRET')) {
    console.warn('[MommyDeob] Notice: Valid CLIENT_ID not set in .env yet. Skipping slash registration.');
    return;
  }

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const body = slashCommands.map((cmd) => cmd.toJSON());

    if (process.env.GUILD_ID && process.env.GUILD_ID.trim()) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID.trim()),
        { body }
      );
      console.log('[MommyDeob] Guild slash commands loaded.');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body }
      );
      console.log('[MommyDeob] Global slash commands loaded.');
    }
  } catch (err) {
    console.error('[MommyDeob] Slash registration error:', err.message);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const content = message.content || '';
  const prefix = PREFIXES.find((p) => content.startsWith(p));
  if (!prefix) return;

  const withoutPrefix = content.slice(prefix.length).trim();
  const [cmdToken] = withoutPrefix.split(/\s+/);
  const command = (cmdToken || '').toLowerCase();

  try {
    // Deobfuscate
    if (['deobf', 'deob', 'deo', 'do', 'deobfuscate'].includes(command)) {
      await handleDeobfCommand(message);
    }
    // Dumper / Logger
    else if (['dump', 'l', 'log'].includes(command)) {
      await handleDumpCommand(message);
    }
    // HTTP Spy
    else if (['spy'].includes(command)) {
      await handleSpyCommand(message);
    }
    // Detect
    else if (['detect', 'd', 'dtc'].includes(command)) {
      await handleDetectCommand(message);
    }
    // Script Fetcher
    else if (['get', 'g'].includes(command)) {
      await handleGetCommand(message);
    }
    // Link Bypass
    else if (['bypass', 'byp', 'bypasscity'].includes(command)) {
      await handleBypassCommand(message);
    }
    // Identifier Renamer
    else if (['rename', 'rn', 'r'].includes(command)) {
      await handleRenameCommand(message);
    }
    // Lua Beautifier
    else if (['beautify', 'b', 'btf'].includes(command)) {
      await handleBeautifyCommand(message);
    }
    // Lua Minifier
    else if (['minify'].includes(command)) {
      await handleMinifyCommand(message);
    }
    // Paste / Post
    else if (['paste', 'post', 'p', 'pst', 'past'].includes(command)) {
      await handlePasteCommand(message);
    }
    // Supported
    else if (['supported'].includes(command)) {
      await handleSupportedCommand(message);
    }
    // Key system
    else if (['getkey', 'key'].includes(command)) {
      await handleGetKeyCommand(message);
    }
    else if (['redeem'].includes(command)) {
      await handleRedeemCommand(message);
    }
    else if (['status'].includes(command)) {
      await handleStatusCommand(message);
    }
    // Utility
    else if (['ping'].includes(command)) {
      const comp = container('Latency', `Websocket: ${client.ws.ping}ms`, ACCENT_COLOR, '[ pong ]');
      await message.reply({ components: [comp], flags: V2_FLAG });
    }
    else if (['help'].includes(command)) {
      const comp = container(
        'MommyDeob Command Matrix',
        [
          'Prefix `.` and slash `/` both work.',
          '',
          '**Deobfuscation & Analysis**',
          '• `.deobf` / `.do` / `.deo` — Devirtualizer panel with dropdown menu (detected engine on top)',
          '• `.dump` / `.l` / `.log` — Universal environment logger and constant dumper',
          '• `.spy` — HTTP Spy: exposes webhooks, endpoints, WebSockets, remotes',
          '• `.detect` / `.d` — Identify obfuscator signatures with precision',
          '',
          '**Tools**',
          '• `.get <url>` — Download raw scripts from GitHub/Pastebin/Pastefy',
          '• `.rename` / `.rn` — Clean ugly barcode variables into sequential identifiers',
          '• `.beautify` / `.b` — Format messy/minified Lua scripts',
          '• `.minify` — Strip comments and collapse whitespace',
          '• `.paste` / `.post` / `.p` — Upload code to Pastefy / Hastebin',
          '• `.supported` — View obfuscator engine matrix',
          '',
          '**License & Anti-Bypass**',
          '• `.getkey` — Get your free 7-day access key',
          '• `.redeem <KEY_OR_HASH>` — Activate your key',
          '• `.status` — Check remaining days on your license'
        ].join('\n'),
        ACCENT_COLOR,
        '[ mommydev control panel ]'
      );
      await message.reply({ components: [comp], flags: V2_FLAG });
    }
  } catch (err) {
    console.error(`[MommyDeob] Error executing ${command}:`, err);
    await replyError(message, `Fatal execution fault: ${err.message}`);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('deob_select_')) {
        await handleDeobSelectMenu(interaction);
      }
    } else if (interaction.isChatInputCommand()) {
      await handleSlash(interaction);
    }
  } catch (err) {
    console.error('[MommyDeob] Interaction error:', err);
  }
});

if (process.env.DISCORD_TOKEN && !process.env.DISCORD_TOKEN.includes('KEEP_SECRET')) {
  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('[MommyDeob] Discord login failed:', err.message);
  });
} else {
  console.log('[MommyDeob] DISCORD_TOKEN is set to placeholder in .env. Ready for your actual token.');
}

module.exports = { client };