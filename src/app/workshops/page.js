import Link from 'next/link';
import WorkshopsClient from '@/components/WorkshopsClient';

export const metadata = {
  title: 'Майстер-класи — CreaSphere | Онлайн-запис у Павлограді',
  description: 'Творчі майстер-класи у Павлограді для дітей та дорослих. Гончарство, мозаїка, свічки, живопис. Онлайн-запис на зручний час.',
};

export default function WorkshopsPage() {
  const workshopTypes = [
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
            { icon: '🎨', title: 'Все включено', desc: 'Усі матеріали, інструменти, фарби та фартухи вже входять у вартість' },
            { icon: '👥', title: 'Малі групи', desc: 'До 8-10 учасників для максимальної уваги та допомоги майстра кожному' },
            { icon: '🎁', title: 'Готовий виріб', desc: 'Створений шедевр ви забираєте з собою одразу або після випалу' },
            { icon: '☕', title: 'Чай та кава', desc: 'Затишні перерви на чай з авторським печивом у творчому колі' },
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
              <div style={{ fontSize: 30, marginBottom: 10 }}>{feat.icon}</div>
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
