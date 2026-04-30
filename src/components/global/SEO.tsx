import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
}

const DEFAULT_TITLE = 'ИнтеллектПро — AI-боты и автоматизация для бизнеса';
const DEFAULT_DESC =
  'Платформа для создания AI-ботов, автоматизации соцсетей и работы с нейросетями. Telegram-боты, Instagram, VK, YouTube, TikTok без программирования.';
const DEFAULT_IMAGE = '/og-cover.png';

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    const [, key, val] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (key && val) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
}: SEOProps) => {
  useEffect(() => {
    const finalTitle = title
      ? `${title} — ИнтеллектПро`
      : DEFAULT_TITLE;
    const finalDesc = description || DEFAULT_DESC;
    const finalImage = ogImage || DEFAULT_IMAGE;

    document.title = finalTitle;

    setMeta('meta[name="description"]', 'content', finalDesc);
    if (keywords) setMeta('meta[name="keywords"]', 'content', keywords);

    setMeta('meta[property="og:title"]', 'content', finalTitle);
    setMeta('meta[property="og:description"]', 'content', finalDesc);
    setMeta('meta[property="og:image"]', 'content', finalImage);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[property="og:url"]', 'content', window.location.href);

    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', finalTitle);
    setMeta('meta[name="twitter:description"]', 'content', finalDesc);
    setMeta('meta[name="twitter:image"]', 'content', finalImage);

    setMeta('meta[name="theme-color"]', 'content', '#0A0E27');
  }, [title, description, keywords, ogImage, ogType]);

  return null;
};

export default SEO;
