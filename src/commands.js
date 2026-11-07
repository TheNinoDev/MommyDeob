const {
  AttachmentBuilder,
  SlashCommandBuilder,
  MessageFlags
} = require('discord.js');
const { deobfuscate, detect } = require('./deobfuscator');
const { detectName } = require('./deobfuscator/detect');
const { container, errorContainer, V2_FLAG } = require('./utils/discordComponents');

const MAX_DISCORD = 1900;

function extractCodeFromMessage(message) {
  // attachment first
  const att = message.attachments.first();
  if (att) return { source: 'attachment', attachment: att };
  const content = message.content || '';
  // remove command token
  const m = content.match(/```(?:lua|luau)?\s*([\s\S]*?)```/i);
  if (m) return { source: 'codeblock', code: m[1].trim() };
  // raw after command
  const parts = content.trim().split(/\s+/);
  // drop first token (command)
  const rest = parts.slice(1).join(' ').trim();
  if (rest) return { source: 'text', code: rest };
  return { source: 'none' };
}

async function fetchAttachmentText(attachment) {
  const res = await fetch(attachment.url);
  if (!res.ok) throw new Error(`Failed to download attachment (${res.status})`);
  return await res.text();
}

async function runDeobfuscation(code) {
  if (!code || !code.trim()) throw new Error('No script provided.');
  if (code.length > 2_000_000) throw new Error('Script too large.');
  const type = detect(code);
  const result = await deobfuscate(code);
  return { type, ...result };
}

function makeAttachment(code, name = 'deobfuscated.lua') {
  return new AttachmentBuilder(Buffer.from(code, 'utf8'), { name });
}

async function replyWithResult(interactionOrMessage, result, originalLength) {
  const { code, type, detectName: _ } = result;
  const header = `**Obfuscator:** ${type}\n**Input size:** ${originalLength} chars\n**Output size:** ${code.length} chars`;
  if (code.length <= MAX_DISCORD) {
    const comp = container('Deobfuscated', `${header}\n\`\`\`lua\n${code}\n\`\`\``, 0x57F287);
    if (interactionOrMessage.reply) {
      if (interactionOrMessage.deferred || interactionOrMessage.replied) {
        await interactionOrMessage.editReply({ components: [comp], flags: V2_FLAG });
      } else {
        await interactionOrMessage.reply({ components: [comp], flags: V2_FLAG });
      }
    } else {
      await interactionOrMessage.reply({ components: [comp], flags: V2_FLAG });
    }
  } else {
    const att = makeAttachment(code);
    const comp = container('Deobfuscated', `${header}\nOutput is large, sent as attachment.`, 0x57F287);
    if (interactionOrMessage.reply) {
      if (interactionOrMessage.deferred || interactionOrMessage.replied) {
        await interactionOrMessage.editReply({ components: [comp], files: [att], flags: V2_FLAG });
      } else {
        await interactionOrMessage.reply({ components: [comp], files: [att], flags: V2_FLAG });
      }
    } else {
      await interactionOrMessage.reply({ components: [comp], files: [att], flags: V2_FLAG });
    }
  }
}

async function handleDeobfuscateMessage(message) {
  const extracted = extractCodeFromMessage(message);
  let code = '';
  if (extracted.source === 'attachment') {
    try { code = await fetchAttachmentText(extracted.attachment); }
    catch (e) { await message.reply({ components: [errorContainer(e.message)], flags: V2_FLAG }); return; }
  } else if (extracted.source === 'codeblock' || extracted.source === 'text') {
    code = extracted.code;
  } else {
    await message.reply({ components: [errorContainer('Provide a .lua/.txt attachment or a code block.')], flags: V2_FLAG });
    return;
  }
  try {
    await message.channel.sendTyping();
    const result = await runDeobfuscation(code);
    await replyWithResult(message, result, code.length);
  } catch (e) {
    await message.reply({ components: [errorContainer(e.message || String(e))], flags: V2_FLAG });
  }
}

