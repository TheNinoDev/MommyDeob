local real_type = type
local real_tonumber = tonumber
local real_unpack = unpack or table.unpack
local real_concat = table.concat
local real_tostring = tostring
local real_print = print

local function escape_lua_string(s)
    local parts = {'"'}
    for i = 1, #s do
        local byte = string.byte(s, i)
        if byte == 92 then
            table.insert(parts, "\\\\")
        elseif byte == 34 then
            table.insert(parts, "\\\"")
        elseif byte == 10 then
            table.insert(parts, "\\n")
        elseif byte == 13 then
            table.insert(parts, "\\r")
        elseif byte == 9 then
            table.insert(parts, "\\t")
        elseif byte >= 32 and byte <= 126 then
            table.insert(parts, string.char(byte))
        else
            table.insert(parts, string.format("\\%03d", byte))
        end
    end
    table.insert(parts, '"')
    return table.concat(parts)
end

local _WAIT_COUNT = 0
local _LOOP_COUNTER = 0
local _MAX_LOOPS = 150
local _LOOP_BODIES = {}

local function _check_loop()
    _LOOP_COUNTER = _LOOP_COUNTER + 1
    if _LOOP_COUNTER > _MAX_LOOPS then
        return false
    end
    return true
end

local function type(v)
    local mt = getmetatable(v)
    if mt and mt.__is_mock_dummy then
        return "userdata"
    end
    return real_type(v)
end

local function typeof(v)
    local mt = getmetatable(v)
    if mt and mt.__is_mock_dummy then
        return "Instance"
    end
    return type(v)
end

local function tonumber(v, base)
    if type(v) == "userdata" or (type(v) == "table" and getmetatable(v) and getmetatable(v).__is_mock_dummy) then
        return 1
    end
    return real_tonumber(v, base)
end

local function unpack(t, i, j)
    if real_type(t) == "table" and #t >= 10 then
        local success, res = pcall(real_concat, t, "")
        if success and real_type(res) == "string" then
            local url = res:match("https?://[%w%.%-%/%?%_%=%&%:]+") or res:match("www%.[%w%.%-%/%?%_%=%&%:]+")
            if url then
                real_print("URL DETECTED IN UNPACK --> " .. url)
            end
        end
    end
    return real_unpack(t, i, j)
end

local function table_concat(t, sep, i, j)
    local res = real_concat(t, sep, i, j)
    if real_type(res) == "string" then
        local url = res:match("https?://[%w%.%-%/%?%_%=%&%:]+") or res:match("www%.[%w%.%-%/%?%_%=%&%:]+")
        if url then
            real_print("URL DETECTED IN CONCAT --> " .. url)
        end
    end
    return res
end

local function recursive_tostring(v, depth)
    if depth == nil then depth = 0 end
    if depth > 2 then return tostring(v) end
    
    if real_type(v) == "string" then
        return escape_lua_string(v)
    elseif real_type(v) == "number" then
        if v == math.floor(v) and v >= -2147483648 and v <= 2147483647 then
            return tostring(math.floor(v))
        end
        return tostring(v)
    elseif real_type(v) == "boolean" then
        return tostring(v)
    elseif v == nil then
        return "nil"
    elseif real_type(v) == "table" then
        if getmetatable(v) and getmetatable(v).__is_mock_dummy then
            return tostring(v)
        end
        local parts = {}
        local keys = {}
        for k in pairs(v) do table.insert(keys, k) end
        table.sort(keys, function(a,b) return tostring(a) < tostring(b) end)

        for _, k in ipairs(keys) do
            local val = v[k]
            local k_str = tostring(k)
            if real_type(k) == "string" then k_str = '["' .. k .. '"]' end
            table.insert(parts, k_str .. " = " .. recursive_tostring(val, depth + 1))
        end
        return "{" .. real_concat(parts, ", ") .. "}"
    elseif real_type(v) == "function" then
        return tostring(v)
    else
        return tostring(v)
    end
end

