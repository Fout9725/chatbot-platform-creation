export const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Черновик', cls: 'bg-slate-100 text-slate-700' },
  ready: { label: 'Готов', cls: 'bg-emerald-100 text-emerald-700' },
  published: { label: 'Опубликован', cls: 'bg-indigo-100 text-indigo-700' },
  archived: { label: 'В архиве', cls: 'bg-amber-100 text-amber-700' },
};

export function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeLists(); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeLists(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  return out.join('\n');
}

export function downloadDoc(filename: string, mdContent: string) {
  const safeTitle = filename.replace(/[^\w\sа-яё-]/gi, '').slice(0, 60) || 'document';
  const bodyHtml = mdToHtml(mdContent);
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${safeTitle}</title>
<style>body{font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;}h1{font-size:20pt;}h2{font-size:16pt;}h3{font-size:13pt;}code{font-family:'Consolas',monospace;background:#f4f4f4;padding:1px 4px;}</style>
</head><body><h1>${safeTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h1>${bodyHtml}</body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDate(s: string) {
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
