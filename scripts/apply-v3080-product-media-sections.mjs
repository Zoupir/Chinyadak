import fs from 'node:fs';

const changed=[];
const edit=(path,fn)=>{const before=fs.readFileSync(path,'utf8');const after=fn(before);if(after!==before){fs.writeFileSync(path,after);changed.push(path);}};
const write=(path,content)=>{const before=fs.existsSync(path)?fs.readFileSync(path,'utf8'):'';if(before!==content){fs.writeFileSync(path,content);changed.push(path);}};

write('src/components/admin/AdminProductContentFields.tsx', `import React from 'react';
import type { Product } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';

const lines=(value:string[])=>value.join('\\n');
const list=(value:string)=>value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean);
export const AdminProductContentFields: React.FC<{ value:Partial<Product>; onChange:(next:Partial<Product>)=>void }> = ({value,onChange}) => {
  const patch=(next:Partial<Product>)=>onChange({...value,...next});
  return <section className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 space-y-4" data-product-service-content-editor="1">
    <div><h4 className="text-xs font-black">محتوای خدمات، خرابی و اصالت محصول</h4><p className="mt-1 text-[10px] text-neutral-500">این اطلاعات در تب‌های صفحه محصول و بخش گارانتی نمایش داده می‌شوند.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="text-[10px] font-bold">مدت گارانتی (ماه)<input type="number" min={0} value={Number(value.warrantyMonths || 0)} onChange={e=>patch({warrantyMonths:Math.max(0,Number(e.target.value))})} className="mt-1 w-full rounded-xl border bg-white p-2.5" /></label>
      <label className="text-[10px] font-bold">دوره تعویض<input value={value.replacementInterval || ''} onChange={e=>patch({replacementInterval:e.target.value})} className="mt-1 w-full rounded-xl border bg-white p-2.5" placeholder="مثلاً هر ۶۰٬۰۰۰ کیلومتر یا ۴ سال" /></label>
    </div>
    <RichTextEditor label="گارانتی و خدمات پس از فروش" value={value.warrantyDescription || ''} onChange={v=>patch({warrantyDescription:v})} rows={4} placeholder="شرایط گارانتی، خدمات پس از فروش و موارد ابطال ضمانت..." />
    <label className="block text-[10px] font-bold">علائم خرابی — هر مورد در یک خط<textarea rows={5} value={lines(value.symptomsOfFailure || [])} onChange={e=>patch({symptomsOfFailure:list(e.target.value)})} className="mt-1 w-full rounded-xl border bg-white p-2.5 leading-6" /></label>
    <label className="block text-[10px] font-bold">نکات مهم نصب — هر مورد در یک خط<textarea rows={5} value={lines(value.installationTips || [])} onChange={e=>patch({installationTips:list(e.target.value)})} className="mt-1 w-full rounded-xl border bg-white p-2.5 leading-6" /></label>
    <RichTextEditor label="تشخیص نمونه اصلی از تقلبی" value={value.genuineVsFakeNotes || ''} onChange={v=>patch({genuineVsFakeNotes:v})} rows={5} placeholder="نشانه‌های ظاهری، بسته‌بندی، حک لیزر، کد رهگیری و..." />
  </section>;
};
`);

write('src/components/product/ProductDiscountCountdown.tsx', `import React, { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../types';
import { getProductDiscountInfo } from '../../utils/pricing';

const fa=(value:number)=>String(value).padStart(2,'0').replace(/\\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
export const ProductDiscountCountdown: React.FC<{ product:Product }> = ({ product }) => {
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(id);},[]);
  const discount=useMemo(()=>getProductDiscountInfo(product,now),[product,now]);
  const end=discount.endsAt?Date.parse(discount.endsAt):NaN;
  if(!discount.active||!discount.timed||!Number.isFinite(end)||end<=now)return null;
  let sec=Math.max(0,Math.floor((end-now)/1000));const days=Math.floor(sec/86400);sec%=86400;const hours=Math.floor(sec/3600);sec%=3600;const minutes=Math.floor(sec/60);sec%=60;
  const parts=[[days,'روز'],[hours,'ساعت'],[minutes,'دقیقه'],[sec,'ثانیه']] as const;
  return <div className="rounded-2xl border border-red-200 bg-gradient-to-l from-red-50 via-orange-50 to-amber-50 p-4" data-product-discount-countdown="1"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-xs text-red-700">پایان تخفیف ویژه</strong><p className="mt-1 text-[10px] text-neutral-500">قیمت تخفیفی تا پایان این زمان فعال است.</p></div><div className="flex gap-1.5" dir="ltr">{parts.map(([value,label])=><div key={label} className="min-w-[52px] rounded-xl bg-white px-2 py-2 text-center shadow-sm ring-1 ring-black/5"><b className="block font-mono text-base text-neutral-950">{fa(value)}</b><span className="text-[8px] text-neutral-500">{label}</span></div>)}</div></div></div>;
};
`);