local function create_dummy(name)
    local d = {}
    local mt = {
        __is_mock_dummy = true,
        __index = function(_, k)
             real_print("ACCESSED --> " .. name .. "." .. k)
             if k == "HttpGet" or k == "HttpGetAsync" then
                 return function(_, url, ...)
                     real_print("URL DETECTED --> " .. tostring(url))
                     return create_dummy("HttpGetResult")
                 end
             end
             if k == "IsLoaded" then
                 return function(_) return true end
             end
             if k == "GetService" or k == "getService" then
                 return function(_, sname)
                     real_print("SERVICE_GET --> " .. tostring(sname))
                     return create_dummy("game." .. tostring(sname))
                 end
             end
             if k == "Connect" or k == "connect" then
                 return function(_, fn)
                     if real_type(fn) == "function" then
                         pcall(fn, create_dummy("conn_arg"))
                     end
                     return create_dummy("RBXScriptConnection")
                 end
             end
             if k == "Wait" or k == "wait" then
                 return function(...) return 0 end
             end
             return create_dummy(name .. "." .. k)
        end,
        __newindex = function(_, k, v)
            local val_str = recursive_tostring(v, 0)
            real_print("PROP_SET --> " .. name .. "." .. k .. " = " .. val_str)
        end,
        __call = function(_, ...)
            local args = {...}
            local arg_str = ""
            for i, v in ipairs(args) do
                if i > 1 then arg_str = arg_str .. ", " end
                arg_str = arg_str .. recursive_tostring(v)
            end

            local var_name = name:gsub("%.", "_") .. "_" .. math.random(100, 999)
            real_print("CALL_RESULT --> local " .. var_name .. " = " .. name .. "(" .. arg_str .. ")")
            if name == "task.wait" or name == "wait" then
                _WAIT_COUNT = _WAIT_COUNT + 1
                if _WAIT_COUNT > 10 then
                     error("Too many waits!")
                end
            end

            -- Handle HTTP request functions
            if name == "request" or name == "http_request" or name:match("request$") then
                local opts = args[1]
                if real_type(opts) == "table" and opts.Url then
                    real_print("URL DETECTED --> " .. tostring(opts.Url))
                elseif real_type(opts) == "string" then
                    real_print("URL DETECTED --> " .. tostring(opts))
                end
                return {
                    StatusCode = 200,
                    StatusMessage = "OK",
                    Success = true,
                    Body = '{"success":true,"key":"VALID_KEY"}'
                }
            end
            if name == "identifyexecutor" or name == "getexecutorname" then
                return "MommyDeob", "v2.0"
            end

            for i, v in ipairs(args) do
                if real_type(v) == "function" then
                    real_print("--- ENTERING CLOSURE FOR " .. name .. " ---")
                    local success, err = pcall(v, 
                        create_dummy("arg1"), create_dummy("arg2"), 
                        create_dummy("arg3"), create_dummy("arg4"))
                    if not success then 
                        real_print("-- CLOSURE ERROR: " .. tostring(err)) 
                    end
                    real_print("--- EXITING CLOSURE FOR " .. name .. " ---")
                end
            end

            if name == "readfile" or name == "loadfile" or name == "dofile" then
                return ""
            end
            if name == "isfile" or name == "isfolder" then
                return false
            end
            if name == "listfiles" then
                return {}
            end
            if name == "writefile" or name == "appendfile" or name == "makefolder" or name == "delfile" or name == "delfolder" then
                return nil
            end
            
            return create_dummy(var_name)
        end,
        __tostring = function() return name end,
        __concat = function(a, b) return tostring(a) .. tostring(b) end,
        __add = function(a, b) return create_dummy("("..tostring(a).."+"..tostring(b)..")") end,
        __sub = function(a, b) return create_dummy("("..tostring(a).."-"..tostring(b)..")") end,
        __mul = function(a, b) return create_dummy("("..tostring(a).."*"..tostring(b)..")") end,
        __div = function(a, b) return create_dummy("("..tostring(a).."/"..tostring(b)..")") end,
        __mod = function(a, b) return create_dummy("("..tostring(a).."%"..tostring(b)..")") end,
        __pow = function(a, b) return create_dummy("("..tostring(a).."^"..tostring(b)..")") end,
        __unm = function(a) return create_dummy("-"..tostring(a)) end,
        __lt = function(a, b) return false end,
        __le = function(a, b) return false end,
        __eq = function(a, b) return false end,
        __len = function(a) return 2 end,
    }
    setmetatable(d, mt)
    return d
