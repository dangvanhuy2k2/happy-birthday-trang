(() => {
  'use strict';
  const box = document.querySelector('.photo-bubbles');
  const config = window.BIRTHDAY_CONFIG;
  if (!box || !config || !config.photos) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const photos = config.photos.map((p) => p.src);
  const count = innerWidth < 640 ? 5 : 8;
  let next = 0;
  const rand = (a, b) => a + Math.random() * (b - a);

  function setup(bubble, first) {
    const size = innerWidth < 640 ? rand(62, 92) : rand(80, 135);
    // tránh giữa màn hình để không che khung đếm ngược
    const side = Math.random() < 0.5 ? rand(1, 24) : rand(70, 93);
    const dur = rand(16, 26);
    bubble.style.setProperty('--size', size + 'px');
    bubble.style.setProperty('--x', side + 'vw');
    bubble.style.setProperty('--dur', dur + 's');
    bubble.style.setProperty('--sway', rand(14, 34) + 'px');
    bubble.style.setProperty('--sway-dur', rand(2.8, 4.6) + 's');
    bubble.style.setProperty('--delay', (first ? -rand(0, dur) : 0) + 's');
    bubble.querySelector('img').src = photos[next++ % photos.length];
    bubble.classList.remove('pop');
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = '';
  }

  function pop(bubble) {
    if (bubble.classList.contains('pop')) return;
    const r = bubble.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const h = document.createElement('span');
      h.className = 'bubble-heart';
      h.textContent = i % 2 ? '♡' : '✿';
      h.style.left = r.left + r.width / 2 + 'px';
      h.style.top = r.top + r.height / 2 + 'px';
      const a = (Math.PI * 2 * i) / 8;
      h.style.setProperty('--dx', Math.cos(a) * 60 + 'px');
      h.style.setProperty('--dy', Math.sin(a) * 60 + 'px');
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 900);
    }
    bubble.classList.add('pop');
    setTimeout(() => setup(bubble, false), 600);
  }

  for (let i = 0; i < count; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'photo-bubble';
    b.tabIndex = -1;
    b.innerHTML = '<span class="bubble-inner"><img alt="" decoding="async"></span>';
    b.querySelector('img').onerror = function () { b.hidden = true; };
    b.addEventListener('animationiteration', (e) => { if (e.animationName === 'bubbleRise') setup(b, false); });
    b.addEventListener('click', (e) => { e.stopPropagation(); pop(b); });
    box.appendChild(b);
    setup(b, true);
  }
  if (reduce) box.classList.add('still');
})();
