import fs from 'node:fs';

const changed = [];
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => { fs.writeFileSync(file, value); changed.push(file); };

const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const index = source.indexOf(from);
  if (index < 0) throw new Error(`v30.10.5 marker missing: ${label}`);
  return source.slice(0, index) + to + source.slice(index + from.length);
};

const replaceAllExact = (source, from, to, minCount, label) => {
  if (source.includes(to) && !source.includes(from)) return source;
  const parts = source.split(from);
  const count = parts.length - 1;
  if (count < minCount) throw new Error(`v30.10.5 marker count ${count}/${minCount}: ${label}`);
  return parts.join(to);
};

const edit = (file, transform) => {
  const before = read(file);
  const after = transform(before);
  if (after !== before) write(file, after);
};

edit('server.ts', source => {
  source = replaceOnce(source,
`import {
  buildHtmlSitemap,
  buildSitemapChunkXml,
  buildSitemapXml,
  renderSeoHtml,
  robotsText
} from './src/server/seo';`,
`import { renderSeoHtml } from './src/server/seo';
import {
  buildPublicHtmlSitemap,
  buildPublicRobotsText,
  buildPublicSitemapChunkXml,
  buildPublicSitemapIndexXml
} from './src/server/seo/public';
import { shouldRedirectToCanonicalSeoPath } from './src/server/seo/technical';`,
    'server SEO imports'
  );
  source = source
    .replace('send(await robotsText())', 'send(await buildPublicRobotsText())')
    .replace('const xml = await buildSitemapXml();', 'const xml = await buildPublicSitemapIndexXml();')
    .replace('/^\\/sitemap-(products|articles|categories|pages|brands|models)-(\\d+)\\.xml$/', '/^\\/sitemap-(static|products|articles|categories|pages|brands|models)-(\\d+)\\.xml$/')
    .replace('const xml = await buildSitemapChunkXml(String(req.params[0]), Number(req.params[1]));', 'const xml = await buildPublicSitemapChunkXml(String(req.params[0]), Number(req.params[1]));')
    .replace('res.type(\'html\').send(await buildHtmlSitemap());', 'res.type(\'html\').send(await buildPublicHtmlSitemap());');

  source = replaceOnce(source,
`app.use(seoRedirectMiddleware);`,
`app.use((req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) { next(); return; }
  const target = shouldRedirectToCanonicalSeoPath(req.path);
  if (!target) { next(); return; }
  const queryIndex = req.originalUrl.indexOf('?');
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
  res.redirect(308, target + query);
});

app.use(seoRedirectMiddleware);`,
    'canonical SEO middleware'
  );
  return source;
});

