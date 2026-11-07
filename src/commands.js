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
const { resolvePastblox } = require('./features/pastblox');
const { fetchScript, extractUrlFromLoadstring, extractLinksFromText } = require('./services/fetcher');
const { uploadPaste } = require('./services/paste');
const { getSupportedSites, buildBypassUrl, tryServerSideBypass } = require('./services/bypassCity');
const { keyManager } = require('./services/keyManager');
const {
  container,
  errorContainer,
  replyError,
  V2_FLAG,
  ACCENT_COLOR,
  SUCCESS_COLOR,
  WARN_COLOR
} = require('./utils/discordComponents');

const MAX_DISCORD_TEXT = 1800;

function checkAuth(userId) {
  return keyManager.hasAccess(userId);
}

function authRequiredResponse(userId) {
  const url = keyManager.getKeyUrl(userId);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Get 7-Day Access Key')
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  const comp = container(
    'License Required',
    [
      'Ara ara... where do you think you are going without a key, skid?',
      'Mommy does not work for free. You need an active 7-day license.',
      '',
      '1. Click below and complete the Linkvertise ads properly (no cheat bypassers).',
      '2. Take your hash or key and redeem it with:',
      '   `.redeem <KEY_OR_HASH>`',
      '',
      'Now get on your knees and do your tasks, baka.'
    ].join('\n'),
    WARN_COLOR,
    '[ access denied ]'
  );

  return { components: [comp, row], flags: V2_FLAG };
}

// Resolve any script input: attachment, code block, URL, reply, loadstring URL, pastblox
async function resolveScriptInput(messageOrContent) {
  let sourceText = '';
  let sourceName = 'script.lua';
  let originalUrl = null;

  if (messageOrContent.content) {
    // This is a Discord message object
    const message = messageOrContent;
    // 1. Reply to another message
    if (message.reference && message.reference.messageId) {
      try {
        const refMsg = await message.channel.messages.fetch(message.reference.messageId);
        if (refMsg) {
          const extracted = await resolveScriptInput(refMsg);
          if (extracted && extracted.code) return extracted;
        }
      } catch (_) {}
    }

    // 2. Attachments
    const att = message.attachments && message.attachments.first();
    if (att) {
      const res = await fetch(att.url);
      if (!res.ok) throw new Error(`Attachment download failed (${res.status})`);
      return { code: await res.text(), source: 'attachment', name: att.name || 'script.lua' };
    }

    // 3. Code block in content
    const content = message.content || '';
    const codeBlockMatch = content.match(/```(?:lua|luau)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      return { code: codeBlockMatch[1].trim(), source: 'codeblock', name: 'script.lua' };
    }

    // 4. URL argument or raw text
    const words = content.trim().split(/\s+/);
    const candidateUrl = words.find(w => /^https?:\/\//i.test(w));
    if (candidateUrl) {
      originalUrl = candidateUrl;
      sourceText = candidateUrl;
    } else if (words.length > 1) {
      sourceText = words.slice(1).join(' ').trim();
    }
  } else {
    // Raw string passed directly
    sourceText = messageOrContent;
  }

  if (!sourceText || sourceText.length < 3) return null;

  // Handle Pastblox specially
  if (sourceText.includes('pasteblox.com')) {
    const resolved = await resolvePastblox(sourceText);
    if (resolved.innerCode) {
      return {
        code: resolved.innerCode,
        source: 'pastblox',
        name: 'pastblox_resolved.lua',
        url: resolved.innerUrl,
        outerUrl: resolved.outerUrl,
        innerLoadstringUrls: resolved.innerLoadstringUrls,
        detected: resolved.detected,
        deobfResult: resolved.deobf
      };
    }
    return {
      code: resolved.outerCode,
      source: 'pastblox_raw',
      name: 'pasteblox.lua',
      url: resolved.outerUrl
    };
  }

  // Handle loadstring(game:HttpGet("URL"))() pattern - extract inner URL and fetch it
  const innerUrls = extractUrlFromLoadstring(sourceText);
  if (innerUrls.length > 0) {
    const fetched = await fetchScript(innerUrls[0]);
    return {
      code: fetched.code,
      source: 'loadstring_url',
      name: 'loadstring_resolved.lua',
      url: fetched.url,
      originalLoadstringUrl: innerUrls[0],
      innerUrls
    };
  }

  // Handle direct URL fetch
  const fetched = await fetchScript(sourceText);
  return {
    code: fetched.code,
    source: 'url',
    name: 'fetched.lua',
    url: fetched.url,
    originalUrl: sourceText
  };
}

// Handler for .deobf / .do / .deo / .deobfuscate
async function handleDeobfCommand(message) {
  if (!checkAuth(message.author.id)) {
    await message.reply(authRequiredResponse(message.author.id));
    return;
  }

  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'You provided zero code, baka. Attach a .lua/.txt file, paste a code block, or provide a URL.');
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

  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'Feed me a script to dump, you absolute peasant.');
    return;
  }

  await message.channel.sendTyping();
  const res = dumpScript(script.code);

  const formattedOutput = [
    '-- MommyDeob Universal Environment Dump',
    `-- Log Entries: ${res.totalLogs}`,
    '-- Cry about it skid',
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

  // Always return as file for dumps
  const file = new AttachmentBuilder(Buffer.from(formattedOutput, 'utf8'), { name: 'dump.lua' });
  const comp = container(
    'Environment Dump Result',
    `Ripped ${res.totalLogs} runtime logs and ${res.accessed.length} globals. Full dump attached as .lua file.`,
    SUCCESS_COLOR,
    '[ memory stripped - file attached ]'
  );
  await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
}

// Handler for .spy
async function handleSpyCommand(message) {
  if (!checkAuth(message.author.id)) {
    await message.reply(authRequiredResponse(message.author.id));
    return;
  }

  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'Provide a script to spy on, baka.');
    return;
  }

  await message.channel.sendTyping();
  const res = spyScript(script.code);

  const lines = [
    `HTTP Requests: ${res.httpRequests.length}`,
    `WebSockets: ${res.webSockets.length}`,
    `Remote Calls: ${res.remoteCalls.length}`,
    `Webhooks Found: ${res.webhooks.length}`,
    `Endpoints Detected: ${res.urls.length}`,
    ''
  ];

  if (res.webhooks.length > 0) {
    lines.push('Exposed Discord Webhooks:');
    res.webhooks.forEach(wh => lines.push(`• \`${wh}\``));
    lines.push('');
  }

  if (res.urls.length > 0) {
    lines.push('Target Endpoints:');
    res.urls.slice(0, 10).forEach(u => lines.push(`• \`${u}\``));
    lines.push('');
  }

  if (res.httpRequests.length > 0) {
    lines.push('Intercepted HTTP Calls:');
    res.httpRequests.slice(0, 5).forEach(req => lines.push(`• \`${req}\``));
    lines.push('');
  }

  const comp = container(
    'Network Spy Intercept',
    lines.join('\n').slice(0, 3900),
    res.webhooks.length > 0 ? 0xAA0033 : ACCENT_COLOR,
    '[ traffic intercepted ]'
  );

  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Handler for .detect / .d
