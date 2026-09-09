'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentGalleryIdx, setCurrentGalleryIdx] = useState(0);

  const galleryImages = [
    { src: '/gallery1.jpg', alt: 'Галерея 1' },
    { src: '/gallery2.jpg', alt: 'Галерея 2' },
    { src: '/gallery3.jpg', alt: 'Галерея 3' },
    { src: '/gallery4.jpg', alt: 'Галерея 4' },
    { src: '/gallery5.jpg', alt: 'Галерея 5' },
    { src: '/gallery6.jpg', alt: 'Галерея 6' },
    { src: '/gallery7.jpg', alt: 'Галерея 7' },
    { src: '/craft_hands.webp', alt: 'Галерея 8' },
  ];

  const openLightbox = (idx) => {
    setCurrentGalleryIdx(idx);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightbox = (e) => {
    e?.stopPropagation();
    setCurrentGalleryIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const prevLightbox = (e) => {
    e?.stopPropagation();
    setCurrentGalleryIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setCurrentGalleryIdx((prev) => (prev + 1) % galleryImages.length);
      if (e.key === 'ArrowLeft') setCurrentGalleryIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [lightboxOpen, galleryImages.length]);

  useEffect(() => {
    let lenis;
    let ctx;

    async function initAnimations() {
      try {
        const gsapPkg = await import('gsap');
        const stPkg = await import('gsap/ScrollTrigger');
        const lenisPkg = await import('lenis');

        const gsap = gsapPkg.default || gsapPkg.gsap;
        const ScrollTrigger = stPkg.ScrollTrigger;
        const Lenis = lenisPkg.default || lenisPkg.Lenis;

        gsap.registerPlugin(ScrollTrigger);

        // Lenis smooth scroll
        lenis = new Lenis({
          duration: 1.4,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.5,
        });

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        // Header scroll
        const header = document.getElementById('header');
        if (header) {
          window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
          });
        }

        ctx = gsap.context(() => {
          // Hero character split (guard against duplicate splitting)
          const splitLines = document.querySelectorAll('[data-split]');
          splitLines.forEach(line => {
            if (line.querySelector('.char')) return;
            const text = line.textContent;
            line.innerHTML = '';
            text.split('').forEach(char => {
              const span = document.createElement('span');
              span.className = 'char';
              span.textContent = char === ' ' ? '\u00A0' : char;
              line.appendChild(span);
            });
          });

          const heroTitle = document.querySelector('.hero__title');
          if (heroTitle) heroTitle.classList.add('is-split');

          // Hero timeline using fromTo with guaranteed final opacity 1
          const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          heroTl
            .fromTo('.hero__title-line .char',
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.6, stagger: 0.02, ease: 'power3.out' }
            )
            .fromTo('.hero__features',
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
              '-=0.3'
            )
            .fromTo('.hero__actions',
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
              '-=0.3'
            );

          // Hero parallax
          gsap.to('.hero__content', {
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
            y: -80, opacity: 0.3, ease: 'none',
          });

          gsap.to('.hero__image-mask img', {
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
            yPercent: 20, ease: 'none',
          });

          // Scroll reveals
          document.querySelectorAll('.reveal-up').forEach(el => {
            const parent = el.closest('.services__grid');
            const delay = parent
              ? Array.from(parent.children).indexOf(el.closest('.service-card')) * 0.12
              : 0;

            gsap.fromTo(el,
              { opacity: 0, y: 30 },
              {
                scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 65%', toggleActions: 'play none none none' },
                opacity: 1, y: 0, duration: 1, delay, ease: 'power3.out',
              }
            );
          });

          // Magnetic buttons
          if (window.innerWidth > 768) {
            document.querySelectorAll('.magnetic').forEach(el => {
              el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
              });
              el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
              });
            });

            // Card tilt
            document.querySelectorAll('.service-card').forEach(card => {
              card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                gsap.to(card, { rotateX: y * -6, rotateY: x * 6, transformPerspective: 800, duration: 0.4, ease: 'power2.out' });
              });
              card.addEventListener('mouseleave', () => {
                gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
              });
            });
          }
        });

        // Smooth anchor scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const href = anchor.getAttribute('href');
            if (href === '#') {
              if (lenis) lenis.scrollTo(0, { duration: 1.5 });
              return;
            }
            const target = document.querySelector(href);
            if (target && lenis) lenis.scrollTo(target, { offset: -80, duration: 1.5 });
          });
        });

        ScrollTrigger.refresh();
      } catch (err) {
        console.warn('Animation initialization warning:', err);
      }
    }

    initAnimations();

    // Gallery track nav buttons
    const track = document.getElementById('gallery-track');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    if (track && prevBtn && nextBtn) {
      prevBtn.onclick = () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' });
      nextBtn.onclick = () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' });
    }

    return () => {
      if (ctx) ctx.revert();
      if (lenis) lenis.destroy();
    };
  }, []);

  return (
    <main>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero" id="hero">
        <div className="hero__bg">
          <div className="hero__image-mask">
            <img src="/hero_banner_wide.png" alt="Авторські вироби ручної роботи CreaSphere" fetchPriority="high" />
          </div>
        </div>
        <div className="hero__content">
          <h1 className="hero__title">
            <span className="hero__title-line" data-split>Місце, про яке всі говорять</span>
          </h1>
          <ul className="hero__features">
            <li className="hero__feature">Подарунки, сувеніри</li>
            <li className="hero__feature">Творчі майстер-класи</li>
            <li className="hero__feature">Тематичні зустрічі та здибанки</li>
          </ul>
          <div className="hero__actions">
            <Link href="/shop" className="btn btn--primary magnetic">
              <span>Магазин</span>
            </Link>
            <Link href="/workshops" className="btn btn--ghost magnetic">
              <span>Майстер-класи</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ DIVIDER ═══════════════ */}
      <div className="section-divider"></div>

      {/* ═══════════════ GALLERY ═══════════════ */}
      <section className="gallery" id="gallery">
        <div className="gallery__header container">
          <div className="section-label reveal-up">
            <span className="section-label__line"></span>
            <span className="section-label__text">Галерея</span>
            <span className="section-label__num">01</span>
          </div>
          <h2 className="gallery__title reveal-up" style={{ marginBottom: 24 }}>
            Тут панує <em>атмосфера</em>,<br/> яку важко передати словами.
          </h2>
          <p className="gallery__desc reveal-up" style={{ marginBottom: 64, fontSize: '1.1rem', maxWidth: 700, lineHeight: 1.6, color: 'var(--text-muted)' }}>
            Тому ми зібрали для вас кілька світлин. Сподіваємося, вони передадуть тепло нашого простору. А якщо будете неподалік — завітайте до нас.
          </p>
        </div>
        <div className="gallery__wrapper" id="gallery-wrapper">
          <div className="gallery__nav-btn gallery__nav-btn--prev" id="gallery-prev">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div className="gallery__nav-btn gallery__nav-btn--next" id="gallery-next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div className="gallery__track" id="gallery-track">
            {galleryImages.map((item, i) => (
              <div className="gallery__item" key={i} onClick={() => openLightbox(i)} style={{ cursor: 'pointer' }}>
                <div className="gallery__item-img">
                  <img src={item.src} alt={item.alt} loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICES ═══════════════ */}
      <section className="services" id="services">
        <div className="container">
          <div className="section-label reveal-up">
            <span className="section-label__line"></span>
            <span className="section-label__text">Послуги</span>
            <span className="section-label__num">02</span>
          </div>
          <h2 className="services__title reveal-up">Ми пропонуємо набагато більше,<br/>ніж <em>ви уявляєте</em></h2>
          <div className="services__grid">
            <article className="service-card reveal-up">
              <div className="service-card__num">01</div>
              <div className="service-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
              </div>
              <h3 className="service-card__title">Подарунки та сувеніри</h3>
              <p className="service-card__text"><strong>Вироби ручної роботи</strong> — українські сувеніри, обереги, декор, прикраси, іграшки, свічки, мило, подарунки для себе, рідних та близьких.</p>
              <ul className="service-card__tags">
                <li>Товари в наявності</li>
                <li>Індивідуальні замовлення</li>
                <li>Подарункове пакування</li>
                <li>Подарункові бокси</li>
                <li>Подарункові сертифікати</li>
              </ul>
            </article>
            <article className="service-card reveal-up">
              <div className="service-card__num">02</div>
              <div className="service-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <h3 className="service-card__title">Майстер-класи та тематичні події</h3>
              <p className="service-card__text">Регулярні творчі заняття для дітей та дорослих — можливість навчитися створювати красу власними руками під керівництвом досвідчених майстрів.</p>
              <ul className="service-card__tags">
                <li>Для дітей</li>
                <li>Для дорослих</li>
                <li>Корпоративні</li>
                <li>Виїзні</li>
                <li>Святкові</li>
                <li>Тематичні</li>
              </ul>
            </article>
            <article className="service-card reveal-up">
              <div className="service-card__num">03</div>
              <div className="service-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <h3 className="service-card__title">Простір для зустрічей та івентів</h3>
              <p className="service-card__text">Оренда затишного творчого простору почасово — для презентацій, зустрічей, дитячих свят та корпоративів. Кейтерінг за бажанням.</p>
              <ul className="service-card__tags">
                <li>Оренда почасово</li>
                <li>Кейтерінг</li>
                <li>Обладнання</li>
                <li>Коворкінг</li>
                <li>Співпраця</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTACT ═══════════════ */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact__inner">
            <div className="contact__left">
              <div className="section-label section-label--light reveal-up">
                <span className="section-label__line"></span>
                <span className="section-label__text">Контакти</span>
                <span className="section-label__num">03</span>
              </div>
              <h2 className="contact__title reveal-up"><em>Зацікавлені?</em></h2>
              <p className="contact__desc reveal-up">Завітайте до нас або напишіть у зручну для вас соцмережу — ми допоможемо з вибором подарунку, запишемо на майстер-клас або організуємо ваш івент.</p>
              <div className="contact__buttons reveal-up">
                <a href="https://instagram.com/creasphere" className="btn btn--light btn--icon magnetic" target="_blank" rel="noopener" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="https://t.me/creasphere" className="btn btn--light btn--icon magnetic" target="_blank" rel="noopener" aria-label="Telegram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 7.5a.752.752 0 0 0 .104 1.407l4.72 1.57 2.257 6.97a.75.75 0 0 0 1.327.208l2.4-3.2 4.282 3.18a1.5 1.5 0 0 0 2.357-.96l2.97-15.33a1.5 1.5 0 0 0-1.895-1.56z"/></svg>
                </a>
                <a href="https://www.facebook.com/share/1BQ9KfUqPt/" className="btn btn--light btn--icon magnetic" target="_blank" rel="noopener" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              </div>
            </div>
            <div className="contact__right reveal-up">
              <div className="contact__card">
                <div className="contact__info">
                  <div className="contact__info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <span className="contact__label">Адреса</span>
                    <span className="contact__value">м. Павлоград, вул. Шевченка, 138б</span>
                  </div>
                </div>
                <div className="contact__info">
                  <div className="contact__info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <span className="contact__label">Режим роботи</span>
                    <span className="contact__value">Щодня 9:00 — 18:00</span>
                  </div>
                </div>
                <div className="contact__info">
                  <div className="contact__info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <span className="contact__label">Телефон</span>
                    <a href="tel:+380992345678" className="contact__link">+380 (99) 234-56-78</a>
                  </div>
                </div>
                <div className="contact__info">
                  <div className="contact__info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <span className="contact__label">Google Maps</span>
                    <a href="https://www.google.com/maps/place/%D0%9A%D1%80%D0%B5%D0%B0%D0%A1%D1%84%D0%B5%D1%80%D0%B0/@48.529782,35.8650135,17.36z" className="contact__link" target="_blank" rel="noopener">Відкрити на карті →</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ LIGHTBOX ═══════════════ */}
      {lightboxOpen && (
        <div className="lightbox is-active" id="lightbox" onClick={closeLightbox}>
          <button className="lightbox__close" aria-label="Закрити" onClick={closeLightbox}>&times;</button>
          <button className="lightbox__prev" aria-label="Попереднє фото" onClick={prevLightbox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button className="lightbox__next" aria-label="Наступне фото" onClick={nextLightbox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          <img
            src={galleryImages[currentGalleryIdx]?.src}
            alt={galleryImages[currentGalleryIdx]?.alt || 'Фото'}
            className="lightbox__img"
            id="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
