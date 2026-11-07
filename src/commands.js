const {
  AttachmentBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const { detect, detectName } = require('./deobfuscator/detect');
const { createDeobfuscatePanel } = require('./features/deobfInteractive');
const { dumpScript } = require('./features/dumper');
const { spyScript } = require('./features/spy');
const { beautifyLua } = require('./features/beautify');
const { minifyLua } = require('./features/minify');
const { renameIdentifiers } = require('./features/rename');
const { getSupportedSummary } = require('./features/supported');
const { fetchScript } = require('./services/fetcher');
const { uploadPaste } = require('./services/paste');
const { keyManager } = require('./services/keyManager');
const { container, errorContainer, V2_FLAG } = require('./utils/discordComponents');

const MAX_DISCORD_TEXT = 1800;

// Helper: check user key authorization
function checkAuth(userId) {
  return keyManager.hasAccess(userId);
}

function authRequiredResponse(userId) {
  const url = keyManager.getKeyUrl(userId);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Get Free 7-Day Key')
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  const comp = container(
    '🔑 Key Required',
    [
      'You need an active **7-day license key** to use this feature.',
      '',
      `1. Click the button below to get your key via Linkvertise.`,
      `2. Once you have your key, run:`,
      `   \`\`\`.redeem <YOUR_KEY>\`\`\``,
      '',
      'Each free key grants full access for 7 days.'
    ].join('\n'),
    0xFEE75C
  );

  return { components: [comp, row], flags: V2_FLAG };
}

// Extract script from message (supporting replies, attachments, URLs, and code blocks)
async function extractScript(message) {
  // 1. Check if this is a reply to another message
  if (message.reference && message.reference.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (refMsg) {
        const extracted = await extractScript(refMsg);
        if (extracted && extracted.code) return extracted;
      }
    } catch (_) {}
  }

  // 2. Check attachments
  const att = message.attachments && message.attachments.first();
  if (att) {
    const res = await fetch(att.url);
    if (!res.ok) throw new Error(`Failed to download attachment (${res.status})`);
    const code = await res.text();
    return { code, source: 'attachment', name: att.name || 'script.lua' };
  }

  // 3. Check for code block in content
  const content = message.content || '';
  const codeBlockMatch = content.match(/```(?:lua|luau)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    return { code: codeBlockMatch[1].trim(), source: 'codeblock', name: 'script.lua' };
  }

  // 4. Check for URL argument
  const words = content.trim().split(/\s+/);
  const candidateUrl = words.find(w => /^https?:\/\//i.test(w));
  if (candidateUrl) {
    const fetched = await fetchScript(candidateUrl);
    return { code: fetched.code, source: 'url', name: 'fetched.lua', url: fetched.url };
  }

  // 5. Raw text after command token
  if (words.length > 1) {
    const raw = words.slice(1).join(' ').trim();
    if (raw.length > 5) {
      return { code: raw, source: 'text', name: 'script.lua' };
    }
  }

  return null;
}

// Handler for .deobf / .do / .deo / .deobfuscate
async function handleDeobfCommand(message) {
  if (!checkAuth(message.author.id)) {
    await message.reply(authRequiredResponse(message.author.id));
    return;
  }

  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Please provide a script via attachment, code block, URL, or reply to a message containing a script.')],
      flags: V2_FLAG
    });
    return;
  }

  const panel = createDeobfuscatePanel(script.code, script.name);
  await message.reply(panel);
}

// Handler for .dump / .l / .log
async function handleDumpCommand(message) {
  if (!checkAuth(message.author.id)) {
    await message.reply(authRequiredResponse(message.author.id));
    return;
  }

  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Provide a script to dump.')],
      flags: V2_FLAG
    });
    return;
  }

  await message.channel.sendTyping();
  const res = dumpScript(script.code);

  const formattedOutput = [
    '-- MommyDeob Universal Environment Dump',
    `-- Total Log Entries: ${res.totalLogs}`,
    '',
    '-- [ACCESSED SERVICES & GLOBALS]',
    ...(res.accessed.map(a => `accessed: ${a}`)),
    '',
    '-- [STRING CONSTANTS DETECTED]',
    ...(res.constants.map((c, i) => `[${i + 1}] = ${c}`)),
    '',
    '-- [EXECUTION TRACE]',
    ...res.trace
  ].join('\n');

  if (formattedOutput.length <= MAX_DISCORD_TEXT) {
    const comp = container(
      'Environment Dump',
      `\`\`\`lua\n${formattedOutput}\n\`\`\``,
      0x57F287
    );
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else {
    const file = new AttachmentBuilder(Buffer.from(formattedOutput, 'utf8'), { name: 'dump.lua' });
    const comp = container(
      'Environment Dump',
      `Dump complete (${res.totalLogs} logs, ${res.accessed.length} accessed items). Attached as file.`,
      0x57F287
    );
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  }
}