end

local function mock_pairs(t)
    local mt = getmetatable(t)
    if mt and mt.__is_mock_dummy then
        local i = 0
        return function(...)
            i = i + 1
            if i <= 1 then
                return i, create_dummy(tostring(t).."_v"..i)
            end
            return nil
        end
    end
    return pairs(t)
end

local function mock_ipairs(t)
    local mt = getmetatable(t)
    if mt and mt.__is_mock_dummy then
        local i = 0
        return function(...)
            i = i + 1
            if i <= 1 then
                return i, create_dummy(tostring(t).."_v"..i)
            end
            return nil
        end
    end
    return ipairs(t)
end

local safe_string = {}
for k, v in pairs(string) do
    safe_string[k] = v
end
safe_string.char = function(...)
    local args = {...}
    for i = 1, #args do
        local value = tonumber(args[i]) or 0
        args[i] = math.floor(value) % 256
    end
    return string.char(unpack(args))
end

-- Real bit/luau bit32 shims (needed by VM-based obfuscators like Luraph)
-- md_toi coerces any number to a 32-bit integer (lenient for floats that have
-- no exact integer representation; errors would abort the whole trace run).
local function md_toi(v)
    if real_type(v) ~= "number" then return 0 end
    local ok, r = pcall(function()
        local i = math.tointeger(v)
        if i then return i & 0xFFFFFFFF end
        if v ~= v or v == math.huge or v == -math.huge then return 0 end
        return math.floor(v % 4294967296) & 0xFFFFFFFF
    end)
    if ok then return r else return 0 end
end

local function md_band(...)
    local r = 0xFFFFFFFF
    for _, v in ipairs({...}) do r = r & md_toi(v) end
    return r
end
local function md_bor(...)
    local r = 0
    for _, v in ipairs({...}) do r = r | md_toi(v) end
    return r
end
local function md_bxor(...)
    local r = 0
    for _, v in ipairs({...}) do r = r ~ md_toi(v) end
    return r
end
local function md_bnot(a) return (~md_toi(a)) & 0xFFFFFFFF end
local function md_lshift(a, b) return (md_toi(a) << (md_toi(b) % 32)) & 0xFFFFFFFF end
local function md_rshift(a, b) return (md_toi(a) >> (md_toi(b) % 32)) & 0xFFFFFFFF end
local function md_arshift(a, b)
    local x = md_toi(a)
    if x >= 0x80000000 then x = x - 0x100000000 end
    local r = x >> (md_toi(b) % 32)
    if r < 0 then r = r & 0xFFFFFFFF end
    return r
end
local function md_lrot(a, b)
    local x = md_toi(a)
    b = md_toi(b) % 32
    return ((x << b) | (x >> (32 - b))) & 0xFFFFFFFF
end
local function md_rrot(a, b)
    local x = md_toi(a)
    b = md_toi(b) % 32
    return ((x >> b) | (x << (32 - b))) & 0xFFFFFFFF
