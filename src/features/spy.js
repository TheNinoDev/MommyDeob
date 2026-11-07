const fs = require('fs');
const path = require('path');
const { runLua } = require('../deobfuscator/wearedevs');
const { normalizeLuau } = require('../deobfuscator/normalize');

const MOCK_ENV_PATH = path.join(__dirname, '..', 'deobfuscator', 'mockEnv.lua');

function spyScript(code) {
  const normalized = normalizeLuau(code);
  const mockEnv = fs.readFileSync(MOCK_ENV_PATH, 'utf8');

  // Network and security hook extensions
  const spyHooks = `
local _SPY_LOG = {}
local function spy_record(category, data)
  real_print("[SPY:" .. category .. "] " .. data)
end

-- Hook request/http_request/syn.request
local function mock_request(options)
  if type(options) == "table" then
    local url = tostring(options.Url or options.url or "unknown")
    local method = tostring(options.Method or options.method or "GET")
    local body = tostring(options.Body or options.body or "")
    spy_record("HTTP_REQUEST", method .. " " .. url .. (body ~= "" and (" | Body: " .. body) or ""))
  else
    spy_record("HTTP_REQUEST", tostring(options))
  end
  return {
    StatusCode = 200,
    StatusMessage = "OK",
    Success = true,
    Body = "{}",
    Headers = {}
  }
end

MockEnv.request = mock_request
MockEnv.http_request = mock_request
MockEnv.syn = MockEnv.syn or {}
MockEnv.syn.request = mock_request

-- Hook WebSocket
MockEnv.WebSocket = {
  connect = function(url)
    spy_record("WEBSOCKET", "Connect: " .. tostring(url))
    return {
      Send = function(_, msg) spy_record("WEBSOCKET_SEND", tostring(msg)) end,
      Close = function() spy_record("WEBSOCKET_CLOSE", "closed") end,
      OnMessage = { Connect = function() end },
      OnClose = { Connect = function() end }
    }
  end
}
`;

  const wrapped = `
${mockEnv}
${spyHooks}
local _spy_ok, _spy_err = pcall(function()
${normalized}
end)
if not _spy_ok then
  real_print("[SPY:ERROR] " .. tostring(_spy_err))
end
`;

  let collected = [];
  try {
    collected = runLua(wrapped);
  } catch (err) {
    collected = [`[SPY:ERROR] Execution crash: ${err.message}`];
  }

  const httpRequests = [];
  const webSockets = [];
  const remoteCalls = [];
  const webhooks = new Set();
  const detectedUrls = new Set();
  const fileAccess = [];
  const dynamicCode = [];
  const logs = [];

  // Static scan for webhooks and URLs across entire code
  const webhookRegex = /https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/gi;
  let whMatch;
  while ((whMatch = webhookRegex.exec(code)) !== null) {
    webhooks.add(whMatch[0]);
  }

  const urlRegex = /https?:\/\/[a-zA-Z0-9_\-.]+(?::\d+)?(?:\/[^\s"']*)?/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(code)) !== null) {
    detectedUrls.add(urlMatch[0]);
  }

  for (const line of collected) {
    const s = String(line).trim();
    if (!s) continue;
    logs.push(s);

    if (s.startsWith('[SPY:HTTP_REQUEST]')) {
      httpRequests.push(s.replace('[SPY:HTTP_REQUEST]', '').trim());
    } else if (s.startsWith('[SPY:WEBSOCKET]')) {
      webSockets.push(s.replace('[SPY:WEBSOCKET]', '').trim());
    } else if (s.includes('HttpGet') || s.includes('HttpPost')) {
      httpRequests.push(s);
    } else if (s.includes('FireServer') || s.includes('InvokeServer')) {
      remoteCalls.push(s);
    } else if (s.startsWith('URL DETECTED')) {
      const u = s.split('-->')[1] ? s.split('-->')[1].trim() : s;
      detectedUrls.add(u);
      if (webhookRegex.test(u)) webhooks.add(u);
    } else if (s.startsWith('LOADSTRING DETECTED')) {
      dynamicCode.push(s);
    }
  }

  return {
    webhooks: Array.from(webhooks),
    urls: Array.from(detectedUrls).slice(0, 30),
    httpRequests,
    webSockets,
    remoteCalls: remoteCalls.slice(0, 25),
    dynamicCode,
    totalLogs: logs.length,
    rawLogs: logs.slice(0, 50)
  };
}

module.exports = { spyScript };