// Handler for .spy
async function handleSpyCommand(message) {
  if (!checkAuth(message.author.id)) {
    await message.reply(authRequiredResponse(message.author.id));
    return;
  }

  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Provide a script to spy on.')],
      flags: V2_FLAG
    });
    return;
  }

  await message.channel.sendTyping();
  const res = spyScript(script.code);

  const lines = [
    `📡 **HTTP Requests:** ${res.httpRequests.length}`,
    `🔌 **WebSockets:** ${res.webSockets.length}`,
    `⚡ **Remote Calls:** ${res.remoteCalls.length}`,
    `🎯 **Webhooks Found:** ${res.webhooks.length}`,
    `🌐 **URLs Detected:** ${res.urls.length}`,
    ''
  ];

  if (res.webhooks.length > 0) {
    lines.push('**Webhooks Detected:**');
    res.webhooks.forEach(wh => lines.push(`• \`${wh}\``));
    lines.push('');
  }

  if (res.urls.length > 0) {
    lines.push('**Endpoints & URLs:**');
    res.urls.slice(0, 10).forEach(u => lines.push(`• \`${u}\``));
    lines.push('');
  }

  if (res.httpRequests.length > 0) {
    lines.push('**HTTP Calls:**');
    res.httpRequests.slice(0, 5).forEach(req => lines.push(`• \`${req}\``));
    lines.push('');
  }

  const comp = container(
    '🕵️ HTTP / Network Spy Report',
    lines.join('\n').slice(0, 3900),
    res.webhooks.length > 0 ? 0xED4245 : 0x5865F2
  );

  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Handler for .detect / .d
async function handleDetectCommand(message) {
  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Provide a script to detect.')],
      flags: V2_FLAG
    });
    return;
  }

  const detectedId = detect(script.code);
  const detectedTitle = detectName(detectedId);

  const comp = container(
    '🔍 Obfuscator Detection',
    [
      `**Result:** **${detectedTitle}** (\`${detectedId}\`)`,
      `**Status:** ${detectedId === 'wearedevs' ? '✅ Full Deobfuscation Available' : '🔄 Detection & Dump Supported'}`,
      `**Script Size:** ${script.code.length.toLocaleString()} characters`
    ].join('\n'),
    detectedId === 'wearedevs' ? 0x57F287 : 0xFEE75C
  );

  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Handler for .get <url>