async function handleDetectCommand(message) {
  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'Provide a script so mommy can tell you how bad it is.');
    return;
  }

  const detectedId = detect(script.code);
  const detectedTitle = detectName(detectedId);

  const comp = container(
    'Obfuscator Identification',
    [
      `Identified Engine: **${detectedTitle}** (\`${detectedId}\`)`,
      `Script Length: ${script.code.length.toLocaleString()} characters`,
      '',
      detectedId === 'wearedevs'
        ? 'Full deobfuscation available. Run `.deobf` to watch it get annihilated.'
        : 'Signature recognized. Run `.dump` or `.spy` to rip its memory wide open.'
    ].join('\n'),
    detectedId === 'wearedevs' ? SUCCESS_COLOR : WARN_COLOR,
    '[ signature scan ]'
  );

  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Handler for .get / .g
async function handleGetCommand(message) {
  const words = message.content.trim().split(/\s+/);
  const urlArg = words.find(w => /^https?:\/\//i.test(w));

  if (!urlArg) {
    await replyError(message, 'Usage: `.get <URL>` (e.g. raw GitHub, Pastebin, Pastefy, jnkies API, loadstring URL). Learn to type.');
    return;
  }

  try {
    await message.channel.sendTyping();
    const fetched = await resolveScriptInput({ content: urlArg });

    // Always return fetched scripts as .lua file attachment
    const file = new AttachmentBuilder(Buffer.from(fetched.code, 'utf8'), { name: fetched.name || 'fetched.lua' });
    const comp = container(
      'Script Downloaded',
      [
        `Source: ${fetched.url || fetched.originalUrl || 'resolved'}`,
        `Payload: ${fetched.code.length.toLocaleString()} bytes`,
        '',
        'Target captured and saved as .lua file below.',
        'Run `.deobf`, `.dump`, or `.spy` on the attached file to rip it apart.'
      ].join('\n'),
      SUCCESS_COLOR,
      '[ fetch complete - .lua file attached ]'
    );

    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  } catch (err) {
    await replyError(message, `Failed downloading script: ${err.message}`);
  }
}

// Handler for .bypass
async function handleBypassCommand(message) {
  const words = message.content.trim().split(/\s+/);
  const urlArg = words.find(w => /^https?:\/\//i.test(w));

  if (!urlArg) {
    await replyError(message, 'Usage: `.bypass <URL>` (e.g. linkvertise, pastebin, tinyurl, bit.ly). Submit your link for bypassing.');
    return;
  }

  try {
    await message.channel.sendTyping();

    const supportedText = await getSupportedSites();
    const bypassUrl = buildBypassUrl(urlArg);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open bypass.city')
        .setStyle(ButtonStyle.Link)
        .setURL(bypassUrl)
    );

    let note = 'bypass.city is primarily browser-based - open the link above to solve any captcha.';
    try {
      const ss = await tryServerSideBypass(urlArg);
      if (ss.redirect) {
        note = `Server-side redirect detected: ${ss.redirect}`;
      } else if (ss.status === 200) {
        note = 'Server-side bypass attempt returned a page. Open the link to confirm completion.';
      }
    } catch (_) {}

    const comp = container(
      'Link Bypass Request',
      [
        `Target URL: ${urlArg}`,
        '',
        note,
        '',
        'Click below to open bypass.city and complete the bypass manually if captcha appears.',
        '',
        'Supported sites include: Linkvertise, pastebin, tinyurl, bit.ly, rentry, jnkies, and many more.'
      ].join('\n'),
      ACCENT_COLOR,
      '[ bypass.city integration ]'
    );

    await message.reply({ components: [comp, row], flags: V2_FLAG });
  } catch (err) {
    await replyError(message, `Bypass lookup failed: ${err.message}`);
  }
}

// Handler for .rename / .rn
async function handleRenameCommand(message) {
  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'Give me a script with awful unreadable variable names to fix.');
    return;
  }

  const res = renameIdentifiers(script.code);
  if (res.count === 0) {
    await replyError(message, 'No heavily obfuscated barcode/hex identifiers were found in this script.');
    return;
  }

  const header = `Replaced **${res.count}** disgusting unreadable identifiers with clean sequential names (\`var_1\`, \`var_2\`). You are welcome.`;

  if (res.code.length <= MAX_DISCORD_TEXT) {
    const comp = container('Identifier Renamer', `${header}\n\`\`\`lua\n${res.code}\n\`\`\``, SUCCESS_COLOR, '[ cleaned ]');
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else {
    const file = new AttachmentBuilder(Buffer.from(res.code, 'utf8'), { name: 'renamed.lua' });
    const comp = container('Identifier Renamer', `${header} Result is attached as a file.`, SUCCESS_COLOR, '[ cleaned - file attached ]');
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  }
}

