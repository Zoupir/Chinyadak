import fs from 'node:fs';

const file = 'scripts/apply-v30108-editor-hotfix.mjs';
let source = fs.readFileSync(file, 'utf8');
const before = source;

const oldBlock = `  source = source.replace(
    "    const decoration = style.match(/(?:^|;)\\\\s*text-decoration(?:-line)?\\\\s*:\\\\s*(none|underline|line-through|underline\\\\s+line-through|line-through\\\\s+underline)\\\\s*(?:;|$)/i);",
    "    const decoration = style.match(/(?:^|;)\\\\s*text-decoration(?:-line)?\\\\s*:\\\\s*(none|underline|line-through|underline\\\\s+line-through|line-through\\\\s+underline)\\\\s*(?:;|$)/i);\\n    const fontFamily = style.match(/(?:^|;)\\\\s*font-family\\\\s*:\\\\s*([^;]+)/i);\\n    const lineHeight = style.match(/(?:^|;)\\\\s*line-height\\\\s*:\\\\s*([^;]+)/i);"
  );`;

const newBlock = `  if (!source.includes('const fontFamily = style.match(')) {
    source = source.replace(
      "    const decoration = style.match(/(?:^|;)\\\\s*text-decoration(?:-line)?\\\\s*:\\\\s*(none|underline|line-through|underline\\\\s+line-through|line-through\\\\s+underline)\\\\s*(?:;|$)/i);",
      "    const decoration = style.match(/(?:^|;)\\\\s*text-decoration(?:-line)?\\\\s*:\\\\s*(none|underline|line-through|underline\\\\s+line-through|line-through\\\\s+underline)\\\\s*(?:;|$)/i);\\n    const fontFamily = style.match(/(?:^|;)\\\\s*font-family\\\\s*:\\\\s*([^;]+)/i);\\n    const lineHeight = style.match(/(?:^|;)\\\\s*line-height\\\\s*:\\\\s*([^;]+)/i);"
    );
  }`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("if (!source.includes('const fontFamily = style.match('))")) {
  throw new Error('v30.10.8 sanitizer declaration transform target not found.');
}

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log('v30.10.8 sanitizer transform made idempotent.');
} else {
  console.log('v30.10.8 sanitizer transform already idempotent.');
}
