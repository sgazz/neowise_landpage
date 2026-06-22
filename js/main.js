const navToggle = document.querySelector('.nav-toggle');
document.documentElement.classList.add('motion-ready');

const navMenu = document.querySelector('#nav-menu');
const betaModal = document.querySelector('#beta-modal');
const betaPanel = betaModal?.querySelector('.modal-panel');
const privacyModal = document.querySelector('#privacy-settings-modal');
const privacyPanel = privacyModal?.querySelector('.modal-panel');
const cookieBanner = document.querySelector('#cookie-banner');
const openBetaButtons = document.querySelectorAll('[data-open-beta-modal]');
const closeBetaButtons = document.querySelectorAll('[data-close-beta-modal]');
const openPrivacyButtons = document.querySelectorAll('[data-open-privacy-settings]');
const closePrivacyButtons = document.querySelectorAll('[data-close-privacy-settings]');
const acceptNecessaryButtons = document.querySelectorAll('[data-accept-necessary]');
const savePrivacyButtons = document.querySelectorAll('[data-save-privacy-settings]');
const getDefaultBetaApiUrl = () => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8787/api/beta-request';
  }
  return '/api/beta-request';
};
const NEOWISE_BETA_API_URL = window.NEOWISE_BETA_API_URL || getDefaultBetaApiUrl();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const cookiePreferenceKey = 'neowiseCookiePreferences';
const themeStorageKey = 'neowiseTheme';
const storageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const storageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in private browsing or strict browser settings.
  }
};
let activeModal = null;
let activePanel = null;
let modalTrigger = null;
let modalTimer = null;

const revealImmediately = (elements) => {
  elements.forEach((element) => {
    element.classList.add('is-visible');
  });
};

const initMotionReveal = () => {
  const revealElements = [...document.querySelectorAll('.motion-reveal')];
  if (!revealElements.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealImmediately(revealElements);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: '0px 0px -6% 0px' }
  );

  revealElements.forEach((element) => observer.observe(element));
};

const hasCookiePreferences = () => Boolean(storageGet(cookiePreferenceKey));

const shouldAutoOpenBeta = () => betaModal && sessionStorage.getItem('neowiseBetaModalClosed') !== 'true';

const scheduleBetaModal = () => {
  if (!shouldAutoOpenBeta() || !hasCookiePreferences() || modalTimer) return;
  modalTimer = window.setTimeout(() => {
    modalTimer = null;
    openBetaModal(null, true);
  }, 6000);
};

const saveNecessaryPreferences = () => {
  storageSet(cookiePreferenceKey, JSON.stringify({
    necessary: true,
    analytics: false,
    marketing: false,
    savedAt: new Date().toISOString(),
  }));
  if (cookieBanner) cookieBanner.hidden = true;
  scheduleBetaModal();
};

const closeNav = () => {
  if (!navMenu?.classList.contains('open')) return;
  navMenu.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
};

const openModal = (modal, panel, trigger = null) => {
  if (!modal || !panel || !modal.hidden) return;
  if (activeModal) closeModal(false);

  activeModal = modal;
  activePanel = panel;
  modalTrigger = trigger;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  panel.focus();
};

const closeModal = (returnFocus = true) => {
  if (!activeModal) return;

  const previousTrigger = modalTrigger;
  activeModal.hidden = true;
  activeModal = null;
  activePanel = null;
  modalTrigger = null;
  document.body.classList.remove('modal-open');

  if (returnFocus && previousTrigger) previousTrigger.focus();
};

const openBetaModal = (trigger = null, automatic = false) => {
  if (!betaModal || !betaPanel || !betaModal.hidden) return;
  if (automatic && sessionStorage.getItem('neowiseBetaModalClosed') === 'true') return;

  if (!automatic && modalTimer) {
    window.clearTimeout(modalTimer);
    modalTimer = null;
  }

  openModal(betaModal, betaPanel, trigger);
};

const closeBetaModal = () => {
  if (!betaModal || betaModal.hidden) return;
  sessionStorage.setItem('neowiseBetaModalClosed', 'true');
  closeModal(true);
};

const openPrivacySettings = (trigger = null) => {
  openModal(privacyModal, privacyPanel, trigger);
};

const closePrivacySettings = () => {
  if (!privacyModal || privacyModal.hidden) return;
  closeModal(true);
};

const trapModalFocus = (event) => {
  if (!activeModal || !activePanel || event.key !== 'Tab') return;

  const focusable = [...activeModal.querySelectorAll(focusableSelector)].filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    closeNav();
  });
});

openBetaButtons.forEach((button) => {
  button.addEventListener('click', () => {
    closeNav();
    openBetaModal(button);
  });
});

closeBetaButtons.forEach((button) => {
  button.addEventListener('click', closeBetaModal);
});

openPrivacyButtons.forEach((button) => {
  button.addEventListener('click', () => openPrivacySettings(button));
});

closePrivacyButtons.forEach((button) => {
  button.addEventListener('click', closePrivacySettings);
});

acceptNecessaryButtons.forEach((button) => {
  button.addEventListener('click', saveNecessaryPreferences);
});

savePrivacyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    saveNecessaryPreferences();
    closePrivacySettings();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeNav();
    if (activeModal === betaModal) closeBetaModal();
    else if (activeModal === privacyModal) closePrivacySettings();
    return;
  }

  trapModalFocus(event);
});

const getFormStatus = (form) => {
  let status = form.querySelector('.form-status');

  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('aria-live', 'polite');
    form.insertAdjacentElement('afterend', status);
  }

  return status;
};

const setFormStatus = (form, message, type) => {
  const status = getFormStatus(form);
  status.textContent = message;
  status.classList.remove('form-status--success', 'form-status--error');
  status.classList.add(`form-status--${type}`);
};

