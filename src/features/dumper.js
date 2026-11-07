const fs = require('fs');
const path = require('path');
const { runLua } = require('../deobfuscator/wearedevs');
const { normalizeLuau } = require('../deobfuscator/normalize');

const MOCK_ENV_PATH = path.join(__dirname, '..', 'deobfuscator', 'mockEnv.lua');

function dumpScript(code) {
  const normalized = normalizeLuau(code);
  const mockEnv = fs.readFileSync(MOCK_ENV_PATH, 'utf8');

  // Inject execution wrapper
  const wrappedCode = `
${mockEnv}
local _DUMP_START = true
local _dumper_success, _dumper_err = pcall(function()
${normalized}
end)
if not _dumper_success then
  real_print("SCRIPT_ERROR --> " .. tostring(_dumper_err))
end
`;

  let collected = [];
  try {
    collected = runLua(wrappedCode);
  } catch (err) {
    // If syntax error or execution break, return what we have or the error
    return {
      success: false,
      error: err.message,
      trace: [`Execution error: ${err.message}`],
      constants: [],
      accessed: [],
      calls: []
    };
  }

  const trace = [];
  const constants = [];
  const accessed = new Set();
  const calls = [];
  const urls = [];
  const globals = [];

  for (const line of collected) {
    const trimmed = String(line).trim();
    if (!trimmed) continue;
    trace.push(trimmed);

    if (trimmed.startsWith('ACCESSED -->')) {
      const item = trimmed.replace('ACCESSED -->', '').trim();
      accessed.add(item);
    } else if (trimmed.startsWith('CALL_RESULT -->')) {
      calls.push(trimmed.replace('CALL_RESULT -->', '').trim());
    } else if (trimmed.startsWith('URL DETECTED -->') || trimmed.startsWith('URL DETECTED IN')) {
      urls.push(trimmed.replace(/URL DETECTED.*-->/, '').trim());
    } else if (trimmed.startsWith('SET GLOBAL -->')) {
      globals.push(trimmed.replace('SET GLOBAL -->', '').trim());
    }
  }

  // Also extract literal string constants statically if possible
  const stringLiterals = new Set();
  const stringRegex = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
  let match;
  while ((match = stringRegex.exec(normalized)) !== null) {
    if (match[0].length >= 3 && match[0].length <= 500) {
      stringLiterals.add(match[0]);
    }
  }

  return {
    success: true,
    totalLogs: trace.length,
    accessed: Array.from(accessed),
    calls,
    urls: Array.from(new Set(urls)),
    globals,
    constants: Array.from(stringLiterals).slice(0, 50),
    trace: trace.slice(0, 150)
  };
}

module.exports = { dumpScript };