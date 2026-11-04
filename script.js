// 1. JSが動くことをCSSに伝える(ふわっと表示は、JSがあるときだけ有効)
document.documentElement.classList.add('js');

const header = document.querySelector('.site-header');
const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 2. スマホのメニューを開け閉めする
function closeMenu() {
  if (nav && btn) {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
}

if (btn && nav) {
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
}

// 3. ページ内リンクを、なめらかにスクロールさせる
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothScrollTo(targetY) {
  if (reduceMotion) {
    window.scrollTo(0, targetY);
    return;
  }
  const startY = window.scrollY;
  const distance = targetY - startY;
  // 距離に応じて時間を変える（近ければ短く、遠ければ少し長く）
  const duration = Math.min(1000, Math.max(400, Math.abs(distance) * 0.5));
  let startTime = null;

  function step(now) {
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    const target = id === '#' ? null : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const headerHeight = header ? header.offsetHeight : 0;
    const y = target.getBoundingClientRect().top + window.scrollY - headerHeight;
    smoothScrollTo(Math.max(0, y));
    history.replaceState(null, '', id);
    closeMenu();
  });
});

// 4. いま見ているセクションのリンクを、ヘッダーで強調する
const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateCurrent() {
  if (!sections.length) return;
  const line = (header ? header.offsetHeight : 0) + window.innerHeight * 0.3;
  let current = sections[0];
  sections.forEach((sec) => {
    if (sec.getBoundingClientRect().top <= line) current = sec;
  });
  // 一番下まで来たら、最後のセクションを強調する
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    current = sections[sections.length - 1];
  }
  navLinks.forEach((link) => {
    if (link.getAttribute('href') === '#' + current.id) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

if (sections.length) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateCurrent();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateCurrent);
  updateCurrent();
}

// 5. 画面に入った要素を、ふわっと表示する
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add('in'));
}
