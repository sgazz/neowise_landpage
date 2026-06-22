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

const HERO_PREVIEW_TOPICS = [
  {
    category: 'Space science',
    label: 'The life of a star',
    mentor: 'Stars do not simply disappear. They change when the balance between gravity and energy breaks.',
    user: 'Can you explain that without heavy physics?',
    next: 'First, compare a stable star, a red giant, and a supernova. Then we will connect each stage to one simple force: gravity.',
    mini: [
      { label: 'Understand', value: 'star life cycle' },
      { label: 'Apply', value: '3 examples' },
      { label: 'Progress', value: '+18% this week' },
    ],
  },
  {
    category: 'AI literacy',
    label: 'How OCR works',
    mentor: 'OCR turns text inside an image or scanned page into editable, searchable text.',
    user: 'Can you explain it like I\u2019m new to AI tools?',
    next: 'Compare a photo of a page, a scanned PDF, and editable text. Then we will connect OCR to search and retrieval.',
    mini: [
      { label: 'Understand', value: 'OCR basics' },
      { label: 'Apply', value: '3 examples' },
      { label: 'Progress', value: '+12% this week' },
    ],
  },
  {
    category: 'Research skills',
    label: 'What is RAG?',
    mentor: 'RAG helps an AI answer using trusted documents instead of relying only on memory.',
    user: 'So it is like giving the AI a library?',
    next: 'Yes. First we choose sources, then retrieve the most relevant parts, then generate an answer grounded in them.',
    mini: [
      { label: 'Understand', value: 'retrieval' },
      { label: 'Apply', value: 'source check' },
      { label: 'Progress', value: '+15% this week' },
    ],
  },
  {
    category: 'Biology exam',
    label: 'How cells make energy',
    mentor: 'Cell respiration is how cells turn glucose and oxygen into usable energy.',
    user: 'What should I remember for the test?',
    next: 'Focus on the three stages: glycolysis, Krebs cycle, and electron transport. We will turn them into a memory path.',
    mini: [
      { label: 'Understand', value: 'ATP' },
      { label: 'Apply', value: 'quiz mode' },
      { label: 'Progress', value: '72%' },
    ],
  },
  {
    category: 'Math confidence',
    label: 'Equations without fear',
    mentor: 'An equation is a balance. Whatever you do to one side, you must do to the other.',
    user: 'That makes algebra less scary.',
    next: 'Good. Now solve three simple equations by keeping the balance visible at every step.',
    mini: [
      { label: 'Understand', value: 'balance' },
      { label: 'Apply', value: '5 problems' },
      { label: 'Progress', value: '+9% today' },
    ],
  },
  {
    category: 'History insight',
    label: 'Why empires fall',
    mentor: 'Empires usually fall from a combination of pressure: economy, leadership, borders, and social trust.',
    user: 'Can we compare Rome with another empire?',
    next: 'Yes. Let\u2019s compare Rome and the Ottoman Empire using the same four causes.',
    mini: [
      { label: 'Understand', value: 'causes' },
      { label: 'Apply', value: 'compare' },
      { label: 'Progress', value: 'Review' },
    ],
  },
  {
    category: 'Career learning',
    label: 'From idea to product',
    mentor: 'A product starts with a real user problem, not with a feature list.',
    user: 'How do I know if an idea is useful?',
    next: 'Write the problem in one sentence, define the user, then test if they already try to solve it somehow.',
    mini: [
      { label: 'Understand', value: 'user problem' },
      { label: 'Apply', value: 'idea test' },
      { label: 'Progress', value: '+21% this month' },
    ],
  },
];

