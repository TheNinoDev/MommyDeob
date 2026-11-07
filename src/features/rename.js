const LUA_KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while'
]);

const STANDARD_GLOBALS = new Set([
  'game', 'workspace', 'Workspace', 'script', 'Instance', 'Vector2', 'Vector3',
  'CFrame', 'UDim', 'UDim2', 'Color3', 'BrickColor', 'Ray', 'Enum', 'NumberRange',
  'NumberSequence', 'ColorSequence', 'math', 'string', 'table', 'debug', 'os', 'io',
  'bit', 'bit32', 'task', 'coroutine', 'utf8', 'select', 'unpack', 'pairs', 'ipairs',
  'next', 'pcall', 'xpcall', 'type', 'typeof', 'tonumber', 'tostring', 'print',
  'warn', 'error', 'assert', 'setmetatable', 'getmetatable', 'rawget', 'rawset',
  'rawequal', 'rawlen', 'getfenv', 'setfenv', '_G', '_VERSION', 'shared',
  'HttpGet', 'HttpGetAsync', 'HttpPost', 'HttpPostAsync', 'FireServer', 'InvokeServer',
  'GetService', 'FindFirstChild', 'WaitForChild', 'Destroy', 'Connect', 'Disconnect'
]);

function isObfuscatedIdentifier(id) {
  if (LUA_KEYWORDS.has(id) || STANDARD_GLOBALS.has(id)) return false;
  if (/^v\d+$/.test(id)) return false; // already clean

  // Patterns like Il11lIl, lIlI, O0OO0
  if (/^[lI1_]{3,}$/.test(id)) return true;
  if (/^[O0_]{3,}$/.test(id)) return true;

  // Hex like _0x1a4b or _0x...
  if (/^_0x[0-9a-fA-F]+$/i.test(id)) return true;

  // Hash-like or random hex (e.g. ab3c89f02a or _a9f1b)
  if (/^_[a-zA-Z0-9]{6,}$/.test(id)) return true;

  // Mixed upper/lower barcodes like aAbBaA
  if (id.length >= 8 && /^[a-zA-Z0-9_]+$/.test(id)) {
    const caps = (id.match(/[A-Z]/g) || []).length;
    const lows = (id.match(/[a-z]/g) || []).length;
    if (caps >= 3 && lows >= 3 && id.length >= 10) return true;
  }

  return false;
}

function renameIdentifiers(code) {
  if (!code) return { code: '', count: 0 };

  // Collect candidate identifiers
  const tokenRegex = /\b[A-Za-z_][A-Za-z0-9_]*\b/g;
  const candidates = new Set();
  let m;

  while ((m = tokenRegex.exec(code)) !== null) {
    const id = m[0];
    if (isObfuscatedIdentifier(id)) {
      candidates.add(id);
    }
  }

  if (candidates.size === 0) {
    return { code, count: 0, replacements: {} };
  }

  // Create mapping: var_1, var_2, etc.
  const mapping = {};
  let counter = 1;
  // Sort by length descending so longer tokens replace first without partial overlap
  const sorted = Array.from(candidates).sort((a, b) => b.length - a.length);

  for (const id of sorted) {
    mapping[id] = `var_${counter++}`;
  }

  // Replace tokens safely using word boundaries outside strings
  let out = '';
  let inString = false;
  let stringQuote = null;
  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code[i];

    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += code[i + 1] || '';
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

    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      out += ch;
      i++;
      continue;
    }

    // Check if word starts here
    if (/[A-Za-z_]/.test(ch)) {
      let word = '';
      while (i < len && /[A-Za-z0-9_]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (mapping[word]) {
        out += mapping[word];
      } else {
        out += word;
      }
      continue;
    }

    out += ch;
    i++;
  }

  return {
    code: out,
    count: Object.keys(mapping).length,
    replacements: mapping
  };
}

module.exports = { renameIdentifiers, isObfuscatedIdentifier };