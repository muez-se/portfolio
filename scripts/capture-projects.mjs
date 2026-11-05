import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "assets", "projects");
fs.mkdirSync(outDir, { recursive: true });

const sites = [
  { slug: "servexio", url: "https://servexio.com/" },
  { slug: "hnf", url: "https://www.hnf.com.pk/" },
  { slug: "sigmashop", url: "https://sigmashop.pk/" },
  { slug: "packaginglane", url: "https://packaginglane.com/" },
];

const hideBranding = () => {
  const css = document.createElement("style");
  css.textContent = `
    .custom-logo-link, .custom-logo, .site-logo, .logo, .navbar-brand, .header-logo,
    .site-branding, .brand, .elementor-widget-theme-site-logo, img.custom-logo,
    .wp-block-site-logo, .wp-block-site-title, header .logo,
    img[src*="logo" i], img[alt*="logo" i],
    .cookie-notice, #cookie-notice, .cky-consent-container, .complianz,
    #onetrust-banner-sdk, .cc-window, .osano-cm-window, .moove_gdpr_cookie_info_bar,
    .elementor-popup-modal, .dialog-widget, #cm,
    a[href*="wa.me"], a[href*="api.whatsapp"], .whatsapp-float, .floating-wpp,
    .scrollup, .back-to-top, #wpadminbar {
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(css);

  document.querySelectorAll("h1, h2, .elementor-heading-title").forEach((el) => {
    if (/^logo$/i.test((el.textContent || "").trim())) {
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("opacity", "0", "important");
    }
  });

  // Hide primary brand anchors in header that are only logo/brand
  document
    .querySelectorAll("header a, .elementor-location-header a, .site-header a")
    .forEach((a) => {
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      const hasImg = !!a.querySelector("img, svg, picture");
      if (
        hasImg ||
        /^logo$/i.test(text) ||
        /^H\s*&\s*F$/i.test(text) ||
        /^sigma/i.test(text) ||
        /^packaging/i.test(text) ||
        /^servexio$/i.test(text)
      ) {
        if (hasImg || text.length < 28) {
          a.style.setProperty("visibility", "hidden", "important");
          a.style.setProperty("opacity", "0", "important");
        }
      }
    });

  window.scrollTo(0, 0);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});

for (const site of sites) {
  const page = await context.newPage();
  console.log(`Capturing ${site.slug}...`);
  try {
    await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(3500);
    await page.evaluate(hideBranding);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    const file = path.join(outDir, `${site.slug}.png`);
    await page.screenshot({ path: file, type: "png" });
    console.log(`Saved ${file}`);
  } catch (err) {
    console.error(`Failed ${site.slug}:`, err.message);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log("Done");
