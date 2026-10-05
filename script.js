gsap.registerPlugin(ScrollTrigger);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const mob = matchMedia('(max-width:760px)').matches;
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const OX = mob ? 0 : 120, OY = mob ? -105 : 0;

/* ---------- Camera: focus point (fx,fy) of the anatomy lands at stage centre ---------- */
const pose = (fx, fy, s, r = 0, ox = OX) => {
  const a = r * Math.PI / 180, dx = (fx - 300) * s, dy = (fy - 350) * s;
  return { scale: s, rotation: r, x: ox - (dx * Math.cos(a) - dy * Math.sin(a)), y: OY - (dx * Math.sin(a) + dy * Math.cos(a)) };
};
const S = mob ? .8 : 1; // mobile composes the anatomy smaller
const poses = [
  pose(150, 400, .6 * S, 0, 0), pose(300, 340, 1.45 * S, -3), pose(318, 420, 2.3 * S, 2), pose(305, 440, 3 * S),
  pose(298, 385, 3.6 * S, -4), pose(300, 410, 1.8 * S), pose(300, 360, 1.3 * S), pose(312, 420, 2 * S),
  pose(300, 420, 1.7 * S, 22), pose(300, 340, 1.2 * S, 0), pose(300, 330, .85 * S, 0), pose(300, 330, 1 * S, 14, 0)
];
gsap.set('#cam', { svgOrigin: '300 350', ...poses[0] });
gsap.set('#sk', { strokeDasharray: 1, strokeDashoffset: 1 });
gsap.set('#tn', { y: -60 }); // tonsil tip starts at the foramen magnum reference
gsap.set('.lb', { opacity: 0 });
gsap.set('.lines span', { opacity: .12 });
gsap.set('#cbg', { opacity: 0 });

/* idle breathing + mouse parallax (very subtle) */
gsap.to('#br', { scale: 1.012, y: -4, svgOrigin: '300 300', duration: 3.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
gsap.set('#stage', { transformPerspective: 1400 });
const qx = gsap.quickTo('#par', 'x', { duration: 1.3, ease: 'power3' }), qy = gsap.quickTo('#par', 'y', { duration: 1.3, ease: 'power3' });
const rY = gsap.quickTo('#stage', 'rotationY', { duration: 1.6, ease: 'power3' }), rX = gsap.quickTo('#stage', 'rotationX', { duration: 1.6, ease: 'power3' });
const fxX = gsap.quickTo('#fx', 'x', { duration: 2.2, ease: 'power3' }), fxY = gsap.quickTo('#fx', 'y', { duration: 2.2, ease: 'power3' });
const spX = gsap.quickTo('#spot', 'x', { duration: .7, ease: 'power3' }), spY = gsap.quickTo('#spot', 'y', { duration: .7, ease: 'power3' });
addEventListener('pointermove', e => {
  const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
  qx(nx * 80); qy(ny * 55);                 // anatomy follows the cursor direction
  if (!mob) { rY(nx * 9); rX(-ny * 6); }    // gentle 3D tilt toward the cursor
  fxX(-nx * 50); fxY(-ny * 35);             // particles drift the other way for depth
  spX(e.clientX); spY(e.clientY);           // soft light follows the cursor
});

/* ---------- Master timeline: 12 units, one per section; scrub = fully reversible ---------- */
const mm = $('#mm'), cnt = { v: 0 }, fx = { out: 0, v: 0 };
const panels = $$('.p'), st = $$('.st');
const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '#sp', start: 'top top', end: 'bottom bottom', scrub: 1.2,
    onUpdate: s => {
      $('#prog').style.transform = `scaleX(${s.progress})`;
      fx.v = Math.max(fx.v, Math.min(1, Math.abs(s.getVelocity()) / 2500));
      const idx = Math.min(11, Math.floor(s.progress * 12)); let on = 0;
      NAV.forEach((n, k) => { if (n <= idx) on = k; });
      $$('nav a').forEach((a, k) => a.classList.toggle('on', k === on));
    }
  }
});
const NAV = [0, 1, 2, 3, 4, 6, 9, 10];

// camera path
poses.slice(1).forEach((p, i) => tl.to('#cam', { ...p, duration: 1, ease: 'sine.inOut' }, i + .35));

// panels: blur-in / blur-out, hero only exits
panels.forEach((p, i) => {
  if (i > 0) tl.fromTo(p, { autoAlpha: 0, y: 34, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .15 }, i + .15);
  if (i < 11) tl.to(p, { autoAlpha: 0, y: -34, filter: 'blur(10px)', duration: .15 }, i + .82);
});

// 01 hero: cerebellum highlighted, rest dims, we enter the body
tl.to('#cbg', { opacity: .9, duration: .6 }, .3).to('#cer', { opacity: .3, duration: .6 }, .3);

