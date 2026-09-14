import AdminLayoutClient from '@/components/AdminLayoutClient';

export const metadata = {
  title: 'Адмін-панель — CreaSphere',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