edit('src/server/seo.ts', source => {
  source = replaceOnce(source,
`  type SeoMetaRecord
} from './seo/platform';`,
`  type SeoMetaRecord
} from './seo/platform';
import {
  canonicalPublicSeoPath,
  canonicalizeAbsoluteSeoUrl,
  isIndexableStaticSeoPath,
  normalizeHreflangEntries
} from './seo/technical';`,
    'seo technical import'
  );

  source = replaceAllExact(
    source,
    `const path = normalizePath(pathname).split('?')[0].replace(/\\/$/, '') || '/';`,
    `const path = canonicalPublicSeoPath(normalizePath(pathname).split('?')[0].replace(/\\/$/, '') || '/');`,
    2,
    'seo canonical path normalization'
  );

  source = replaceOnce(source,
`const applyTitleTemplate = (`,
`const safeIsoDate = (value: unknown, fallback: string): string => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const applyTitleTemplate = (`,
    'schema date helper'
  );

  source = replaceOnce(source,
`      potentialAction: {
        '@type': 'SearchAction',
        target: baseUrl() + '/shop?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }`,
`      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: baseUrl() + '/shop?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }`,
    'functional SearchAction schema'
  );

  source = replaceOnce(source,
`    const priceToman = Number(entity.data?.discountPrice ?? entity.data?.price ?? 0);
    const stock = Number(entity.data?.stock ?? 0);`,
`    const regularPriceToman = Math.max(0, Number(entity.data?.price ?? 0));
    const discountPriceToman = Math.max(0, Number(entity.data?.discountPrice ?? 0));
    const priceToman = discountPriceToman > 0 && (regularPriceToman <= 0 || discountPriceToman < regularPriceToman)
      ? discountPriceToman
      : regularPriceToman;
    const stock = Math.max(0, Number(entity.data?.stock ?? 0));
    const stockStatus = String(entity.data?.stockStatus || '');`,
    'product schema price source'
  );

  source = replaceOnce(source,
`      brand: entity.data?.brandManufacturer
        ? { '@type': 'Brand', name: entity.data.brandManufacturer }
        : undefined`,
`      brand: (entity.data?.partManufacturerCompany || entity.data?.brandManufacturer)
        ? { '@type': 'Brand', name: entity.data.partManufacturerCompany || entity.data.brandManufacturer }
        : undefined,
      aggregateRating: Number(entity.data?.rating || 0) > 0 && Number(entity.data?.reviewsCount || 0) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(entity.data.rating),
            reviewCount: Number(entity.data.reviewsCount)
          }
        : undefined`,
    'product schema brand/rating'
  );

  source = replaceOnce(source,
`        availability: stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition'`,
`        availability: stockStatus === 'out_of_stock' || stock <= 0
          ? 'https://schema.org/OutOfStock'
          : stockStatus === 'low_stock'
            ? 'https://schema.org/LimitedAvailability'
            : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': baseUrl() + '/#organization' },
        inventoryLevel: { '@type': 'QuantitativeValue', value: stock }`,
    'product schema availability'
  );

  source = replaceOnce(source,
`      dateModified: entity.updatedAt.toISOString(),
      mainEntityOfPage: canonical`,
`      datePublished: safeIsoDate(entity.data?.date, entity.updatedAt.toISOString()),
      dateModified: entity.updatedAt.toISOString(),
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }`,
    'article schema dates'
  );

  source = replaceOnce(source,
`  const indexAllowed = settings.global.indexRobots && !isPrivatePath(path);`,
`  const indexAllowed = settings.global.indexRobots && !isPrivatePath(path) && isIndexableStaticSeoPath(path);`,
    'static indexability allowlist'
  );

  source = replaceOnce(source,
`    canonical: safeAbsoluteUrl(canonical) || absoluteSiteUrl(path),`,
`    canonical: canonicalizeAbsoluteSeoUrl(safeAbsoluteUrl(canonical) || absoluteSiteUrl(path), path),`,
    'static canonical normalization'
  );

  source = replaceOnce(source,
`  const canonical = safeAbsoluteUrl(meta.canonicalUrl) || absoluteSiteUrl(
    (path === '/about' || path === '/guarantee') ? path : entity.url
  );`,
`  const canonicalTargetPath = (path === '/about' || path === '/guarantee') ? path : entity.url;
  const canonical = canonicalizeAbsoluteSeoUrl(meta.canonicalUrl || absoluteSiteUrl(canonicalTargetPath), canonicalTargetPath);`,
    'entity canonical normalization'
  );

  source = replaceOnce(source,
`    hreflang: meta.hreflang,`,
`    hreflang: normalizeHreflangEntries(meta.hreflang, canonical, settings.modules.hreflang),`,
    'hreflang normalization'
  );
  return source;
});

