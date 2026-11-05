import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "assets", "projects");
fs.mkdirSync(outDir, { recursive: true });

const sites = [
  { slug: "outs", url: "https://outs.social/" },
  { slug: "hrm", url: "https://demo.zyber.inc/hrm/contents.php?page=home" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});

for (const site of sites) {
  const page = await context.newPage();
  console.log("Capturing", site.slug);
  try {
    await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(4000);
    await page.addStyleTag({
      content: `
        .custom-logo-link, .custom-logo, .site-logo, .logo, img[src*="logo" i],
        .cookie-notice, #cookie-notice, .cky-consent-container, #onetrust-banner-sdk,
        .cc-window, a[href*="wa.me"], #wpadminbar {
          visibility: hidden !important; opacity: 0 !important;
        }
      `,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(outDir, `${site.slug}.png`),
      type: "png",
    });
    console.log("Saved", site.slug);
  } catch (err) {
    console.error(site.slug, err.message);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log("Done");
