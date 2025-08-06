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
const DOM = {
    // Navigation
    navbar: document.querySelector('.navbar'),
    navLinks: document.querySelectorAll('.nav-link'),
    mobileNavLinks: document.querySelectorAll('.mobile-nav-link'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    
    // Authentication
    loginBtn: document.getElementById('login-btn'),
    mobileLoginBtn: document.getElementById('mobile-login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userGreeting: document.getElementById('user-greeting'),
    
    // Modals
    loginModal: document.getElementById('login-modal'),
    modalClose: document.querySelector('.modal-close'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    
    // UI Elements
    scrollTopBtn: document.getElementById('scroll-top-btn'),
    
    // Page Sections
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
            const navbarHeight = DOM.navbar?.offsetHeight || 70;
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
        DOM.navLinks?.forEach(link => {
            const linkSection = link.getAttribute('href').substring(1);
            link.classList.toggle('active', linkSection === sectionId);
        });

        // Update mobile nav links
        DOM.mobileNavLinks?.forEach(link => {
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
        if (DOM.scrollTopBtn) {
            if (scrollPosition > 300) {
                DOM.scrollTopBtn.classList.add('visible');
            } else {
                DOM.scrollTopBtn.classList.remove('visible');
            }
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
        try {
            const userData = localStorage.getItem('fishRouteProUser');
            if (userData) {
                const { username, timestamp } = JSON.parse(userData);
                if (Date.now() - timestamp < SESSION_TIMEOUT) {
                    AppState.currentUser = username;
                    Auth.updateUI();
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to load session:', e);
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
        if (!DOM.userGreeting || !DOM.loginBtn || !DOM.logoutBtn || !DOM.mobileLoginBtn) return;
        
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
        if (DOM.loginModal) {
            DOM.loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal: () => {
        if (DOM.loginModal) {
            DOM.loginModal.classList.remove('active');
            document.body.style.overflow = '';
            if (DOM.loginForm) DOM.loginForm.reset();
        }
    },

    setupEventListeners: () => {
        // Login button events
        if (DOM.loginBtn) {
            DOM.loginBtn.addEventListener('click', Auth.openModal);
        }
        if (DOM.mobileLoginBtn) {
            DOM.mobileLoginBtn.addEventListener('click', Auth.openModal);
        }
        
        // Logout button event
        if (DOM.logoutBtn) {
            DOM.logoutBtn.addEventListener('click', Auth.clearSession);
        }
        
        // Login form submission
        if (DOM.loginForm) {
            DOM.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = DOM.usernameInput?.value.trim();
                if (username) {
                    Auth.saveSession(username);
                    Auth.closeModal();
                }
            });
        }
        
        // Modal close events
        if (DOM.modalClose) {
            DOM.modalClose.addEventListener('click', Auth.closeModal);
        }
        if (DOM.loginModal) {
            DOM.loginModal.addEventListener('click', (e) => {
                if (e.target === DOM.loginModal) {
                    Auth.closeModal();
                }
            });
        }
    }
};

// ====================== MOBILE MENU ======================
const MobileMenu = {
    init: () => {
        MobileMenu.setupEventListeners();
    },

    toggleMenu: () => {
        if (DOM.mobileMenu) {
            DOM.mobileMenu.classList.toggle('active');
        }
    },

    closeMenu: () => {
        if (DOM.mobileMenu) {
            DOM.mobileMenu.classList.remove('active');
        }
    },

    setupEventListeners: () => {
        if (DOM.mobileMenuBtn) {
            DOM.mobileMenuBtn.addEventListener('click', MobileMenu.toggleMenu);
        }
        
        // Close menu when clicking on a link
        DOM.mobileNavLinks?.forEach(link => {
            link.addEventListener('click', () => {
                MobileMenu.closeMenu();
                const sectionId = link.getAttribute('href').substring(1);
                Utils.scrollToSection(sectionId);
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (DOM.mobileMenu && !DOM.mobileMenu.contains(e.target) && 
                DOM.mobileMenuBtn && !DOM.mobileMenuBtn.contains(e.target)) {
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
        DOM.navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                Utils.scrollToSection(sectionId);
            });
        });
        
        // Scroll to top button
        if (DOM.scrollTopBtn) {
            DOM.scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
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

// ====================== ANIMATIONS ======================
const Animations = {
    init: () => {
        Animations.initAboutAnimations();
        Animations.initFeatureCards();
    },

    initAboutAnimations: () => {
        const aboutSection = document.getElementById('about');
        if (!aboutSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    Animations.animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(aboutSection);
    },

    animateCounters: () => {
        const counters = document.querySelectorAll('.stat-number');
        if (!counters.length) return;

        const speed = 200;
        
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-count');
            const count = +counter.innerText;
            const increment = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(Animations.animateCounters, 1);
            } else {
                counter.innerText = target;
            }
        });
    },

    initFeatureCards: () => {
        const featureCards = document.querySelectorAll('.feature-card');
        if (!featureCards.length) return;
        
        featureCards.forEach((card, index) => {
            // Add staggered animation delay
            card.style.transitionDelay = `${index * 0.1}s`;
            
            // Intersection Observer for scroll animation
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(card);
            
            // Mouse movement parallax effect
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const angleX = (y - centerY) / 20;
                const angleY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-10px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(-10px)';
            });
        });
    }
};

// ====================== INITIALIZATION ======================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Auth.init();
    MobileMenu.init();
    ScrollManager.init();
    ActivityMonitor.init();
    Animations.init();
    
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
// Update the map click handler in map.js
map.on('click', function (e) {
  if (isSettingLocation) {
    setUserLocation([e.latlng.lat, e.latlng.lng]);
    return;
  }

  // Check if clicked location is water
  if (!isWater(e.latlng)) {
    showLandWarning();
    return;
  }

  analyzeFishingZone(e.latlng);
});

// Add these new functions to map.js
function isWater(latlng) {
  // Simple check - adjust these coordinates to match your fishing area
  return latlng.lat > 5.0 && latlng.lat < 15.0 && 
         latlng.lng > 75.0 && latlng.lng < 85.0;
}

function showLandWarning() {
  const landWarning = document.getElementById('land-warning');
  if (landWarning) {
    landWarning.style.display = 'block';
    
    // Close button handler
    const closeBtn = landWarning.querySelector('.land-warning-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        landWarning.style.display = 'none';
      }, { once: true }); // Only bind once
    }
  }
}

// Update the setUserLocation function to show the water selection reminder
function setUserLocation(coords) {
  userLocation = coords;
  isSettingLocation = false;

  if (userMarker) map.removeLayer(userMarker);

  userMarker = L.marker(userLocation, {
    icon: L.divIcon({
      className: 'user-location-pin',
      html: '<i class="fas fa-ship"></i>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }).addTo(map).bindPopup("Your Location").openPopup();

  map.setView(userLocation, 10);
  
  // Show the water selection reminder
  showWaterPopup(true);
}

// Water selection popup handler
function showWaterPopup(show) {
  const waterPopup = document.getElementById('water-selection-popup');
  if (waterPopup) {
    waterPopup.style.display = show ? 'block' : 'none';
    
    // OK button handler
    const okBtn = waterPopup.querySelector('#popup-ok-btn');
    if (okBtn) {
      okBtn.addEventListener('click', () => {
        waterPopup.style.display = 'none';
      }, { once: true });
    }
  }
}