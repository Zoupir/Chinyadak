import fs from 'node:fs';

const path = 'src/components/common/RichTextComposer.tsx';
let source = fs.readFileSync(path, 'utf8');
const before = source;

if (!source.includes('const uploadDirectMedia = async')) {
  throw new Error('v30.7.1 requires the v30.6 rich-media upload handler before UI repair.');
}

if (!source.includes('data-rich-direct-upload="1"')) {
  const block = /        \{urlMediaType && \(\n          <form className="rich-text-media-form"[\s\S]*?\n          <\/form>\n        \)\}/;
  if (!block.test(source)) throw new Error('v30.7.1 could not find the rich-media dialog block.');

  source = source.replace(block, `        {urlMediaType && (\n          <form className="rich-text-media-form" onSubmit={insertUrlMedia} data-rich-direct-upload="1">\n            <div className="grid gap-3">\n              <div>\n                <strong className="block text-xs mb-1">{urlMediaType === 'video' ? 'ویدئو' : 'فایل صوتی'}</strong>\n                <p className="text-[10px] text-neutral-500">می‌توانید فایل را مستقیم از کامپیوتر آپلود کنید یا لینک مستقیم / لینک سرویس‌های پشتیبانی‌شده را وارد کنید.</p>\n              </div>\n\n              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700">\n                <UploadCloud aria-hidden="true" className="h-4 w-4" />\n                <span>{uploadingMedia ? 'در حال آپلود…' : urlMediaType === 'video' ? 'آپلود ویدئو از دستگاه' : 'آپلود فایل صوتی از دستگاه'}</span>\n                <input\n                  type="file"\n                  className="sr-only"\n                  accept={urlMediaType === 'video' ? 'video/mp4,video/webm,video/ogg,video/quicktime' : 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac'}\n                  disabled={uploadingMedia}\n                  onChange={event => {\n                    const file = event.currentTarget.files?.[0];\n                    void uploadDirectMedia(file);\n                    event.currentTarget.value = '';\n                  }}\n                />\n              </label>\n\n              <div className="flex items-center gap-2 text-[10px] text-neutral-400"><span className="h-px flex-1 bg-neutral-200"/><span>یا درج از لینک</span><span className="h-px flex-1 bg-neutral-200"/></div>\n\n              <label htmlFor="rich-text-media-url" className="text-xs font-bold">{urlMediaType === 'video' ? 'لینک ویدئو، YouTube، Aparat، Vimeo یا Dailymotion' : 'لینک فایل صوتی، SoundCloud یا Spotify'}</label>\n              <input\n                id="rich-text-media-url"\n                ref={mediaInputRef}\n                type="text"\n                inputMode="url"\n                value={mediaUrl}\n                placeholder={urlMediaType === 'video' ? 'https://www.aparat.com/v/... یا https://youtu.be/...' : 'https://soundcloud.com/... یا https://example.com/audio.mp3'}\n                onChange={event => setMediaUrl(event.currentTarget.value)}\n              />\n\n              <div className="flex flex-wrap gap-2">\n                <button type="submit" disabled={uploadingMedia}>درج از لینک</button>\n                <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => setUrlMediaType(null)}>انصراف</button>\n              </div>\n\n              <span className="rich-text-media-form__hint">ویدئو: MP4 / WebM / OGV / MOV — صدا: MP3 / WAV / OGG / M4A / AAC</span>\n              {mediaError && <span className="rich-text-media-form__error" role="alert">{mediaError}</span>}\n            </div>\n          </form>\n        )}`);
}

if (!source.includes('data-rich-direct-upload="1"')) {
  throw new Error('v30.7.1 rich-media upload UI marker missing after repair.');
}

if (source !== before) fs.writeFileSync(path, source);
console.log(source === before ? 'v30.7.1 rich-media upload UI already satisfied.' : 'v30.7.1 rich-media upload UI repair applied.');