edit('src/server/seo/platform.ts', source => {
  source = replaceOnce(source,
`import { config } from '../config';`,
`import { config } from '../config';
import { canonicalPublicSeoPath } from './technical';`,
    'platform canonical helper import'
  );

  source = replaceOnce(source,
`  if (type === 'page') return '/page/' + encodeURIComponent(slug);`,
`  if (type === 'page') return canonicalPublicSeoPath('/page/' + encodeURIComponent(slug));`,
    'canonical page entity URL'
  );

  source = replaceOnce(source,
`  const wanted = Math.max(1, Math.min(10, Number(limit || 5)));
  let result = candidates.slice(0, wanted);
  if (sourceType !== 'product') {
    const productCandidates = candidates.filter(item => item.targetType === 'product').slice(0, 2);
    if (productCandidates.length >= 2) {
      const ids = new Set(result.map(item => item.targetType + ':' + item.targetId));
      for (const product of productCandidates) {
        const id = product.targetType + ':' + product.targetId;
        if (ids.has(id)) continue;
        const replaceIndex = result.map((item, index) => ({ item, index }))
          .filter(pair => pair.item.targetType !== 'product')
          .sort((a, b) => a.item.score - b.item.score)[0]?.index;
        if (replaceIndex !== undefined) result[replaceIndex] = product;
      }
      result = result.sort((a, b) => b.score - a.score);
    }
  }
  return result.slice(0, wanted);`,
`  const wanted = Math.max(1, Math.min(10, Number(limit || 5)));
  const result: typeof candidates = [];
  const seen = new Set<string>();
  const add = (candidate: typeof candidates[number] | undefined) => {
    if (!candidate || result.length >= wanted) return;
    const id = candidate.targetType + ':' + candidate.targetId;
    if (seen.has(id)) return;
    seen.add(id);
    result.push(candidate);
  };

  // Cross-entity diversity is intentional: a product page should be able to
  // receive useful links to its category, vehicle model/brand and articles,
  // rather than repeatedly suggesting only other products.
  const diversityTypes: SeoEntityType[] = sourceType === 'product'
    ? ['category', 'model', 'brand', 'article']
    : sourceType === 'article'
      ? ['product', 'category', 'model', 'brand']
      : ['product', 'article', 'category', 'model', 'brand'];
  const diversityTarget = Math.min(wanted, sourceType === 'product' ? 3 : 2);
  for (const type of diversityTypes) {
    if (result.length >= diversityTarget) break;
    add(candidates.find(item => item.targetType === type));
  }
  for (const candidate of candidates) add(candidate);
  return result.slice(0, wanted);`,
    'cross-type internal link diversification'
  );

  source = replaceOnce(source,
`  const path = normalizePath(pathname).split('?')[0].replace(/\\/$/, '') || '/';`,
`  const path = canonicalPublicSeoPath(normalizePath(pathname).split('?')[0].replace(/\\/$/, '') || '/');`,
    'seoPathExists canonicalization'
  );
  return source;
});

