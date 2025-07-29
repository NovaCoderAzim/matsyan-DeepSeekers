/**
 * Fishing Route Optimizer - Main Controller
 * Handles navigation, authentication, and UI interactions
 */

// ====================== CONSTANTS ======================
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes session timeout

// ====================== STATE MANAGEMENT ======================
const AppState = {
    currentUser: null,
    lastActivity: Date.now(),
    currentSection: 'home'
};

// ====================== DOM ELEMENTS ======================
// In the DOM Elements section
// Update the DOM elements section in main.js
const DOM = {
  navbar: document.querySelector('.navbar'),
  navLinks: document.querySelectorAll('.nav-link'),
  mobileNavLinks: document.querySelectorAll('.mobile-nav-link'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  mobileMenu: document.getElementById('mobile-menu'),
  loginBtn: document.getElementById('login-btn'),
  mobileLoginBtn: document.getElementById('mobile-login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  userGreeting: document.getElementById('user-greeting'),
  scrollTopBtn: document.getElementById('scroll-top-btn'),
  loginModal: document.getElementById('login-modal'),
  modalClose: document.querySelector('.modal-close'),
  loginForm: document.getElementById('login-form'),
  usernameInput: document.getElementById('username'),
  sections: {
    home: document.getElementById('home'),
    about: document.getElementById('about'),
    features: document.getElementById('features'),
    app: document.getElementById('app')
  }
};

// ====================== UTILITY FUNCTIONS ======================
const Utils = {
    debounce: (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    scrollToSection: (sectionId) => {
        const section = DOM.sections[sectionId];
        if (section) {
            const navbarHeight = DOM.navbar.offsetHeight;
            const sectionPosition = section.offsetTop - navbarHeight;
            window.scrollTo({
                top: sectionPosition,
                behavior: 'smooth'
            });
            AppState.currentSection = sectionId;
            Utils.updateActiveNavLink(sectionId);
        }
    },

    updateActiveNavLink: (sectionId) => {
        // Update desktop nav links
        DOM.navLinks.forEach(link => {
            const linkSection = link.getAttribute('href').substring(1);
            link.classList.toggle('active', linkSection === sectionId);
        });

        // Update mobile nav links
        DOM.mobileNavLinks.forEach(link => {
            const linkSection = link.getAttribute('href').substring(1);
            link.classList.toggle('active', linkSection === sectionId);
        });
    },

    checkScrollPosition: () => {
        const scrollPosition = window.scrollY + 100;
        
        // Determine which section is currently in view
        for (const [sectionId, section] of Object.entries(DOM.sections)) {
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    if (AppState.currentSection !== sectionId) {
                        AppState.currentSection = sectionId;
                        Utils.updateActiveNavLink(sectionId);
                    }
                    break;
                }
            }
        }
        
        // Show/hide scroll to top button
        if (scrollPosition > 300) {
            DOM.scrollTopBtn.classList.add('visible');
        } else {
            DOM.scrollTopBtn.classList.remove('visible');
        }
    }
};

// ====================== AUTHENTICATION SYSTEM ======================
const Auth = {
    init: () => {
        Auth.loadSession();
        Auth.setupEventListeners();
    },

    loadSession: () => {
        const userData = localStorage.getItem('fishRouteProUser');
        if (userData) {
            try {
                const { username, timestamp } = JSON.parse(userData);
                if (Date.now() - timestamp < SESSION_TIMEOUT) {
                    AppState.currentUser = username;
                    Auth.updateUI();
                    return;
                }
            } catch (e) {
                console.error('Failed to load session:', e);
            }
        }
        Auth.clearSession();
    },

    saveSession: (username) => {
        const sessionData = {
            username,
            timestamp: Date.now()
        };
        localStorage.setItem('fishRouteProUser', JSON.stringify(sessionData));
        AppState.currentUser = username;
        AppState.lastActivity = Date.now();
        Auth.updateUI();
    },

    clearSession: () => {
        localStorage.removeItem('fishRouteProUser');
        AppState.currentUser = null;
        Auth.updateUI();
    },

    updateUI: () => {
        if (AppState.currentUser) {
            DOM.userGreeting.textContent = `Welcome, ${AppState.currentUser}`;
            DOM.loginBtn.classList.add('hidden');
            DOM.logoutBtn.classList.remove('hidden');
            DOM.mobileLoginBtn.classList.add('hidden');
        } else {
            DOM.userGreeting.textContent = '';
            DOM.loginBtn.classList.remove('hidden');
            DOM.logoutBtn.classList.add('hidden');
            DOM.mobileLoginBtn.classList.remove('hidden');
        }
    },

    openModal: () => {
        DOM.loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal: () => {
        DOM.loginModal.classList.remove('active');
        document.body.style.overflow = '';
        DOM.loginForm.reset();
    },

    setupEventListeners: () => {
        // Login button events
        DOM.loginBtn.addEventListener('click', Auth.openModal);
        DOM.mobileLoginBtn.addEventListener('click', Auth.openModal);
        
        // Logout button event
        DOM.logoutBtn.addEventListener('click', Auth.clearSession);
        
        // Login form submission
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = DOM.usernameInput.value.trim();
            if (username) {
                Auth.saveSession(username);
                Auth.closeModal();
            }
        });
        
        // Modal close events
        DOM.modalClose.addEventListener('click', Auth.closeModal);
        DOM.loginModal.addEventListener('click', (e) => {
            if (e.target === DOM.loginModal) {
                Auth.closeModal();
            }
        });
    }
};

