function cleanDummyName(name) { return name; }

function smartSplitArgs(argsStr) {
  const result = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let stringChar = null;
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (inString) {
      current += ch;
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      current += ch;
    } else if (ch === '(') {
      depth++;
      current += ch;
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === ',' && depth === 0) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current);
  return result;
}

function simplifyObjName(name) {
  return name.replace(/_\d{3,}$/, '');
}

function generateVarName(obj, method, args) {
  if (method === 'GetService' && args.length >= 1) return args[0].trim().replace(/^["']|["']$/g, '');
  if (method === 'FindFirstChild' && args.length >= 1) return args[0].trim().replace(/^["']|["']$/g, '');
  if (method === 'FindFirstChildOfClass' && args.length >= 1) return args[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
  if (method === 'WaitForChild' && args.length >= 1) return args[0].trim().replace(/^["']|["']$/g, '');
  if (method === 'Connect') return null;
  if (method === 'GetMouse') return 'mouse';
  if (method === 'GetPlayers') return 'playerList';
  if (method === 'GetChildren') return 'children';
  if (method === 'GetDescendants') return 'descendants';
  return method ? method[0].toLowerCase() + method.slice(1) : null;
}

function generateVarNameFromFunc(funcName, args) {
  if (funcName.includes('Instance.new') && args.length >= 1) {
    const cn = args[0].trim().replace(/^["']|["']$/g, '');
    return cn ? cn[0].toLowerCase() + cn.slice(1) : null;
  }
  if (funcName.includes('Vector3.new')) return null;
  if (funcName.includes('Vector2.new')) return null;
  if (funcName.includes('UDim2.new')) return null;
  if (funcName.includes('Color3')) return null;
  if (funcName.includes('CFrame')) return null;
  if (funcName.includes('task.wait')) return null;
  const base = funcName.split('.').pop();
  return base ? base[0].toLowerCase() + base.slice(1) : null;
}

function detectLoops(lines) {
  if (lines.length < 6) return null;
  for (let patternLen = 2; patternLen <= Math.min(20, Math.floor(lines.length / 2)); patternLen++) {
    const pattern = [];
    for (let i = 0; i < patternLen; i++) pattern.push(normalizeForPattern(lines[i]));
    let count = 1;
    let pos = patternLen;
    while (pos + patternLen <= lines.length) {
      let matches = true;
      for (let j = 0; j < patternLen; j++) {
        if (normalizeForPattern(lines[pos + j]) !== pattern[j]) { matches = false; break; }
      }
      if (matches) { count++; pos += patternLen; }
      else break;
    }
    if (count >= 3 && count * patternLen >= lines.length * 0.8) {
      return { patternLen, repeatCount: count, patternLines: lines.slice(0, patternLen) };
    }
  }
  return null;
}

function normalizeForPattern(line) {
  return line.replace(/_\d{3,}/g, '_XXX').replace(/Service_\w+/g, 'Service_XXX');
}

function resolveVars(text, varMap) {
  const sortedVars = Object.keys(varMap).sort((a, b) => b.length - a.length);
  for (const dummyVar of sortedVars) {
    if (dummyVar && varMap[dummyVar]) {
      const cleanVar = varMap[dummyVar];
      text = text.replace(new RegExp('\\b' + escapeRegex(dummyVar) + '\\b', 'g'), cleanVar);
    }
  }
  text = text.replace(/\b[A-Za-z0-9_]+_v(\d+)\b/g, 'v$1');
  return text;
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function processCallLine(raw, varMap, varCounter, usedVars) {
  const m = raw.match(/^local\s+(\S+)\s*=\s*(.+)$/);
  if (!m) return raw;
  const origVar = m[1];
  const rhs = m[2].trim();
  const resolvedRhs = resolveVars(rhs, varMap);

  const callMatch = resolvedRhs.match(/^([A-Za-z0-9_.]+)\((.*)\)$/s);
  if (!callMatch) {
    const cleanName = getCleanVar(origVar, varCounter, usedVars);
    varMap[origVar] = cleanName;
    return `local ${cleanName} = ${resolvedRhs}`;
  }

  const funcChain = callMatch[1];
  const argsRaw = callMatch[2] || '';
  const parts = funcChain.split('.');
  const argsList = smartSplitArgs(argsRaw);

  let isMethod = false;
  let objStr = '';
  let methodStr = '';
  let cleanArgs = argsList;

  if (parts.length >= 2 && argsList.length >= 1) {
    objStr = parts.slice(0, -1).join('.');
    methodStr = parts[parts.length - 1];
    const firstArg = argsList[0].trim();
    if (firstArg === objStr) {
      isMethod = true;
      cleanArgs = argsList.slice(1);
    }
  }

  const cleanArgStrs = cleanArgs.map((a) => {
    let s = a.trim();
    s = s.replace(/function:\s*[0-9a-fA-F]+/g, 'function(...) end');
    return s;
  });
  const argsStr = cleanArgStrs.join(', ');

  let callExpr;
  if (isMethod) callExpr = `${objStr}:${methodStr}(${argsStr})`;
  else callExpr = `${funcChain}(${argsStr})`;

  let needsVar = true;
  let niceName = null;

  const NO_VAR_METHODS = ['Connect', 'FireServer', 'Disconnect', 'Destroy', 'CaptureController', 'ClickButton2', 'ChangeState', 'MoveTo', 'SetPrimaryPartCFrame', 'ClearAllChildren', 'Clone', 'Remove', 'remove', 'insert', 'sort', 'wait'];
  if (isMethod) {
    niceName = generateVarName(objStr, methodStr, cleanArgStrs);
    if (NO_VAR_METHODS.includes(methodStr)) needsVar = false;
  } else {
    niceName = generateVarNameFromFunc(funcChain, cleanArgStrs);
    if (funcChain.includes('task.wait') || funcChain.toLowerCase().includes('wait')) needsVar = false;
  }

  if (niceName && needsVar) {
    if (usedVars.has(niceName)) {
      const count = (varCounter.get ? varCounter.get(niceName) : varCounter[niceName] || 1) + 1;
      if (varCounter instanceof Map) varCounter.set(niceName, count); else varCounter[niceName] = count;
      const finalName = `${niceName}${count}`;
      usedVars.add(finalName);
      varMap[origVar] = finalName;
      return `local ${finalName} = ${callExpr}`;
    } else {
      const finalName = niceName;
      if (varCounter instanceof Map) varCounter.set(niceName, 1); else varCounter[niceName] = 1;
      usedVars.add(finalName);
      varMap[origVar] = finalName;
      return `local ${finalName} = ${callExpr}`;
    }
  } else {
    if (niceName) varMap[origVar] = niceName;
    else varMap[origVar] = callExpr;
    return callExpr;
  }
}

function getCleanVar(origVar, varCounter, usedVars) {
  const parts = origVar.split('_');
  while (parts.length && /^\d+$/.test(parts[parts.length - 1])) parts.pop();
  let name = parts.length ? parts[parts.length - 1] : 'var';
  if (name && /^[A-Z]/.test(name)) name = name[0].toLowerCase() + name.slice(1);
  const has = (v) => usedVars instanceof Set ? usedVars.has(v) : usedVars[v];
  const add = (v) => { if (usedVars instanceof Set) usedVars.add(v); else usedVars[v] = true; };
  const getc = (k) => (varCounter instanceof Map ? (varCounter.get(k) || 0) : (varCounter[k] || 0));
  const setc = (k, v) => { if (varCounter instanceof Map) varCounter.set(k, v); else varCounter[k] = v; };
  if (has(name)) {
    const count = getc(name) + 1;
    setc(name, count);
    name = `${name}${count}`;
  }
  add(name);
  return name;
}

function processSetGlobal(raw, varMap) {
  const m = raw.match(/^(\S+)\s*=\s*(.+)$/);
  if (!m) return raw;
  const varName = m[1];
  const value = resolveVars(m[2].trim(), varMap);
  return `${varName} = ${value}`;
}

function processPropSet(raw, varMap) {
  return resolveVars(raw, varMap);
}

function postprocessOutput(output) {
  const lines = output.split('\n');
  const cleaned = [];
  let prev = '';
  for (const line of lines) {
    const stripped = line.trim();
    if (stripped === '' && prev.trim() === '') continue;
    let l = line.replace(/function:\s*[0-9a-fA-F]{10,}/g, 'function(...) end');
    cleaned.push(l);
    prev = l;
  }
  return cleaned.join('\n');
}

function parseTraceReport(reportText) {
  const lines = reportText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
  // Actually keep empties? We'll parse like Python but filter blank at line level; Python skips blank.
  const allLines = reportText.split(/\r?\n/);

  let constantsStr = '';
  const traceLines = [];
  let inConstants = false;
  let inTrace = false;

  for (const rawLine of allLines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === '--- CONSTANTS START ---' || line === '--- CONSTANTS ---') { inConstants = true; continue; }
    if (line === '--- CONSTANTS END ---') { inConstants = false; continue; }
    if (line === '--- TRACE ---') { inTrace = true; continue; }
    if (line === '--- TRACE END ---') { inTrace = false; continue; }
    if (inConstants) { constantsStr += line + '\n'; continue; }
    if (inTrace || /^(CALL_RESULT -->|SET GLOBAL -->|TRACE_PRINT -->|URL DETECTED -->|--- ENTERING CLOSURE|--- EXITING CLOSURE|ACCESSED -->|LOADSTRING DETECTED|LOADSTRING CONTENT|PROP_SET -->)/.test(line)) {
      traceLines.push(line);
    }
  }

  const operations = [];
  const closureStack = [];

  for (const line of traceLines) {
    if (line.startsWith('CALL_RESULT -->')) {
      operations.push({ type: 'call', raw: line.split('CALL_RESULT -->')[1].trim(), depth: closureStack.length });
    } else if (line.startsWith('SET GLOBAL -->')) {
      operations.push({ type: 'set_global', raw: line.split('SET GLOBAL -->')[1].trim(), depth: closureStack.length });
    } else if (line.startsWith('TRACE_PRINT -->')) {
      operations.push({ type: 'print', raw: line.split('TRACE_PRINT -->')[1].trim(), depth: closureStack.length });
    } else if (line.startsWith('URL DETECTED -->')) {
      operations.push({ type: 'url', raw: line.split('URL DETECTED -->')[1].trim(), depth: closureStack.length });
    } else if (line.startsWith('--- ENTERING CLOSURE FOR')) {
      const funcName = line.replace('--- ENTERING CLOSURE FOR ', '').replace(' ---', '').trim();
      operations.push({ type: 'closure_start', name: funcName, depth: closureStack.length });
      closureStack.push(funcName);
    } else if (line.startsWith('--- EXITING CLOSURE FOR')) {
      operations.push({ type: 'closure_end', depth: closureStack.length - 1 });
      if (closureStack.length) closureStack.pop();
    } else if (line.startsWith('PROP_SET -->')) {
      operations.push({ type: 'prop_set', raw: line.split('PROP_SET -->')[1].trim(), depth: closureStack.length });
    } else if (line.startsWith('LOADSTRING DETECTED')) {
      operations.push({ type: 'loadstring', raw: line, depth: closureStack.length });
    }
  }

  const luaLines = [];
  const varCounter = new Map();
  const varMap = {};
  const usedVars = new Set();

  const topLevelCalls = operations.filter((op) => op.type === 'call' && op.depth === 0);
  const loopInfo = detectLoops(topLevelCalls.map((op) => op.raw));

  if (loopInfo) {
    luaLines.push(`-- Loop detected: ${loopInfo.repeatCount} iterations`);
    luaLines.push('while true do');
    for (const rawLine of loopInfo.patternLines) {
      const cleanLine = processCallLine(rawLine, varMap, varCounter, usedVars);
      if (cleanLine) luaLines.push(`    ${cleanLine}`);
    }
    luaLines.push('end');
    luaLines.push('');
  } else {
    const closureInfoStack = [];
    let i = 0;
    while (i < operations.length) {
      const op = operations[i];
      const inClosure = closureInfoStack.length;
      const indent = '    '.repeat(inClosure);

      if (op.type === 'call') {
        let cleanLine = processCallLine(op.raw, varMap, varCounter, usedVars);
        if (cleanLine) {
          let skip = false;
          const CONSTRUCTOR_PREFIXES = ['UDim2.new', 'Color3.fromRGB', 'Color3.new', 'Vector3.new', 'Vector2.new', 'CFrame.new', 'BrickColor.new', 'NumberRange.new'];
          if (CONSTRUCTOR_PREFIXES.some((p) => cleanLine.startsWith(p))) {
            if (i + 1 < operations.length && operations[i + 1].type === 'prop_set') {
              const nextRaw = operations[i + 1].raw;
              if (nextRaw.includes(cleanLine) || nextRaw.includes(cleanLine.split('(')[0])) skip = true;
            }
          }
          if (!skip) {
            if (i + 1 < operations.length && operations[i + 1].type === 'closure_start') {
              if (cleanLine.includes('function(...) end)')) {
                cleanLine = cleanLine.replace('function(...) end)', 'function(...)');
                operations[i + 1].inline_close = 'end)';
              } else if (cleanLine.includes('function(...) end')) {
                cleanLine = cleanLine.replace('function(...) end', 'function(...)');
                operations[i + 1].inline_close = 'end';
              }
            }
            luaLines.push(`${indent}${cleanLine}`);
          }
        }
      } else if (op.type === 'set_global') {
        const cleanLine = processSetGlobal(op.raw, varMap);
        if (cleanLine) luaLines.push(`${indent}${cleanLine}`);
      } else if (op.type === 'print') {
        const msg = op.raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        luaLines.push(`${indent}print("${msg}")`);
      } else if (op.type === 'url') {
        luaLines.push(`${indent}-- URL: ${op.raw}`);
      } else if (op.type === 'prop_set') {
        const cleanLine = processPropSet(op.raw, varMap);
        if (cleanLine) luaLines.push(`${indent}${cleanLine}`);
      } else if (op.type === 'closure_start') {
        const inlineClose = op.inline_close;
        if (inlineClose !== undefined) {
          closureInfoStack.push(inlineClose);
        } else {
          luaLines.push(`${indent}-- Closure for ${op.name}`);
          luaLines.push(`${indent}local function callback(...)`);
          closureInfoStack.push('end');
        }
      } else if (op.type === 'closure_end') {
        const closeStr = closureInfoStack.length ? closureInfoStack.pop() : 'end';
        const indentInner = '    '.repeat(closureInfoStack.length);
        luaLines.push(`${indentInner}${closeStr}`);
      } else if (op.type === 'loadstring') {
        luaLines.push(`${indent}-- ${op.raw}`);
      }
      i++;
    }
  }

  const outputLines = ['-- Deobfuscated via Trace Emulation', ''];
  if (constantsStr.trim()) {
    outputLines.push('-- === String Constants ===');
    outputLines.push(constantsStr.trim());
    outputLines.push('');
  }
  outputLines.push(...luaLines);

  const finalOutput = postprocessOutput(outputLines.join('\n'));
  return finalOutput;
}

module.exports = { parseTraceReport, smartSplitArgs };