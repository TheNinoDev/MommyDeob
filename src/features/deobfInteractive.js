const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder
} = require('discord.js');
const crypto = require('crypto');
const { detect, detectName, getAllEngines, deobfuscate } = require('../deobfuscator');
const { dumpScript } = require('./dumper');
const { container, errorContainer, replyError, V2_FLAG, SUCCESS_COLOR, ACCENT_COLOR } = require('../utils/discordComponents');
const { taskManager } = require('../services/taskManager');

const activeSessions = new Map();

function cleanOldSessions() {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) {
      activeSessions.delete(id);
    }
  }
}
setInterval(cleanOldSessions, 60 * 1000).unref();

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

  const resourceNotice = taskManager.getSystemStatusNotice();

  const panelContainer = container(
    'MommyDeob Target Locked',
    [
      `Target Obfuscator: **${detectedTitle}** (\`${detectedId}\`)`,
      `Script Size: ${code.length.toLocaleString()} bytes`,
      '',
      'Ara ara... did a little skid really think this trash obfuscator would protect their code?',
      'Pick an engine from the dropdown below and watch it get shredded.',
      '',
      '⏱️ *Notice: Deep deobfuscation and Pastblox reconstruction can take several minutes depending on VM complexity.*',
      resourceNotice
    ].filter(Boolean).join('\n'),
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
  const { code } = session;

  // Let the user know if resources are tight or queued
  const queueNotice = taskManager.getSystemStatusNotice();
  if (queueNotice) {
    try {
      const waitComp = container(
        'Processing in Queue',
        `Your deobfuscation request has been queued behind active execution.\nNotice: Deep VM deobfuscation takes minutes on complex targets. Stay patient skid!${queueNotice}`,
        ACCENT_COLOR,
        '[ queued for shredding ]'
      );
      await interaction.editReply({ components: [waitComp], flags: V2_FLAG });
    } catch (_) {}
  }

  try {
    const { resultOutput, resultEngineName } = await taskManager.enqueueHeavy(async () => {
      let output = '';
      let engineName = chosenEngine;

      if (chosenEngine === 'wearedevs') {
        const res = await deobfuscate(code);
        output = res.code;
        engineName = 'WeAreDevs / Prometheus Emulation';
      } else if (chosenEngine === 'dumper') {
        const res = dumpScript(code);
        output = [
          '-- MommyDeob Universal Environment Dump',
          '-- Cry about it skid',
          '',
          '-- [CONSTANTS FOUND]',
          ...(res.constants.map((c, i) => `[${i + 1}] = ${c}`)),
          '',
          '-- [EXECUTION TRACE]',
          ...res.trace
        ].join('\n');
        engineName = 'Universal Dumper';
      } else {
        // For Luraph, MoonSec, IronBrew, PSU, LuaArmor, etc. - try deobfuscate first, fall back to dump
        try {
          const res = await deobfuscate(code);
          output = res.code;
          engineName = `${detectName(chosenEngine)} (Deobfuscated)`;
        } catch (_) {
          const res = dumpScript(code);
          output = [
            `-- Engine: ${detectName(chosenEngine)}`,
            '-- Full AST deobfuscation not yet available for this engine.',
            '-- Running trace & constant recovery dump instead.',
            '',
            '-- === String Constants ===',
            ...(res.constants.map((c, i) => `[${i + 1}] = ${c}`)),
            '',
            '-- === Execution Trace ===',
            ...res.trace
          ].join('\n');
          engineName = `${detectName(chosenEngine)} (Trace Extraction)`;
        }
      }

      return { resultOutput: output, resultEngineName: engineName };
    });

    const header = [
      `Engine: ${resultEngineName}`,
      `Input: ${code.length} chars | Output: ${resultOutput.length} chars`,
      'Deobfuscated successfully. Cry about it.'
    ].join('\n');

    const attachment = new AttachmentBuilder(Buffer.from(resultOutput, 'utf8'), {
      name: 'deobfuscated.lua'
    });

    // Always attach .lua file attachment per bot specification
    if (resultOutput.length <= 1500) {
      const resultComp = container(
        'Script Shredded',
        `${header}\n\`\`\`lua\n${resultOutput}\n\`\`\``,
        SUCCESS_COLOR,
        '[ devirtualized - file attached ]'
      );
      await interaction.editReply({ components: [resultComp], files: [attachment], flags: V2_FLAG });
    } else {
      const resultComp = container(
        'Script Shredded',
        `${header}\nOutput was too massive for preview. Attached as a .lua file below.`,
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