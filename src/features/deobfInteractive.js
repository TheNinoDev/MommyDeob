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
const { container, errorContainer, V2_FLAG } = require('../utils/discordComponents');

// Temporary cache for active sessions (5 minutes TTL)
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

  activeSessions.set(sessionId, {
    code,
    detectedId,
    originalName,
    createdAt: Date.now()
  });

  // Build select menu: detected engine is placed first!
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

  // Also include Universal Dumper option
  sortedEngines.push({
    id: 'dumper',
    name: 'Universal Environment Dumper',
    desc: 'Dump constants, globals, and execution trace'
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`deob_select_${sessionId}`)
    .setPlaceholder(`Detected: ${detectedTitle} (Select to execute)`);

  sortedEngines.slice(0, 25).forEach((eng, idx) => {
    const opt = new StringSelectMenuOptionBuilder()
      .setValue(eng.id)
      .setLabel(eng.isDetected ? `⭐ ${eng.name} (Detected)` : eng.name)
      .setDescription((eng.desc || 'Deobfuscation engine').slice(0, 100));

    if (idx === 0) {
      opt.setDefault(false);
    }
    selectMenu.addOptions(opt);
  });

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const panelContainer = container(
    'MommyDeob Deobfuscation Panel',
    [
      `🔍 **Detected Obfuscator:** **${detectedTitle}** (\`${detectedId}\`)`,
      `📄 **Script Size:** ${code.length.toLocaleString()} characters`,
      '',
      'Select the target obfuscator engine from the dropdown below to begin deobfuscation.'
    ].join('\n'),
    detectedId === 'wearedevs' ? 0x57F287 : 0x5865F2
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
    await interaction.reply({
      components: [errorContainer('This deobfuscation session has expired. Please run the command again.')],
      flags: V2_FLAG,
      ephemeral: true
    });
    return;
  }

  await interaction.deferUpdate();

  const chosenEngine = interaction.values[0];
  const { code } = session;

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
        '',
        '-- [CONSTANTS FOUND]',
        ...(res.constants.map((c, i) => `[${i + 1}] = ${c}`)),
        '',
        '-- [TRACE LOGS]',
        ...res.trace
      ].join('\n');
      resultEngineName = 'Universal Dumper';
    } else {
      // For engines not fully ported to AST yet, run the trace dumper
      const res = dumpScript(code);
      resultOutput = [
        `-- Deobfuscation Engine: ${detectName(chosenEngine)}`,
        '-- Notice: Running in trace & constant recovery mode',
        '',
        '-- === String Constants ===',
        ...(res.constants.map((c, i) => `[${i + 1}] = ${c}`)),
        '',
        '-- === Execution Trace ===',
        ...res.trace
      ].join('\n');
      resultEngineName = `${detectName(chosenEngine)} (Trace Extraction)`;
    }

    const header = `**Engine:** ${resultEngineName}\n**Input Size:** ${code.length} chars\n**Output Size:** ${resultOutput.length} chars`;

    if (resultOutput.length <= 1800) {
      const resultComp = container(
        'Deobfuscation Result',
        `${header}\n\`\`\`lua\n${resultOutput}\n\`\`\``,
        0x57F287
      );
      await interaction.editReply({ components: [resultComp], flags: V2_FLAG });
    } else {
      const attachment = new AttachmentBuilder(Buffer.from(resultOutput, 'utf8'), {
        name: 'deobfuscated.lua'
      });
      const resultComp = container(
        'Deobfuscation Result',
        `${header}\nResult is larger than 1,800 characters and has been attached as a file.`,
        0x57F287
      );
      await interaction.editReply({ components: [resultComp], files: [attachment], flags: V2_FLAG });
    }

    // Clean up session once finished
    activeSessions.delete(sessionId);
  } catch (err) {
    await interaction.editReply({
      components: [errorContainer(`Deobfuscation failed: ${err.message}`)],
      flags: V2_FLAG
    });
  }
}

module.exports = {
  createDeobfuscatePanel,
  handleDeobSelectMenu,
  activeSessions
};