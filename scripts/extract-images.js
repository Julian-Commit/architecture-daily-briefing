#!/usr/bin/env node
/**
 * extract-images.js — Extract og:image from architecture news articles
 *
 * Usage:
 *   node scripts/extract-images.js <url> [url2] [url3] ...
 *
 * Output (JSON):
 *   [
 *     { "url": "https://...", "image": "https://...og-image.jpg", "status": "ok" },
 *     { "url": "https://...", "image": null, "status": "no_image" },
 *     { "url": "https://...", "image": null, "status": "timeout" }
 *   ]
 *
 * Each URL has a 15-second timeout. Browser reuses a single instance.
 */

const puppeteer = require('puppeteer');

const TIMEOUT_MS = 20000;
const WAIT_MS = 6000; // Wait for JS to render + lazy images

async function extractImage(page, url) {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT_MS,
    });

    // Wait for late-loading JS and lazy images
    await new Promise(r => setTimeout(r, WAIT_MS));

    // Scroll to trigger lazy-loaded hero images
    await page.evaluate(() => window.scrollTo(0, 800));
    await new Promise(r => setTimeout(r, 1000));

    // Try og:image first
    let imageUrl = await page.$eval(
      'meta[property="og:image"]',
      el => el.getAttribute('content')
    ).catch(() => null);

    // Fallback: twitter:image
    if (!imageUrl) {
      imageUrl = await page.$eval(
        'meta[name="twitter:image"]',
        el => el.getAttribute('content')
      ).catch(() => null);
    }

    // Fallback: first large image in article
    if (!imageUrl) {
      imageUrl = await page.$eval(
        'article img, .article img, .post img, main img, .content img',
        el => el.src || el.getAttribute('data-src')
      ).catch(() => null);
    }

    if (imageUrl) {
      return { url, image: imageUrl, status: 'ok' };
    }
    return { url, image: null, status: 'no_image' };

  } catch (err) {
    const isTimeout = err.message && err.message.includes('timeout');
    return {
      url,
      image: null,
      status: isTimeout ? 'timeout' : 'error',
      error: err.message.slice(0, 100),
    };
  }
}

async function main() {
  const urls = process.argv.slice(2).filter(u => u.startsWith('http'));

  if (urls.length === 0) {
    console.error('Usage: node extract-images.js <url1> [url2] ...');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const results = [];

  try {
    for (const url of urls) {
      // Each URL gets its own page for isolation
      const page = await browser.newPage();
      try {
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        );
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
        });
        await page.setViewport({ width: 1200, height: 800 });

        // Anti-bot-detection: hide webdriver flag
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Block unnecessary resources for speed
        await page.setRequestInterception(true);
        page.on('request', req => {
          const type = req.resourceType();
          if (['font', 'media'].includes(type)) {
            req.abort();
          } else {
            req.continue();
          }
        });

        const result = await extractImage(page, url);
        results.push(result);
        console.error(`[${result.status}] ${url} → ${result.image || 'none'}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  // Output JSON to stdout
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