const getFieldValue = (form, selectors) => {
  const field = selectors.map((selector) => form.querySelector(selector)).find(Boolean);
  return field?.value?.trim() || '';
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getBetaFormPayload = (form) => {
  const params = new URLSearchParams(window.location.search);
  const consentField = form.querySelector('input[name="consent"], [data-beta-consent]');
  const useCase = getFieldValue(form, ['[name="goal"]', '[name="use_case"]', '[name="message"]']);
  const textGoal = getFieldValue(form, ['textarea[name="goal"]', 'textarea[name="message"]', 'textarea[name="learning"]', 'textarea']);
  const goal = [useCase, textGoal].filter(Boolean).join(' — ');

  return {
    name: getFieldValue(form, ['[name="name"]']),
    email: getFieldValue(form, ['[name="email"]', 'input[type="email"]']),
    role: getFieldValue(form, ['[name="role"]']),
    goal,
    source: getFieldValue(form, ['[name="source"]']) || form.dataset.betaSource || 'unknown',
    consent: consentField ? consentField.checked === true : true,
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
  };
};

const getCurrentUtmQueryString = () => {
  const current = new URLSearchParams(window.location.search);
  const utm = new URLSearchParams();

  ['utm_source', 'utm_medium', 'utm_campaign'].forEach((key) => {
    const value = current.get(key);
    if (value) utm.set(key, value);
  });

  const query = utm.toString();
  return query ? `?${query}` : '';
};

document.querySelectorAll('form[data-beta-form="true"]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = getBetaFormPayload(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent;

    if (!isValidEmail(payload.email) || !payload.consent) {
      setFormStatus(form, 'Please enter a valid email and accept the beta consent.', 'error');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    fetch(NEOWISE_BETA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.message || 'We could not submit your request. Please try again.');
        }
        return data;
      })
      .then((data) => {
        form.classList.add('is-success');
        form.classList.remove('is-error');
        setFormStatus(form, data.message || 'Thank you. Your beta request has been received.', 'success');
        const hiddenValues = [...form.querySelectorAll('input[type="hidden"]')].map((input) => [
          input,
          input.value,
        ]);
        form.reset();
        hiddenValues.forEach(([input, value]) => {
          input.value = value;
        });
        window.setTimeout(() => {
          window.location.href = `/thank-you/${getCurrentUtmQueryString()}`;
        }, 900);
      })
      .catch((error) => {
        form.classList.add('is-error');
        form.classList.remove('is-success');
        const message =
          error instanceof TypeError
            ? 'We could not reach the beta server. Please try again later.'
            : error.message || 'We could not submit your request. Please try again.';
        setFormStatus(
          form,
          message,
          'error'
        );
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      });
  });
});

if (cookieBanner && !hasCookiePreferences()) {
  cookieBanner.hidden = false;
}

if (shouldAutoOpenBeta() && hasCookiePreferences()) {
  scheduleBetaModal();
}

window.addEventListener('beforeunload', () => {
  if (modalTimer) window.clearTimeout(modalTimer);
});


const defaultBetaShareData = {
  title: 'Join the Neowise private beta',
  text: 'Neowise is opening a private beta for learners, students, and educators. Help shape a personal AI learning mentor built around understanding, practice, memory, and progress.',
  url: 'https://www.neowise.ai/beta/?utm_source=copy&utm_medium=referral&utm_campaign=beta_invite',
};

const getShareContext = (element) => {
  const panel = element.closest('.share-panel');

  return {
    panel,
    status: panel?.querySelector('[data-share-status]'),
    source: panel?.querySelector('.share-copy-source'),
    data: {
      title: panel?.dataset.shareTitle || defaultBetaShareData.title,
      text: panel?.dataset.shareText || defaultBetaShareData.text,
      url: panel?.dataset.shareUrl || defaultBetaShareData.url,
    },
  };
};

const setShareStatus = (status, message) => {
  if (status) status.textContent = message;
};

const copyBetaLink = async (context) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(context.data.url);
    } else if (context.source) {
      context.source.hidden = false;
      context.source.focus();
      context.source.select();
      document.execCommand('copy');
      context.source.blur();
      context.source.hidden = true;
    } else {
      setShareStatus(context.status, 'Copy the link and share it with someone who should test Neowise.');
      return;
    }

    setShareStatus(context.status, 'Beta link copied.');
  } catch {
    setShareStatus(context.status, 'Copy the link and share it with someone who should test Neowise.');
  }
};

document.querySelectorAll('[data-share-beta]').forEach((button) => {
  button.addEventListener('click', async () => {
    const context = getShareContext(button);

    if (navigator.share) {
      try {
        await navigator.share(context.data);
        setShareStatus(context.status, 'Beta invitation ready to share.');
      } catch {
        setShareStatus(context.status, 'Sharing was cancelled or unavailable.');
      }
      return;
    }

    await copyBetaLink(context);
  });
});

document.querySelectorAll('[data-copy-beta-link]').forEach((button) => {
  button.addEventListener('click', () => copyBetaLink(getShareContext(button)));
});

const getPreferredTheme = () => {
  const saved = storageGet(themeStorageKey);
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
};

const applyTheme = (theme) => {
  const isLight = theme === 'light';
  if (isLight) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = isLight ? '#f4f6fa' : '#08050f';

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(isLight));
    const label = isLight ? 'Switch to dark theme' : 'Switch to light theme';
    button.setAttribute('aria-label', label);
    const labelNode = button.querySelector('[data-theme-toggle-label]');
    if (labelNode) labelNode.textContent = label;
  });
};

const initTheme = () => {
  applyTheme(getPreferredTheme());

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      storageSet(themeStorageKey, nextTheme);
      applyTheme(nextTheme);
    });
  });
};

initMotionReveal();
initTheme();
