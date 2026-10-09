export const renderExtensionsAdminPage = (): string => `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>مدیریت افزونه‌ها و قالب‌ها | Yadak Store</title>
<style>
:root{font-family:Vazirmatn,Tahoma,Arial,sans-serif;color:#111827;background:#f4f6f8}
*{box-sizing:border-box}body{margin:0}.wrap{max-width:1180px;margin:0 auto;padding:24px}.top{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:22px}.title h1{margin:0;font-size:26px}.title p{margin:6px 0 0;color:#64748b}.back{color:#0f4c81;text-decoration:none;font-weight:700}.panel{background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 8px 30px rgba(15,23,42,.06);overflow:hidden}.toolbar{display:flex;flex-wrap:wrap;gap:10px;padding:16px;border-bottom:1px solid #e5e7eb;align-items:center}.tabs{display:flex;gap:8px}.tab{border:1px solid #dbe1e8;background:#fff;padding:9px 16px;border-radius:10px;cursor:pointer;font-weight:700}.tab.active{background:#0f4c81;color:#fff;border-color:#0f4c81}.grow{flex:1}.upload{display:flex;gap:8px;align-items:center}.upload select,.upload input{border:1px solid #d6dce3;border-radius:10px;padding:9px;background:#fff}.btn{border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;background:#0f4c81;color:white}.btn.secondary{background:#eef2f6;color:#0f172a}.btn.danger{background:#b91c1c}.btn.warn{background:#b45309}.btn:disabled{opacity:.5;cursor:not-allowed}.notice{margin:16px;padding:12px 14px;border-radius:12px;background:#eff6ff;color:#1e3a5f;display:none}.notice.error{background:#fef2f2;color:#991b1b}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:16px}.card{border:1px solid #e5e7eb;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px}.row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.name{font-weight:900;font-size:18px}.meta{font-size:13px;color:#64748b;line-height:1.8}.badge{font-size:12px;padding:5px 8px;border-radius:999px;background:#f1f5f9}.badge.on{background:#dcfce7;color:#166534}.badge.bad{background:#fee2e2;color:#991b1b}.actions{display:flex;flex-wrap:wrap;gap:8px}.empty{padding:48px;text-align:center;color:#64748b}.footer{padding:14px 16px;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px}.permissions{font-size:12px;color:#475569;background:#f8fafc;border-radius:10px;padding:9px}.hidden{display:none!important}
</style>
</head>
<body>
<div class="wrap">
  <div class="top"><div class="title"><h1>افزونه‌ها و قالب‌ها</h1><p>نصب ZIP، فعال‌سازی، بروزرسانی و Rollback بدون تغییر مستقیم Core</p></div><a class="back" href="/admin">بازگشت به مدیریت ←</a></div>
  <div class="panel">
    <div class="toolbar">
      <div class="tabs"><button class="tab active" data-tab="plugin">افزونه‌ها</button><button class="tab" data-tab="theme">قالب‌ها</button></div>
      <div class="grow"></div>
      <form class="upload" id="uploadForm"><select id="kind"><option value="plugin">افزونه</option><option value="theme">قالب</option></select><input id="zip" type="file" accept=".zip,application/zip" required><button class="btn" type="submit">نصب ZIP</button></form>
    </div>
    <div id="notice" class="notice"></div>
    <div id="grid" class="grid"></div>
    <div class="footer">فقط بسته‌های مورد اعتماد را نصب کنید. فایل‌های ZIP قبل از نصب از نظر مسیر، حجم، تعداد فایل و manifest بررسی می‌شوند.</div>
  </div>
</div>
<script type="module">
let currentTab='plugin';
let data={plugins:[],themes:[],activeThemeId:null};
const grid=document.getElementById('grid');
const notice=document.getElementById('notice');
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const flash=(text,error=false)=>{notice.textContent=text;notice.className='notice'+(error?' error':'');notice.style.display='block';setTimeout(()=>notice.style.display='none',7000)};
const api=async(url,options={})=>{const res=await fetch(url,{credentials:'same-origin',...options});let body={};try{body=await res.json()}catch{}if(!res.ok)throw new Error(body.detail||body.error||('HTTP '+res.status));return body};
const render=()=>{
 const items=currentTab==='plugin'?data.plugins:data.themes;
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));
 document.getElementById('kind').value=currentTab;
 if(!items.length){grid.innerHTML='<div class="empty">هنوز '+(currentTab==='plugin'?'افزونه':'قالب')+'ی نصب نشده است.</div>';return}
 grid.innerHTML=items.map(item=>{
  const m=item.manifest,s=item.state,isActive=currentTab==='theme'?data.activeThemeId===m.id:s.enabled;
  const permissions=(m.permissions||[]).map(esc).join('، ');
  return '<article class="card">'+
   '<div class="row"><div><div class="name">'+esc(m.name)+'</div><div class="meta">'+esc(m.id)+' · v'+esc(m.version)+(m.author?' · '+esc(m.author):'')+'</div></div><span class="badge '+(isActive?'on':'')+'">'+(isActive?'فعال':'غیرفعال')+'</span></div>'+
   (m.description?'<div>'+esc(m.description)+'</div>':'')+
   '<div class="meta">سازگاری: '+(item.compatible?'✓ سازگار':'✕ '+esc(item.compatibilityMessage||'ناسازگار'))+'</div>'+
   (permissions?'<div class="permissions">مجوزهای اعلام‌شده: '+permissions+'</div>':'')+
   '<div class="actions">'+
   (isActive?'<button class="btn secondary" data-action="deactivate" data-kind="'+currentTab+'" data-id="'+esc(m.id)+'">غیرفعال</button>':'<button class="btn" '+(!item.compatible?'disabled':'')+' data-action="activate" data-kind="'+currentTab+'" data-id="'+esc(m.id)+'">فعال‌سازی</button>')+
   (item.rollbackAvailable?'<button class="btn warn" data-action="rollback" data-kind="'+currentTab+'" data-id="'+esc(m.id)+'">Rollback</button>':'')+
   '<button class="btn danger" data-action="delete" data-kind="'+currentTab+'" data-id="'+esc(m.id)+'">حذف</button></div></article>'
 }).join('');
};
const load=async()=>{try{data=await api('/api/extensions');render()}catch(e){flash('خواندن افزونه‌ها انجام نشد: '+e.message,true)}};
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{currentTab=btn.dataset.tab;render()}));
document.getElementById('uploadForm').addEventListener('submit',async e=>{e.preventDefault();const file=document.getElementById('zip').files[0];if(!file)return;const fd=new FormData();fd.append('kind',document.getElementById('kind').value);fd.append('file',file);try{await api('/api/extensions/install',{method:'POST',body:fd});flash('بسته با موفقیت نصب شد.');document.getElementById('zip').value='';await load()}catch(err){flash('نصب انجام نشد: '+err.message,true)}});
grid.addEventListener('click',async e=>{const btn=e.target.closest('[data-action]');if(!btn)return;const {action,kind,id}=btn.dataset;if(action==='delete'&&!confirm('این بسته حذف شود؟ یک نسخه برای Rollback نگه داشته می‌شود.'))return;if(action==='rollback'&&!confirm('نسخه قبلی این بسته بازیابی شود؟'))return;try{const method=action==='delete'?'DELETE':'POST';const url=action==='delete'?'/api/extensions/'+kind+'/'+id:'/api/extensions/'+kind+'/'+id+'/'+action;await api(url,{method});flash('عملیات انجام شد.');await load()}catch(err){flash('عملیات انجام نشد: '+err.message,true)}});
load();
</script>
</body>
</html>`;
