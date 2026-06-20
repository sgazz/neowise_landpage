const navToggle = document.querySelector('.nav-toggle');
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
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const cookiePreferenceKey = 'neowiseCookiePreferences';
let activeModal = null;
let activePanel = null;
let modalTrigger = null;
let modalTimer = null;

const hasCookiePreferences = () => Boolean(localStorage.getItem(cookiePreferenceKey));

const shouldAutoOpenBeta = () => betaModal && sessionStorage.getItem('neowiseBetaModalClosed') !== 'true';

const scheduleBetaModal = () => {
  if (!shouldAutoOpenBeta() || !hasCookiePreferences() || modalTimer) return;
  modalTimer = window.setTimeout(() => {
    modalTimer = null;
    openBetaModal(null, true);
  }, 6000);
};

const saveNecessaryPreferences = () => {
  localStorage.setItem(cookiePreferenceKey, JSON.stringify({
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

document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    form.classList.add('is-success');

    const status = form.querySelector('.form-status');
    if (status) {
      status.textContent = form.dataset.message || 'Thank you — your beta request has been noted for this prototype.';
    }
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


const betaShareData = {
  title: 'Join the Neowise private beta',
  text: 'Neowise is opening a private beta for learners, students, and educators. Help shape a personal AI learning mentor built around understanding, practice, memory, and progress.',
  url: 'https://www.neowise.ai/beta/',
};

const shareStatus = document.querySelector('[data-share-status]');
const shareBetaButton = document.querySelector('[data-share-beta]');
const copyBetaButton = document.querySelector('[data-copy-beta-link]');
const shareCopySource = document.querySelector('.share-copy-source');

const setShareStatus = (message) => {
  if (shareStatus) shareStatus.textContent = message;
};

const copyBetaLink = async () => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(betaShareData.url);
    } else if (shareCopySource) {
      shareCopySource.hidden = false;
      shareCopySource.focus();
      shareCopySource.select();
      document.execCommand('copy');
      shareCopySource.blur();
      shareCopySource.hidden = true;
    } else {
      setShareStatus('Copy the link and share it with someone who should test Neowise.');
      return;
    }

    setShareStatus('Beta link copied.');
  } catch {
    setShareStatus('Copy the link and share it with someone who should test Neowise.');
  }
};

if (shareBetaButton) {
  shareBetaButton.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share(betaShareData);
        setShareStatus('Beta invitation ready to share.');
      } catch {
        setShareStatus('Sharing was cancelled or unavailable.');
      }
      return;
    }

    await copyBetaLink();
  });
}

if (copyBetaButton) {
  copyBetaButton.addEventListener('click', copyBetaLink);
}
