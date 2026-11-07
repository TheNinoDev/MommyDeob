const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');

function container(title, body, color = 0x5865F2) {
  const c = new ContainerBuilder().setAccentColor(color);
  if (title) c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));
  if (body) c.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
  return c;
}

function errorContainer(message) {
  return container('Error', message, 0xED4245);
}

function infoContainer(title, message) {
  return container(title, message, 0x57F287);
}

const V2_FLAG = MessageFlags.IsComponentsV2;

module.exports = { container, errorContainer, infoContainer, V2_FLAG, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags };