import fs from 'node:fs';

const file = 'src/context/StoreContext.tsx';
const source = fs.readFileSync(file, 'utf8');
const startNeedle = '  const updateProduct = async (updated: Product): Promise<Product | null> => {';
const endNeedle = '\n\n  const deleteProduct = ';
const start = source.indexOf(startNeedle);
const end = source.indexOf(endNeedle, start + startNeedle.length);
if (start < 0 || end < 0) throw new Error('v30.10.3 canonical product save target missing');

const replacement = `  // data-v30103-product-save: authoritative save plus legacy discount cleanup\n  const updateProduct = async (updated: Product): Promise<Product | null> => {\n    const basePrice = Math.max(0, Number(updated.price || 0));\n    const legacyDiscountPrice = Math.max(0, Number(updated.discountPrice ?? 0));\n    const hadLegacyDiscount = !updated.discountMode && legacyDiscountPrice > 0 && legacyDiscountPrice < basePrice;\n    const discountMode: NonNullable<Product['discountMode']> = updated.discountMode || (hadLegacyDiscount ? 'fixed' : 'none');\n    const discountValue = discountMode === 'none'\n      ? 0\n      : hadLegacyDiscount\n        ? Math.max(0, basePrice - legacyDiscountPrice)\n        : Math.max(0, Number(updated.discountValue || 0));\n\n    const normalized: Product = {\n      ...updated,\n      price: basePrice,\n      stock: Math.max(0, Math.round(Number(updated.stock || 0))),\n      discountMode,\n      discountValue,\n      discountPrice: 0\n    };\n\n    try {\n      const { product: saved } = await apiRequest<{ product: Product }>(\`/api/catalog/products/\${encodeURIComponent(updated.id)}\`, {\n        method: 'PUT',\n        body: JSON.stringify(normalized)\n      });\n      setProducts(prev => {\n        const exists = prev.some(item => item.id === saved.id);\n        return exists ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved];\n      });\n      try {\n        await syncSeoDraft('product', saved.id, saved.seo);\n      } catch (seoError) {\n        console.error('Product SEO sync failed:', seoError);\n      }\n      showToast(\`محصول «\${saved.nameFa}» با موفقیت ذخیره شد.\`);\n      return saved;\n    } catch (error) {\n      console.error(error);\n      showToast('ذخیره تغییرات محصول روی سرور انجام نشد.', 'error');\n      return null;\n    }\n  };`;

const next = source.slice(0, start) + replacement + source.slice(end);
if (next !== source) fs.writeFileSync(file, next);
console.log('v30.10.3 canonical product save repair applied.');