end
local md_bit32 = {
    ["band"] = md_band, ["bor"] = md_bor, ["bxor"] = md_bxor, ["bnot"] = md_bnot,
    ["lshift"] = md_lshift, ["rshift"] = md_rshift, ["arshift"] = md_arshift,
    ["lrotate"] = md_lrot, ["rrotate"] = md_rrot,
    ["btest"] = function(...) return md_bor(...) ~= 0 end,
    ["tohex"] = function(a) return string.format("%08x", md_toi(a)) end,
    ["tobit"] = md_toi,
    -- Luau bit32 extensions (used by Luraph VMs)
    ["countlz"] = function(x, width)
        local v = md_toi(x)
        local w = math.tointeger(width or 32) or 32
        if w < 1 then w = 1 elseif w > 32 then w = 32 end
        local count = 0
        for i = w - 1, 0, -1 do
            local bit = (v >> i) & 1
            if bit == 1 then break end
            count = count + 1
        end
        return count
    end,
    ["countrz"] = function(x, width)
        local v = md_toi(x)
        local w = math.tointeger(width or 32) or 32
        if w < 1 then w = 1 elseif w > 32 then w = 32 end
        local count = 0
        for i = 0, w - 1 do
            local bit = (v >> i) & 1
            if bit == 1 then break end
            count = count + 1
        end
        return count
    end,
    ["byteswap"] = function(x)
        local b = md_toi(x)
        return (((b & 0xFF) << 24) | (((b >> 8) & 0xFF) << 16) | (((b >> 16) & 0xFF) << 8) | ((b >> 24) & 0xFF)) & 0xFFFFFFFF
    end,
    ["extract"] = function(n, field, width)
        local v = md_toi(n)
        local f = math.tointeger(field) or 0
        local w = math.tointeger(width or 1) or 1
        if w < 1 then w = 1 elseif w > 32 then w = 32 end
        if f < 0 then f = 0 elseif f > 32 then f = 32 end
        if f + w > 32 then w = 32 - f end
        local mask = (w >= 32) and 0xFFFFFFFF or ((1 << w) - 1)
        return (v >> f) & mask
    end,
    ["replace"] = function(n, field, width, value)
        local v = md_toi(n)
        local f = math.tointeger(field) or 0
        local w = math.tointeger(width or 1) or 1
        if w < 1 then w = 1 elseif w > 32 then w = 32 end
        if f < 0 then f = 0 elseif f > 32 then f = 32 end
        if f + w > 32 then w = 32 - f end
        local mask = (w >= 32) and 0xFFFFFFFF or ((1 << w) - 1)
        v = (v & ~(((1 << w) - 1) << f)) | ((md_toi(value) & mask) << f)
        return v & 0xFFFFFFFF
    end
}
local md_bit = {
    ["band"] = md_band, ["bor"] = md_bor, ["bxor"] = md_bxor, ["bnot"] = md_bnot,
    ["lshift"] = md_lshift, ["rshift"] = md_rshift, ["arshift"] = md_arshift,
    ["rol"] = md_lrot, ["ror"] = md_rrot,
    ["btest"] = function(...) return md_bor(...) ~= 0 end,
    ["tobit"] = md_toi,
    ["tohex"] = function(a) return string.format("%08x", md_toi(a)) end,
    ["bswap"] = function(a)
        local x = md_toi(a)
        return (((x & 0xFF) << 24) | (((x >> 8) & 0xFF) << 16) | (((x >> 16) & 0xFF) << 8) | ((x >> 24) & 0xFF)) & 0xFFFFFFFF
    end
}

-- Lua 5.1 env API built on Lua 5.3 debug upvalues (_ENV)
local MockEnv = {}
local function md_getfenv(f)
    if f == nil or real_type(f) ~= "function" then return MockEnv end
    local i = 1
    while true do
        local name, val = debug.getupvalue(f, i)
        if not name then break end
        if name == "_ENV" then return val end
        i = i + 1
    end
    return _G
end
local function md_setfenv(f, env)
    if real_type(f) ~= "function" then return nil end
    local i = 1
    while true do
        local name = debug.getupvalue(f, i)
        if not name then break end
        if name == "_ENV" then
            debug.setupvalue(f, i, env or MockEnv)
            return f
        end
        i = i + 1
    end
    return nil
end

-- Luau table extensions
local function md_table_create(n, v)
    local t = {}
    n = tonumber(n) or 0
    if n > 262144 then n = 262144 end
    if v ~= nil then
        for i = 1, n do t[i] = v end
    end
    return t
