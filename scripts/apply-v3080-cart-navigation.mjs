import fs from 'node:fs';

const changed=[];
const edit=(path,fn)=>{const before=fs.readFileSync(path,'utf8');const after=fn(before);if(after!==before){fs.writeFileSync(path,after);changed.push(path);}};
const write=(path,content)=>{const before=fs.existsSync(path)?fs.readFileSync(path,'utf8'):'';if(before!==content){fs.writeFileSync(path,content);changed.push(path);}};

write('src/components/common/StoreLink.tsx', `import React from 'react';
import { buildRoutePath } from '../../utils/navigation';

export interface StoreLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  view: string;
  param?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const StoreLink: React.FC<StoreLinkProps> = ({ view, param, onNavigate, onClick, children, ...props }) => {
  const href = buildRoutePath(view, param);
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || props.target) return;
    event.preventDefault();
    onNavigate(view, param);
  }}>{children}</a>;
};
`);

write('src/components/cart/CartView.tsx', `import React from 'react';
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatToman, getGradeInfo } from '../../utils/formatters';
import { getEffectiveProductPrice } from '../../utils/pricing';
import { StoreLink } from '../common/StoreLink';

export const CartView: React.FC<{ onNavigate:(view:string,param?:string)=>void }> = ({ onNavigate }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useStore();
  return <main className="max-w-7xl mx-auto px-4 py-8 md:py-12" dir="rtl" data-dedicated-cart-page="1">
    <div className="flex items-center justify-between gap-4 mb-6">
      <div><h1 className="text-xl md:text-2xl font-black text-neutral-950">سبد خرید</h1><p className="mt-1 text-xs text-neutral-500">{cartCount.toLocaleString('fa-IR')} قلم کالا در سبد شما</p></div>
      <StoreLink view="shop" onNavigate={onNavigate} className="text-xs font-bold text-blue-700 hover:underline">ادامه خرید</StoreLink>
    </div>
    {cart.length === 0 ? <section className="rounded-3xl border border-neutral-200 bg-white px-6 py-20 text-center shadow-sm">
      <span className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-neutral-100 text-neutral-400"><ShoppingBag className="h-9 w-9" /></span>
      <h2 className="font-black text-neutral-900">سبد خرید شما خالی است</h2>
      <p className="mt-2 text-xs text-neutral-500">قطعه موردنظر را از فروشگاه انتخاب و به سبد اضافه کنید.</p>
      <StoreLink view="shop" onNavigate={onNavigate} className="mt-6 inline-flex rounded-xl bg-neutral-950 px-6 py-3 text-xs font-black text-white">مشاهده فروشگاه</StoreLink>
    </section> : <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
      <section className="space-y-3">{cart.map(item => { const price=getEffectiveProductPrice(item.product); const grade=getGradeInfo(item.product.grade); return <article key={item.product.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex gap-4">
          <StoreLink view="product" param={item.product.slug || item.product.id} onNavigate={onNavigate} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-neutral-50"><img src={item.product.images[0]} alt={item.product.nameFa} className="h-full w-full object-contain" /></StoreLink>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 text-[10px]"><span className={\`rounded-md border px-2 py-0.5 font-bold \${grade.bgClass}\`}>{grade.shortLabel}</span><span className="font-mono text-neutral-400">OEM: {item.product.oemNumber}</span></div>
            <StoreLink view="product" param={item.product.slug || item.product.id} onNavigate={onNavigate} className="mt-2 block text-sm font-black leading-6 text-neutral-900 hover:text-red-600">{item.product.nameFa}</StoreLink>
            {item.selectedVehicle && <p className="mt-1 text-[11px] font-bold text-emerald-700">✓ مناسب {item.selectedVehicle.modelName}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="flex items-center overflow-hidden rounded-lg border"><button type="button" onClick={()=>updateQuantity(item.product.id,item.quantity-1)} className="grid h-8 w-8 place-items-center hover:bg-neutral-100"><Minus className="h-3.5 w-3.5" /></button><span className="w-10 text-center text-xs font-black">{item.quantity.toLocaleString('fa-IR')}</span><button type="button" onClick={()=>updateQuantity(item.product.id,item.quantity+1)} className="grid h-8 w-8 place-items-center hover:bg-neutral-100"><Plus className="h-3.5 w-3.5" /></button></div><div className="flex items-center gap-4"><strong className="text-sm text-red-600">{formatToman(price * item.quantity)}</strong><button type="button" onClick={()=>removeFromCart(item.product.id)} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600" title="حذف"><Trash2 className="h-4 w-4" /></button></div></div>
          </div>
        </div>
      </article>; })}</section>
      <aside className="sticky top-24 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-black">خلاصه سفارش</h2><div className="mt-4 space-y-3 text-xs"><div className="flex justify-between"><span>مجموع کالاها</span><strong>{formatToman(cartTotal)}</strong></div><div className="flex justify-between text-neutral-500"><span>ارسال و بسته‌بندی</span><span>در تسویه محاسبه می‌شود</span></div></div><div className="mt-4 border-t pt-4 flex justify-between font-black"><span>مبلغ فعلی</span><span className="text-red-600">{formatToman(cartTotal)}</span></div><StoreLink view="checkout" onNavigate={onNavigate} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white hover:bg-red-700">ادامه فرایند خرید <ArrowLeft className="h-4 w-4" /></StoreLink><div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-[10px] text-emerald-800"><ShieldCheck className="h-4 w-4 shrink-0" /> خرید امن و ضمانت اصالت کالا</div><div className="mt-2 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-[10px] text-blue-800"><Truck className="h-4 w-4 shrink-0" /> روش و هزینه ارسال در مرحله بعد انتخاب می‌شود</div></aside>
    </div>}
  </main>;
};
`);

