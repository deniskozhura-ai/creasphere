import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import { ToastProvider } from '@/components/Toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getBaseUrl } from '@/lib/site-url';

const siteUrl = getBaseUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CreaSphere — Творчий простір, подарунки ручної роботи | Павлоград',
    template: '%s | CreaSphere',
  },
  description:
    'CreaSphere — творчий простір у Павлограді. Авторські подарунки ручної роботи, кераміка, декор, сувеніри та творчі майстер-класи для дітей і дорослих.',
  keywords: [
    'CreaSphere',
    'подарунки ручної роботи',
    'Павлоград',
    'майстер-класи',
    'кераміка',
    'сувеніри',
    'творчий простір',
    'магазин подарунків',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CreaSphere — Творчий простір, подарунки ручної роботи | Павлоград',
    description:
      'Авторські подарунки ручної роботи, кераміка, декор, сувеніри та творчі майстер-класи у Павлограді.',
    url: '/',
    siteName: 'CreaSphere',
    locale: 'uk_UA',
    type: 'website',
    images: [
      {
        url: '/hero_products.webp',
        width: 1200,
        height: 630,
        alt: 'CreaSphere — творчий простір та авторські подарунки',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreaSphere — Творчий простір, подарунки ручної роботи',
    description:
      'Авторські подарунки ручної роботи, кераміка, декор, сувеніри та майстер-класи у Павлограді.',
    images: ['/hero_products.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }) {
  const orgWebsiteSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'CreaSphere',
        alternateName: 'КреаСфера',
        url: siteUrl,
        logo: `${siteUrl}/hero_products.webp`,
        description: 'Творчий простір та інтернет-магазин авторських подарунків ручної роботи у Павлограді.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'вул. Шевченка, 138б',
          addressLocality: 'Павлоград',
          addressRegion: 'Дніпропетровська область',
          addressCountry: 'UA',
        },
        sameAs: [
          'https://www.instagram.com/creasphere2024',
          'https://t.me/creasphere',
          'https://www.facebook.com/share/1BQ9KfUqPt/',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'CreaSphere',
        description: 'Інтернет-магазин авторських подарунків ручної роботи та творчий простір у Павлограді',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgWebsiteSchema) }}
        />
      </head>
      <body>
        <CartProvider>
          <ToastProvider>
            <div className="grain-overlay" aria-hidden="true"></div>
            <Header />
            {children}
            <Footer />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
