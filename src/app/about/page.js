import Link from 'next/link';

export const metadata = {
  title: 'Про нас — CreaSphere | Центр креативних індустрій у Павлограді',
  description: 'КреаСфера — унікальний творчий простір у Павлограді. Понад 120 локальних майстрів, 5000+ авторських виробів ручної роботи. Наша історія та місія.',
};

// Clean vector SVG icons for values
const PaletteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
  </svg>
);

const SupportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default function AboutPage() {
  const stats = [
    { number: '5 000+', label: 'виробів ручної роботи' },
    { number: '120+', label: 'майстрів у різних техніках' },
    { number: '50+', label: 'проведених майстер-класів' },
    { number: '100%', label: 'душевного тепла та любові' },
  ];

  const values = [
    {
      title: 'Підтримка локальних майстрів',
      desc: 'Ми даємо можливість талановитим майстрам Павлограда та України реалізовувати свій потенціал та знайомити світ зі своєю творчістю.',
      icon: <PaletteIcon />,
    },
    {
      title: 'Соціальний вплив',
      desc: 'Багато наших виробів створені людьми, які долають життєві виклики через мистецтво. Кожна покупка — це реальна підтримка.',
      icon: <SupportIcon />,
    },
    {
      title: 'Екологічність та натуральність',
      desc: 'Ми віддаємо перевагу натуральним матеріалам: глина, бавовна, натуральний віск, дерево та безпечні барвники.',
      icon: <LeafIcon />,
    },
    {
      title: 'Творчий коворкінг',
      desc: 'Наш простір відкритий для зустрічей, презентацій, обміну досвідом та спільного створення прекрасного.',
      icon: <SparklesIcon />,
    },
  ];

  return (
    <main>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <span>Про нас</span>
          </div>
          <h1 className="page-header__title">Про нас</h1>
          <p style={{ marginTop: 16, color: 'var(--text-2)', fontSize: 16, maxWidth: 640, lineHeight: 1.6 }}>
            КреаСфера — це простір для креативу, натхнення та підтримки у серці Павлограда.
          </p>
        </div>
      </div>

      {/* ── Main Story ── */}
      <section style={{ padding: '80px 0 60px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(40px, 6vw, 80px)',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--sage)', fontWeight: 600 }}>
                Наша історія
              </span>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.2,
                margin: '16px 0 24px',
              }}>
                Ми не просто крамниця.<br />Ми — <em>цілий всесвіт</em> ручної роботи.
              </h2>
              <div style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p>
                  У нас ви знайдете те, чого не купите в звичайних магазинах! Кожен виріб у нашій крамниці має особливу цінність. За ним стоїть історія людини, яка, попри всі життєві виклики, не перестала творити.
                </p>
                <p>
                  Купуючи у КреаСфері, ви не просто обираєте річ ручної роботи. Ви допомагаєте людям повірити у власні сили, підтримуєте розвиток локальних майстрів і стаєте важливою частиною соціальних змін.
                </p>
                <p style={{ fontWeight: 600, color: 'var(--text)' }}>
                  Ваш вибір дарує комусь можливість творити далі.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 36, flexWrap: 'wrap' }}>
                <Link href="/shop" className="btn btn--primary">
                  <span>Переглянути товари</span>
                </Link>
                <Link href="/workshops" className="btn btn--ghost">
                  <span>Майстер-класи</span>
                </Link>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                aspectRatio: '4 / 3',
                background: 'var(--bg-warm)',
              }}>
                <img
                  src="/photo_2026-08-01_15-03-05.jpg"
                  alt="Творчий простір CreaSphere у Павлограді"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section style={{ padding: '60px 0', background: 'var(--bg-warm)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
            textAlign: 'center',
          }}>
            {stats.map((s, idx) => (
              <div key={idx}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(36px, 5vw, 54px)',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 8,
                }}>
                  {s.number}
                </div>
                <div style={{ color: 'var(--text-2)', fontSize: 15 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Values ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--sage)', fontWeight: 600 }}>
              Принципи
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.5vw, 38px)', marginTop: 12 }}>
              Що для нас важливо
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28,
          }}>
            {values.map((val, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-card)',
                  padding: 32,
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(96, 108, 56, 0.1)',
                    color: 'var(--sage, #606c38)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 18,
                  }}
                >
                  {val.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12 }}>
                  {val.title}
                </h3>
                <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Space Photos ── */}
      <section style={{ padding: '40px 0 80px', background: 'var(--bg-cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 36px)', marginBottom: 12 }}>
              Наш простір
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 15 }}>
              м. Павлоград, вул. Шевченка, 138б — чекаємо на вас щодня з 9:00 до 18:00
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {[
              { img: '/studio_space.webp', alt: 'Затишна зона майстерні' },
              { img: '/photo_2026-07-29_10-48-40.jpg', alt: 'Полиці з сувенірами' },
              { img: '/about1.jpg', alt: 'Творчий куточок' },
            ].map((pic, i) => (
              <div
                key={i}
                style={{
                  height: 300,
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <img
                  src={pic.img}
                  alt={pic.alt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