// 02 look closer: transparent skull draws, anatomy separates, labels appear
tl.to('#sk', { strokeDashoffset: 0, duration: .6 }, 1)
  .to('#cbl', { x: 10, y: 10, duration: .4 }, 1.15).to('#bs', { x: -7, duration: .4 }, 1.15).to('#cord', { y: 20, duration: .4 }, 1.15)
  .to('.lb', { opacity: 1, stagger: .08, duration: .2 }, 1.35)
  .to('.lb', { opacity: 0, duration: .15 }, 1.88)
  .to(['#cbl', '#bs', '#cord'], { x: 0, y: 0, duration: .3 }, 2.02);

// 03 MRI: measurement line extends while 0 → 11.9 builds
tl.to('#ms', { opacity: 1, duration: .1 }, 2.15)
  .to('#tn', { y: 0, duration: .7, ease: 'power1.inOut' }, 2.15)
  .to('#msl', { strokeDashoffset: 0, duration: .7, ease: 'power1.inOut' }, 2.15)
  .to(cnt, { v: 11.9, duration: .7, ease: 'power1.inOut', onUpdate: () => mm.textContent = cnt.v.toFixed(1) }, 2.15)
  .to('#ms', { opacity: .45, duration: .2 }, 3.9);

// 04 crowding
tl.to('#tn', { y: 4, duration: .5 }, 3.1)
  .to('#crowd', { opacity: 1, duration: .2 }, 3.2)
  .fromTo('#ring', { scale: .75, svgOrigin: '312 428' }, { scale: 1, svgOrigin: '312 428', duration: .4, ease: 'power2.out' }, 3.2)
  .to('#an1', { strokeDashoffset: 0, duration: .4 }, 3.4)
  .to('#cord', { scaleX: .93, svgOrigin: '289 450', duration: .4 }, 3.3)
  .to('#crowd', { opacity: 0, duration: .15 }, 3.95);

// 05 brainstem: medulla shifts subtly, arrow draws
tl.to('#arw', { strokeDashoffset: 0, duration: .45 }, 4.25)
  .to('#bs', { x: 3, duration: .4 }, 4.25)
  .to('#arw', { opacity: 0, duration: .15 }, 4.95);