async function handleGetCommand(message) {
  const words = message.content.trim().split(/\s+/);
  const urlArg = words.find(w => /^https?:\/\//i.test(w));

  if (!urlArg) {
    await message.reply({
      components: [errorContainer('Usage: `.get <URL>` (e.g. raw GitHub, Pastebin, Pastefy)')],
      flags: V2_FLAG
    });
    return;
  }

  try {
    await message.channel.sendTyping();
    const fetched = await fetchScript(urlArg);

    const comp = container(
      '📥 Script Fetched',
      [
        `**URL:** ${fetched.url}`,
        `**Size:** ${fetched.bytes.toLocaleString()} bytes`,
        '',
        'Use `.deobf`, `.dump`, or `.spy` on this script.'
      ].join('\n'),
      0x57F287
    );

    const file = new AttachmentBuilder(Buffer.from(fetched.code, 'utf8'), { name: 'fetched.lua' });
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  } catch (err) {
    await message.reply({
      components: [errorContainer(`Failed to fetch script: ${err.message}`)],
      flags: V2_FLAG
    });
  }
}

// Handler for .rename / .rn
async function handleRenameCommand(message) {
  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Provide a script to rename variables.')],
      flags: V2_FLAG
    });
    return;
  }

  const res = renameIdentifiers(script.code);
  if (res.count === 0) {
    await message.reply({
      components: [container('Rename Identifiers', 'No heavily obfuscated identifiers were detected in this script.', 0xFEE75C)],
      flags: V2_FLAG
    });
    return;
  }

  const header = `Renamed **${res.count}** obfuscated identifiers to clean sequential names (\`var_1\`, \`var_2\`, ...).`;

  if (res.code.length <= MAX_DISCORD_TEXT) {
    const comp = container('Rename Identifiers', `${header}\n\`\`\`lua\n${res.code}\n\`\`\``, 0x57F287);
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else {
    const file = new AttachmentBuilder(Buffer.from(res.code, 'utf8'), { name: 'renamed.lua' });
    const comp = container('Rename Identifiers', `${header} Result is attached as a file.`, 0x57F287);
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  }
}

// Handler for .beautify / .b
async function handleBeautifyCommand(message) {
  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Provide a script to beautify.')],
      flags: V2_FLAG
    });
    return;
  }

  const formatted = beautifyLua(script.code);

  if (formatted.length <= MAX_DISCORD_TEXT) {
    const comp = container('Beautified Lua', `\`\`\`lua\n${formatted}\n\`\`\``, 0x57F287);
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else {
    const file = new AttachmentBuilder(Buffer.from(formatted, 'utf8'), { name: 'beautified.lua' });
    const comp = container('Beautified Lua', 'Formatted code attached as a file.', 0x57F287);
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  }
}

// Handler for .minify
async function handleMinifyCommand(message) {
  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Provide a script to minify.')],
      flags: V2_FLAG
    });
    return;
  }

  const minified = minifyLua(script.code);

  if (minified.length <= MAX_DISCORD_TEXT) {
    const comp = container('Minified Lua', `\`\`\`lua\n${minified}\n\`\`\``, 0x57F287);
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else {
    const file = new AttachmentBuilder(Buffer.from(minified, 'utf8'), { name: 'minified.lua' });
    const comp = container('Minified Lua', `Minified down to ${minified.length.toLocaleString()} characters. Attached as file.`, 0x57F287);
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  }
}

// Handler for .paste / .p
async function handlePasteCommand(message) {
  const script = await extractScript(message);
  if (!script || !script.code) {
    await message.reply({
      components: [errorContainer('Provide a script to paste.')],
      flags: V2_FLAG
    });
    return;
  }

  try {
    await message.channel.sendTyping();
    const res = await uploadPaste(script.code);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('View on ' + res.service)
        .setStyle(ButtonStyle.Link)
        .setURL(res.url),
      new ButtonBuilder()
        .setLabel('Raw Script')
        .setStyle(ButtonStyle.Link)
        .setURL(res.rawUrl)
    );

    const comp = container(
      '📋 Paste Created',
      `Your script was uploaded to **${res.service}**.\n\n🔗 **Link:** ${res.url}\n📄 **Raw:** ${res.rawUrl}`,
      0x57F287
    );

    await message.reply({ components: [comp, row], flags: V2_FLAG });
  } catch (err) {
    await message.reply({
      components: [errorContainer(`Paste failed: ${err.message}`)],
      flags: V2_FLAG
    });
  }
}