edit('src/utils/navigation.ts',source=>{if(!source.includes("if (view === 'cart') return '/cart';"))source=source.replace("  if (view === 'checkout') return '/checkout';","  if (view === 'cart') return '/cart';\n  if (view === 'checkout') return '/checkout';");return source;});

edit('src/App.tsx',source=>{
 source=source.replace("import React, { useState, useEffect } from 'react';","import React, { useState, useEffect, useRef } from 'react';");
 source=source.replace("import { CartDrawer } from './components/cart/CartDrawer';","import { CartView } from './components/cart/CartView';");
 source=source.replace("  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);\n",'');
 if(!source.includes('const navigationIntentRef = useRef')) source=source.replace("  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);",`  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);\n  const navigationIntentRef = useRef<'same'|'tab'|'window'>('same');\n\n  useEffect(() => {\n    const capture=(event:MouseEvent)=>{ navigationIntentRef.current=event.ctrlKey||event.metaKey?'tab':event.shiftKey?'window':'same'; window.setTimeout(()=>{navigationIntentRef.current='same';},0); };\n    document.addEventListener('click',capture,true);\n    return ()=>document.removeEventListener('click',capture,true);\n  }, []);`);
 if(!source.includes("navigationIntentRef.current === 'tab'")) source=source.replace("    const targetPath = buildRoutePath(view, canonicalParam);",`    const targetPath = buildRoutePath(view, canonicalParam);\n    if (navigationIntentRef.current === 'tab') { window.open(targetPath, '_blank', 'noopener,noreferrer'); return; }\n    if (navigationIntentRef.current === 'window') { window.open(targetPath, '_blank', 'noopener,noreferrer'); return; }`);
 source=source.replace(/onOpenCartDrawer=\{\(\) => setIsCartDrawerOpen\(true\)\}/g,"onOpenCartDrawer={() => handleNavigate('cart')}");
 if(!source.includes("route.view === 'cart'")) source=source.replace("      {route.view === 'checkout' && (","      {route.view === 'cart' && <CartView onNavigate={handleNavigate} />}\n\n      {route.view === 'checkout' && (");
 source=source.replace(/\n\s*\{\/\* Cart Sliding Drawer \*\/\}\n\s*<CartDrawer[\s\S]*?\n\s*\/>\n/,'\n');
 return source;
});

edit('src/components/layout/Header.tsx',source=>{
 if(!source.includes("StoreLink")) source=source.replace("import { ShareButton } from '../common/ShareButton';","import { ShareButton } from '../common/ShareButton';\nimport { StoreLink } from '../common/StoreLink';");
 source=source.replace(`<button type="button" onClick={onOpenCartDrawer} className="marketplace-ref-cart" title="سبد خرید">\n                <ShoppingBag className="w-4 h-4" />\n                <span className="marketplace-ref-cart-label">سبد خرید</span>\n                <b>{cartCount}</b>\n              </button>`,`<StoreLink view="cart" onNavigate={onNavigate} className="marketplace-ref-cart" title="سبد خرید">\n                <ShoppingBag className="w-4 h-4" />\n                <span className="marketplace-ref-cart-label">سبد خرید</span>\n                <b>{cartCount}</b>\n              </StoreLink>`);
 source=source.replace(/<button\n(\s*)onClick=\{onOpenCartDrawer\}\n([\s\S]*?title="سبد خرید"[\s\S]*?)<\/button>/g,`<StoreLink\n$1view="cart" onNavigate={onNavigate}\n$2</StoreLink>`);
 return source;
});

console.log('v30.8.0 cart/navigation patch:',changed.length?changed.join(', '):'already applied');