// Handler for .beautify / .b
async function handleBeautifyCommand(message) {
  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'Provide some messy code to beautify, baka.');
    return;
  }

  const formatted = beautifyLua(script.code);

  if (formatted.length <= MAX_DISCORD_TEXT) {
    const comp = container('Lua Beautifier', `\`\`\`lua\n${formatted}\n\`\`\``, SUCCESS_COLOR, '[ formatted ]');
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else {
    const file = new AttachmentBuilder(Buffer.from(formatted, 'utf8'), { name: 'beautified.lua' });
    const comp = container('Lua Beautifier', 'Formatted code attached below.', SUCCESS_COLOR, '[ formatted - file attached ]');
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  }
}

// Handler for .minify
async function handleMinifyCommand(message) {
  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'Provide code to minify, baka.');
    return;
  }

  const minified = minifyLua(script.code);

  if (minified.length <= MAX_DISCORD_TEXT) {
    const comp = container('Lua Minifier', `\`\`\`lua\n${minified}\n\`\`\``, SUCCESS_COLOR, '[ minified ]');
    await message.reply({ components: [comp], flags: V2_FLAG });
  } else {
    const file = new AttachmentBuilder(Buffer.from(minified, 'utf8'), { name: 'minified.lua' });
    const comp = container('Lua Minifier', `Compressed down to ${minified.length.toLocaleString()} characters. File attached.`, SUCCESS_COLOR, '[ minified - file attached ]');
    await message.reply({ components: [comp], files: [file], flags: V2_FLAG });
  }
}

