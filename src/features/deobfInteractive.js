const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder
} = require('discord.js');
const crypto = require('crypto');
const { detect, detectName, getAllEngines } = require('../deobfuscator/detect');
const { deobfuscateWeAreDevs } = require('../deobfuscator/wearedevs');
const { dumpScript } = require('./dumper');
const { extractLoadstringUrls, resolveNestedScripts } = require('../services/fetcher');
const { container, errorContainer, replyError, V2_FLAG, SUCCESS_COLOR, ACCENT_COLOR } = require('../utils/discordComponents');

const activeSessions = new Map();

function cleanOldSessions() {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) {
      activeSessions.delete(id);
    }
  }
}
setInterval(cleanOldSessions, 60 * 1000);

function createDeobfuscatePanel(code, originalName = 'script.lua') {
  const sessionId = crypto.randomBytes(6).toString('hex');
  const detectedId = detect(code);
  const detectedTitle = detectName(detectedId);

  const loadstrings = extractLoadstringUrls(code);
  const pastebloxUrls = loadstrings.filter(u => /pasteblox\.com/i.test(u));

  activeSessions.set(sessionId, {
    code,
    detectedId,
    originalName,
    loadstrings,
    pastebloxUrls,
    createdAt: Date.now()
  });

  const engines = getAllEngines();
  const sortedEngines = [];

  const detectedEngine = engines.find(e => e.id === detectedId);
  if (detectedEngine) {
    sortedEngines.push({ ...detectedEngine, isDetected: true });
  }

  for (const eng of engines) {
    if (eng.id !== detectedId) {
      sortedEngines.push(eng);
    }
  }

  // Add loadstring resolver option if loadstrings found
  if (loadstrings.length > 0) {
    sortedEngines.push({
      id: 'resolve_loadstrings',
      name: 'Resolve Nested Loadstrings',
      desc: `Fetch and extract ${loadstrings.length} embedded loadstring URL(s)`
    });
  }

  // Add pasteblox resolver if pasteblox URLs found
  if (pastebloxUrls.length > 0) {
    sortedEngines.push({
      id: 'resolve_pasteblox',
      name: 'Resolve Pasteblox Luraph Keys',
      desc: `Extract original loadstring from ${pastebloxUrls.length} pasteblox URL(s)`
    });
  }

  sortedEngines.push({
    id: 'dumper',
    name: 'Universal Environment Dumper',
    desc: 'Dump string tables, global calls and runtime trace'
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`deob_select_${sessionId}`)
    .setPlaceholder(`Detected: ${detectedTitle} (Select engine)`);

  sortedEngines.slice(0, 25).forEach((eng) => {
    const label = eng.isDetected ? `[DETECTED] ${eng.name}` : eng.name;
    const opt = new StringSelectMenuOptionBuilder()
      .setValue(eng.id)
      .setLabel(label.slice(0, 100))
      .setDescription((eng.desc || 'Deobfuscation engine').slice(0, 100));

    selectMenu.addOptions(opt);
  });

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const extraInfo = [];
  if (loadstrings.length > 0) {
    extraInfo.push(`Embedded Loadstrings: ${loadstrings.length} URL(s) found`);
  }
  if (pastebloxUrls.length > 0) {
    extraInfo.push(`Pasteblox URLs: ${pastebloxUrls.length} detected (Luraph key system)`);
  }

  const panelContainer = container(
    'MommyDeob Target Locked',
    [
      `Target Obfuscator: **${detectedTitle}** (\`${detectedId}\`)`,
      `Script Size: ${code.length.toLocaleString()} bytes`,
      ...(extraInfo.length ? ['', ...extraInfo] : []),
      '',
      'Ara ara... did a little skid really think this trash obfuscator would protect their code?',
      'Pick an engine from the dropdown below and watch it get shredded.'
    ].join('\n'),
    ACCENT_COLOR,
    '[ target analysis ready ]'
  );

  return {
    components: [panelContainer, row],
    flags: V2_FLAG,
    sessionId
  };
}

async function handleDeobSelectMenu(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith('deob_select_')) return;

  const sessionId = customId.replace('deob_select_', '');
  const session = activeSessions.get(sessionId);

  if (!session) {
    await replyError(interaction, 'Session expired. Stop sleeping and run the command again, baka.');
    return;
  }

  await interaction.deferUpdate();

  const chosenEngine = interaction.values[0];
  const { code, loadstrings, pastebloxUrls } = session;

  try {
    let resultOutput = '';
    let resultEngineName = chosenEngine;

    if (chosenEngine === 'wearedevs') {
      const res = deobfuscateWeAreDevs(code);
      resultOutput = res.code;
      resultEngineName = 'WeAreDevs / Prometheus Emulation';
    } else if (chosenEngine === 'dumper') {
      const res = dumpScript(code);
      resultOutput = [
        '-- MommyDeob Universal Environment Dump',
        '-- Cry about it skid',
        '',
        '-- [CONSTANTS FOUND]',
        ...(res.constants.map((c, i) => `[${i + 1}] = ${c}`)),
        '',
        '-- [EXECUTION TRACE]',
        ...res.trace
      ].join('\n');
      resultEngineName = 'Universal Dumper';
    } else if (chosenEngine === 'resolve_loadstrings') {
      const resolved = await resolveNestedScripts(code, 2);
      const parts = [];
      parts.push('-- MommyDeob Nested Loadstring Resolution');
      parts.push(`-- Found ${loadstrings.length} embedded URL(s)`);
      parts.push('');

      for (const r of resolved) {
        parts.push(`-- === URL: ${r.url} ===`);
        if (r.error) {
          parts.push(`-- ERROR: ${r.error}`);
        } else {
          parts.push(`-- Resolved: ${r.resolvedUrl}`);
          parts.push(`-- Size: ${r.bytes} bytes`);
          parts.push('');
          parts.push(r.code);
        }
        parts.push('');
        parts.push('-- ' + '='.repeat(60));
        parts.push('');
      }

      resultOutput = parts.join('\n');
      resultEngineName = `Loadstring Resolver (${resolved.length} URL(s))`;
    } else if (chosenEngine === 'resolve_pasteblox') {
      const resolved = await deobfuscatePasteblox(code);
      const parts = [];
      parts.push('-- MommyDeob Pasteblox Luraph Key System Deobfuscation');
      parts.push(`-- Found ${pastebloxUrls.length} pasteblox URL(s)`);
      parts.push('');

      for (const r of resolved) {
        parts.push(`-- === Pasteblox URL: ${r.originalUrl} ===`);
        if (r.error) {
          parts.push(`-- ERROR: ${r.error}`);
        } else {
          parts.push(`-- Resolved: ${r.resolvedUrl}`);
          parts.push(`-- Size: ${r.bytes} bytes`);
          parts.push('-- Original loadstring content extracted below:');
          parts.push('');
          parts.push(r.code);
        }
        parts.push('');
        parts.push('-- ' + '='.repeat(60));
        parts.push('');
      }

      if (resolved.length === 0) {
        parts.push('-- No pasteblox URLs found in script.');
      }

      resultOutput = parts.join('\n');
      resultEngineName = `Pasteblox Resolver (${resolved.length} URL(s))`;
    } else {
      const res = dumpScript(code);
      resultOutput = [
        `-- Engine: ${detectName(chosenEngine)}`,
        '-- Running in full trace and constant recovery mode',
        '',
        '-- === String Constants ===',
        ...(res.constants.map((c, i) => `[${i + 1}] = ${c}`)),
        '',
        '-- === Execution Trace ===',
        ...res.trace
      ].join('\n');
      resultEngineName = `${detectName(chosenEngine)} (Trace Extraction)`;
    }

    const header = [
      `Engine: ${resultEngineName}`,
      `Input: ${code.length} chars | Output: ${resultOutput.length} chars`,
      'Deobfuscated successfully. Cry about it.'
    ].join('\n');

    if (resultOutput.length <= 1800) {
      const resultComp = container(
        'Script Shredded',
        `${header}\n\`\`\`lua\n${resultOutput}\n\`\`\``,
        SUCCESS_COLOR,
        '[ devirtualized ]'
      );
      await interaction.editReply({ components: [resultComp], flags: V2_FLAG });
    } else {
      const attachment = new AttachmentBuilder(Buffer.from(resultOutput, 'utf8'), {
        name: 'deobfuscated.lua'
      });
      const resultComp = container(
        'Script Shredded',
        `${header}\nOutput was too massive for your tiny screen. Attached as a file below.`,
        SUCCESS_COLOR,
        '[ devirtualized - file attached ]'
      );
      await interaction.editReply({ components: [resultComp], files: [attachment], flags: V2_FLAG });
    }

    activeSessions.delete(sessionId);
  } catch (err) {
    await replyError(interaction, `Deobfuscation failed: ${err.message}`);
  }
}

module.exports = {
  createDeobfuscatePanel,
  handleDeobSelectMenu,
  activeSessions
};