const initHeroPreview = () => {
  const root = document.querySelector('#hero-preview');
  const topicsEl = document.querySelector('#preview-topics');
  const chatEl = document.querySelector('#preview-chat');
  const mentorText = document.querySelector('#preview-mentor-text');
  const userText = document.querySelector('#preview-user-text');
  const nextText = document.querySelector('#preview-next-text');
  const miniGrid = document.querySelector('#preview-mini-grid');

  if (!root || !topicsEl || !chatEl || !mentorText || !userText || !nextText || !miniGrid) return;

  let activeIndex = 0;
  let rotateTimer = null;
  let isAnimating = false;
  const rotateDelay = 3500;
  const fadeDuration = reduceMotion ? 0 : 420;

  const miniRows = [];

  const initMiniGrid = () => {
    miniGrid.replaceChildren();

    for (let i = 0; i < 3; i += 1) {
      const row = document.createElement('div');
      row.className = 'path-row';
      const label = document.createElement('span');
      const value = document.createElement('strong');
      row.append(label, value);
      miniGrid.appendChild(row);
      miniRows.push({ label, value });
    }
  };

  const updateMiniCards = (topic) => {
    topic.mini.forEach((item, index) => {
      const row = miniRows[index];
      if (!row) return;
      row.label.textContent = item.label;
      row.value.textContent = item.value;
    });
  };

  const renderChat = (topic) => {
    mentorText.textContent = topic.mentor;
    userText.textContent = topic.user;
    nextText.textContent = topic.next;
    updateMiniCards(topic);
  };

  const setActiveTopic = (index, { animate = true, force = false } = {}) => {
    const nextIndex = (index + HERO_PREVIEW_TOPICS.length) % HERO_PREVIEW_TOPICS.length;
    const topic = HERO_PREVIEW_TOPICS[nextIndex];

    const applyState = () => {
      activeIndex = nextIndex;

      topicsEl.querySelectorAll('.path-row').forEach((row, rowIndex) => {
        const isActive = rowIndex === activeIndex;
        row.classList.toggle('active', isActive);
        row.setAttribute('aria-selected', String(isActive));
        row.tabIndex = isActive ? 0 : -1;
      });

      renderChat(topic);
    };

    if (!animate || fadeDuration === 0) {
      chatEl.classList.remove('is-fading');
      isAnimating = false;
      applyState();
      return;
    }

    if (isAnimating && !force) return;
    isAnimating = true;
    chatEl.classList.add('is-fading');

    window.setTimeout(() => {
      applyState();
      chatEl.classList.remove('is-fading');
      window.setTimeout(() => {
        isAnimating = false;
      }, fadeDuration);
    }, fadeDuration);
  };

  topicsEl.innerHTML = HERO_PREVIEW_TOPICS.map((topic, index) => {
    const isActive = index === 0;
    return `<button type="button" class="path-row${isActive ? ' active' : ''}" role="tab" aria-selected="${isActive}" tabindex="${isActive ? 0 : -1}" data-topic-index="${index}"><span>${topic.category}</span><strong>${topic.label}</strong></button>`;
  }).join('');

  topicsEl.setAttribute('role', 'tablist');
  topicsEl.setAttribute('aria-orientation', 'vertical');

  initMiniGrid();
  renderChat(HERO_PREVIEW_TOPICS[0]);

  topicsEl.addEventListener('click', (event) => {
    const row = event.target.closest('[data-topic-index]');
    if (!row) return;

    event.preventDefault();
    event.stopPropagation();

    const index = Number(row.dataset.topicIndex);
    if (Number.isNaN(index) || index === activeIndex) return;
    setActiveTopic(index, { force: true });
    restartRotation();
  });

  topicsEl.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    let nextIndex = activeIndex;
    if (event.key === 'ArrowUp') nextIndex = activeIndex - 1;
    if (event.key === 'ArrowDown') nextIndex = activeIndex + 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = HERO_PREVIEW_TOPICS.length - 1;

    setActiveTopic(nextIndex, { force: true });
    restartRotation();
  });

  const restartRotation = () => {
    if (rotateTimer) window.clearInterval(rotateTimer);
    if (reduceMotion) return;
    rotateTimer = window.setInterval(() => {
      setActiveTopic(activeIndex + 1);
    }, rotateDelay);
  };

  restartRotation();
};

initMotionReveal();
initTheme();
initHeroPreview();
