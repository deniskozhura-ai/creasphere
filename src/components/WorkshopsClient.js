'use client';

import { useState, useEffect } from 'react';
import WorkshopBookingForm from './WorkshopBookingForm';

export default function WorkshopsClient({ workshopTypes: initialTypes = [] }) {
  const [items, setItems] = useState(initialTypes || []);
  const [selectedWorkshop, setSelectedWorkshop] = useState('');

  useEffect(() => {
    fetch('/api/workshops')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data.map((w) => ({
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
          })));
        }
      })
      .catch((e) => console.warn('Failed to refresh workshops client-side:', e));
  }, []);

  const handleSelectWorkshop = (title) => {
    setSelectedWorkshop(title);
    const formElement = document.getElementById('book-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* ── Workshop Types Grid ── */}
      <section style={{ padding: '60px 0 80px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.5vw, 36px)', marginBottom: 16 }}>
              Напрямки майстер-класів
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto', fontSize: 15 }}>
              Оберіть напрямок до душі та запишіться на зручний час онлайн
            </p>
          </div>

          {items.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
              gap: 32,
            }}>
              {items.map((item, i) => (
              <article
                key={i}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: 'var(--bg-warm)' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 12px',
                      borderRadius: 100,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    {item.badge}
                  </span>

                  {item.difficulty && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        padding: '4px 10px',
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#fff',
                      }}
                    >
                      {item.difficultyLevel === 'beginner' ? '🟢' : '🟡'} {item.difficulty}
                    </span>
                  )}
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0 }}>
                      {item.title}
                    </h3>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--sage, #606c38)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {item.price}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6, flex: 1, marginBottom: 18 }}>
                    {item.desc}
                  </p>

                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 13,
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⏱</span> <span>{item.duration}</span>
                      </div>
                      {item.available_spots !== undefined && (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 8,
                          background: item.available_spots <= 2 ? '#fef2f2' : '#ecfdf5',
                          color: item.available_spots <= 2 ? '#b91c1c' : '#047857',
                        }}>
                          Залишилось {item.available_spots} з {item.max_participants} місць
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>👤</span> <span>{item.age}</span>
                    </div>

                    {item.scheduled_dates && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Найближчі дати:</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {item.scheduled_dates.map((d, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 11,
                                background: 'rgba(0,0,0,0.04)',
                                padding: '2px 7px',
                                borderRadius: 6,
                                color: 'var(--text)',
                              }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectWorkshop(item.title)}
                    className="btn btn--primary"
                    style={{ width: '100%', marginTop: 20, textAlign: 'center', justifyContent: 'center' }}
                  >
                    <span>Записатися онлайн</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
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
                  margin: '0 auto 16px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text)' }}>Наразі майстер-класів немає</h3>
              <p>Слідкуйте за оновленнями розкладу або зв’яжіться з нами для індивідуального запису.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Photo Showcase ── */}
      <section style={{ padding: '60px 0 80px', background: 'var(--bg-warm)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 36px)', marginBottom: 12 }}>
              Як проходять наші заняття
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Живі емоції, нові навички та атмосфера творчого натхнення
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {[
              { src: '/workshop_main.jpg', caption: 'Гончарне коло та ліплення' },
              { src: '/workshop1.jpg', caption: 'Дитяча творча група' },
              { src: '/workshop2.jpg', caption: 'Робота з мозаїкою та склом' },
              { src: '/workshop3.jpg', caption: 'Святкова атмосфера занять' },
            ].map((photo, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  position: 'relative',
                  height: 260,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 16,
                }}>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                    {photo.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Booking Form Anchor Section ── */}
      <div id="book-section">
        <WorkshopBookingForm
          initialWorkshop={selectedWorkshop}
          workshopTypes={items}
        />
      </div>
    </>
  );
}
