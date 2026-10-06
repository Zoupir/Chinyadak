const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const css = fs.readdirSync('dist/assets').filter(name => name.endsWith('.css')).map(name => fs.readFileSync(`dist/assets/${name}`, 'utf8')).join('\n');
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    for (const width of [360, 390, 640, 700, 820, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(`<html dir="rtl" data-layout="marketplace-rtl"><head><style>${css}</style></head><body><div style="padding:16px"><div class="category-browser"><div class="category-browser-tabs"><button>دسته‌بندی مادر با عنوان طولانی برای آزمایش</button></div><div class="category-browser-content">${Array.from({ length: 8 }, () => '<button>زیر دسته با عنوان طولانی و چند کلمه</button>').join('')}</div></div><div class="marketplace-ref-mainbar"><div class="marketplace-ref-container marketplace-ref-mainbar-inner" data-mobile-logo-align="center" style="--mobile-logo-width:118px"><button class="marketplace-ref-hamburger">☰</button><button class="marketplace-ref-logo"><span>YS</span></button><div class="marketplace-ref-search-wrap"><div class="marketplace-ref-search"><input value="جستجو" /></div></div><div class="marketplace-ref-actions"><button>سبد</button></div></div></div><div class="media-compact-grid">${Array.from({ length: 20 }, () => '<div style="aspect-ratio:1;background:#eee"></div>').join('')}</div></div></body></html>`);
      const metrics = await page.evaluate(() => {
        const content = document.querySelector('.category-browser-content');
        const media = document.querySelector('.media-compact-grid');
        const columns = Number(getComputedStyle(media).getPropertyValue('--media-cols'));
        const logo = document.querySelector('.marketplace-ref-logo');
        const mainbar = document.querySelector('.marketplace-ref-mainbar-inner');
        const search = document.querySelector('.marketplace-ref-search-wrap');
        const logoRect = logo.getBoundingClientRect();
        const mainbarRect = mainbar.getBoundingClientRect();
        const searchRect = search.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          contentColumns: getComputedStyle(content).gridTemplateColumns.split(' ').length,
          cardWidth: media.firstElementChild.getBoundingClientRect().width,
          expectedCardWidth: (media.getBoundingClientRect().width - (columns - 1) * 12) / columns * .6,
          logoPosition: getComputedStyle(logo).position,
          logoCenterDelta: Math.abs((logoRect.left + logoRect.width / 2) - (mainbarRect.left + mainbarRect.width / 2)),
          logoSearchOverlap: logoRect.bottom > searchRect.top + 0.5,
        };
      });
      assert.equal(metrics.overflow, false, `horizontal overflow at ${width}px`);
      assert.equal(metrics.contentColumns, 2, `mega-menu content must keep two columns at ${width}px`);
      assert.ok(Math.abs(metrics.cardWidth - metrics.expectedCardWidth) < 1, `media size at ${width}px`);
      if (width <= 767) {
        assert.equal(metrics.logoPosition, 'static', `center logo must stay in grid flow at ${width}px`);
        assert.ok(metrics.logoCenterDelta < 1, `center logo is not geometrically centered at ${width}px`);
        assert.equal(metrics.logoSearchOverlap, false, `center logo overlaps search at ${width}px`);
      }
    }
    console.log('Responsive mega-menu, centered mobile logo and compact media cards passed at seven widths.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
