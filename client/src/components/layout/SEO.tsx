import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({ 
  title = "MotoVault - Il Tuo Garage Digitale Premium", 
  description = "Gestisci le tue moto, pianifica i tuoi viaggi e unisciti alla community dei motociclisti più esclusiva.",
  image = "https://motovvault.com/og-image.jpg", // Immagine predefinita
  url = "https://motovvault.com",
  type = "website"
}: SEOProps) {
  const siteTitle = title.includes("MotoVault") ? title : `${title} | MotoVault`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Mobile Apps & Icons */}
      <meta name="theme-color" content="#15803d" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
}
