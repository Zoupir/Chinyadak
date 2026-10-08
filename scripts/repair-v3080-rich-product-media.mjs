import fs from 'node:fs';

const changed=[];
const edit=(path,fn)=>{const before=fs.readFileSync(path,'utf8');const after=fn(before);if(after!==before){fs.writeFileSync(path,after);changed.push(path);}};

edit('src/components/product/ProductDetailView.tsx',source=>{
 source=source.replace(`<p className="leading-relaxed">\n              {product.warrantyDescription} ({product.warrantyMonths} ماه ضمانت رسمی شرکتی)\n            </p>`,`<div className="leading-relaxed"><RichTextContent content={product.warrantyDescription || ''} />{Number(product.warrantyMonths || 0) > 0 && <p className="mt-1 text-[10px] font-bold text-neutral-500">{product.warrantyMonths} ماه ضمانت رسمی شرکتی</p>}</div>`);
 source=source.replace('<p className="text-neutral-700">{product.genuineVsFakeNotes}</p>','<div className="text-neutral-700"><RichTextContent content={product.genuineVsFakeNotes || \'\'} /></div>');
 return source;
});

edit('src/components/admin/AdminMediaLibrary.tsx',source=>{
 source=source.replace('<img src={selected.url} alt={seoForm.alt} className="max-w-full max-h-[78vh] object-contain" />',`{selected.mediaType === 'video' ? <video src={selected.url} controls preload="metadata" className="max-w-full max-h-[78vh]" /> : selected.mediaType === 'audio' ? <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-sm"><FileAudio className="mx-auto mb-5 h-16 w-16 text-blue-500" /><audio src={selected.url} controls preload="metadata" className="w-full" /></div> : <img src={selected.url} alt={seoForm.alt} className="max-w-full max-h-[78vh] object-contain" />}`);
 return source;
});

edit('src/components/common/MediaPickerModal.tsx',source=>{
 const before=`  const visible = useMemo(() => {\n    const q = query.trim().toLowerCase();\n    if (!q) return items;\n    return items.filter(item =>`;
 const after=`  const visible = useMemo(() => {\n    const imageItems = items.filter(item => !item.mediaType || item.mediaType === 'image');\n    const q = query.trim().toLowerCase();\n    if (!q) return imageItems;\n    return imageItems.filter(item =>`;
 if(source.includes(before)) source=source.replace(before,after);
 return source;
});

console.log('v30.8.0 rich product/media repair:',changed.length?changed.join(', '):'already satisfied');
