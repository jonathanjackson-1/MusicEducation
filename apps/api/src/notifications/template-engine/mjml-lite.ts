const ATTR_REGEX = /([a-zA-Z-]+)="([^"]*)"/g;

function parseAttributes(raw: string) {
  const attributes: Record<string, string> = {};
  if (!raw) {
    return attributes;
  }

  let match: RegExpExecArray | null;
  while ((match = ATTR_REGEX.exec(raw))) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

function mapToStyle(attrs: Record<string, string>, prefix = '') {
  const style = Object.entries(attrs)
    .filter(([key]) => key !== 'href')
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
  const combined = [prefix, style].filter(Boolean).join('');
  return combined ? `${combined};` : '';
}

function styleAttribute(raw: string, prefix = '') {
  const attrs = parseAttributes(raw);
  const style = mapToStyle(attrs, prefix);
  return style ? ` style="${style}"` : '';
}

export function renderMjml(mjml: string) {
  let html = mjml.replace(/\r\n/g, '\n');

  html = html.replace(/<mj-head[\s\S]*?<\/mj-head>/g, '');
  html = html.replace(/<mj-attributes[\s\S]*?<\/mj-attributes>/g, '');

  html = html.replace(/<mjml[^>]*>/g, '<!doctype html><html><body>');
  html = html.replace(/<\/mjml>/g, '</body></html>');

  html = html.replace(/<mj-body([^>]*)>/g, (_, attrs) => `<div class="mj-body"${styleAttribute(attrs)}>\n`);
  html = html.replace(/<\/mj-body>/g, '</div>');

  html = html.replace(/<mj-section([^>]*)>/g, (_, attrs) => `<section${styleAttribute(attrs)}>\n`);
  html = html.replace(/<\/mj-section>/g, '</section>');

  html = html.replace(/<mj-column([^>]*)>/g, (_, attrs) => `<div class="mj-column"${styleAttribute(attrs)}>\n`);
  html = html.replace(/<\/mj-column>/g, '</div>');

  html = html.replace(/<mj-text([^>]*)>/g, (_, attrs) => `<p${styleAttribute(attrs)}>\n`);
  html = html.replace(/<\/mj-text>/g, '</p>');

  html = html.replace(/<mj-button([^>]*)>/g, (_, attrs) => {
    const parsed = parseAttributes(attrs);
    const href = parsed.href ?? '#';
    const style = mapToStyle(parsed, 'display:inline-block;padding:12px 20px;border-radius:6px;text-decoration:none;');
    return `<a href="${href}" style="${style}">`;
  });
  html = html.replace(/<\/mj-button>/g, '</a>');

  return { html };
}
