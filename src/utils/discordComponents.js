const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');

const ACCENT_COLOR = 0xE0115F; // Crimson / Ruby Gothic Pink
const ERROR_COLOR = 0xAA0033;
const SUCCESS_COLOR = 0x00FF88;
const WARN_COLOR = 0xFF6600;

function createHeaderDisplay(title, subtitle) {
  let content = `### ${title}`;
  if (subtitle) {
    content += `\n*${subtitle}*`;
  }
  return new TextDisplayBuilder().setContent(content);
}

function container(title, body, color = ACCENT_COLOR, subtitle = null) {
  const c = new ContainerBuilder().setAccentColor(color);

  if (title) {
    c.addTextDisplayComponents(createHeaderDisplay(title, subtitle));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
  }

  if (body) {
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
  }

  return c;
}

function errorContainer(message) {
  const toxicQuotes = [
    'baka skid moment',
    'your brain has zero bytes',
    'imagine failing this hard',
    'pathetic attempt',
    'go cry in pastebin'
  ];
  const quote = toxicQuotes[Math.floor(Math.random() * toxicQuotes.length)];
  return container('Execution Failed', message, ERROR_COLOR, `[ ${quote} ]`);
}

function successContainer(title, message) {
  return container(title, message, SUCCESS_COLOR, '[ mommy devirtualizer ]');
}

// Helper to reply with an error and auto-delete after timeout
async function replyError(context, errorMessage, autoDeleteMs = 8000) {
  const comp = errorContainer(errorMessage);
  try {
    if (context.reply) {
      if (context.isChatInputCommand && context.isChatInputCommand()) {
        const reply = context.deferred || context.replied
          ? await context.editReply({ components: [comp], flags: MessageFlags.IsComponentsV2 })
          : await context.reply({ components: [comp], flags: MessageFlags.IsComponentsV2 });
        if (autoDeleteMs && context.deleteReply) {
          setTimeout(() => context.deleteReply().catch(() => {}), autoDeleteMs);
        }
        return reply;
      } else {
        const sent = await context.reply({ components: [comp], flags: MessageFlags.IsComponentsV2 });
        if (autoDeleteMs && sent && sent.delete) {
          setTimeout(() => sent.delete().catch(() => {}), autoDeleteMs);
        }
        return sent;
      }
    }
  } catch (err) {
    console.error('[DiscordComponents] replyError failed:', err.message);
  }
}

const V2_FLAG = MessageFlags.IsComponentsV2;

module.exports = {
  container,
  errorContainer,
  successContainer,
  replyError,
  V2_FLAG,
  ACCENT_COLOR,
  ERROR_COLOR,
  SUCCESS_COLOR,
  WARN_COLOR,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
};