edit('src/components/admin/AdminView.tsx',source=>{
 if(!source.includes("AdminProductContentFields")) source=source.replace("import { AdminProductPromotionFields } from './AdminProductPromotionFields';","import { AdminProductPromotionFields } from './AdminProductPromotionFields';\nimport { AdminProductContentFields } from './AdminProductContentFields';");
 if(!source.includes('value={editingProduct} onChange={(next) => setEditingProduct(next as Product)}')) source=source.replace(/(<AdminProductPromotionFields\s+value=\{editingProduct\}[\s\S]*?\/>)/,`$1\n                      <AdminProductContentFields value={editingProduct} onChange={(next) => setEditingProduct(next as Product)} />`);
 if(!source.includes('value={newProductForm} onChange={(next) => setNewProductForm(next as Product)}')) source=source.replace(/(<AdminProductPromotionFields\s+value=\{newProductForm\}[\s\S]*?\/>)/,`$1\n                      <AdminProductContentFields value={newProductForm} onChange={(next) => setNewProductForm(next as Product)} />`);
 return source;
});

edit('src/components/product/ProductDetailView.tsx',source=>{
 if(!source.includes("ProductDiscountCountdown")) source=source.replace("import { apiRequest } from '../../api/client';","import { apiRequest } from '../../api/client';\nimport { ProductDiscountCountdown } from './ProductDiscountCountdown';");
 if(!source.includes('<ProductDiscountCountdown product={product} />')) source=source.replace('          </div>\n        </div>\n\n        {/* Right Col: Product Information & Purchase Box */}','          </div>\n          <ProductDiscountCountdown product={product} />\n        </div>\n\n        {/* Right Col: Product Information & Purchase Box */}');
 return source;
});

// Rich uploads live in top-level media-type folders, then year/month.
edit('src/server/routes/rich-media.ts',source=>{
 source=source.replace("  const rawCategory = String(req.body?.category || 'editor-media').toLowerCase();\n  const category = rawCategory.replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'editor-media';\n",'');
 source=source.replace("  const relativeDir = path.posix.join(category, kind, year, month);\n  const targetDir = path.join(uploadDirectory(), category, kind, year, month);","  const relativeDir = path.posix.join(kind, year, month);\n  const targetDir = path.join(uploadDirectory(), kind, year, month);");
 return source;
});

edit('src/server/routes/media.ts',source=>{
 if(!source.includes("mediaType: 'image' | 'audio' | 'video';")) source=source.replace('  extension: string;\n  category: string;',"  extension: string;\n  mediaType: 'image' | 'audio' | 'video';\n  category: string;");
 source=source.replace("      if (!entry.isFile() || !/\\.(?:jpe?g|png|webp|gif)$/i.test(entry.name)) continue;","      if (!entry.isFile() || !/\\.(?:jpe?g|png|webp|gif|mp3|wav|ogg|m4a|aac|mp4|webm|ogv|mov)$/i.test(entry.name)) continue;");
 if(!source.includes("const mediaType = /\\.(?:mp4|webm|ogv|mov)$/i")){
  source=source.replace('        const folder = parseMediaFolder(rel);\n        const displayName = decodeMultipartFilename(entry.name);',"        const folder = parseMediaFolder(rel);\n        const mediaType = /\\.(?:mp4|webm|ogv|mov)$/i.test(entry.name) ? 'video' : /\\.(?:mp3|wav|ogg|m4a|aac)$/i.test(entry.name) ? 'audio' : 'image';\n        const displayName = decodeMultipartFilename(entry.name);");
  source=source.replace('          extension: path.extname(displayName).slice(1).toLowerCase(),\n          category:','          extension: path.extname(displayName).slice(1).toLowerCase(),\n          mediaType,\n          category:');
 }
 source=source.replace("  if (!normalized || normalized.includes('..') || !/\\.(?:jpe?g|png|webp|gif)$/i.test(normalized)) return null;","  if (!normalized || normalized.includes('..') || !/\\.(?:jpe?g|png|webp|gif|mp3|wav|ogg|m4a|aac|mp4|webm|ogv|mov)$/i.test(normalized)) return null;");
 return source;
});

edit('src/api/media.ts',source=>{if(!source.includes("mediaType: 'image' | 'audio' | 'video';"))source=source.replace('  extension: string;\n  category: string;',"  extension: string;\n  mediaType: 'image' | 'audio' | 'video';\n  category: string;");return source;});