// 06 image → understanding: MRI zooms, scan sweeps, region lights, then reveals anatomy
tl.fromTo('#mri', { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, 5.1)
  .fromTo('#mri svg', { scale: 1 }, { scale: 1.45, svgOrigin: '50% 60%', duration: .85 }, 5.1)
  .fromTo('.scan', { top: '0%' }, { top: '100%', duration: .5 }, 5.25)
  .to('#mhl', { opacity: 1, duration: .15 }, 5.6)
  .to('#mri', { clipPath: 'inset(100% 0 0 0)', duration: .3, ease: 'power2.inOut' }, 5.7)
  .set('#mri', { autoAlpha: 0 }, 6.1).set('#mri', { clipPath: 'inset(0% 0 0 0)' }, 6.1);
tl.to('#cer', { opacity: 1, duration: .2 }, 5.7).to('#cbg', { opacity: 0, duration: .2 }, 5.7);

// 07 journey: horizontal timeline, anatomy stays fixed
const unit = () => innerWidth * (mob ? .7 : .42);
tl.fromTo('#tlw', { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, 6.15)
  .fromTo('#tr', { x: () => innerWidth * .06 }, { x: () => -3 * unit() + (innerWidth - unit()) / 2, duration: 2.7 }, 6.3)
  .to('#tlw', { autoAlpha: 0, duration: .15 }, 9.75);
[6.3, 7.1, 8.0, 9.0].forEach((t, k) => {
  tl.to(st[k], { opacity: 1, duration: .1 }, t);
  if (k < 3) tl.to(st[k], { opacity: .28, duration: .1 }, [7.1, 8.0, 9.0][k]);
});

// 08 before: MRI finding ↔ visual interpretation
const lkp = $('#lkp'), m2 = $('#mri2'), tg = $('#tgt');
tl.fromTo('#mri2', { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, 7.15)
  .fromTo('#vi', { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, 7.2)
  .fromTo('#lk', { opacity: 0 }, { opacity: 1, duration: .15 }, 7.3)
  .to(['#mri2', '#vi', '#lk'], { autoAlpha: 0, duration: .15 }, 7.85)
  .to('#lk', { opacity: 0, duration: .1 }, 7.85);
tl.eventCallback('onUpdate', () => {
  const t = tl.time(); if (t < 7 || t > 8.1) return;
  const a = m2.getBoundingClientRect(), b = tg.getBoundingClientRect(), y = a.top + a.height * .55;
  lkp.setAttribute('d', `M${a.right} ${y}C${a.right + 90} ${y} ${b.left - 90} ${b.top} ${b.left} ${b.top}`);
});

// 09 transformation: lines retract, abstract rings mark the intervention
tl.to('#ms', { opacity: 0, duration: .2 }, 8.05)
  .to('#abs', { opacity: 1, duration: .2 }, 8.2)
  .fromTo('#abs circle', { scale: .6, svgOrigin: '300 428' }, { scale: 1, svgOrigin: '300 428', stagger: .08, duration: .5, ease: 'power2.out' }, 8.2)
  .to('#abs', { opacity: 0, duration: .2 }, 8.85)
  .to('#ref', { opacity: 0, duration: .2 }, 8.4);

// 10 recovery: environment lightens, particles drift outward
tl.to('#bg', { backgroundColor: '#34454f', duration: .6 }, 8.95)
  .to(fx, { out: 1, duration: .5 }, 9.05)
  .to(fx, { out: 0, duration: .4 }, 9.85)
  .to('#bg', { backgroundColor: '#000000', duration: .5 }, 10.45)
  .to('#anat,#photo', { opacity: .3, duration: .3 }, 10.05).to('#anat,#photo', { opacity: .5, duration: .3 }, 11.05);

// 11 what I learned: lines arrive in sequence
$$('.lines span').forEach((s, i) => tl.to(s, { opacity: 1, duration: .1 }, 10.2 + i * .15));

/* ---------- Hero text reveal + hover distortion ---------- */
const title = $('#title');
title.innerHTML = title.textContent.split(' ').map(w => `<span class="w">${[...w].map(c => `<span class="ch">${c}</span>`).join('')}</span>`).join(' ');
if (!calm) gsap.from('.ch', { yPercent: 115, rotate: 5, opacity: 0, stagger: .035, duration: 1.3, ease: 'expo.out', delay: .3 });
$$('.ch').forEach(c => c.addEventListener('pointerenter', () => gsap.fromTo(c, { skewX: 0 }, { skewX: -14, yPercent: -7, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out' })));

/* ---------- Custom cursor ---------- */
const cur = $('.cur'), ring = $('.ring');
const cx = gsap.quickTo(cur, 'x', { duration: .05 }), cy = gsap.quickTo(cur, 'y', { duration: .05 });
const rx = gsap.quickTo(ring, 'x', { duration: .35 }), ry = gsap.quickTo(ring, 'y', { duration: .35 });
addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); rx(e.clientX); ry(e.clientY); });
$$('[data-h]').forEach(el => { el.addEventListener('pointerenter', () => ring.classList.add('big')); el.addEventListener('pointerleave', () => ring.classList.remove('big')); });

/* ---------- Navigation: jump to the middle of a section ---------- */
$$('[data-i]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const s = tl.scrollTrigger, i = +a.dataset.i;
  scrollTo({ top: s.start + (i === 0 ? 0 : (i + .5) / 12) * (s.end - s.start) * (i === 0 ? 1 : 1), behavior: 'smooth' });
}));

/* ---------- Particles (fewer on mobile; speed follows scroll velocity) ---------- */
if (!calm) {
  const cv = $('#fx'), c = cv.getContext('2d'); let W, H;
  const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; size(); addEventListener('resize', size);
  const pts = Array.from({ length: mob ? 34 : 90 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, z: .3 + Math.random() * .7 }));
  gsap.ticker.add(() => {
    c.clearRect(0, 0, W, H); fx.v *= .94;
    for (const p of pts) {
      p.y -= (.12 + fx.v * 3.2) * p.z;
      p.x += (p.x - W / 2) * .0012 * fx.out * p.z + (p.y - H / 2) * .0006 * fx.out * p.z * 0;
      p.y += (p.y - H / 2) * .0012 * fx.out * p.z;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5 || p.x > W + 5 || p.y > H + 5) { p.x = W / 2 + (Math.random() - .5) * 60; p.y = H / 2 + (Math.random() - .5) * 60; }
      c.fillStyle = `rgba(165,195,220,${.5 * p.z})`; c.fillRect(p.x, p.y, 1.4 * p.z + .4, 1.4 * p.z + .4);
    }
  });
}
/* ---------- Living brain: neural pulses, firing nodes, cord signal ---------- */
if (!calm) {
  $$('.nd').forEach(n => gsap.fromTo(n, { opacity: .1, attr: { r: 1.2 } }, { opacity: 1, attr: { r: 3.2 }, duration: 1 + Math.random() * 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: Math.random() * 2 }));
  gsap.fromTo('.cp', { strokeDashoffset: 0 }, { strokeDashoffset: -80, duration: 1.5, repeat: -1, ease: 'none' });
  gsap.to('#cglow', { attr: { 'fill-opacity': .5 }, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}
addEventListener('resize', () => ScrollTrigger.refresh());