async function handleDetectMessage(message) {
  const extracted = extractCodeFromMessage(message);
  let code = '';
  if (extracted.source === 'attachment') {
    try { code = await fetchAttachmentText(extracted.attachment); }
    catch (e) { await message.reply({ components: [errorContainer(e.message)], flags: V2_FLAG }); return; }
  } else if (extracted.source === 'codeblock' || extracted.source === 'text') {
    code = extracted.code;
  } else {
    await message.reply({ components: [errorContainer('Provide a script to detect.')], flags: V2_FLAG });
    return;
  }
  const type = detect(code);
  const name = detectName(type);
  const comp = container('Detection', `**Detected:** ${name} (\`${type}\`)\n**Supported:** ${type === 'wearedevs' ? 'Yes' : 'No (yet)'}`, type === 'wearedevs' ? 0x57F287 : 0xFEE75C);
  await message.reply({ components: [comp], flags: V2_FLAG });
}

const slashCommands = [
  new SlashCommandBuilder()
    .setName('deobfuscate')
    .setDescription('Deobfuscate a Roblox Luau script (WeAreDevs/Prometheus-style).')
    .addStringOption((o) => o.setName('code').setDescription('Obfuscated Luau code').setRequired(false))
    .addAttachmentOption((o) => o.setName('file').setDescription('Obfuscated .lua/.txt file').setRequired(false)),
  new SlashCommandBuilder()
    .setName('detect')
    .setDescription('Detect which obfuscator was used on a script.')
    .addStringOption((o) => o.setName('code').setDescription('Obfuscated Luau code').setRequired(false))
    .addAttachmentOption((o) => o.setName('file').setDescription('Obfuscated .lua/.txt file').setRequired(false)),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help for MommyDeob.')
];

async function handleSlash(interaction) {
  const { commandName } = interaction;
  if (commandName === 'help') {
    const comp = container('MommyDeob Help', [
      '**Commands (prefix `.` or `/`):**',
      '• `deobfuscate` — deobfuscate a script (attach file or paste code)',
      '• `detect` — detect obfuscator type',
      '• `ping` — bot latency',
      '',
      '**Supported:** WeAreDevs / Prometheus-style (trace-based).',
      '**Discord v2 components** are used for all replies.'
    ].join('\n'), 0x5865F2);
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }
  if (commandName === 'ping') {
    const comp = container('Pong', `Latency: ${interaction.client.ws.ping}ms`, 0x5865F2);
    await interaction.reply({ components: [comp], flags: V2_FLAG });
    return;
  }
  // deobfuscate / detect
  await interaction.deferReply();
  let code = interaction.options.getString('code');
  const file = interaction.options.getAttachment('file');
  if (!code && file) {
    try { code = await fetchAttachmentText(file); }
    catch (e) { await interaction.editReply({ components: [errorContainer(e.message)], flags: V2_FLAG }); return; }
  }
  if (!code) {
    await interaction.editReply({ components: [errorContainer('Provide code or a file.')], flags: V2_FLAG });
    return;
  }
  if (commandName === 'detect') {
    const type = detect(code);
    const name = detectName(type);
    const comp = container('Detection', `**Detected:** ${name} (\`${type}\`)\n**Supported:** ${type === 'wearedevs' ? 'Yes' : 'No (yet)'}`, type === 'wearedevs' ? 0x57F287 : 0xFEE75C);
    await interaction.editReply({ components: [comp], flags: V2_FLAG });
    return;
  }
  try {
    const result = await runDeobfuscation(code);
    await replyWithResult(interaction, result, code.length);
  } catch (e) {
    await interaction.editReply({ components: [errorContainer(e.message || String(e))], flags: V2_FLAG });
  }
}

module.exports = {
  extractCodeFromMessage,
  handleDeobfuscateMessage,
  handleDetectMessage,
  handleSlash,
  slashCommands,
  fetchAttachmentText
};