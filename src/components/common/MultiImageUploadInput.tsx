import React, { useState } from 'react';
import {
  FolderOpen,
  Image as ImageIcon,
  Star,
  Trash2
} from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';

interface MultiImageUploadInputProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
  helperText?: string;
  maxImages?: number;
}

export const MultiImageUploadInput: React.FC<MultiImageUploadInputProps> = ({
  label = 'تصاویر کالا (گالری عکس‌ها):',
  images = [],
  onChange,
  helperText = 'تصویر اول به عنوان عکس شاخص محصول در سایت نمایش داده می‌شود.',
  maxImages = 8
}) => {
  const [isMediaOpen,setIsMediaOpen]=useState(false);
  const [activeImageUrl,setActiveImageUrl]=useState('');
  const openMediaPicker=(url='')=>{setActiveImageUrl(url);setIsMediaOpen(true);};

  const addImage=(url:string)=>{
    const clean=url.trim();
    if(!clean)return;
    if(images.includes(clean))return;
    if(images.length>=maxImages){
      window.alert(`حداکثر می‌توانید ${maxImages} تصویر اضافه کنید.`);
      return;
    }
    onChange([...images,clean]);
  };

  const remove=(index:number)=>onChange(images.filter((_,i)=>i!==index));
  const primary=(index:number)=>{
    if(index===0)return;
    const target=images[index];
    onChange([target,...images.filter((_,i)=>i!==index)]);
  };

  return (
    <div className="space-y-3 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-neutral-700 font-bold text-xs">{label}</label>
          {helperText&&<p className="text-[9px] text-neutral-400 mt-1">{helperText}</p>}
        </div>
        <button
          type="button"
          onClick={()=>openMediaPicker()}
          className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-[10px] font-black inline-flex items-center justify-center gap-1.5"
        >
          <FolderOpen className="w-4 h-4"/>
          انتخاب / آپلود از کتابخانه رسانه
        </button>
      </div>

      {images.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url,index)=>(
            <article key={`${url}-${index}`} className={`relative rounded-2xl border p-1 bg-neutral-50 overflow-hidden ${index===0?'border-blue-500 ring-2 ring-blue-100':'border-neutral-200'}`}>
              <div className="aspect-square rounded-xl overflow-hidden bg-white grid place-items-center relative">
                <button type="button" onClick={()=>openMediaPicker(url)} aria-label="ویرایش اطلاعات این تصویر در کتابخانه رسانه" title="ویرایش اطلاعات تصویر" className="absolute inset-0 w-full h-full cursor-pointer"><img src={url} alt="" className="w-full h-full object-contain"/></button>
                {index===0?(
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-1 rounded-lg bg-blue-600 text-white text-[8px] font-black inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current"/> شاخص
                  </span>
                ):(
                  <button type="button" onClick={()=>primary(index)} className="absolute top-1.5 right-1.5 px-1.5 py-1 rounded-lg bg-neutral-900/85 text-white text-[8px] font-bold opacity-0 group-hover:opacity-100">
                    شاخص کردن
                  </button>
                )}
                <button type="button" onClick={()=>remove(index)} className="absolute top-1.5 left-1.5 w-7 h-7 rounded-lg bg-red-600 text-white grid place-items-center">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
              <span className="block mt-1 px-1 text-[8px] text-neutral-400 truncate" dir="ltr">{url}</span>
            </article>
          ))}
          {images.length<maxImages&&(
            <button type="button" onClick={()=>openMediaPicker()} className="aspect-square rounded-2xl border-2 border-dashed border-neutral-300 hover:border-blue-500 bg-neutral-50 grid place-items-center text-neutral-400">
              <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto mb-2"/><span className="text-[9px] font-bold">افزودن رسانه</span></div>
            </button>
          )}
        </div>
      ):(
        <button type="button" onClick={()=>openMediaPicker()} className="w-full min-h-40 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-blue-500 bg-neutral-50 grid place-items-center text-neutral-500">
          <div className="text-center"><ImageIcon className="w-8 h-8 mx-auto mb-2 text-blue-600"/><strong className="text-xs">کتابخانه رسانه را باز کن</strong><span className="block text-[9px] text-neutral-400 mt-1">از تصاویر قبلی استفاده کن یا تصویر جدید آپلود کن.</span></div>
        </button>
      )}

      <MediaPickerModal
        isOpen={isMediaOpen}
        onClose={()=>setIsMediaOpen(false)}
        onSelect={(url)=>addImage(url)}
        category="parts"
        initialUrl={activeImageUrl}
        title="انتخاب تصویر برای گالری محصول"
      />
    </div>
  );
};
