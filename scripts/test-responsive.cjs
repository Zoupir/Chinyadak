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
      await page.setContent(`<html dir="rtl"><head><style>${css}</style></head><body><div style="padding:16px"><div class="category-browser"><div class="category-browser-tabs"><button>دسته‌بندی مادر با عنوان طولانی برای آزمایش</button></div><div class="category-browser-content">${Array.from({ length: 8 }, () => '<button>زیر دسته با عنوان طولانی و چند کلمه</button>').join('')}</div></div><div class="media-compact-grid">${Array.from({ length: 20 }, () => '<div style="aspect-ratio:1;background:#eee"></div>').join('')}</div></div></body></html>`);
      const metrics = await page.evaluate(() => {
        const content = document.querySelector('.category-browser-content');
        const media = document.querySelector('.media-compact-grid');
        const columns = Number(getComputedStyle(media).getPropertyValue('--media-cols'));
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          contentColumns: getComputedStyle(content).gridTemplateColumns.split(' ').length,
          cardWidth: media.firstElementChild.getBoundingClientRect().width,
          expectedCardWidth: (media.getBoundingClientRect().width - (columns - 1) * 12) / columns * .6,
        };
      });
      assert.equal(metrics.overflow, false, `horizontal overflow at ${width}px`);
      assert.equal(metrics.contentColumns, width < 1024 ? 1 : 2, `submenu columns at ${width}px`);
      assert.ok(Math.abs(metrics.cardWidth - metrics.expectedCardWidth) < 1, `media size at ${width}px`);
    }
    console.log('Responsive category columns and 40% smaller media cards passed at seven widths.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
