import Link from 'next/link';
import WorkshopsClient from '@/components/WorkshopsClient';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const metadata = {
  title: 'Майстер-класи — CreaSphere | Онлайн-запис у Павлограді',
  description: 'Творчі майстер-класи у Павлограді для дітей та дорослих. Гончарство, мозаїка, свічки, живопис. Онлайн-запис на зручний час.',
};

const STATIC_WORKSHOPS = [
  {
    id: 'mc-1',
    title: 'Гончарство та кераміка',
    desc: 'Створення унікального посуду або авторських скульптур з природної глини під наглядом майстра на справжньому гончарному колі. Кожен виріб проходить сушку та випал.',
    duration: '1.5 – 2 години',
    price: '480 ₴',
    difficulty: 'Початковий',
    difficultyLevel: 'beginner',
    max_participants: 8,
    registered_count: 5,
    available_spots: 3,
    age: 'від 6 років та дорослі',
    image: '/workshop1.jpg',
    badge: 'Хіт сезону',
    scheduled_dates: [
      '12 вер (сб), 14:00',
      '16 вер (ср), 16:30',
      '19 вер (сб), 11:00',
    ],
  },
  {
    id: 'mc-2',
    title: 'Мозаїка та вітражний арт',
    desc: 'Створення декоративного панно або дзеркала з кольорового скла, кераміки та смальти. Розвиває просторове мислення та дарує естетичну насолоду.',
    duration: '2 – 3 години',
    price: '550 ₴',
    difficulty: 'Середній',
    difficultyLevel: 'intermediate',
    max_participants: 10,
    registered_count: 6,
    available_spots: 4,
    age: 'від 8 років та дорослі',
    image: '/workshop2.jpg',
    badge: 'Популярне',
    scheduled_dates: [
      '13 вер (нд), 12:00',
      '20 вер (нд), 15:00',
    ],
  },
  {
    id: 'mc-3',
    title: 'Ароматичні соєві свічки',
    desc: 'Створення авторської свічки з 100% натурального соєвого воску, дерев’яним гнотом та преміальними аромаоліями у стильній скляній або гіпсовій баночці.',
    duration: '1 – 1.5 години',
    price: '420 ₴',
    difficulty: 'Початковий',
    difficultyLevel: 'beginner',
    max_participants: 10,
    registered_count: 8,
    available_spots: 2,
    age: 'від 10 років та дорослі',
    image: '/gallery3.jpg',
    badge: 'Атмосферне',
    scheduled_dates: [
      '15 вер (вт), 17:30',
      '18 вер (пт), 18:00',
      '22 вер (вт), 17:30',
    ],
  },
  {
    id: 'mc-4',
    title: 'Живопис та текстурний арт',
    desc: 'Картини акрилом на полотні з використанням текстурної рельєфної пасти, золочення поталлю та сучасних технік інтер’єрного живопису.',
    duration: '2 години',
    price: '520 ₴',
    difficulty: 'Початковий',
    difficultyLevel: 'beginner',
    max_participants: 10,
    registered_count: 7,
    available_spots: 3,
    age: 'від 7 років та дорослі',
    image: '/gallery1.jpg',
    badge: 'Творчість',
    scheduled_dates: [
      '14 вер (пн), 16:00',
      '21 вер (пн), 16:00',
    ],
  },
  {
    id: 'mc-5',
    title: 'Дитячі свята та дні народження',
    desc: 'Організація творчого свята під ключ у нашому затишному просторі. Майстер-клас на вибір для всіх гостей, фотозона та святкова атмосфера.',
    duration: '2 – 3 години',
    price: 'від 350 ₴ / дитина',
    difficulty: 'Початковий',
    difficultyLevel: 'beginner',
    max_participants: 15,
    registered_count: 9,
    available_spots: 6,
    age: 'від 5 років',
    image: '/workshop3.jpg',
    badge: 'Свята',
    scheduled_dates: [
      'За індивідуальним замовленням',
    ],
  },
  {
    id: 'mc-6',
    title: 'Корпоративи та тімбілдинги',
    desc: 'Творчий відпочинок для команд і компаній. Спільне створення великого арт-об’єкта або індивідуальні вироби для кожного колеги з чайними частуваннями.',
    duration: 'від 2 годин',
    price: 'від 400 ₴ / ос.',
    difficulty: 'Середній',
    difficultyLevel: 'intermediate',
    max_participants: 25,
    registered_count: 15,
    available_spots: 10,
    age: 'для дорослих компаній',
    image: '/workshop_scene.webp',
    badge: 'Корпоратив',
    scheduled_dates: [
      'За індивідуальним узгодженням',
    ],
  },
];

// Clean vector SVG icons for workshop benefits
const PaletteIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const GiftIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

const TeaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

export const dynamic = 'force-dynamic';

export default async function WorkshopsPage() {
  let workshopTypes = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        workshopTypes = data.map((w) => ({
          id: w.id,
          title: w.title,
          desc: w.description || w.desc || '',
          duration: w.duration || '',
          price: w.price || '',
          difficulty: w.difficulty || 'Початковий',
          difficultyLevel: w.difficulty_level || w.difficultyLevel || 'beginner',
          max_participants: w.max_participants || 10,
          registered_count: w.registered_count || 0,
          available_spots: w.available_spots || 10,
          age: w.age || '',
          image: w.image || '/workshop1.jpg',
          badge: w.badge || '',
          scheduled_dates: Array.isArray(w.scheduled_dates) ? w.scheduled_dates : [],
        }));
      }
    } catch (err) {
      console.warn('Failed to load workshops from Supabase:', err);
    }
  }

  // Fallback to static demo workshops ONLY if Supabase is completely unconfigured
  if (workshopTypes.length === 0 && !isSupabaseConfigured) {
    workshopTypes = STATIC_WORKSHOPS;
  }

  return (
    <main>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <span>Майстер-класи</span>
          </div>
          <h1 className="page-header__title">Майстер-класи та творчі заняття</h1>
          <p
            style={{
              maxWidth: 680,
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              marginTop: 16,
            }}
          >
            Відкрийте радість творчості власними руками. Досвідчені майстри, якісні матеріали, теплі знайомства та готовий авторський виріб, який ви забираєте з собою.
          </p>
        </div>
      </div>

      {/* ── Key Workshop Features ── */}
      <div className="container" style={{ paddingTop: 40, paddingBottom: 20 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {[
            { icon: <PaletteIcon />, title: 'Все включено', desc: 'Усі матеріали, інструменти, фарби та фартухи вже входять у вартість' },
            { icon: <UsersIcon />, title: 'Малі групи', desc: 'До 8-10 учасників для максимальної уваги та допомоги майстра кожному' },
            { icon: <GiftIcon />, title: 'Готовий виріб', desc: 'Створений шедевр ви забираєте з собою одразу або після випалу' },
            { icon: <TeaIcon />, title: 'Чай та кава', desc: 'Затишні перерви на чай з авторським печивом у творчому колі' },
          ].map((feat, idx) => (
            <div
              key={idx}
              style={{
                background: '#fff',
                padding: '24px 20px',
                borderRadius: 16,
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(96, 108, 56, 0.1)',
                  color: 'var(--sage, #606c38)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                {feat.icon}
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{feat.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Interactive Workshops List & Booking ── */}
      <WorkshopsClient workshopTypes={workshopTypes} />
    </main>
  );
}
