import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "assets", "projects", "hnf.png");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});

await page.goto("https://www.hnf.com.pk/shop/", {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await page.waitForTimeout(4000);

await page.addStyleTag({
  content: `
    .custom-logo-link, .custom-logo, .site-logo, .logo, .navbar-brand, .site-branding,
    .elementor-widget-theme-site-logo, img.custom-logo, img[src*="logo" i], img[alt*="logo" i],
    a[href*="wa.me"], #wpadminbar, .cookie-notice, #cookie-notice,
    .elementor-popup-modal, .dialog-widget, .dialog-lightbox-widget, [data-elementor-type="popup"],
    header .elementor-widget-image, .elementor-location-header .elementor-widget-image {
      display: none !important; visibility: hidden !important; opacity: 0 !important;
    }
  `,
});

await page.evaluate(() => {
  document
    .querySelectorAll(".elementor-popup-modal, .dialog-widget, .dialog-lightbox-widget")
    .forEach((el) => el.remove());

  // Hide brand anchors / H&F text in header
  document.querySelectorAll("header a, .elementor-location-header a, .site-header a").forEach((a) => {
    if (a.querySelector("img") || /^H\s*&\s*F$/i.test((a.textContent || "").trim())) {
      a.style.setProperty("visibility", "hidden", "important");
      a.style.setProperty("opacity", "0", "important");
    }
  });

  // Scroll to product catalog (skip promotional banner with logo mark)
  const catalog =
    document.querySelector(".woocommerce-result-count, ul.products, .products") ||
    document.querySelector("main");
  if (catalog) {
    const y = catalog.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo(0, Math.max(0, y));
  } else {
    window.scrollTo(0, 520);
  }
});

await page.waitForTimeout(700);
await page.screenshot({ path: out, type: "png" });
console.log("Saved", out);
await browser.close();