edit('src/components/admin/AdminMediaLibrary.tsx',source=>{
 if(!source.includes("from '../../api/richMedia'")) source=source.replace("} from '../../api/media';","} from '../../api/media';\nimport { uploadRichMedia } from '../../api/richMedia';");
 source=source.replace('  FileImage,\n  Folder,','  FileImage,\n  FileAudio,\n  FileVideo,\n  Folder,');
 source=source.replace('      for (const file of list) uploaded.push(await uploadImage(file, uploadCategory));',"      for (const file of list) { if (file.type.startsWith('video/')) uploaded.push(await uploadRichMedia(file,'video','video')); else if (file.type.startsWith('audio/')) uploaded.push(await uploadRichMedia(file,'audio','audio')); else uploaded.push(await uploadImage(file,uploadCategory)); }");
 source=source.replace('type="file" accept="image/*" multiple','type="file" accept="image/*,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,video/mp4,video/webm,video/ogg,video/quicktime" multiple');
 source=source.replace('            آپلود گروهی','            آپلود تصویر / صدا / ویدئو');
 source=source.replace('<div className="aspect-square bg-white overflow-hidden"><img src={item.url} alt={item.seo?.alt || item.filename} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" /></div>',`<div className="aspect-square bg-white overflow-hidden grid place-items-center">{item.mediaType === 'video' ? <video src={item.url} muted preload="metadata" className="w-full h-full object-cover" /> : item.mediaType === 'audio' ? <FileAudio className="w-12 h-12 text-blue-500" /> : <img src={item.url} alt={item.seo?.alt || item.filename} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />}</div>`);
 source=source.replace('<input aria-label={`انتخاب ${item.filename}`} type="checkbox" checked={checkedPaths.includes(item.relativePath)} onChange={() => toggleMedia(item.relativePath)}/><img src={item.url} alt={item.seo?.alt || \'\'} className="w-12 h-12 object-cover rounded-lg border" />',`<input aria-label={\`انتخاب \${item.filename}\`} type="checkbox" checked={checkedPaths.includes(item.relativePath)} onChange={() => toggleMedia(item.relativePath)}/>{item.mediaType === 'video' ? <span className="w-12 h-12 grid place-items-center rounded-lg border bg-neutral-50"><FileVideo className="w-5 h-5" /></span> : item.mediaType === 'audio' ? <span className="w-12 h-12 grid place-items-center rounded-lg border bg-neutral-50"><FileAudio className="w-5 h-5" /></span> : <img src={item.url} alt={item.seo?.alt || ''} className="w-12 h-12 object-cover rounded-lg border" />}`);
 return source;
});

// Atomic section persistence against fresh DB state prevents preview/save races.
edit('src/server/routes/cms.ts',source=>{
 if(!source.includes("cmsRouter.put('/pages/:id/sections/:sectionId'")){
  const marker="cmsRouter.put('/pages/:id', requireAdminPermission('canManageSettings'), async (req, res) => {";
  const endpoint=`cmsRouter.put('/pages/:id/sections/:sectionId', requireAdminPermission('canManageSettings'), async (req, res) => {\n  const pageId=String(req.params.id||''); const sectionId=String(req.params.sectionId||''); const section={...(req.body?.section||req.body||{}),id:sectionId};\n  if(!pageId||!sectionId||!String(section.title||'').trim()){res.status(400).json({error:'SECTION_DATA_INVALID'});return;}\n  const [rows]=await pool.query<JsonRow[]>('SELECT id, data_json FROM site_pages WHERE id = ? LIMIT 1',[pageId]);\n  if(!rows[0]){res.status(404).json({error:'PAGE_NOT_FOUND'});return;}\n  const page={...parseJson<any>(rows[0].data_json,{}),id:rows[0].id}; const sections=Array.isArray(page.sections)?page.sections:[]; const index=sections.findIndex((item:any)=>String(item.id)===sectionId);\n  if(index<0){res.status(404).json({error:'SECTION_NOT_FOUND'});return;}\n  const saved={...page,sections:sections.map((item:any,i:number)=>i===index?section:item),updatedAt:new Date().toLocaleDateString('fa-IR')};\n  await pool.execute('UPDATE site_pages SET data_json = ?, updated_at = NOW() WHERE id = ?',[asJson(saved),pageId]);\n  res.json({page:saved,section});\n});\n\n`;
  if(!source.includes(marker)) throw new Error('v30.8 cms page route marker missing');
  source=source.replace(marker,endpoint+marker);
 }
 return source;
});

edit('src/context/StoreContext.tsx',source=>{
 if(source.includes('/sections/${encodeURIComponent(updatedSection.id)}')) return source;
 const pattern=/  const updateSection = async \(pageSlug: string, updatedSection: PageSection\): Promise<boolean> => \{[\s\S]*?\n  \};\n\n  const previewSection/;
 const replacement=`  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {\n    const page=pages.find(item=>item.slug===pageSlug); if(!page){showToast('برگه برای ذخیره پیدا نشد.','error');return false;}\n    try { const {page:saved}=await apiRequest<{page:SitePage}>(\`/api/cms/pages/\${encodeURIComponent(page.id)}/sections/\${encodeURIComponent(updatedSection.id)}\`,{method:'PUT',body:JSON.stringify({section:updatedSection})}); setPages(prev=>prev.map(item=>item.id===saved.id||item.slug===saved.slug?saved:item)); showToast(\`بخش "\${updatedSection.title}" با موفقیت ذخیره شد.\`,'success'); return true; }\n    catch(error){console.error(error);showToast('ذخیره سکشن انجام نشد. دوباره تلاش کنید.','error');return false;}\n  };\n\n  const previewSection`;
 const next=source.replace(pattern,replacement); if(next===source) throw new Error('v30.8 updateSection marker missing'); return next;
});

console.log('v30.8.0 product/media/sections patch:',changed.length?changed.join(', '):'already applied');
