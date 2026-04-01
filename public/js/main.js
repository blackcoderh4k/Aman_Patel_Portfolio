document.addEventListener('DOMContentLoaded', () => {

    // --- Breathing Intro Splash ---
    const breathingIntro = document.getElementById('breathingIntro');
    if (breathingIntro) {
        // Prevent scrolling during intro
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            breathingIntro.classList.add('fade-out');
            document.body.style.overflow = '';
        }, 2100); // Trigger shatter right as the final mega-slash peaks

        setTimeout(() => {
            breathingIntro.classList.add('hidden');
        }, 3200); // Cleanup after shards fully fly off-screen
    }

    // --- Custom Cursor (Water Droplet Style) ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    // Breathing mode state (shared with water-effects.js via window)
    window.breathingMode = 'water'; // 'water' or 'sun'
    
    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 400, fill: "forwards" });
        });

        // Hover effects on buttons and links
        const hoverElements = document.querySelectorAll('a, button, .btn');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '50px';
                cursorOutline.style.height = '50px';
                cursorOutline.style.borderColor = window.breathingMode === 'feral' 
                    ? 'rgba(211, 47, 47, 0.6)' : 'rgba(129, 212, 250, 0.6)';
                cursorOutline.style.backgroundColor = window.breathingMode === 'feral'
                    ? 'rgba(211, 47, 47, 0.05)' : 'rgba(129, 212, 250, 0.05)';
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '32px';
                cursorOutline.style.height = '32px';
                cursorOutline.style.borderColor = window.breathingMode === 'feral'
                    ? 'rgba(211, 47, 47, 0.4)' : 'rgba(129, 212, 250, 0.4)';
                cursorOutline.style.backgroundColor = 'transparent';
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        });
    }

    // --- Inosuke Cursor-Follow & Dual Breathing Mode ---
    const tanjiroImg = document.querySelector('.hero-avatar-img');
    const heroSection = document.getElementById('hero');
    let breathingTimeout;
    
    if (tanjiroImg && heroSection) {
        // Subtle tilt on hero section for corner avatar
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const rotateY = ((x - centerX) / centerX) * 6;
            const rotateX = ((y - centerY) / centerY) * -6;
            
            tanjiroImg.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        });
        
        heroSection.addEventListener('mouseleave', () => {
            tanjiroImg.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
        });
        
        const activateFeralMode = () => {
            clearTimeout(breathingTimeout);
            window.breathingMode = 'feral';
            document.body.classList.add('feral-mode');
            
            if (cursorDot) {
                cursorDot.style.background = '#D32F2F';
                cursorDot.style.boxShadow = '0 0 10px #D32F2F, 0 0 20px rgba(211, 47, 47, 0.3)';
            }
            if (cursorOutline) {
                cursorOutline.style.borderColor = 'rgba(211, 47, 47, 0.4)';
            }
        };

        const revertToBeastBreathing = () => {
            window.breathingMode = 'beast';
            document.body.classList.remove('feral-mode');
            
            if (cursorDot) {
                cursorDot.style.background = '#81D4FA';
                cursorDot.style.boxShadow = '0 0 10px #81D4FA, 0 0 20px rgba(129, 212, 250, 0.3)';
            }
            if (cursorOutline) {
                cursorOutline.style.borderColor = 'rgba(129, 212, 250, 0.4)';
            }
        };

        // Dual Breathing Toggle: Beast ↔ Feral on hover, stays for 10 seconds
        tanjiroImg.addEventListener('mouseenter', activateFeralMode);
        
        tanjiroImg.addEventListener('mouseleave', () => {
            // Wait 10 seconds before reverting to normal
            breathingTimeout = setTimeout(revertToBeastBreathing, 10000);
        });
    }

    // --- Typing Effect ---
    const typedWords = document.querySelector('.typed-words');
    const words = ['Full Stack Developer', 'Beast in the Mist', 'AI Explorer', 'Untamed Tech Enthusiast'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    const type = () => {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typedWords.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typedWords.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typingSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentWord.length) {
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typingSpeed = 500;
        }
        
        setTimeout(type, typingSpeed);
    };
    
    setTimeout(type, 1000);

    // --- Navbar Scroll & Active Link Highlighting ---
    const navbar = document.getElementById('navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const sections = document.querySelectorAll('.section[id]');
    const navItems = document.querySelectorAll('.nav-links a');
    
    // Scroll handler
    window.addEventListener('scroll', () => {
        // Navbar style on scroll
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting based on scroll position
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
    
    // Mobile menu
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const lines = hamburger.querySelectorAll('.line');
        if(navLinks.classList.contains('active')){
            lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            lines[1].style.opacity = '0';
            lines[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            lines[0].style.transform = 'none';
            lines[1].style.opacity = '1';
            lines[2].style.transform = 'none';
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const lines = hamburger.querySelectorAll('.line');
            lines[0].style.transform = 'none';
            lines[1].style.opacity = '1';
            lines[2].style.transform = 'none';
        });
    });

    // --- Scroll Reveal Animations (Staggered) ---
    const revealElements = document.querySelectorAll(
        '.glass-card, .section-title, .project-card, .wave-divider, .service-card'
    );
    
    revealElements.forEach(el => el.classList.add('reveal'));
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    revealElements.forEach(el => revealObserver.observe(el));

    // --- Tech Stack Pyramid Staggered Reveal ---
    const pyramidRows = document.querySelectorAll('.pyramid-row');
    const pyramidObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('row-visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    pyramidRows.forEach(row => pyramidObserver.observe(row));

    // --- 3D Tilt Effect on Glass Cards ---
    const tiltCards = document.querySelectorAll('.project-card, .about-text, .contact-info, .contact-form-wrapper, .service-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -4;
            const rotateY = (x - centerX) / centerX * 4;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    // --- Parallax Effect on Hero ---
    const heroBgText = document.querySelector('.hero-bg-text');
    const heroAvatar = document.querySelector('.hero-avatar-corner');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
            if (heroBgText) {
                heroBgText.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.3}px))`;
            }
            if (heroAvatar) {
                heroAvatar.style.transform = `translateY(${scrollY * 0.1}px)`;
            }
        }
    });

    // --- Stats Counter ---
    const counters = document.querySelectorAll('.counter');
    let counted = false;
    
    const statsObserver = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting && !counted) {
            counted = true;
            counters.forEach(counter => {
                counter.innerText = '0';
                const updateCounter = () => {
                    const target = +counter.getAttribute('data-target');
                    const c = +counter.innerText;
                    const increment = target / 50; 
                    
                    if (c < target) {
                        counter.innerText = Math.ceil(c + increment);
                        setTimeout(updateCounter, 40);
                    } else {
                        counter.innerText = target + "+";
                    }
                };
                updateCounter();
            });
        }
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.stats');
    if(statsSection) {
        statsObserver.observe(statsSection);
    }

    // --- Footer Year ---
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- Contact Form Submission ---
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const originalText = btnText.innerText;
            btnText.innerText = 'Transmitting...';
            submitBtn.disabled = true;
            formStatus.innerHTML = '<span style="color: var(--text-muted)">Establishing connection...</span>';
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    formStatus.innerHTML = `<span class="status-success"><i class="fas fa-check-circle"></i> ${data.message}</span>`;
                    contactForm.reset();
                } else {
                    formStatus.innerHTML = `<span class="status-error"><i class="fas fa-exclamation-triangle"></i> Error: ${data.error}</span>`;
                }
            } catch (error) {
                formStatus.innerHTML = `<span class="status-error"><i class="fas fa-exclamation-triangle"></i> Connection Failed. Ensure server is running.</span>`;
            } finally {
                btnText.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
