import Link from 'next/link';

export const metadata = {
  title: 'Про нас — CreaSphere | Центр креативних індустрій у Павлограді',
  description: 'КреаСфера — унікальний творчий простір у Павлограді. Понад 120 локальних майстрів, 5000+ авторських виробів ручної роботи. Наша історія та місія.',
};

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
      icon: '🎨',
    },
    {
      title: 'Соціальний вплив',
      desc: 'Багато наших виробів створені людьми, які долають життєві виклики через мистецтво. Кожна покупка — це реальна підтримка.',
      icon: '🤝',
    },
    {
      title: 'Екологічність та натуральність',
      desc: 'Ми віддаємо перевагу натуральним матеріалам: глина, бавовна, натуральний віск, дерево та безпечні барвники.',
      icon: '🌿',
    },
    {
      title: 'Творчий коворкінг',
      desc: 'Наш простір відкритий для зустрічей, презентацій, обміну досвідом та спільного створення прекрасного.',
      icon: '✨',
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
                <div style={{ fontSize: 32, marginBottom: 16 }}>{val.icon}</div>
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
