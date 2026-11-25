(function () {
  'use strict';

  const config = window.BIRTHDAY_CONFIG;
  const byId = id => document.getElementById(id);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = matchMedia('(max-width: 640px)');
  const theme = document.body.className;
  const countdown = byId('countdown');
  const birthday = byId('birthday');
  const celebration = byId('celebration');
  const giftStage = byId('gift-stage');
  const openGift = byId('open-gift');
  const candle = byId('candle');
  const mic = byId('mic');
  const micStatus = byId('mic-status');
  const jar = byId('jar');
  const wishPaper = byId('wish-paper');
  const envelope = byId('envelope');
  const letter = byId('letter');
  const letterText = byId('letter-text');
  const readAll = byId('read-all');
  const musicButton = byId('music');
  const lightbox = byId('lightbox');
  const units = [...countdown.querySelectorAll('.unit')];
  const digits = units.map(unit => unit.querySelector('.digits'));
  const rings = units.map(unit => unit.querySelector('.progress'));
  const eligibleDevModes = ['countdown', 'soon', 'birthday'];
  const previewDuration = (2 * 86400 + 8 * 3600 + 34 * 60 + 44) * 1000;
  const params = new URLSearchParams(location.search);
  let devMode = params.has('dev') ? params.get('dev') : null;
  if (devMode !== null && !eligibleDevModes.includes(devMode)) devMode = 'countdown';
  let devDeadline = Date.now() + (devMode === 'soon' ? 10_000 : previewDuration);
  let currentMode;
  let giftTimer;
  let opened = false;
  let photoIndex = 0;
  let photoTrigger;
  let touchStart;
  let wishDeck = [];
  let lastWish;
  let letterTimer;
  let microphone;
  let clocks = [];

  byId('waiting-name').textContent = config.name;
  byId('written-name').textContent = config.name;
  byId('letter-accessible').textContent = config.letter;

  buildAlbum();
  buildTimeline();
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('has-reveal');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  function photoFrame(photo, lazy = false) {
    const frame = document.createElement('div');
    frame.className = 'photo-frame';

    const placeholder = document.createElement('span');
    placeholder.className = 'photo-placeholder';
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '📷';
    placeholder.append(icon, 'Ảnh của em');

    const image = new Image();
    image.alt = photo.caption;
    image.decoding = 'async';
    if (lazy) image.loading = 'lazy';
    image.hidden = true;
    image.onload = () => {
      placeholder.hidden = true;
      image.hidden = false;
    };
    image.onerror = () => {
      placeholder.hidden = false;
      image.remove();
    };
    frame.append(placeholder, image);
    // Giữ ảnh trong bố cục để trình duyệt có thể tải ảnh lazy.
    if (lazy) {
      image.hidden = false;
      image.classList.add('loading');
      image.addEventListener('load', () => image.classList.remove('loading'), { once: true });
    }
    image.src = photo.src;
    return frame;
  }

  function buildAlbum() {
    const album = byId('album');
    config.photos.forEach((photo, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'polaroid reveal';
      card.setAttribute('aria-label', 'Xem ảnh ' + (index + 1) + ' — ' + photo.caption);
      const caption = document.createElement('span');
      caption.className = 'polaroid-caption';
      caption.textContent = photo.caption;
      card.append(photoFrame(photo, true), caption);
      card.addEventListener('click', () => {
        photoTrigger = card;
        showPhoto(index);
        lightbox.showModal();
      });
      album.append(card);
    });
  }

  function buildTimeline() {
    const timeline = byId('timeline');
    for (const milestone of config.timeline) {
      const item = document.createElement('li');
      item.className = 'reveal';
      const time = document.createElement('time');
      time.dateTime = milestone.date.split('/').reverse().join('-');
      time.textContent = milestone.date;
      const title = document.createElement('h3');
      title.textContent = milestone.title;
      const body = document.createElement('p');
      body.textContent = milestone.text;
      item.append(time, title, body);
      timeline.append(item);
    }
  }

  function showPhoto(index) {
    const count = config.photos.length;
    photoIndex = (index + count) % count;
    const photo = config.photos[photoIndex];
    byId('full-photo').replaceChildren(photoFrame(photo));
    byId('photo-caption').textContent = (photoIndex + 1) + ' / ' + count + ' · ' + photo.caption;
  }

  byId('close-lightbox').addEventListener('click', () => lightbox.close());
  byId('prev-photo').addEventListener('click', () => showPhoto(photoIndex - 1));
  byId('next-photo').addEventListener('click', () => showPhoto(photoIndex + 1));
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    touchStart = undefined;
    if (photoTrigger && !celebration.hidden) photoTrigger.focus({ preventScroll: true });
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  byId('full-photo').addEventListener('touchstart', event => {
    if (event.touches.length === 1) {
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
  }, { passive: true });
  byId('full-photo').addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      showPhoto(photoIndex + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });
  byId('full-photo').addEventListener('touchcancel', () => { touchStart = undefined; });

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = .62;
  let audioMissing = false;

  function refreshMusic() {
    const playing = !audio.paused;
    musicButton.hidden = !opened || audioMissing || audio.readyState < 1;
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.textContent = playing ? '♫ Tắt nhạc' : '♫ Bật nhạc';
  }

  function playMusic() {
    if (!config.music || audioMissing) return;
    if (!audio.hasAttribute('src')) audio.src = config.music;
    audio.play().catch(refreshMusic);
  }

  audio.addEventListener('error', () => {
    audioMissing = true;
    refreshMusic();
  });
  ['loadedmetadata', 'playing', 'pause'].forEach(type => audio.addEventListener(type, refreshMusic));
  musicButton.addEventListener('click', () => {
    if (audio.paused) playMusic();
    else audio.pause();
  });

  function stopMicrophone() {
    const session = microphone;
    microphone = undefined;
    if (!session) return;
    cancelAnimationFrame(session.frame);
    clearTimeout(session.timeout);
    session.stream?.getTracks().forEach(track => track.stop());
    if (session.context.state !== 'closed') session.context.close().catch(() => {});
    mic.disabled = false;
  }

  function blowCandle() {
    if (candle.disabled) return;
    stopMicrophone();
    micStatus.textContent = '';
    candle.disabled = true;
    candle.classList.add('out');
    mic.hidden = true;
    byId('wish-granted').hidden = false;
    const bounds = candle.getBoundingClientRect();
    effects.burst(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 'firework');
  }

  candle.addEventListener('click', blowCandle);
  mic.addEventListener('click', async () => {
    const fallback = 'Micro chưa sẵn sàng. Em vẫn có thể chạm vào nến nhé.';
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !AudioContext) {
      micStatus.textContent = fallback;
      return;
    }

    let session;
    try {
      session = { context: new AudioContext() };
      microphone = session;
      mic.disabled = true;
      micStatus.textContent = 'Đang chờ quyền dùng micro…';
      // Mở AudioContext trong thao tác bấm để hỗ trợ trình duyệt di động.
      const ready = session.context.resume().then(() => true, () => false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (microphone !== session) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      session.stream = stream;
      if (!(await ready)) throw new Error('AudioContext unavailable');
      if (microphone !== session) return;
      const analyser = session.context.createAnalyser();
      analyser.fftSize = 1024;
      session.context.createMediaStreamSource(stream).connect(analyser);
      const signal = new Uint8Array(analyser.fftSize);
      let loudSince;
      micStatus.textContent = 'Em thổi gần micro để tắt nến nhé.';
      session.timeout = setTimeout(() => {
        stopMicrophone();
        micStatus.textContent = 'Chưa nghe thấy tiếng thổi. Em thử lại hoặc chạm vào nến nhé.';
      }, 15_000);

      function listen(now) {
        analyser.getByteTimeDomainData(signal);
        let sum = 0;
        for (const sample of signal) sum += ((sample - 128) / 128) ** 2;
        if (Math.sqrt(sum / signal.length) > .10) {
          loudSince ??= now;
          if (now - loudSince > 115) {
            blowCandle();
            return;
          }
        } else {
          loudSince = undefined;
        }
        session.frame = requestAnimationFrame(listen);
      }

      session.frame = requestAnimationFrame(listen);
    } catch {
      if (session && microphone !== session) return;
      stopMicrophone();
      micStatus.textContent = fallback;
    }
  });

  function animateClass(element, className) {
    element.classList.remove(className);
    // Đọc kích thước để trình duyệt bắt đầu lại hoạt ảnh khi bấm liên tiếp.
    void element.offsetWidth;
    element.classList.add(className);
  }

  jar.addEventListener('click', () => {
    if (wishDeck.length === 0) {
      wishDeck = [...config.wishes];
      for (let i = wishDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wishDeck[i], wishDeck[j]] = [wishDeck[j], wishDeck[i]];
      }
      const last = wishDeck.length - 1;
      if (wishDeck[last] === lastWish) [wishDeck[0], wishDeck[last]] = [wishDeck[last], wishDeck[0]];
    }
    lastWish = wishDeck.pop();
    wishPaper.textContent = lastWish;
    animateClass(wishPaper, 'drawn');
    animateClass(jar, 'shaken');
  });

  function finishLetter() {
    cancelAnimationFrame(letterTimer);
    letterText.textContent = config.letter;
    readAll.hidden = true;
  }

  envelope.addEventListener('click', () => {
    const expand = letter.hidden;
    letter.hidden = !expand;
    envelope.classList.toggle('unsealed', expand);
    envelope.setAttribute('aria-expanded', String(expand));
    byId('envelope-label').textContent = expand ? 'Gấp thư' : 'Mở thư';
    cancelAnimationFrame(letterTimer);
    if (!expand) return;
    if (motion.matches) {
      finishLetter();
      return;
    }

    readAll.hidden = false;
    letterText.textContent = '';
    const start = performance.now();
    let rendered = 0;
    function type(now) {
      const length = Math.min(config.letter.length, 1 + Math.floor((now - start) / 16));
      if (length !== rendered) {
        letterText.textContent = config.letter.slice(0, length);
        rendered = length;
      }
      if (length < config.letter.length) letterTimer = requestAnimationFrame(type);
      else finishLetter();
    }
    letterTimer = requestAnimationFrame(type);
  });
  readAll.addEventListener('click', finishLetter);
  motion.addEventListener('change', () => {
    if (motion.matches && !letter.hidden) finishLetter();
  });

  function resetGift() {
    clearTimeout(giftTimer);
    if (lightbox.open) lightbox.close();
    stopMicrophone();
    audio.pause();
    opened = false;
    refreshMusic();
    celebration.hidden = true;
    giftStage.hidden = false;
    giftStage.classList.remove('is-opening');
    openGift.disabled = false;
    candle.disabled = false;
    candle.classList.remove('out');
    mic.hidden = false;
    micStatus.textContent = '';
    byId('wish-granted').hidden = true;
    if (!letter.hidden) envelope.click();
  }

  openGift.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    giftStage.classList.add('is-opening');
    openGift.disabled = true;
    playMusic();
    refreshMusic();
    effects.celebrate('confetti');
    giftTimer = setTimeout(() => {
      celebration.hidden = false;
      giftStage.hidden = true;
      window.scrollTo({ top: 0, behavior: 'instant' });
      byId('written-name').focus({ preventScroll: true });
      effects.celebrate('firework');
    }, motion.matches ? 0 : 680);
  });

  document.addEventListener('click', event => {
    if (event.detail === 0 || event.target.closest('.dev-bar, .lightbox')) return;
    effects.burst(event.clientX, event.clientY, 'heart');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (microphone) {
        stopMicrophone();
        micStatus.textContent = '';
      }
    } else {
      tick();
    }
  });

  const effects = createEffects();
  setupDevBar();
  tick();
  setInterval(tick, 200);

  function setupDevBar() {
    if (devMode === null) return;
    const bar = document.createElement('div');
    bar.className = 'dev-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Xem thử các trạng thái');
    const label = document.createElement('strong');
    label.textContent = 'DEV';
    bar.append(label);
    const labels = ['Trang chờ', 'Còn 10 giây', 'Sinh nhật'];
    eligibleDevModes.forEach((mode, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = labels[index];
      button.setAttribute('aria-pressed', String(mode === devMode));
      button.addEventListener('click', () => {
        devMode = mode;
        params.set('dev', mode);
        try {
          history.replaceState(null, '', '?' + params.toString());
        } catch {
          // Một số trình duyệt giới hạn History API với file://.
        }
        devDeadline = Date.now() + (mode === 'soon' ? 10_000 : previewDuration);
        bar.querySelectorAll('button').forEach(item => {
          item.setAttribute('aria-pressed', String(item === button));
        });
        tick();
      });
      bar.append(button);
    });
    document.body.append(bar);
  }

  function getState(now) {
    if (devMode === null) return config.getBirthdayState(now);
    const preview = config.getBirthdayState(config.birthdayStart(2026));
    const remaining = devDeadline - now;
    preview.mode = devMode === 'birthday' || (devMode === 'soon' && remaining <= 0) ? 'birthday' : 'countdown';
    preview.remaining = devMode === 'countdown' && remaining <= 0 ? previewDuration : remaining;
    return preview;
  }

  function tick() {
    const state = getState(Date.now());
    if (state.mode !== currentMode) {
      const justReachedBirthday = currentMode === 'countdown' && state.mode === 'birthday';
      currentMode = state.mode;
      countdown.hidden = currentMode !== 'countdown';
      birthday.hidden = currentMode !== 'birthday';
      if (currentMode === 'countdown') resetGift();
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (justReachedBirthday) effects.celebrate('firework');
    }
    if (state.mode === 'birthday') {
      const age = String(state.age);
      if (byId('birthday-age').textContent !== age) byId('birthday-age').textContent = age;
      return;
    }

    const sec = Math.ceil(state.remaining / 1000);
    const age = state.age;
    const copy = sec <= 60 ? 'Đếm từng giây chờ đến ngày em tròn ' + age + ' ♡'
      : sec <= 10 * 60 ? 'Chỉ còn vài phút thôi, em chuẩn bị ước đi nhé ✨'
      : sec <= 60 * 60 ? 'Chưa đầy một giờ nữa là sinh nhật em rồi đó'
      : sec <= 24 * 3600 ? 'Ngày mai là ngày đặc biệt nhất của em rồi'
      : 'Một chút nữa thôi, thế giới sẽ mừng tuổi ' + age + ' của em';
    const date = [config.birthDay, config.birthMonth, state.year].join(' · ');
    const copyEl = byId('countdown-copy');
    if (copyEl.textContent !== copy) {
      copyEl.textContent = copy;
      copyEl.classList.remove('swap'); void copyEl.offsetWidth; copyEl.classList.add('swap');
    }
    if (byId('date').textContent !== date) byId('date').textContent = date;
    byId('passed').hidden = !state.passed;
    const parts = config.getCountdownParts(state.remaining);
    parts.forEach((value, index) => {
      if (clocks[index] === value) return;
      if (clocks[index] !== undefined) animateClass(digits[index], 'changed');
      digits[index].textContent = String(value).padStart(2, '0');
      const scale = [366, 24, 60, 60][index];
      rings[index].style.strokeDashoffset = 100 * (1 - value / scale);
    });
    clocks = parts;
  }

  function createEffects() {
    function makeLayer(id, fullScreen = false) {
      const canvas = byId(id);
      const context = canvas.getContext('2d');
      return {
        canvas,
        context,
        width: 0,
        height: 0,
        resize() {
          const width = fullScreen ? window.innerWidth : canvas.clientWidth;
          const height = fullScreen ? window.innerHeight : canvas.clientHeight;
          if (width === this.width && height === this.height) return;
          this.width = width;
          this.height = height;
          const ratio = Math.min(window.devicePixelRatio || 1, smallScreen.matches ? 1.5 : 2);
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          context?.setTransform(ratio, 0, 0, ratio, 0, 0);
        },
        clear() { context?.clearRect(0, 0, this.width, this.height); }
      };
    }

    const ambient = makeLayer('ambient', true);
    const overlay = makeLayer('fireworks', true);
    const finale = makeLayer('heart');
    const palette = {
      stars: ['#ffaddd', '#c7a7ff', '#fff4fd', '#86adff'],
      petals: ['#d75085', '#f58aa8', '#e8739d', '#ad4676'],
      gold: ['#e7c075', '#fff0c7', '#fff8e5', '#b18a49']
    }[theme];
    const isPetals = theme === 'petals';
    const isStars = theme === 'stars';
    const random = (a, b) => a + Math.random() * (b - a);
    const make = (count, factory) => Array.from({ length: count }, factory);
    const backdrop = make(smallScreen.matches ? 36 : 76, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      phase: random(0, Math.PI * 2),
      size: isPetals ? random(2.5, 8) : random(.55, 1.8),
      speed: random(.45, 1.25),
      bubble: i % 8 === 0,
      color: palette[i % palette.length]
    }));
    const heartPoints = make(smallScreen.matches ? 82 : 140, (_, i) => {
      const angle = i * 2.399963;
      const fill = i % 4 === 0 ? 1 : Math.sqrt(Math.random());
      return {
        x: 16 * Math.sin(angle) ** 3 * fill,
        y: -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) -
          2 * Math.cos(3 * angle) - Math.cos(4 * angle)) * fill,
        size: random(.8, 2.25),
        phase: random(0, Math.PI * 2),
        color: palette[i % palette.length]
      };
    });
    const lanterns = make(7, (_, i) => ({ x: random(.06, .94), phase: i / 7, size: random(4, 8) }));
    let particles = [];
    let frame = 0;
    let elapsed = 0;
    let previous;
    let finaleVisible = false;

    function paintAmbient() {
      const { context, width, height } = ambient;
      if (!context) return;
      ambient.clear();
      const time = elapsed / 1000;
      for (const dot of backdrop) {
        const drift = Math.sin(time * dot.speed + dot.phase);
        const dx = dot.x * width + drift * (isPetals ? 24 : 8);
        const travel = time * (isPetals ? 24 : 5) * dot.speed;
        const dy = isStars ? dot.y * height :
          (dot.y * height + (isPetals && !dot.bubble ? travel : -travel) % height + height) % height;
        context.globalAlpha = isPetals ? .34 + .12 * drift : .36 + .3 * drift;
        context.fillStyle = context.strokeStyle = dot.color;
        context.beginPath();
        if (isPetals && dot.bubble) {
          context.arc(dx, dy, dot.size * 1.65, 0, Math.PI * 2);
          context.stroke();
        } else if (isPetals) {
          context.ellipse(dx, dy, dot.size, dot.size * .49, dot.phase + time * .65, 0, Math.PI * 2);
          context.fill();
        } else {
          context.arc(dx, dy, Math.max(.45, dot.size + .2 * drift), 0, Math.PI * 2);
          context.fill();
        }
      }
      if (isStars && !motion.matches) {
        const progress = (time % 8 - .8) / 1.25;
        if (progress > 0 && progress < 1) {
          const x = width * (.91 - .62 * progress);
          const y = height * (.08 + .26 * progress);
          const tail = Math.min(width * .21, 140);
          const trail = context.createLinearGradient(x, y, x + tail, y - tail * .42);
          trail.addColorStop(0, '#fff0fc');
          trail.addColorStop(1, '#d4a7ff00');
          context.globalAlpha = Math.sin(Math.PI * progress);
          context.strokeStyle = trail;
          context.lineWidth = 1.4;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x + tail, y - tail * .42);
          context.stroke();
        }
      }
      context.globalAlpha = 1;
    }

    function paintFinale() {
      const { context, width, height } = finale;
      if (!context || !width || !height) return;
      finale.clear();
      const time = elapsed / 1000;
      const scale = Math.min(width / 44, height / 33) * (1 + .025 * Math.sin(time * 1.8));
      for (const dot of heartPoints) {
        const shine = .67 + .3 * Math.sin(time * 2 + dot.phase);
        context.globalAlpha = shine;
        context.fillStyle = dot.color;
        context.beginPath();
        context.arc(width / 2 + dot.x * scale, height * .48 + dot.y * scale, dot.size, 0, Math.PI * 2);
        context.fill();
      }
      if (isStars && !motion.matches) {
        for (const lantern of lanterns) {
          const progress = (time / 9 + lantern.phase) % 1;
          const x = width * lantern.x + 12 * Math.sin(progress * Math.PI * 2);
          const y = height * (1 - progress);
          const s = lantern.size;
          context.globalAlpha = Math.sin(progress * Math.PI) * .85;
          context.fillStyle = '#ffb573';
          context.fillRect(x - s / 2, y, s, s * 1.25);
          context.fillStyle = '#fff0ba';
          context.fillRect(x - s * .27, y + s * .8, s * .54, s * .36);
        }
      }
      context.globalAlpha = 1;
    }

    function paintParticles(dt) {
      const { context } = overlay;
      if (!context) return;
      overlay.clear();
      const active = [];
      for (const dot of particles) {
        dot.age += dt;
        if (dot.age >= dot.life) continue;
        active.push(dot);
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;
        if (dot.type !== 'heart') dot.vy += (dot.type === 'confetti' ? .0017 : .0011) * dt;
        context.globalAlpha = Math.min(1, (1 - dot.age / dot.life) * 1.7);
        context.fillStyle = dot.color;
        if (dot.type === 'heart') {
          context.font = dot.size + 'px Georgia, serif';
          context.fillText('♥', dot.x, dot.y);
        } else if (dot.type === 'confetti') {
          context.save();
          context.translate(dot.x, dot.y);
          context.rotate(dot.angle + dot.age * .008);
          context.fillRect(-dot.size, -dot.size / 2, dot.size * 2, dot.size);
          context.restore();
        } else {
          context.beginPath();
          context.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
          context.fill();
        }
      }
      particles = active;
      context.globalAlpha = 1;
    }

    function draw(now) {
      frame = 0;
      const dt = previous === undefined ? 16 : Math.min(42, now - previous);
      previous = now;
      elapsed += dt;
      paintAmbient();
      if (finaleVisible) paintFinale();
      if (particles.length) paintParticles(dt);
      start();
    }

    function start() {
      if (!frame && !motion.matches && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function resize() {
      ambient.resize();
      overlay.resize();
      finale.resize();
      if (motion.matches) {
        paintAmbient();
        paintFinale();
      }
    }

    function updateMotion() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = undefined;
      if (motion.matches) {
        particles = [];
        overlay.clear();
        paintAmbient();
        paintFinale();
      } else {
        start();
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    motion.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateMotion);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(finale.canvas);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        finaleVisible = entry.isIntersecting;
        if (finaleVisible) {
          resize();
          if (motion.matches) paintFinale();
        }
      }).observe(finale.canvas);
    } else {
      finaleVisible = true;
    }
    resize();
    start();

    function burst(x, y, type) {
      if (motion.matches || !overlay.context) return;
      const count = type === 'heart' ? 4 : smallScreen.matches ? 32 : 55;
      const limit = smallScreen.matches ? 112 : 240;
      for (let i = 0; i < count; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(.055, .33);
        particles.push({
          type, x, y, angle, age: 0,
          vx: type === 'heart' ? random(-.045, .045) : Math.cos(angle) * speed,
          vy: type === 'heart' ? random(-.15, -.07) : Math.sin(angle) * speed,
          life: type === 'confetti' ? random(900, 1500) : random(520, 1000),
          color: palette[i % palette.length],
          size: type === 'heart' ? random(12, 21) : random(1.2, 3.5)
        });
      }
      if (particles.length > limit) particles.splice(0, particles.length - limit);
      start();
    }

    function celebrate(type) {
      burst(overlay.width * .38, overlay.height * .41, type);
      burst(overlay.width * .69, overlay.height * .28, type);
    }

    return { burst, celebrate };
  }
})();
