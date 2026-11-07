async function uploadPaste(content, title = 'MommyDeob Script') {
  // Try Pastefy first
  try {
    const res = await fetch('https://pastefy.app/api/v2/paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        type: 'PASTE'
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.paste && data.paste.id) {
        return {
          service: 'Pastefy',
          url: `https://pastefy.app/${data.paste.id}`,
          rawUrl: `https://pastefy.app/${data.paste.id}/raw`
        };
      }
    }
  } catch (_) {}

  // Fallback to dpaste.org
  try {
    const res = await fetch('https://dpaste.org/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        content,
        syntax: 'lua',
        title,
        expiry_days: '7'
      })
    });
    if (res.ok) {
      const url = (await res.text()).trim().replace(/^"|"$/g, '');
      if (url.startsWith('http')) {
        return {
          service: 'dpaste',
          url,
          rawUrl: `${url}/raw`
        };
      }
    }
  } catch (_) {}

  // Fallback to rentry or hastebin
  try {
    const res = await fetch('https://hastebin.com/documents', {
      method: 'POST',
      body: content
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.key) {
        return {
          service: 'Hastebin',
          url: `https://hastebin.com/${data.key}`,
          rawUrl: `https://hastebin.com/raw/${data.key}`
        };
      }
    }
  } catch (_) {}

  throw new Error('All paste upload services failed. Output is still available as a file.');
}

module.exports = { uploadPaste };