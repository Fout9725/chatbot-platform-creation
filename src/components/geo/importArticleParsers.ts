export const ACCEPTED = '.txt,.md,.markdown,.html,.htm,.doc,.docx,.pdf,text/plain,text/markdown,text/html,application/pdf';
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function extractPdfText(file: File): Promise<string> {
  // Динамический импорт чтобы не утяжелять основной бандл
  const pdfjs = await import('pdfjs-dist');
  // Локально подключаем worker как ESM-модуль (CDN не требуется)
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = (pdfjsWorker as { default: string }).default;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: unknown) => (it as { str?: string }).str || '')
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (pageText) parts.push(pageText);
  }
  // Пытаемся восстановить абзацы: если в строке есть точка/перевод — отделяем
  return parts
    .join('\n\n')
    .replace(/([.!?])\s+(?=[А-ЯA-Z])/g, '$1\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function htmlToMarkdown(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.querySelectorAll('script,style,nav,header,footer,noscript').forEach((n) => n.remove());

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\s+/g, ' ');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(walk).join('');
    switch (tag) {
      case 'h1': return `\n\n# ${inner.trim()}\n\n`;
      case 'h2': return `\n\n## ${inner.trim()}\n\n`;
      case 'h3': return `\n\n### ${inner.trim()}\n\n`;
      case 'h4': return `\n\n#### ${inner.trim()}\n\n`;
      case 'h5':
      case 'h6': return `\n\n##### ${inner.trim()}\n\n`;
      case 'p':
      case 'div':
      case 'section':
      case 'article': return `\n\n${inner.trim()}\n\n`;
      case 'br': return '\n';
      case 'strong':
      case 'b': return `**${inner}**`;
      case 'em':
      case 'i': return `*${inner}*`;
      case 'code': return `\`${inner}\``;
      case 'pre': return `\n\n\`\`\`\n${inner}\n\`\`\`\n\n`;
      case 'a': {
        const href = el.getAttribute('href') || '';
        return href ? `[${inner}](${href})` : inner;
      }
      case 'li': return `- ${inner.trim()}\n`;
      case 'ul':
      case 'ol': return `\n${inner}\n`;
      case 'blockquote': return `\n> ${inner.trim()}\n`;
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        return src ? `![${alt}](${src})` : '';
      }
      default: return inner;
    }
  };

  return walk(tmp).replace(/\n{3,}/g, '\n\n').trim();
}

export async function readFileAsMarkdown(file: File): Promise<{ title: string; content: string }> {
  const name = file.name;
  const baseTitle = name.replace(/\.(txt|md|markdown|html?|docx?|pdf)$/i, '').replace(/[-_]+/g, ' ').trim();
  const ext = (name.split('.').pop() || '').toLowerCase();

  if (ext === 'md' || ext === 'markdown' || ext === 'txt' || file.type === 'text/markdown' || file.type === 'text/plain') {
    const txt = await file.text();
    const firstHeading = txt.match(/^#\s+(.+)$/m);
    return { title: firstHeading ? firstHeading[1].trim() : baseTitle, content: txt };
  }

  if (ext === 'html' || ext === 'htm' || file.type === 'text/html') {
    const txt = await file.text();
    const titleMatch = txt.match(/<title[^>]*>([^<]*)<\/title>/i);
    return { title: (titleMatch?.[1] || baseTitle).trim(), content: htmlToMarkdown(txt) };
  }

  if (ext === 'pdf' || file.type === 'application/pdf') {
    try {
      const text = await extractPdfText(file);
      if (!text || text.length < 30) {
        throw new Error('PDF не содержит распознаваемого текста (возможно, это отсканированный документ — нужен OCR).');
      }
      return { title: baseTitle, content: text };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Не удалось извлечь текст из PDF. ${msg}`);
    }
  }

  if (ext === 'docx') {
    try {
      const buf = await file.arrayBuffer();
      const text = await extractDocxText(buf);
      return { title: baseTitle, content: text };
    } catch (e) {
      throw new Error('Не удалось распарсить .docx. Попробуйте сохранить как .txt или .md');
    }
  }

  if (ext === 'doc') {
    const txt = await file.text().catch(() => '');
    const cleaned = txt.replace(/[^\x20-\x7Eа-яёА-ЯЁ\n\r\t.,!?:;()«»\-—–"'/]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (cleaned.length < 50) {
      throw new Error('Старый .doc плохо парсится в браузере. Сохраните файл как .docx, .md или .txt');
    }
    return { title: baseTitle, content: cleaned };
  }

  // fallback
  const txt = await file.text();
  return { title: baseTitle, content: txt };
}

export async function extractDocxText(buf: ArrayBuffer): Promise<string> {
  // .docx — это ZIP. Достанем word/document.xml без внешних зависимостей
  const bytes = new Uint8Array(buf);
  const decoder = new TextDecoder('utf-8');
  const view = new DataView(buf);

  // Поиск central directory: проще пробежаться по локальным заголовкам PK\x03\x04
  const SIG = [0x50, 0x4b, 0x03, 0x04];
  let xmlText = '';
  for (let i = 0; i < bytes.length - 30; i++) {
    if (bytes[i] === SIG[0] && bytes[i + 1] === SIG[1] && bytes[i + 2] === SIG[2] && bytes[i + 3] === SIG[3]) {
      const compressionMethod = view.getUint16(i + 8, true);
      const compressedSize = view.getUint32(i + 18, true);
      const fileNameLen = view.getUint16(i + 26, true);
      const extraLen = view.getUint16(i + 28, true);
      const nameStart = i + 30;
      const name = decoder.decode(bytes.subarray(nameStart, nameStart + fileNameLen));
      const dataStart = nameStart + fileNameLen + extraLen;
      if (name === 'word/document.xml') {
        const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
        if (compressionMethod === 0) {
          xmlText = decoder.decode(compressed);
        } else if (compressionMethod === 8) {
          const ds = new DecompressionStream('deflate-raw');
          const stream = new Blob([compressed]).stream().pipeThrough(ds);
          const arr = await new Response(stream).arrayBuffer();
          xmlText = decoder.decode(arr);
        }
        break;
      }
    }
  }

  if (!xmlText) throw new Error('document.xml not found in docx');

  // Преобразуем XML в markdown
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const paras = Array.from(xml.getElementsByTagName('w:p'));
  const lines: string[] = [];
  for (const p of paras) {
    const styleEl = p.getElementsByTagName('w:pStyle')[0];
    const style = styleEl?.getAttribute('w:val') || '';
    const runs = Array.from(p.getElementsByTagName('w:t'));
    const text = runs.map((r) => r.textContent || '').join('').trim();
    if (!text) {
      lines.push('');
      continue;
    }
    if (/^Heading1$/i.test(style)) lines.push(`# ${text}`);
    else if (/^Heading2$/i.test(style)) lines.push(`## ${text}`);
    else if (/^Heading3$/i.test(style)) lines.push(`### ${text}`);
    else if (/^Heading[4-6]$/i.test(style)) lines.push(`#### ${text}`);
    else if (/ListParagraph/i.test(style)) lines.push(`- ${text}`);
    else lines.push(text);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
