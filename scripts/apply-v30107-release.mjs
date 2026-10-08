import fs from 'node:fs';

const changed = [];
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => { fs.writeFileSync(file, value); changed.push(file); };

const homeFile = 'src/components/home/HomeView.tsx';
let home = read(homeFile);
const homeBefore = home;

home = home.replace("import { ARTICLES } from '../../data/mockData';\n", '');

if (!/\barticles\s*,/.test(home.match(/const \{[\s\S]*?\} = useStore\(\);/)?.[0] || '')) {
  home = home.replace(
    /const \{\s*\n\s*products,\s*\n/,
    match => match.replace('products,', 'products,\n    articles,')
  );
}

home = home.replace(/\{ARTICLES\.map\(\(article\) => \(/g, '{articles.slice(0, 3).map((article) => (');

if (home !== homeBefore) write(homeFile, home);

const required = [
  ['src/components/home/HomeView.tsx', 'articles.slice(0, 3).map((article) => ('],
  ['src/components/blog/ArticleDetailView.tsx', 'const { products, articles, articleCategories, categories } = useStore();']
];
for (const [file, marker] of required) {
  if (!read(file).includes(marker)) throw new Error(`v30.10.7 runtime cleanup incomplete: ${file} :: ${marker}`);
}

if (read(homeFile).includes("from '../../data/mockData'")) {
  throw new Error('v30.10.7 HomeView still imports runtime article data from mockData.');
}

console.log(changed.length
  ? `v30.10.7 stage 8 runtime cleanup applied: ${changed.join(', ')}`
  : 'v30.10.7 stage 8 runtime cleanup already satisfied.');
