// This module is intentionally exclusive to the coming-soon page.
const page = document.querySelector('body.coming');

if (page) {
  const journey = page.querySelector('.coming-journey');
  const panels = [...page.querySelectorAll('.coming-panel')];
  const desktop = window.matchMedia('(min-width: 701px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let trackStart = 0;
  let trackLength = 1;

  const clamp = (value) => Math.min(1, Math.max(0, value));
  const smoothstep = (value) => value * value * (3 - 2 * value);

  function render() {
    frame = 0;
    if (!desktop.matches) return;
    const progress = clamp((window.scrollY - trackStart) / trackLength);
    // Holds at each composition, with two reversible crossfades.
    const first = smoothstep(clamp((progress - 0.16) / 0.18));
    const second = smoothstep(clamp((progress - 0.56) / 0.18));
    const weights = [1 - first, first * (1 - second), second];
    const active = progress < 0.25 ? 0 : progress < 0.65 ? 1 : 2;

    panels.forEach((panel, index) => {
      const opacity = reducedMotion.matches ? Number(index === active) : weights[index];
      panel.style.opacity = String(opacity);
      panel.style.visibility = opacity > 0.001 ? 'visible' : 'hidden';
      panel.style.transform = reducedMotion.matches ? 'none' : `translateY(${(1 - opacity) * 12}px) scale(${0.99 + opacity * 0.01})`;
      panel.setAttribute('aria-hidden', String(index !== active));
    });
  }

  function schedule() {
    if (desktop.matches && !frame) frame = requestAnimationFrame(render);
  }

  function measure() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    page.classList.add('is-enhanced');
    if (desktop.matches) {
      trackStart = journey.getBoundingClientRect().top + window.scrollY;
      trackLength = Math.max(1, journey.offsetHeight - page.querySelector('.coming-stage').offsetHeight);
      render();
    } else {
      panels.forEach((panel) => {
        panel.style.removeProperty('opacity');
        panel.style.removeProperty('visibility');
        panel.style.removeProperty('transform');
        panel.removeAttribute('aria-hidden');
      });
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  desktop.addEventListener('change', measure);
  reducedMotion.addEventListener('change', measure);
  document.fonts.ready.then(measure);
  measure();

  // Pause decorative motion outside the viewport and in background tabs.
  // Scene visibility still comes from the existing reversible scroll journey.
  const motionGroups = page.querySelectorAll('.coming-signup, .coming-panel, .coming-footer-canvas');
  if ('IntersectionObserver' in window) {
    const motionObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target.classList.toggle('is-motion-visible', isIntersecting);
      });
    });
    motionGroups.forEach((group) => motionObserver.observe(group));
  } else {
    motionGroups.forEach((group) => group.classList.add('is-motion-visible'));
  }
  function updateMotionVisibility() {
    page.classList.toggle('is-motion-hidden', document.hidden);
  }
  document.addEventListener('visibilitychange', updateMotionVisibility);
  updateMotionVisibility();

  // Both forms use the same existing Formspree endpoint. No personal data is
  // persisted locally. A positive server response alone triggers success.
  page.querySelectorAll('[data-subscribe]').forEach((form) => {
    const status = form.querySelector('[role="status"]');
    const submit = form.querySelector('button[type="submit"]');
    let pending = false;

    form.addEventListener('invalid', (event) => {
      event.target.setAttribute('aria-invalid', 'true');
      status.textContent = event.target.type === 'email'
        ? 'Введи корректный e-mail, например name@example.com.'
        : 'Напиши, как тебя зовут.';
    }, true);

    form.addEventListener('input', (event) => {
      if (event.target.matches('input')) event.target.removeAttribute('aria-invalid');
      if (!pending) status.textContent = '';
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (pending) return;
      const name = form.elements.namedItem('name');
      if (name && !name.value.trim()) {
        name.setCustomValidity('Напиши, как тебя зовут.');
        form.reportValidity();
        name.setCustomValidity('');
        return;
      }
      if (!form.reportValidity()) return;

      pending = true;
      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      status.textContent = 'Отправляем…';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const data = new FormData(form);
      if (name) data.set('name', name.value.trim());
      data.set('email', String(data.get('email')).trim());

      try {
        const response = await fetch(form.action, {
          method: 'POST', body: data, headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.ok !== true || result?.errors?.length) {
          throw new Error('Submission rejected');
        }
        status.textContent = 'Заявка отправлена! Сообщим о запуске.';
        form.reset();
      } catch (error) {
        status.textContent = error.name === 'AbortError'
          ? 'Сервис не ответил вовремя. Попробуй отправить ещё раз.'
          : 'Не получилось отправить. Проверь соединение и попробуй ещё раз.';
      } finally {
        clearTimeout(timeout);
        pending = false;
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    });
  });
}
