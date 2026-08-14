/**
 * Centralized SEO & Metadata Utility for VAULT.CO
 */

const SITE_NAME = 'Vault.Co';
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://vault.co';

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
    : `${SITE_NAME} | Online Shopping`;
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
    'Shop premium luxury accessories at Vault.Co. Curated collection of masterfully engineered watches, leather wallets, belts, jewelry and fragrances for the modern gentleman.';
  const finalDesc = description || defaultDesc;
  setMetaTag('name', 'description', finalDesc);

  // 3. Robots Meta Tag
  setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

  // 4. Canonical URL
  const canonicalUrl = canonicalPath
    ? `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
    : `${BASE_URL}${window.location.pathname}`;

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
  if (ogImage) {
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;
    setMetaTag('property', 'og:image', fullOgImage);
  }

  // 6. Twitter / X Cards
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', formattedTitle);
  setMetaTag('name', 'twitter:description', finalDesc);
  if (ogImage) {
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;
    setMetaTag('name', 'twitter:image', fullOgImage);
  }

  // 7. Dynamic JSON-LD Structured Data
  if (jsonLd) {
    const scriptId = 'page-jsonld-schema';
    let scriptTag = document.getElementById(scriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLd);
  }

  // 8. Breadcrumb JSON-LD Schema
  if (breadcrumbList && breadcrumbList.length > 0) {
    const breadcrumbScriptId = 'breadcrumb-jsonld-schema';
    let breadcrumbScript = document.getElementById(breadcrumbScriptId);
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
        item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
      })),
    };
    breadcrumbScript.textContent = JSON.stringify(breadcrumbData);
  }
};
