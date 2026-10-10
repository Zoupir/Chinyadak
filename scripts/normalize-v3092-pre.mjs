import fs from 'node:fs';

// The project is assembled from a long chain of idempotent migration scripts.
// Normalize only the small legacy regions that v30.9.2 intentionally replaces,
// so harmless comments/whitespace from earlier versions cannot break CI.

{
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
}

{
  const path = 'src/components/common/LiveSectionModal.tsx';
  let source = fs.readFileSync(path, 'utf8');

  // v30.8.1 removed the title requirement, so the exact body differs from the
  // historical target used by the v30.9.2 patch. Canonicalize it first; a
  // post-repair removes the obsolete title gate again after the new save flow
  // has been installed.
  if (!source.includes('nextPlacements = resolved.map')) {
    const canonicalSave = `  const save = async () => {
    if (!form.title?.trim()) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }
    const saved = await updateSection(pageSlug, form);
    if (!saved) return;
    originalRef.current = JSON.parse(JSON.stringify(form));
    onClose();
  };
`;
    const saveRegion = /  (?:\/\/[^\n]*\n)?  const save = async \(\) => \{[\s\S]*?\n  \};\n(?=\n  const deleteCurrent)/;
    if (!saveRegion.test(source)) {
      throw new Error('v30.9.2 pre-normalize could not locate live section save region');
    }
    source = source.replace(saveRegion, canonicalSave);
  }

  fs.writeFileSync(path, source);
}

console.log('v30.9.2 pre-normalize OK.');
