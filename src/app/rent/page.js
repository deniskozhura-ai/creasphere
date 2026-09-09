import Link from 'next/link';
import SpaceBookingForm from '@/components/SpaceBookingForm';

export const metadata = {
  title: 'Оренда простору — CreaSphere | Затишний зал для подій у Павлограді',
  description: 'Погодинна оренда творчого простору у Павлограді. Для дитячих свят, днів народження, власних майстер-класів, лекцій та зустрічей. Вул. Шевченка, 138б.',
};

export default function RentPage() {
  const spaceFeatures = [
    {
      icon: '🏛️',
      title: 'Затишний арт-зал',
      desc: 'Світле, атмосферне приміщення з крафтовим декором, зручними столами та посадкою до 25 гостей.',
    },
    {
      icon: '📽️',
      title: 'Обладнання під ключ',
      desc: 'Мультимедійний проектор, великий екран, якісний звук, швидкісний Wi-Fi та регульоване освітлення.',
    },
    {
      icon: '☕',
      title: 'Зона чаювання та відпочинку',
      desc: 'Чайник, крафтовий посуд, келихи, прилади для солодощів. Можна приносити власні частування та торт.',
    },
    {
      icon: '📸',
      title: 'Фотозона та декор',
      desc: 'Красиві авторські куточки для пам’ятних світлин з вашого свята, презентації чи майстер-класу.',
    },
  ];

  const eventFormats = [
    {
      title: 'Дитячі свята та дні народження',
      price: 'від 350 ₴ / год',
      desc: 'Тепла та безпечна атмосфера для діток. Можна замовити творчий майстер-клас або провести власну анімаційну програму.',
      badge: 'Найпопулярніше',
    },
    {
      title: 'Власні майстер-класи та воркшопи',
      price: 'від 300 ₴ / год',
      desc: 'Ідеальне місце для майстрів, коучів та викладачів: просторі робочі столи, вода, захисні покриття, хороше світло.',
      badge: 'Для майстрів',
    },
    {
      title: 'Лекції, презентації та зустрічі',
      price: 'від 350 ₴ / год',
      desc: 'Камерний формат для бізнес-зустрічей, клубів за інтересами, книжкових вечорів та семінарів з проектором.',
      badge: 'Діловий',
    },
    {
      title: 'Фотосесії та зйомки контенту',
      price: 'від 300 ₴ / год',
      desc: 'Естетичний бекграунд ручної роботи, кераміка, сонячне денне світло для створення гарного візуалу.',
      badge: 'Атмосферно',
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
            <span>Оренда простору</span>
          </div>
          <h1 className="page-header__title">Оренда простору для ваших подій</h1>
          <p
            style={{
              maxWidth: 720,
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              marginTop: 16,
            }}
          >
            Творчий простір <strong>CreaSphere</strong> у центрі Павлограда — ідеальне місце для святкування дня народження, проведення майстер-класу, презентації або затишної зустрічі друзів.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {/* ── Key Features ── */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {spaceFeatures.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  padding: '28px 24px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Space Gallery & Atmosphere ── */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--sage, #606c38)',
              }}
            >
              Атмосфера простору
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0 0 0', color: 'var(--text)' }}>
              Місце, де народжуються <em>теплі спогади</em>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', height: 260 }}>
              <img src="/workshop_main.jpg" alt="Простір для майстер-класів" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 16, overflow: 'hidden', height: 260 }}>
              <img src="/about2.jpg" alt="Зона відпочинку" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 16, overflow: 'hidden', height: 260 }}>
              <img src="/workshop3.jpg" alt="Свята та події" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </section>

        {/* ── Formats and Pricing ── */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--sage, #606c38)',
              }}
            >
              Тарифи та формати
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0 0 0', color: 'var(--text)' }}>
              Для яких подій ви можете орендувати зал
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {eventFormats.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'linear-gradient(180deg, #fff 0%, #faf8f5 100%)',
                  borderRadius: 20,
                  padding: '30px 24px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 12,
                      background: 'rgba(96, 108, 56, 0.12)',
                      color: 'var(--sage, #606c38)',
                      display: 'inline-block',
                      marginBottom: 12,
                    }}
                  >
                    {item.badge}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                    {item.desc}
                  </p>
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Вартість:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--sage, #606c38)' }}>
                    {item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Booking Form Section ── */}
        <section id="rent-form">
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <SpaceBookingForm />
          </div>
        </section>
      </div>
    </main>
  );
}
