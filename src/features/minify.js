function minifyLua(code) {
  if (!code) return '';

  let out = '';
  let inString = false;
  let stringQuote = null;
  let inMultiLineString = false;
  let inComment = false;
  let inMultiLineComment = false;

  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code[i];
    const next = code[i + 1] || '';

    // Handle multiline comment --[[ ... ]]
    if (inMultiLineComment) {
      if (ch === ']' && next === ']') {
        inMultiLineComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Handle single line comment -- ...
    if (inComment) {
      if (ch === '\n' || ch === '\r') {
        inComment = false;
        out += '\n';
      }
      i++;
      continue;
    }

    // Handle string literal
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += next;
        i += 2;
        continue;
      }
      if (ch === stringQuote) {
        inString = false;
        stringQuote = null;
      }
      i++;
      continue;
    }

    // Handle multiline string [[ ... ]]
    if (inMultiLineString) {
      out += ch;
      if (ch === ']' && next === ']') {
        out += next;
        inMultiLineString = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Start comment?
    if (ch === '-' && next === '-') {
      if (code.slice(i, i + 4) === '--[[') {
        inMultiLineComment = true;
        i += 4;
        continue;
      }
      inComment = true;
      i += 2;
      continue;
    }

    // Start multiline string?
    if (ch === '[' && next === '[') {
      inMultiLineString = true;
      out += '[[';
      i += 2;
      continue;
    }

    // Start string?
    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      out += ch;
      i++;
      continue;
    }

    // Normal character
    out += ch;
    i++;
  }

  // Collapse consecutive whitespaces and clean empty lines
  const minified = out
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  return minified;
}

module.exports = { minifyLua };