end
local function md_table_find(t, value, init)
    if real_type(t) ~= "table" then return nil end
    for i = math.max(tonumber(init) or 1, 1), #t do
        if t[i] == value then return i end
    end
    return nil
end
local function md_table_clear(t)
    if real_type(t) == "table" then
        for k in pairs(t) do t[k] = nil end
    end
    return t
end

-- Roblox buffer API emulation. A blob is a tagged table with a sparse byte
-- array (nil = 0) plus explicit length; reads/writes are O(1).
local BUF_MT = { __md_buf = true }
local function buf_new(s)
    local t = setmetatable({}, BUF_MT)
    rawset(t, "a", {})
    rawset(t, "n", 0)
    if s then
        local a = {}
        local n = #s
        for i = 1, n do a[i] = string.byte(s, i) or 0 end
        rawset(t, "a", a)
        rawset(t, "n", n)
    end
    return t
end
local function buf_check(b)
    local mt = getmetatable(b)
    if real_type(b) ~= "table" or real_type(mt) ~= "table" or not mt.__md_buf then
        error("expected buffer, got " .. tostring(b), 3)
    end
    return b
end
local function buf_off(i, b, extra)
    local n = math.tointeger(tonumber(i))
    if not n or n < 0 then error("buffer offset must be a non-negative integer", 3) end
    if b and extra and n + extra > b.n then
        error("buffer access out of bounds", 3)
    end
    return n
end
local function md_buffer_create(size)
    local n = math.tointeger(tonumber(size)) or 0
    if n > 67108864 then n = 67108864 end
    if n < 0 then n = 0 end
    local t = buf_new(nil)
    rawset(t, "n", n)
    return t
end
local function buf_bytes_to_string(a, start, stop)
    start = start or 1
    stop = stop or 0
    if stop < start then return "" end
    local parts = {}
    local i = start
    while i <= stop do
        local jend = i + 2047
        if jend > stop then jend = stop end
        local chunk = {}
        for k = i, jend do chunk[k - i + 1] = a[k] or 0 end
        table.insert(parts, string.char(table.unpack(chunk, 1, jend - i + 1)))
        i = jend + 1
    end
    return table.concat(parts)
end
local BUF_SIZES = { u8 = 1, i8 = 1, u16 = 2, i16 = 2, u32 = 4, i32 = 4, f32 = 4, f64 = 8 }
local function md_buffer_read(fmt)
    local size = BUF_SIZES[fmt]
    return function(b, off)
        buf_check(b)
        local j = buf_off(off, b, size)
        local a = b.a
        if size == 1 then
            local u8 = a[j + 1] or 0
            if fmt == "i8" then return u8 >= 128 and u8 - 256 or u8 end
            return u8
        elseif size == 2 then
            local lo, hi = a[j + 1] or 0, a[j + 2] or 0
            local u16 = lo + hi * 256
            if fmt == "i16" then return u16 >= 0x8000 and u16 - 0x10000 or u16 end
            return u16
        elseif fmt == "f32" then
            local b0, b1, b2, b3 = a[j + 1] or 0, a[j + 2] or 0, a[j + 3] or 0, a[j + 4] or 0
            return (string.unpack("<f", string.char(b0, b1, b2, b3)))
        elseif fmt == "f64" then
            local bytes = {}
            for k = 1, 8 do bytes[k] = a[j + k] or 0 end
            return (string.unpack("<d", string.char(table.unpack(bytes, 1, 8))))
        else
            local b0, b1, b2, b3 = a[j + 1] or 0, a[j + 2] or 0, a[j + 3] or 0, a[j + 4] or 0
            local u32 = b0 + b1 * 256 + b2 * 65536 + b3 * 16777216
            if fmt == "i32" then return u32 >= 0x80000000 and u32 - 0x100000000 or u32 end
            return u32
        end
    end