// Handler for .supported
async function handleSupportedCommand(message) {
  const comp = container(
    '🛡️ Supported Obfuscators & Tools',
    getSupportedSummary(),
    0x5865F2
  );
  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Handler for .getkey / .key
async function handleGetKeyCommand(message) {
  const url = keyManager.getKeyUrl(message.author.id);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Generate 7-Day Key')
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  const comp = container(
    '🔑 MommyDeob Free Key',
    [
      'Click below to generate your free **7-Day Access Key** through Linkvertise.',
      '',
      'Once completed, redeem it by typing:',
      '```.redeem <YOUR_KEY>```'
    ].join('\n'),
    0x5865F2
  );

  await message.reply({ components: [comp, row], flags: V2_FLAG });
}

// Handler for .redeem <key>
async function handleRedeemCommand(message) {
  const parts = message.content.trim().split(/\s+/);
  const keyArg = parts[1];

  if (!keyArg) {
    await message.reply({
      components: [errorContainer('Usage: `.redeem <KEY>`\nGet a key using `.getkey`.')],
      flags: V2_FLAG
    });
    return;
  }

  try {
    await message.channel.sendTyping();
    const res = await keyManager.redeemKey(message.author.id, keyArg);

    const comp = container(
      '🎉 Key Activated!',
      [
        `**Status:** ${res.message}`,
        `**Days Remaining:** ${res.daysRemaining} days`,
        `**Expires:** ${res.expiresAt}`,
        '',
        'You can now use `.deobf`, `.dump`, `.spy` and all features.'
      ].join('\n'),
      0x57F287
    );

    await message.reply({ components: [comp], flags: V2_FLAG });
  } catch (err) {
    await message.reply({
      components: [errorContainer(`Redeem failed: ${err.message}`)],
      flags: V2_FLAG
    });
  }
}

// Handler for .status
async function handleStatusCommand(message) {
  const status = keyManager.getUserStatus(message.author.id);
  if (!status.active) {
    await message.reply(authRequiredResponse(message.author.id));
    return;
  }

  const comp = container(
    '🔑 Key Status',
    [
      `**Status:** Active ✅`,
      `**Key:** \`${status.key}\``,
      `**Days Remaining:** ${status.daysRemaining} days`,
      `**Expires:** ${status.expiresAt}`
    ].join('\n'),
    0x57F287
  );

  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Slash commands definition
const slashCommands = [
  new SlashCommandBuilder()
    .setName('deobfuscate')
    .setDescription('Open the deobfuscation panel with interactive dropdown.')
    .addStringOption(o => o.setName('code').setDescription('Lua script or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('detect')
    .setDescription('Detect which obfuscator a script is using.')
    .addStringOption(o => o.setName('code').setDescription('Lua script or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('dump')
    .setDescription('Run environment dumper to extract constants and trace.')
    .addStringOption(o => o.setName('code').setDescription('Lua script or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('spy')
    .setDescription('Run HTTP & Network spy on a script.')
    .addStringOption(o => o.setName('code').setDescription('Lua script or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('beautify')
    .setDescription('Beautify and format Lua/Luau code.')
    .addStringOption(o => o.setName('code').setDescription('Lua script or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('minify')
    .setDescription('Minify Lua/Luau code.')
    .addStringOption(o => o.setName('code').setDescription('Lua script or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Rename obfuscated variables to clean sequential names.')
    .addStringOption(o => o.setName('code').setDescription('Lua script or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('paste')
    .setDescription('Upload a script to a pastebin service.')
    .addStringOption(o => o.setName('code').setDescription('Lua script to paste'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('supported')
    .setDescription('List all supported obfuscators and tool status.'),

  new SlashCommandBuilder()
    .setName('getkey')
    .setDescription('Get a free 7-day access key via Linkvertise.'),

  new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem your 7-day access key.')
    .addStringOption(o => o.setName('key').setDescription('Your license key').setRequired(true)),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check your current key license status.'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show MommyDeob help menu.'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency.')
];

// Slash command interaction router
async function handleSlash(interaction) {
  const { commandName } = interaction;

  if (commandName === 'help') {
    const comp = container(
      '📜 MommyDeob Commands',
      [
        'Prefix `.` and slash `/` both work!',
        '',
        '**🔍 Deobfuscation & Analysis**',
        '• `.deobf` / `.do` / `.deo` — Interactive panel with dropdown menu (detected engine on top!)',
        '• `.dump` / `.l` / `.log` — Universal environment logger & constant dumper',
        '• `.spy` — HTTP Spy: logs webhooks, HttpGet/Post, WebSockets, remotes, IPs',
        '• `.detect` / `.d` — Detect obfuscator type with confidence',
        '',
        '**🧰 Tools**',
        '• `.get <url>` — Fetch raw script from GitHub/Pastebin/Pastefy',
        '• `.rename` / `.rn` — Rename unreadable identifiers into clean sequential names',
        '• `.beautify` / `.b` — Format messy/minified Lua scripts',
        '• `.minify` — Strip comments and collapse whitespace',
        '• `.paste` / `.p` — Upload code to Pastefy / Hastebin',
        '• `.supported` — View supported obfuscators and feature status',
        '',
        '**💎 7-Day Key System (PWF Auth)**',
        '• `.getkey` — Get your free 7-day access key',
        '• `.redeem <KEY>` — Activate your key',
        '• `.status` — Check remaining days on your license'
      ].join('\n'),
      0x5865F2
    );
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  if (commandName === 'ping') {
    const comp = container('Pong', `Latency: ${interaction.client.ws.ping}ms`, 0x5865F2);
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  if (commandName === 'supported') {
    const comp = container('🛡️ Supported Obfuscators & Tools', getSupportedSummary(), 0x5865F2);
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  if (commandName === 'getkey') {
    const url = keyManager.getKeyUrl(interaction.user.id);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Generate 7-Day Key').setStyle(ButtonStyle.Link).setURL(url)
    );
    const comp = container('🔑 Free 7-Day Key', 'Click below to generate your key, then use `/redeem`.', 0x5865F2);
    await interaction.reply({ components: [comp, row], flags: V2_FLAG });
    return;
  }

  if (commandName === 'redeem') {
    const key = interaction.options.getString('key');
    await interaction.deferReply();
    try {
      const res = await keyManager.redeemKey(interaction.user.id, key);
      const comp = container(
        '🎉 Key Activated!',
        `**Status:** ${res.message}\n**Days Remaining:** ${res.daysRemaining} days\n**Expires:** ${res.expiresAt}`,
        0x57F287
      );
      await interaction.editReply({ components: [comp], flags: V2_FLAG });
    } catch (e) {
      await interaction.editReply({ components: [errorContainer(e.message)], flags: V2_FLAG });
    }
    return;
  }

  if (commandName === 'status') {
    const status = keyManager.getUserStatus(interaction.user.id);
    if (!status.active) {
      await interaction.reply(authRequiredResponse(interaction.user.id));
      return;
    }
    const comp = container(
      '🔑 Key Status',
      `**Status:** Active ✅\n**Key:** \`${status.key}\`\n**Days Remaining:** ${status.daysRemaining} days\n**Expires:** ${status.expiresAt}`,
      0x57F287
    );
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  // Deobfuscate / Dump / Spy / Beautify / Minify / Rename / Paste
  // Check auth first for deobf, dump, spy
  if (['deobfuscate', 'dump', 'spy'].includes(commandName) && !checkAuth(interaction.user.id)) {
    await interaction.reply(authRequiredResponse(interaction.user.id));
    return;
  }

  let code = interaction.options.getString('code');
  const file = interaction.options.getAttachment('file');
  if (!code && file) {
    try {
      const res = await fetch(file.url);
      code = await res.text();
    } catch (e) {
      await interaction.reply({ components: [errorContainer(e.message)], flags: V2_FLAG });
      return;
    }
  }

  if (!code) {
    await interaction.reply({ components: [errorContainer('Provide Lua code or a file.')], flags: V2_FLAG });
    return;
  }

  if (commandName === 'deobfuscate') {
    const panel = createDeobfuscatePanel(code, 'script.lua');
    await interaction.reply(panel);
    return;
  }

  await interaction.deferReply();

  try {
    if (commandName === 'detect') {
      const detectedId = detect(code);
      const detectedTitle = detectName(detectedId);
      const comp = container('🔍 Detection', `**Result:** **${detectedTitle}** (\`${detectedId}\`)`, 0x5865F2);
      await interaction.editReply({ components: [comp], flags: V2_FLAG });
    } else if (commandName === 'dump') {
      const res = dumpScript(code);
      const out = `-- MommyDeob Dump\n-- Logs: ${res.totalLogs}\n\n${res.trace.join('\n')}`;
      if (out.length <= MAX_DISCORD_TEXT) {
        await interaction.editReply({ components: [container('Dump', `\`\`\`lua\n${out}\n\`\`\``, 0x57F287)], flags: V2_FLAG });
      } else {
        const att = new AttachmentBuilder(Buffer.from(out, 'utf8'), { name: 'dump.lua' });
        await interaction.editReply({ components: [container('Dump', 'Attached as file.', 0x57F287)], files: [att], flags: V2_FLAG });
      }
    } else if (commandName === 'spy') {
      const res = spyScript(code);
      const summary = `**Webhooks:** ${res.webhooks.length}\n**Endpoints:** ${res.urls.length}\n**HTTP:** ${res.httpRequests.length}`;
      await interaction.editReply({ components: [container('Spy Report', summary, 0x5865F2)], flags: V2_FLAG });
    } else if (commandName === 'beautify') {
      const b = beautifyLua(code);
      if (b.length <= MAX_DISCORD_TEXT) {
        await interaction.editReply({ components: [container('Beautified', `\`\`\`lua\n${b}\n\`\`\``, 0x57F287)], flags: V2_FLAG });
      } else {
        const att = new AttachmentBuilder(Buffer.from(b, 'utf8'), { name: 'beautified.lua' });
        await interaction.editReply({ components: [container('Beautified', 'Attached as file.', 0x57F287)], files: [att], flags: V2_FLAG });
      }
    } else if (commandName === 'minify') {
      const m = minifyLua(code);
      if (m.length <= MAX_DISCORD_TEXT) {
        await interaction.editReply({ components: [container('Minified', `\`\`\`lua\n${m}\n\`\`\``, 0x57F287)], flags: V2_FLAG });
      } else {
        const att = new AttachmentBuilder(Buffer.from(m, 'utf8'), { name: 'minified.lua' });
        await interaction.editReply({ components: [container('Minified', 'Attached as file.', 0x57F287)], files: [att], flags: V2_FLAG });
      }
    } else if (commandName === 'rename') {
      const r = renameIdentifiers(code);
      if (r.code.length <= MAX_DISCORD_TEXT) {
        await interaction.editReply({ components: [container('Renamed', `\`\`\`lua\n${r.code}\n\`\`\``, 0x57F287)], flags: V2_FLAG });
      } else {
        const att = new AttachmentBuilder(Buffer.from(r.code, 'utf8'), { name: 'renamed.lua' });
        await interaction.editReply({ components: [container('Renamed', 'Attached as file.', 0x57F287)], files: [att], flags: V2_FLAG });
      }
    } else if (commandName === 'paste') {
      const p = await uploadPaste(code);
      await interaction.editReply({ components: [container('Paste', `Link: ${p.url}`, 0x57F287)], flags: V2_FLAG });
    }
  } catch (err) {
    await interaction.editReply({ components: [errorContainer(err.message)], flags: V2_FLAG });
  }
}

module.exports = {
  extractScript,
  handleDeobfCommand,
  handleDumpCommand,
  handleSpyCommand,
  handleDetectCommand,
  handleGetCommand,
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
};