// Handler for .paste / .post / .p
async function handlePasteCommand(message) {
  let script;
  try {
    script = await resolveScriptInput(message);
  } catch (err) {
    await replyError(message, `Failed reading input: ${err.message}`);
    return;
  }

  if (!script || !script.code) {
    await replyError(message, 'Nothing to paste. Attach a file, paste code, or reply to a message with a script.');
    return;
  }

  try {
    await message.channel.sendTyping();
    const res = await uploadPaste(script.code);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(`View on ${res.service}`)
        .setStyle(ButtonStyle.Link)
        .setURL(res.url),
      new ButtonBuilder()
        .setLabel('Raw Script')
        .setStyle(ButtonStyle.Link)
        .setURL(res.rawUrl)
    );

    const comp = container(
      'Paste Uploaded',
      [
        `Target uploaded to ${res.service}.`,
        '',
        `Link: ${res.url}`,
        `Raw: ${res.rawUrl}`
      ].join('\n'),
      SUCCESS_COLOR,
      '[ upload success ]'
    );

    await message.reply({ components: [comp, row], flags: V2_FLAG });
  } catch (err) {
    await replyError(message, `Paste upload failed: ${err.message}`);
  }
}

// Handler for .supported
async function handleSupportedCommand(message) {
  const comp = container(
    'Supported Obfuscator Matrix',
    getSupportedSummary(),
    ACCENT_COLOR,
    '[ devirtualizer engines ]'
  );
  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Handler for .getkey / .key
async function handleGetKeyCommand(message) {
  const url = keyManager.getKeyUrl(message.author.id);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Complete Linkvertise (7 Days)')
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  const comp = container(
    'MommyDeob License Generation',
    [
      'Generate your free 7-Day Access Key through Linkvertise below.',
      '',
      'Notice: Anti-bypass token is strictly enforced on our backend.',
      'If you try to use automated bypassers, your token will be rejected and logged.',
      '',
      'Once finished, redeem your key or completion hash with:',
      '```.redeem <KEY_OR_HASH>```'
    ].join('\n'),
    ACCENT_COLOR,
    '[ key generator ]'
  );

  await message.reply({ components: [comp, row], flags: V2_FLAG });
}

// Handler for .redeem <key_or_hash>
async function handleRedeemCommand(message) {
  const parts = message.content.trim().split(/\s+/);
  const tokenArg = parts[1];

  if (!tokenArg) {
    await replyError(message, 'Usage: `.redeem <KEY_OR_HASH>`\nGet one using `.getkey`. Do not make mommy repeat herself.');
    return;
  }

  try {
    await message.channel.sendTyping();
    const res = await keyManager.redeemKey(message.author.id, tokenArg);

    const comp = container(
      'License Activated',
      [
        `Verification: ${res.method}`,
        `Status: ${res.message}`,
        `Time Remaining: ${res.daysRemaining} days`,
        `Expires: ${res.expiresAt}`,
        '',
        'Now run `.deobf`, `.dump`, or `.spy` and stop crying.'
      ].join('\n'),
      SUCCESS_COLOR,
      '[ authorization granted ]'
    );

    await message.reply({ components: [comp], flags: V2_FLAG });
  } catch (err) {
    await replyError(message, err.message);
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
    'License Status',
    [
      'Status: Active',
      `Key: \`${status.key}\``,
      `Days Remaining: ${status.daysRemaining} days`,
      `Expires: ${status.expiresAt}`
    ].join('\n'),
    SUCCESS_COLOR,
    '[ authorized user ]'
  );

  await message.reply({ components: [comp], flags: V2_FLAG });
}

// Slash command declarations
const slashCommands = [
  new SlashCommandBuilder()
    .setName('deobfuscate')
    .setDescription('Open the devirtualizer panel with dropdown select menu.')
    .addStringOption(o => o.setName('code').setDescription('Lua code, URL, or loadstring URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('detect')
    .setDescription('Detect which obfuscator a script is using.')
    .addStringOption(o => o.setName('code').setDescription('Lua code, URL, or loadstring URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('dump')
    .setDescription('Run universal environment dumper.')
    .addStringOption(o => o.setName('code').setDescription('Lua code, URL, or loadstring URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('spy')
    .setDescription('Run HTTP and network spy to expose webhooks and remotes.')
    .addStringOption(o => o.setName('code').setDescription('Lua code, URL, or loadstring URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('get')
    .setDescription('Download raw script from URL (supports loadstring URLs and jnkies API).')
    .addStringOption(o => o.setName('url').setDescription('Script URL or raw URL').setRequired(true)),

  new SlashCommandBuilder()
    .setName('bypass')
    .setDescription('Bypass link shorteners via bypass.city.')
    .addStringOption(o => o.setName('url').setDescription('Link to bypass').setRequired(true)),

  new SlashCommandBuilder()
    .setName('beautify')
    .setDescription('Format and indent Lua code.')
    .addStringOption(o => o.setName('code').setDescription('Lua code or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('minify')
    .setDescription('Strip comments and compress Lua code.')
    .addStringOption(o => o.setName('code').setDescription('Lua code or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Clean obfuscated variable names.')
    .addStringOption(o => o.setName('code').setDescription('Lua code or raw URL'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('paste')
    .setDescription('Upload script to Pastefy / Hastebin.')
    .addStringOption(o => o.setName('code').setDescription('Lua script to upload'))
    .addAttachmentOption(o => o.setName('file').setDescription('Lua script file')),

  new SlashCommandBuilder()
    .setName('supported')
    .setDescription('List all supported obfuscators and engines.'),

  new SlashCommandBuilder()
    .setName('getkey')
    .setDescription('Generate 7-day license key via Linkvertise.'),

  new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem your 7-day license key or completion hash.')
    .addStringOption(o => o.setName('token').setDescription('Your license key or hash').setRequired(true)),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check your current license duration.'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show MommyDeob command matrix.'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot websocket latency.')
];

async function handleSlash(interaction) {
  const { commandName } = interaction;

  if (commandName === 'help') {
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
        '• `.get <url>` — Download raw scripts from GitHub/Pastebin/Pastefy/jnkies/loadstring URLs',
        '• `.bypass <url>` — Bypass link shorteners via bypass.city',
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
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  if (commandName === 'ping') {
    const comp = container('Latency', `Websocket: ${interaction.client.ws.ping}ms`, ACCENT_COLOR, '[ pong ]');
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  if (commandName === 'supported') {
    const comp = container('Supported Obfuscator Matrix', getSupportedSummary(), ACCENT_COLOR, '[ devirtualizer engines ]');
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  if (commandName === 'getkey') {
    const url = keyManager.getKeyUrl(interaction.user.id);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Complete Linkvertise (7 Days)').setStyle(ButtonStyle.Link).setURL(url)
    );
    const comp = container('License Generation', 'Complete Linkvertise below, then use `/redeem`.', ACCENT_COLOR, '[ key generator ]');
    await interaction.reply({ components: [comp, row], flags: V2_FLAG });
    return;
  }

  if (commandName === 'redeem') {
    const token = interaction.options.getString('token');
    await interaction.deferReply();
    try {
      const res = await keyManager.redeemKey(interaction.user.id, token);
      const comp = container(
        'License Activated',
        `Verification: ${res.method}\nStatus: ${res.message}\nDays Remaining: ${res.daysRemaining} days\nExpires: ${res.expiresAt}`,
        SUCCESS_COLOR,
        '[ authorized ]'
      );
      await interaction.editReply({ components: [comp], flags: V2_FLAG });
    } catch (e) {
      await replyError(interaction, e.message);
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
      'License Status',
      `Status: Active\nKey: \`${status.key}\`\nDays Remaining: ${status.daysRemaining} days\nExpires: ${status.expiresAt}`,
      SUCCESS_COLOR,
      '[ authorized user ]'
    );
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }

  if (['deobfuscate', 'dump', 'spy'].includes(commandName) && !checkAuth(interaction.user.id)) {
    await interaction.reply(authRequiredResponse(interaction.user.id));
    return;
  }

  let code = interaction.options.getString('code') || interaction.options.getString('url');
  const file = interaction.options.getAttachment('file');
  if (!code && file) {
    try {
      const res = await fetch(file.url);
      code = await res.text();
    } catch (e) {
      await replyError(interaction, `Attachment download failed: ${e.message}`);
      return;
    }
  }

  if (!code) {
    await replyError(interaction, 'You provided zero code, baka. Pass code or a file.');
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
      const comp = container('Obfuscator Identification', `Identified: **${detectedTitle}** (\`${detectedId}\`)`, ACCENT_COLOR, '[ scan complete ]');
      await interaction.editReply({ components: [comp], flags: V2_FLAG });
    } else if (commandName === 'dump') {
      const res = dumpScript(code);
      const out = `-- MommyDeob Dump\n-- Total Logs: ${res.totalLogs}\n\n${res.trace.join('\n')}`;
      const att = new AttachmentBuilder(Buffer.from(out, 'utf8'), { name: 'dump.lua' });
      const comp = container('Environment Dump', `Ripped ${res.totalLogs} logs. Full dump attached as .lua file.`, SUCCESS_COLOR, '[ dump file attached ]');
      await interaction.editReply({ components: [comp], files: [att], flags: V2_FLAG });
    } else if (commandName === 'spy') {
      const res = spyScript(code);
      const summary = `Webhooks: ${res.webhooks.length}\nEndpoints: ${res.urls.length}\nHTTP Calls: ${res.httpRequests.length}`;
      await interaction.editReply({ components: [container('Network Spy Report', summary, ACCENT_COLOR, '[ traffic captured ]')], flags: V2_FLAG });
    } else if (commandName === 'get') {
      const fetched = await resolveScriptInput(code);
      const att = new AttachmentBuilder(Buffer.from(fetched.code, 'utf8'), { name: fetched.name || 'fetched.lua' });
      const comp = container(
        'Script Downloaded',
        `Source: ${fetched.url || code}\nPayload: ${fetched.code.length.toLocaleString()} bytes`,
        SUCCESS_COLOR,
        '[ fetch complete - .lua file attached ]'
      );
      await interaction.editReply({ components: [comp], files: [att], flags: V2_FLAG });
    } else if (commandName === 'bypass') {
      const bypassUrl = buildBypassUrl(code);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Open bypass.city').setStyle(ButtonStyle.Link).setURL(bypassUrl)
      );
      const comp = container('Link Bypass Request', `Target URL: ${code}\nOpen bypass.city above to complete captcha and get the direct link.`, ACCENT_COLOR, '[ bypass.city ]');
      await interaction.editReply({ components: [comp, row], flags: V2_FLAG });
    } else if (commandName === 'beautify') {
      const b = beautifyLua(code);
      if (b.length <= MAX_DISCORD_TEXT) {
        await interaction.editReply({ components: [container('Beautified Code', `\`\`\`lua\n${b}\n\`\`\``, SUCCESS_COLOR, '[ formatted ]')], flags: V2_FLAG });
      } else {
        const att = new AttachmentBuilder(Buffer.from(b, 'utf8'), { name: 'beautified.lua' });
        await interaction.editReply({ components: [container('Beautified Code', 'Attached as file.', SUCCESS_COLOR, '[ formatted - file attached ]')], files: [att], flags: V2_FLAG });
      }
    } else if (commandName === 'minify') {
      const m = minifyLua(code);
      if (m.length <= MAX_DISCORD_TEXT) {
        await interaction.editReply({ components: [container('Minified Code', `\`\`\`lua\n${m}\n\`\`\``, SUCCESS_COLOR, '[ minified ]')], flags: V2_FLAG });
      } else {
        const att = new AttachmentBuilder(Buffer.from(m, 'utf8'), { name: 'minified.lua' });
        await interaction.editReply({ components: [container('Minified Code', 'Attached as file.', SUCCESS_COLOR, '[ minified - file attached ]')], files: [att], flags: V2_FLAG });
      }
    } else if (commandName === 'rename') {
      const r = renameIdentifiers(code);
      if (r.code.length <= MAX_DISCORD_TEXT) {
        await interaction.editReply({ components: [container('Renamed Variables', `\`\`\`lua\n${r.code}\n\`\`\``, SUCCESS_COLOR, '[ renamed ]')], flags: V2_FLAG });
      } else {
        const att = new AttachmentBuilder(Buffer.from(r.code, 'utf8'), { name: 'renamed.lua' });
        await interaction.editReply({ components: [container('Renamed Variables', 'Attached as file.', SUCCESS_COLOR, '[ renamed - file attached ]')], files: [att], flags: V2_FLAG });
      }
    } else if (commandName === 'paste') {
      const p = await uploadPaste(code);
      await interaction.editReply({ components: [container('Paste Uploaded', `Link: ${p.url}\nRaw: ${p.rawUrl}`, SUCCESS_COLOR, '[ upload success ]')], flags: V2_FLAG });
    }
  } catch (err) {
    await replyError(interaction, err.message);
  }
}

module.exports = {
  resolveScriptInput,
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
};