// ====================== MOBILE MENU ======================
const MobileMenu = {
    init: () => {
        MobileMenu.setupEventListeners();
    },

    toggleMenu: () => {
        DOM.mobileMenu.classList.toggle('active');
    },

    closeMenu: () => {
        DOM.mobileMenu.classList.remove('active');
    },

    setupEventListeners: () => {
        DOM.mobileMenuBtn.addEventListener('click', MobileMenu.toggleMenu);
        
        // Close menu when clicking on a link
        DOM.mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                MobileMenu.closeMenu();
                const sectionId = link.getAttribute('href').substring(1);
                Utils.scrollToSection(sectionId);
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!DOM.mobileMenu.contains(e.target))
            {
                MobileMenu.closeMenu();
            }
        });
    }
};

// ====================== SCROLL MANAGEMENT ======================
const ScrollManager = {
    init: () => {
        ScrollManager.setupEventListeners();
        Utils.checkScrollPosition(); // Initial check
    },

    setupEventListeners: () => {
        // Smooth scrolling for nav links
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                Utils.scrollToSection(sectionId);
            });
        });
        
        // Scroll to top button
        DOM.scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Debounced scroll event
        window.addEventListener('scroll', Utils.debounce(Utils.checkScrollPosition, 100));
    }
};

// ====================== ACTIVITY MONITOR ======================
const ActivityMonitor = {
    init: () => {
        ActivityMonitor.setupEventListeners();
        ActivityMonitor.startSessionTimer();
    },

    recordActivity: () => {
        AppState.lastActivity = Date.now();
    },

    setupEventListeners: () => {
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, ActivityMonitor.recordActivity);
        });
    },

    startSessionTimer: () => {
        setInterval(() => {
            if (AppState.currentUser && (Date.now() - AppState.lastActivity > SESSION_TIMEOUT)) {
                Auth.clearSession();
            }
        }, 60000); // Check every minute
    }
};

// ====================== INITIALIZATION ======================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Auth.init();
    MobileMenu.init();
    ScrollManager.init();
    ActivityMonitor.init();
    
    // Set initial active nav link
    Utils.updateActiveNavLink(AppState.currentSection);
});

// ====================== PUBLIC API ======================
window.FishRoutePro = {
    navigateTo: (sectionId) => {
        Utils.scrollToSection(sectionId);
    },
    getCurrentUser: () => AppState.currentUser
};