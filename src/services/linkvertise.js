const LINKVERTISE_API_ENDPOINT = 'https://publisher.linkvertise.com/api/v1/anti_bypassing';

async function verifyLinkvertiseHash(hash, token = process.env.LINKVERTISE_ANTI_BYPASS_TOKEN) {
  if (!hash || !hash.trim()) {
    return { valid: false, message: 'Empty hash provided' };
  }

  const cleanHash = hash.trim();
  const cleanToken = (token || '90e0ee71cad4aaa0a891c8f08d9113eb37c9bfccbc81b63713c210b582a1a92c').trim();

  try {
    const res = await fetch(LINKVERTISE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 MommyDeob/2.0'
      },
      body: JSON.stringify({
        token: cleanToken,
        hash: cleanHash
      })
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data) {
      // Check success conditions from Linkvertise anti-bypass response
      if (data.status === 'success' || data.status === 200 || data.success === true) {
        return { valid: true, data };
      }
    }

    return {
      valid: false,
      message: (data && data.message) || `Linkvertise rejected hash (HTTP ${res.status})`
    };
  } catch (err) {
    return { valid: false, message: `Linkvertise verification error: ${err.message}` };
  }
}

function getLinkvertiseUrl(userId) {
  const pubId = process.env.LINKVERTISE_USER_ID || '10452071';
  return `https://linkvertise.com/${pubId}/mommydeob-key?o=sharing&userId=${userId}`;
}

module.exports = {
  verifyLinkvertiseHash,
  getLinkvertiseUrl
};