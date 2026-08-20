/**
 * Centralized SEO & Metadata Utility for VAULT.CO
 * Strictly enforces https://vaultco.online as the canonical/primary domain.
 */

const SITE_NAME = 'Vault.Co';
const CANONICAL_DOMAIN = 'https://vaultco.online';

export const setDocumentSEO = ({
  title,
  description,
  canonicalPath,
  noIndex = false,
  ogType = 'website',
  ogImage,
  jsonLd,
  breadcrumbList,
}) => {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  const formattedTitle = title
    ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
    : `${SITE_NAME} | Premium Watches, Wallets, Belts, Chains & Accessories`;
  document.title = formattedTitle;

  // Helper to upsert meta tags
  const setMetaTag = (attribute, name, content) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 2. Meta Description
  const defaultDesc =
    'Shop premium watches, wallets, belts, chains, rings, glasses, caps, earrings and accessories at Vault.Co. Discover stylish collections with a smooth online shopping experience.';
  const finalDesc = description || defaultDesc;
  setMetaTag('name', 'description', finalDesc);

  // 3. Robots Meta Tag
  setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

  // 4. Canonical URL (Always anchored to authoritative https://vaultco.online)
  let cleanPath = canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
  const canonicalUrl = `${CANONICAL_DOMAIN}${cleanPath}`;

  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', canonicalUrl);

  // 5. Open Graph Metadata
  setMetaTag('property', 'og:title', formattedTitle);
  setMetaTag('property', 'og:description', finalDesc);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:site_name', SITE_NAME);
  
  const ogImgUrl = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${CANONICAL_DOMAIN}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`)
    : `${CANONICAL_DOMAIN}/android-chrome-512x512.png`;
  setMetaTag('property', 'og:image', ogImgUrl);

  // 6. Twitter / X Cards
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', formattedTitle);
  setMetaTag('name', 'twitter:description', finalDesc);
  setMetaTag('name', 'twitter:image', ogImgUrl);

  // 7. Dynamic JSON-LD Structured Data
  const scriptId = 'page-jsonld-schema';
  let scriptTag = document.getElementById(scriptId);
  if (jsonLd) {
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLd);
  } else if (scriptTag) {
    scriptTag.remove();
  }

  // 8. Breadcrumb JSON-LD Schema
  const breadcrumbScriptId = 'breadcrumb-jsonld-schema';
  let breadcrumbScript = document.getElementById(breadcrumbScriptId);
  if (breadcrumbList && breadcrumbList.length > 0) {
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = breadcrumbScriptId;
      breadcrumbScript.type = 'application/ld+json';
      document.head.appendChild(breadcrumbScript);
    }
    const breadcrumbData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbList.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${CANONICAL_DOMAIN}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
      })),
    };
    breadcrumbScript.textContent = JSON.stringify(breadcrumbData);
  } else if (breadcrumbScript) {
    breadcrumbScript.remove();
  }
};