edit('src/components/shop/ShopView.tsx', source => {
  source = replaceOnce(source,
`interface ShopViewProps {
  initialCategory?: string;
  initialFilterMode?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
}

export const ShopView`,
`interface ShopViewProps {
  initialCategory?: string;
  initialFilterMode?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
}

const normalizeShopSearch = (value: unknown) => String(value ?? '')
  .normalize('NFKC')
  .toLocaleLowerCase('fa-IR')
  .replace(/ي/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[^a-z0-9\\u0600-\\u06ff]+/gi, ' ')
  .replace(/\\s+/g, ' ')
  .trim();

export const ShopView`,
    'shop query normalizer'
  );

  source = replaceOnce(source,
`  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');

  useEffect(() => {
    if (selectedCategory === 'all') return;
    void loadCatalogPage({ categorySlug: selectedCategory, append: false });
  }, [selectedCategory]);`,
`  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return String(new URLSearchParams(window.location.search).get('q') || '').trim().slice(0, 160);
  });

  useEffect(() => {
    if (selectedCategory === 'all' && !searchQuery) return;
    void loadCatalogPage({
      categorySlug: selectedCategory === 'all' ? undefined : selectedCategory,
      query: searchQuery || undefined,
      append: false
    });
  }, [selectedCategory, searchQuery]);`,
    'shop SearchAction query loading'
  );

  source = replaceOnce(source,
`    return products.filter(p => {
      // 1. Category Filter`,
`    return products.filter(p => {
      if (searchQuery) {
        const queryTokens = normalizeShopSearch(searchQuery).split(' ').filter(Boolean);
        const haystack = normalizeShopSearch([
          p.nameFa, p.nameEn, p.oemNumber, p.partNumber, p.sku,
          p.brandManufacturer, p.partManufacturerCompany, p.vehicleManufacturerCompany,
          p.shortDescription, p.description,
          ...(p.fitments || []).flatMap(fitment => [fitment.brandName, fitment.modelName, fitment.engine, fitment.engineCode])
        ].filter(Boolean).join(' '));
        if (queryTokens.length && !queryTokens.every(token => haystack.includes(token))) return false;
      }

      // 1. Category Filter`,
    'shop query filtering'
  );

  source = replaceOnce(source,
`  }, [products, selectedCategory, selectedBrand, selectedManufacturer, selectedGrade, onlyInStock, onlyFitActiveVehicle, selectedVehicle, sortBy]);`,
`  }, [products, searchQuery, selectedCategory, selectedBrand, selectedManufacturer, selectedGrade, onlyInStock, onlyFitActiveVehicle, selectedVehicle, sortBy]);`,
    'shop query memo dependency'
  );

  source = replaceOnce(source,
`  const resetAllFilters = () => {
    setSelectedCategory('all');`,
`  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('q')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url.pathname + url.search);
    }`,
    'shop query reset'
  );

  source = replaceOnce(source,
`            <span>{activeCategoryObj?.heroTitle || (activeCategoryObj ? `قطعات ${activeCategoryObj.nameFa}` : 'فهرست کامل قطعات یدکی خودروهای چینی')}</span>`,
`            <span>{searchQuery ? `نتایج جستجو برای «${searchQuery}»` : activeCategoryObj?.heroTitle || (activeCategoryObj ? `قطعات ${activeCategoryObj.nameFa}` : 'فهرست کامل قطعات یدکی خودروهای چینی')}</span>`,
    'shop query heading'
  );

  source = replaceOnce(source,
`                onClick={() => void loadCatalogPage({ categorySlug: selectedCategory === 'all' ? undefined : selectedCategory, append: true })}`,
`                onClick={() => void loadCatalogPage({ categorySlug: selectedCategory === 'all' ? undefined : selectedCategory, query: searchQuery || undefined, append: true })}`,
    'shop query pagination'
  );
  return source;
});

const required = [
  ['server.ts', "buildPublicSitemapIndexXml"],
  ['server.ts', "shouldRedirectToCanonicalSeoPath"],
  ['server.ts', "sitemap-(static|products|articles|categories|pages|brands|models)"],
  ['src/server/seo.ts', "urlTemplate: baseUrl() + '/shop?q={search_term_string}'"],
  ['src/server/seo.ts', 'LimitedAvailability'],
  ['src/server/seo.ts', 'datePublished: safeIsoDate'],
  ['src/server/seo.ts', 'normalizeHreflangEntries'],
  ['src/server/seo/platform.ts', "canonicalPublicSeoPath('/page/'"],
  ['src/server/seo/platform.ts', 'Cross-entity diversity is intentional'],
  ['src/components/shop/ShopView.tsx', 'normalizeShopSearch'],
  ['src/components/shop/ShopView.tsx', 'query: searchQuery || undefined'],
  ['src/server/seo/public.ts', "p.slug NOT IN ('home','part-request')"],
  ['src/server/seo/public.ts', 'sitemap-static-1.xml'],
  ['src/server/seo/technical.ts', "['/page/home', '/']"]
];
for (const [file, marker] of required) {
  if (!read(file).includes(marker)) throw new Error(`v30.10.5 SEO preparation incomplete: ${file} :: ${marker}`);
}

console.log(changed.length
  ? `v30.10.5 stage 6 technical SEO applied: ${changed.join(', ')}`
  : 'v30.10.5 stage 6 technical SEO already satisfied.');
