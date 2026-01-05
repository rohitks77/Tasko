/* ============================================
   Tasko Website - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Preloader.init();
    Theme.init();
    Navigation.init();
    Cursor.init();
    Animations.init();
    Screenshots.init();
    FAQ.init();
    BackToTop.init();
});

/* ============================================
   Preloader
   ============================================ */
const Preloader = {
    init() {
        const preloader = document.getElementById('preloader');
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 500);
        });
        
        // Fallback: Hide preloader after 3 seconds
        setTimeout(() => {
            preloader.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }, 3000);
    }
};

/* ============================================
   Theme Toggle
   ============================================ */
const Theme = {
    init() {
        this.toggle = document.getElementById('themeToggle');
        this.html = document.documentElement;
        
        // Check saved theme or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (systemPrefersDark) {
            this.setTheme('dark');
        }
        
        // Toggle event
        this.toggle?.addEventListener('click', () => {
            const currentTheme = this.html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },
    
    setTheme(theme) {
        this.html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
};

/* ============================================
   Navigation
   ============================================ */
const Navigation = {
    init() {
        this.navbar = document.getElementById('navbar');
        this.navToggle = document.getElementById('navToggle');
        this.navMenu = document.getElementById('navMenu');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        // Scroll handling
        this.handleScroll();
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Mobile menu toggle
        this.navToggle?.addEventListener('click', () => this.toggleMenu());
        
        // Close menu on link click
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                this.closeMenu();
            }
        });
        
        // Smooth scroll for anchor links
        this.initSmoothScroll();
    },
    
    handleScroll() {
        if (window.scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    },
    
    toggleMenu() {
        this.navToggle.classList.toggle('active');
        this.navMenu.classList.toggle('active');
        document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : 'auto';
    },
    
    closeMenu() {
        this.navToggle?.classList.remove('active');
        this.navMenu?.classList.remove('active');
        document.body.style.overflow = 'auto';
    },
    
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const navHeight = this.navbar.offsetHeight;
                    const targetPosition = target.offsetTop - navHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
};

/* ============================================
   Custom Cursor
   ============================================ */
const Cursor = {
    init() {
        // Only on devices with hover capability
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        
        this.cursor = document.querySelector('.cursor');
        this.follower = document.querySelector('.cursor-follower');
        
        if (!this.cursor || !this.follower) return;
        
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let followerX = 0, followerY = 0;
        
        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Animate cursor
        const animate = () => {
            // Cursor follows instantly
            cursorX = mouseX;
            cursorY = mouseY;
            
            // Follower with lag
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;
            
            this.cursor.style.left = `${cursorX}px`;
            this.cursor.style.top = `${cursorY}px`;
            this.follower.style.left = `${followerX}px`;
            this.follower.style.top = `${followerY}px`;
            
            requestAnimationFrame(animate);
        };
        animate();
        
        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .feature-card, .engine-card, .faq-question');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
                this.follower.classList.add('hover');
            });
            
            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
                this.follower.classList.remove('hover');
            });
        });
        
        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => {
            this.cursor.style.opacity = '0';
            this.follower.style.opacity = '0';
        });
        
        document.addEventListener('mouseenter', () => {
            this.cursor.style.opacity = '1';
            this.follower.style.opacity = '0.5';
        });
    }
};

/* ============================================
   Animations (AOS)
   ============================================ */
const Animations = {
    init() {
        // Initialize AOS
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-out-cubic',
                once: true,
                offset: 50,
                disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            });
        }
        
        // Parallax effect for hero orbs
        this.initParallax();
        
        // Counter animation
        this.initCounters();
    },
    
    initParallax() {
        const orbs = document.querySelectorAll('.gradient-orb');
        
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 0.1;
                orb.style.transform = `translateY(${scrollY * speed}px)`;
            });
        });
    },
    
    initCounters() {
        const counters = document.querySelectorAll('.stat-value');
        
        const animateCounter = (el) => {
            const target = el.textContent;
            
            // Skip if not a number
            if (isNaN(parseInt(target))) return;
            
            const targetNum = parseInt(target);
            const duration = 2000;
            const startTime = performance.now();
            
            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                el.textContent = Math.round(targetNum * easeOut);
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            };
            
            requestAnimationFrame(update);
        };
        
        // Intersection Observer for counters
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
};

/* ============================================
   Screenshots Slider
   ============================================ */
const Screenshots = {
    init() {
        this.items = document.querySelectorAll('.screenshot-item');
        this.dots = document.querySelectorAll('.screenshot-dots .dot');
        this.currentIndex = 0;
        
        if (!this.items.length) return;
        
        // Dot click handlers
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goTo(index));
        });
        
        // Auto-advance
        this.startAutoPlay();
        
        // Pause on hover
        const slider = document.querySelector('.screenshots-slider');
        slider?.addEventListener('mouseenter', () => this.stopAutoPlay());
        slider?.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Touch/swipe support
        this.initSwipe(slider);
    },
    
    goTo(index) {
        this.items[this.currentIndex].classList.remove('active');
        this.dots[this.currentIndex].classList.remove('active');
        
        this.currentIndex = index;
        
        this.items[this.currentIndex].classList.add('active');
        this.dots[this.currentIndex].classList.add('active');
    },
    
    next() {
        const nextIndex = (this.currentIndex + 1) % this.items.length;
        this.goTo(nextIndex);
    },
    
    prev() {
        const prevIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.goTo(prevIndex);
    },
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => this.next(), 5000);
    },
    
    stopAutoPlay() {
        clearInterval(this.autoPlayInterval);
    },
    
    initSwipe(element) {
        if (!element) return;
        
        let startX = 0;
        let endX = 0;
        
        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
        }, { passive: true });
    }
};

/* ============================================
   FAQ Accordion
   ============================================ */
const FAQ = {
    init() {
        this.items = document.querySelectorAll('.faq-item');
        
        this.items.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question?.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all
                this.items.forEach(i => i.classList.remove('active'));
                
                // Open clicked if wasn't active
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }
};

/* ============================================
   Back to Top Button
   ============================================ */
const BackToTop = {
    init() {
        this.button = document.getElementById('backToTop');
        if (!this.button) return;
        
        // Show/hide based on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                this.button.classList.add('visible');
            } else {
                this.button.classList.remove('visible');
            }
        });
        
        // Scroll to top on click
        this.button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
};

/* ============================================
   Utility Functions
   ============================================ */
const Utils = {
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
};
