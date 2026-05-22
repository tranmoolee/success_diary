const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function getTurnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY || '';
}

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp;

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();

  return req.ip;
}

async function verifyTurnstile(token, remoteIp, expectedAction = 'register') {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error('TURNSTILE_SECRET_KEY 未配置');
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: controller.signal,
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.success !== true) return false;
    if (data.action && data.action !== expectedAction) return false;

    return true;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { getClientIp, getTurnstileSiteKey, verifyTurnstile };