end
local function md_buffer_write(fmt)
    local size = BUF_SIZES[fmt]
    local packs = ({ u0 = nil }) -- (unused)
    local packfmt = ({ u8 = "B", i8 = "b", u16 = "<I2", i16 = "<i2", u32 = "<I4", i32 = "<i4", f32 = "<f", f64 = "<d" })[fmt]
    return function(b, off, v)
        buf_check(b)
        v = tonumber(v) or 0
        local bytes
        if fmt == "u8" then
            local x = (math.tointeger(v) or math.floor(v)) % 256
            bytes = { x }
        elseif fmt == "i8" then
            local x = (math.tointeger(v) or math.floor(v)) % 256
            if x > 127 then x = x - 256 end
            bytes = { x }
        elseif fmt == "u16" then
            local x = (math.tointeger(v) or math.floor(v)) % 65536
            bytes = { x % 256, math.floor(x / 256) % 256 }
        elseif fmt == "i16" then
            local x = (math.tointeger(v) or math.floor(v)) % 65536
            if x > 32767 then x = x - 65536 end
            bytes = { x % 256, math.floor(x / 256) % 256 }
        elseif fmt == "u32" then
            local x = (math.tointeger(v) or math.floor(v)) % 4294967296
            bytes = { x % 256, math.floor(x / 256) % 256, math.floor(x / 65536) % 256, math.floor(x / 16777216) % 256 }
        elseif fmt == "i32" then
            local x = (math.tointeger(v) or math.floor(v)) % 4294967296
            if x > 2147483647 then x = x - 4294967296 end
            bytes = { x % 256, math.floor(x / 256) % 256, math.floor(x / 65536) % 256, math.floor(x / 16777216) % 256 }
        else
            bytes = { string.byte(string.pack(packfmt, v), 1, size) }
        end
        local j = buf_off(off, b, size)
        if j + size > b.n then error("buffer access out of bounds", 3) end
        local a = b.a
        for k = 1, size do a[j + k] = bytes[k] end
        return v
    end
