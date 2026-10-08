import fs from 'node:fs';

const path = 'src/components/admin/AdminView.tsx';
let source = fs.readFileSync(path, 'utf8');

const canonicalProductBlock = `  // Product Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  useEffect(() => {
    if (!initialTarget?.startsWith('product:')) return;
    const targetId = initialTarget.slice('product:'.length);
    const match = products.find(product => product.id === targetId || product.slug === targetId);
    if (match) {
      setActiveTab('products');
      setEditingProduct(match);
    }
  }, [initialTarget, products]);
`;

if (!source.includes('handledProductTargetRef')) {
  const productRegion = /  (?:\/\/[^\n]*\n)?  const \[editingProduct, setEditingProduct\] = useState<Product \| null>\(null\);[\s\S]*?(?=  const \[isNewProductModalOpen, setIsNewProductModalOpen\])/;
  if (!productRegion.test(source)) {
    throw new Error('v30.9.2 pre-normalize could not locate product editor state region');
  }
  source = source.replace(productRegion, canonicalProductBlock);
}

fs.writeFileSync(path, source);
console.log('v30.9.2 pre-normalize OK.');
