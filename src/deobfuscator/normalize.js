const COMPOUND = ['+=', '-=', '*=', '/=', '%=', '..=', '^='];

function findLhsStart(content, operatorIndex) {
  let idx = operatorIndex - 1;
  while (idx >= 0 && /\s/.test(content[idx])) idx--;
  while (idx >= 0 && content[idx] === ']') {
    let depth = 1;
    idx--;
    while (idx >= 0 && depth > 0) {
      if (content[idx] === ']') depth++;
      else if (content[idx] === '[') depth--;
      idx--;
    }
  }
  while (idx >= 0 && /[A-Za-z0-9_]/.test(content[idx])) idx--;
  while (idx >= 0 && content[idx] === '.') {
    idx--;
    while (idx >= 0 && content[idx] === ']') {
      let depth = 1;
      idx--;
      while (idx >= 0 && depth > 0) {
        if (content[idx] === ']') depth++;
        else if (content[idx] === '[') depth--;
        idx--;
      }
    }
    while (idx >= 0 && /[A-Za-z0-9_]/.test(content[idx])) idx--;
  }
  return idx + 1;
}

function findRhsEnd(content, rhsStart) {
  let idx = rhsStart;
  const len = content.length;
  let bracket = 0, paren = 0, brace = 0;
  let quote = null;
  while (idx < len && /\s/.test(content[idx])) idx++;
  while (idx < len) {
    const ch = content[idx];
    if (quote) {
      if (ch === '\\') { idx += 2; continue; }
      if (ch === quote) quote = null;
      idx++;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; idx++; continue; }
    if (ch === '[') bracket++;
    else if (ch === ']') { if (bracket === 0 && paren === 0 && brace === 0) break; bracket = Math.max(0, bracket - 1); }
    else if (ch === '(') paren++;
    else if (ch === ')') { if (paren === 0 && bracket === 0 && brace === 0) break; paren = Math.max(0, paren - 1); }
    else if (ch === '{') brace++;
    else if (ch === '}') { if (brace === 0 && bracket === 0 && paren === 0) break; brace = Math.max(0, brace - 1); }
    else if (bracket === 0 && paren === 0 && brace === 0) {
      if (ch === ';' || ch === ',' || ch === '\n' || ch === '\r') break;
      if (/\s/.test(ch)) break;
    }
    idx++;
  }
  return idx;
}

function normalizeLuau(content) {
  const replacements = [];
  let idx = 0;
  while (idx < content.length) {
    let matched = null;
    for (const op of COMPOUND) {
      if (content.startsWith(op, idx)) { matched = op; break; }
    }
    if (!matched) { idx++; continue; }
    const lhsStart = findLhsStart(content, idx);
    const rhsStart = idx + matched.length;
    const rhsEnd = findRhsEnd(content, rhsStart);
    const lhs = content.slice(lhsStart, idx).trim();
    const rhs = content.slice(rhsStart, rhsEnd).trim();
    if (lhs && rhs) replacements.push({ start: lhsStart, end: rhsEnd, text: `${lhs} = ${lhs} ${matched.slice(0, -1)} ${rhs}` });
    idx = rhsEnd;
  }
  if (!replacements.length) return content;
  let rewritten = content;
  for (const r of replacements.reverse()) rewritten = rewritten.slice(0, r.start) + r.text + rewritten.slice(r.end);
  return rewritten;
}

module.exports = { normalizeLuau };