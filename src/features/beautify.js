function beautifyLua(code, indentChar = '    ') {
  if (!code) return '';

  const lines = code.split(/\r?\n/);
  const out = [];
  let indentLevel = 0;

  // Patterns that increase indent on subsequent lines
  const OPEN_BLOCK = /^\b(function\b|local\s+function\b|if\b|while\b|for\b|repeat\b)\b/;
  // Keywords that decrease indent for their own line
  const DEDENT_SELF = /^\b(else|elseif|until)\b/;
  // Keywords that end a block
  const END_BLOCK = /^\b(end|until)\b/;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      if (out.length && out[out.length - 1] !== '') {
        out.push('');
      }
      continue;
    }

    // Check brace openings/closings in the line
    let openBraces = (line.match(/\{/g) || []).length;
    let closeBraces = (line.match(/\}/g) || []).length;
    let openParens = (line.match(/\(/g) || []).length;
    let closeParens = (line.match(/\)/g) || []).length;

    // Is this line an 'end', 'until', 'else', 'elseif'?
    let isDedentSelf = DEDENT_SELF.test(line) || END_BLOCK.test(line) || line.startsWith('}') || line.startsWith(')');

    if (isDedentSelf) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    out.push(indentChar.repeat(indentLevel) + line);

    // Calculate next indent
    let isBlockStart = OPEN_BLOCK.test(line) || DEDENT_SELF.test(line);

    // If an inline 'end' closed it on the same line, don't indent (e.g. `if x then y end`)
    let hasInlineEnd = /\bend\b/.test(line) && !line.startsWith('end');
    let hasInlineUntil = /\buntil\b/.test(line) && !line.startsWith('until');

    if (isBlockStart && !hasInlineEnd && !hasInlineUntil) {
      indentLevel++;
    }

    // Adjust for net curly braces
    const netBraces = openBraces - closeBraces;
    if (netBraces > 0 && !line.startsWith('{')) indentLevel += netBraces;
    else if (netBraces < 0 && !line.startsWith('}')) indentLevel = Math.max(0, indentLevel + netBraces);
  }

  return out.join('\n').trim();
}

module.exports = { beautifyLua };