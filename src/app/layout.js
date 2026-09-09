import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import { ToastProvider } from '@/components/Toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  title: 'CreaSphere — Творчий простір, подарунки ручної роботи | Павлоград',
  description: 'CreaSphere — преміальний творчий простір у Павлограді. Подарунки ручної роботи, авторські сувеніри, майстер-класи для дітей та дорослих.',
  keywords: 'CreaSphere, подарунки ручної роботи, Павлоград, майстер-класи, сувеніри, творчий простір, магазин',
  openGraph: {
    title: 'CreaSphere — Творчий простір, подарунки ручної роботи',
    description: 'Преміальний творчий простір у Павлограді. Авторські подарунки, сувеніри, майстер-класи.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
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