end
local md_buffer = {
    ["create"] = md_buffer_create,
    ["len"] = function(b) return buf_check(b).n end,
    ["readu8"] = md_buffer_read("u8"),
    ["readi8"] = md_buffer_read("i8"),
    ["readu16"] = md_buffer_read("u16"),
    ["readi16"] = md_buffer_read("i16"),
    ["readu32"] = md_buffer_read("u32"),
    ["readi32"] = md_buffer_read("i32"),
    ["readf32"] = md_buffer_read("f32"),
    ["readf64"] = md_buffer_read("f64"),
    ["writeu8"] = md_buffer_write("u8"),
    ["writei8"] = md_buffer_write("i8"),
    ["writeu16"] = md_buffer_write("u16"),
    ["writei16"] = md_buffer_write("i16"),
    ["writeu32"] = md_buffer_write("u32"),
    ["writei32"] = md_buffer_write("i32"),
    ["writef32"] = md_buffer_write("f32"),
    ["writef64"] = md_buffer_write("f64"),
    ["readstring"] = function(b, off, count)
        buf_check(b)
        count = math.tointeger(tonumber(count)) or 0
        if count <= 0 then return "" end
        local j = buf_off(off, b, count)
        if j + count > b.n then error("buffer access out of bounds", 3) end
        return buf_bytes_to_string(b.a, j + 1, j + count)
    end,
    ["writestring"] = function(b, off, s)
        buf_check(b)
        s = tostring(s or "")
        local j = buf_off(off, b, #s)
        if j + #s > b.n then error("buffer access out of bounds", 3) end
        local a = b.a
        for i = 1, #s do a[j + i] = string.byte(s, i) end
    end,
    ["copy"] = function(dst, dstOff, src, srcOff, count)
        buf_check(dst)
        buf_check(src)
        srcOff = math.tointeger(tonumber(srcOff)) or 0
        if srcOff < 0 then srcOff = 0 end
        local avail = src.n - srcOff
        if avail < 0 then avail = 0 end
        local n = tonumber(count)
        n = (n == nil) and avail or math.floor(n)
        if n > avail then n = avail end
        if n < 0 then n = 0 end
        local j = buf_off(dstOff, dst, n)
        if j + n > dst.n then error("buffer access out of bounds", 3) end
        local sa, da = src.a, dst.a
        for i = 0, n - 1 do da[j + 1 + i] = sa[srcOff + 1 + i] end
    end,
    ["fill"] = function(b, off, count, v)
        buf_check(b)
        if count < 0 then count = 0 end
        local j = buf_off(off, b, count)
        local byte = (math.tointeger(tonumber(v) or 0) or 0) % 256
        if j + count > b.n then error("buffer access out of bounds", 3) end
        local a = b.a
        for i = 0, count - 1 do a[j + 1 + i] = byte end
    end,
    ["tostring"] = function(b, start, stop)
        buf_check(b)
        start = math.tointeger(tonumber(start)) or 0
        stop = math.tointeger(tonumber(stop))
        if stop == nil then stop = b.n - 1 end
        if start < 0 then start = 0 end
        if stop > b.n - 1 then stop = b.n - 1 end
        return buf_bytes_to_string(b.a, start + 1, stop + 1)
    end,
    ["fromstring"] = function(s)
        return buf_new(tostring(s or ""))
    end
}
-- Luau's type() must report "buffer" for blobs
local function md_buffer_type(v)
    if getmetatable(v) == BUF_MT then return "buffer" end
    return real_type(v)
end

local pcall_depth = 0
local function traced_pcall(fn, ...)
    pcall_depth = pcall_depth + 1
    local my_depth = pcall_depth
    local args = table.pack(...)
    
    local ret_pack = nil
    local err_obj = nil
    local ok = xpcall(function()
        ret_pack = table.pack(fn(table.unpack(args, 1, args.n)))
    end, function(e)
        err_obj = e
        local out = {string.format("PCALL #%d ERROR: %s", my_depth, tostring(e))}
        for lvl = 2, 8 do
            local linfo = debug.getinfo(lvl, "nSlutf")
            if not linfo then break end
            table.insert(out, "  L" .. lvl .. ": " .. tostring(linfo.name) .. " src=" .. tostring(linfo.short_src) .. " line=" .. tostring(linfo.currentline))
            for li = 1, 20 do
                local lk, lv = debug.getlocal(lvl, li)
                if not lk then break end
                table.insert(out, "    loc " .. tostring(lk) .. " (" .. real_type(lv) .. ") = " .. tostring(lv):sub(1, 50))
            end
        end
        local full_err = table.concat(out, "\n")
        real_print(full_err)
        return full_err
    end)
    
    pcall_depth = pcall_depth - 1
    if not ok then
        return false, err_obj
    end
    return true, table.unpack(ret_pack, 1, ret_pack.n)
end

local safe_table = {}
for k, v in pairs(table) do
    safe_table[k] = v
end
safe_table["create"] = md_table_create
safe_table["find"] = md_table_find
safe_table["clear"] = md_table_clear
safe_table["concat"] = table_concat
safe_table["unpack"] = table.unpack or unpack
safe_table["pack"] = table.pack
safe_table["move"] = table.move

local safe_globals = {
    ["string"] = safe_string,
    ["table"] = safe_table,
    ["math"] = math,
    ["bit32"] = __MD_BIT32 or md_bit32,
    ["bit"] = __MD_BITXX or md_bit,
    ["buffer"] = md_buffer,
    ["pairs"] = mock_pairs,
    ["ipairs"] = mock_ipairs,
    ["select"] = select,
    ["unpack"] = unpack or table.unpack,
    ["tonumber"] = tonumber,
    ["tostring"] = tostring,
    ["type"] = md_buffer_type,
    ["typeof"] = typeof,
    ["pcall"] = traced_pcall,
    ["xpcall"] = xpcall,
    ["getfenv"] = md_getfenv,
    ["setfenv"] = md_setfenv,
    ["setmetatable"] = setmetatable,
    ["getmetatable"] = getmetatable,
    ["error"] = error,
    ["assert"] = assert,
    ["next"] = next,
    ["print"] = function(...)
        local args = {...}
        local parts = {}
        for i,v in ipairs(args) do table.insert(parts, tostring(v)) end
        real_print("TRACE_PRINT --> " .. table.concat(parts, "\t"))
    end,
    ["_VERSION"] = _VERSION,
    ["rawset"] = rawset,
    ["rawget"] = rawget,
    ["os"] = os,
    ["io"] = io,
    ["package"] = package,
    ["debug"] = debug,
    ["dofile"] = dofile,
    ["loadfile"] = loadfile,
    ["coroutine"] = coroutine,
    ["utf8"] = utf8,
    ["loadstring"] = function(s) 
        real_print("LOADSTRING DETECTED: size=" .. tostring(#s)) 
        real_print("LOADSTRING CONTENT START")
        real_print(s)
        real_print("LOADSTRING CONTENT END")
        return function() real_print("DUMMY FUNC CALLED") end
    end
}

setmetatable(MockEnv, {
    __index = function(t, k)
        if safe_globals[k] then
            return safe_globals[k]
        end

        if k == "game" then
            real_print("ACCESSED --> game")
            return create_dummy("game")
        end
        if k == "getgenv" or k == "getrenv" or k == "getreg" then
            return function() return MockEnv end
        end

        local exploit_funcs = {
            "getgc", "getinstances", "getnilinstances",
            "getloadedmodules", "getconnections", "firesignal", "fireclickdetector",
            "firetouchinterest", "isnetworkowner", "gethiddenproperty", "sethiddenproperty",
            "setsimulationradius", "rconsoleprint", "rconsolewarn", "rconsoleerr",
            "rconsoleinfo", "rconsolename", "rconsoleclear", "consoleprint", "consolewarn",
            "consoleerr", "consoleinfo", "consolename", "consoleclear", "warn", "print",
            "error", "debug", "clonefunction", "hookfunction", "newcclosure", "replaceclosure",
            "restoreclosure", "islclosure", "iscclosure", "checkcaller", "getnamecallmethod",
            "setnamecallmethod", "getrawmetatable", "setrawmetatable", "setreadonly",
            "isreadonly", "iswindowactive", "keypress", "keyrelease", "mouse1click",
            "mouse1press", "mouse1release", "mousescroll", "mousemoverel", "mousemoveabs",
            "hookmetamethod", "getcallingscript", "makefolder", "writefile", "readfile",
            "appendfile", "loadfile", "listfiles", "isfile", "isfolder", "delfile",
            "delfolder", "dofile", "bit", "bit32", 
            "Vector2", "Vector3", "CFrame", "UDim", "UDim2", "Color3", "Instance", "Ray",
            "Enum", "BrickColor", "NumberRange", "NumberSequence", "ColorSequence",
            "task", "Delay", "delay", "Spawn", "spawn", "Wait", "wait", 
            "workspace", "Workspace", "tick", "time", "elapsedTime",
            "request", "http_request", "syn", "identifyexecutor", "getexecutorname", "getscriptbytecode", "setclipboard", "toclipboard"
        }
        for _, name in ipairs(exploit_funcs) do
            if k == name then
                real_print("ACCESSED --> " .. k)
                return create_dummy(k)
            end
        end

        real_print("ACCESSED (NIL) --> " .. k)
        return nil
    end,
    
    __newindex = function(t, k, v)
        local val_str = ""
        if real_type(v) == "string" then
            val_str = '"' .. v .. '"'
        elseif real_type(v) == "number" or real_type(v) == "boolean" then
            val_str = tostring(v)
        else
            val_str = tostring(v)
        end
        real_print("SET GLOBAL --> " .. tostring(k) .. " = " .. val_str)
        rawset(t, k, v)
    end
})

safe_globals["_G"] = MockEnv
safe_globals["shared"] = MockEnv

-- Export for standalone (Luraph) runs; harmless when concatenated
__MD_MOCK_ENV = MockEnv
__MD_REAL_UNPACK = real_unpack or table.unpack or unpack