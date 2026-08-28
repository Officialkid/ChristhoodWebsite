const SITE_CONFIG = {
    email: 'christhoodministries01@gmail.com',
    phones: [
        '+254 714 545791',
        '+254 712 284711'
    ],
    phoneLinks: [
        'tel:+254714545791',
        'tel:+254712284711'
    ],
    portalUrl: 'https://instituteofapologetics.org',
    logoPath: 'image/logo.png',
    navMap: {
        Home: 'index.html',
        Humanitarian: 'humanitarian.html',
        Give: 'give.html',
        Explore: 'christhood.html',
        Ministries: 'international-faith-chapel.html',
        Programmes: 'jewels.html'
    }
};

function onReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

function safeQuery(selector, root = document) {
    try {
        return root.querySelector(selector);
    } catch (error) {
        return null;
    }
}

function safeQueryAll(selector, root = document) {
    try {
        return Array.from(root.querySelectorAll(selector));
    } catch (error) {
        return [];
    }
}

function getCurrentPage() {
    const page = window.location.pathname.split('/').pop();
    return page || 'index.html';
}

function buildTopBarMarkup() {
    return `
        <div class="top-bar-container">
            <a href="${SITE_CONFIG.phoneLinks[0]}" aria-label="Call ${SITE_CONFIG.phones[0]}"><i class='bx bx-phone'></i> ${SITE_CONFIG.phones[0]}</a>
            <a href="${SITE_CONFIG.phoneLinks[1]}" aria-label="Call ${SITE_CONFIG.phones[1]}"><i class='bx bx-phone'></i> ${SITE_CONFIG.phones[1]}</a>
            <a href="mailto:${SITE_CONFIG.email}" aria-label="Email ${SITE_CONFIG.email}"><i class='bx bx-envelope'></i> ${SITE_CONFIG.email}</a>
            <a href="${SITE_CONFIG.portalUrl}" class="portal-btn"><i class='bx bx-book'></i> Christhood Learning Portal</a>
        </div>
    `;
}

function buildNavigationMarkup() {
    return `
        <div class="nav-container">
            <div class="logo">
                <a href="index.html">Christhood<span>Ministries</span></a>
            </div>

            <button class="mobile-menu-btn" type="button" aria-label="Open navigation menu">
                <i class="bx bx-menu"></i>
            </button>

            <div class="nav-links">
                <button class="close-menu-btn" type="button" aria-label="Close navigation menu">
                    <i class="bx bx-x"></i>
                </button>
                <ul>
                    <li><a href="index.html" class="nav-link" data-indicator="Home">Home</a></li>
                    <li>
                        <a href="christhood.html" class="nav-link has-dropdown" data-indicator="Explore">Explore <i class="bx bx-chevron-down"></i></a>
                        <div class="dropdown mega-menu">
                            <div class="dropdown-column">
                                <h4>About Us</h4>
                                <ul class="dropdown-links">
                                    <li><a href="apostle.html">Apostle Dennis</a></li>
                                    <li><a href="leadership.html">Christhood Leadership</a></li>
                                    <li><a href="christhood.html">Christhood Ministries</a></li>
                                    <li><a href="mission.html">Mission Vision & Statement of Faith</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>
                    <li>
                        <a href="international-faith-chapel.html" class="nav-link has-dropdown" data-indicator="Ministries">Ministries <i class="bx bx-chevron-down"></i></a>
                        <div class="dropdown mega-menu">
                            <div class="dropdown-column">
                                <h4>Ministries</h4>
                                <ul class="dropdown-links">
                                    <li><a href="international-faith-chapel.html">International Faith Chapel</a></li>
                                    <li><a href="worship.html">Worship Ministry</a></li>
                                    <li><a href="missions-outreach.html">Missions Ministry</a></li>
                                    <li><a href="Counselling.html">Counselling Ministry</a></li>
                                    <li><a href="media.html">Media Ministry</a></li>
                                </ul>
                            </div>
                            <div class="dropdown-column">
                                <h4>More Ministries</h4>
                                <ul class="dropdown-links">
                                    <li><a href="men.html">Men's Ministry</a></li>
                                    <li><a href="ladies.html">Ladies Ministry</a></li>
                                    <li><a href="administration.html">Administration</a></li>
                                    <li><a href="protocol.html">Protocol & Security</a></li>
                                    <li><a href="creative.html">Creative & Beautification</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>
                    <li>
                        <a href="jewels.html" class="nav-link has-dropdown" data-indicator="Programmes">Programmes <i class="bx bx-chevron-down"></i></a>
                        <div class="dropdown mega-menu">
                            <div class="dropdown-column">
                                <h4>Programs</h4>
                                <ul class="dropdown-links">
                                    <li><a href="jewels.html">Jewels</a></li>
                                    <li><a href="teen-life.html">Teen Life Mentorship</a></li>
                                    <li><a href="branch.html">Branch</a></li>
                                </ul>
                            </div>
                            <div class="dropdown-column">
                                <h4>More Programs</h4>
                                <ul class="dropdown-links">
                                    <li><a href="impact.html">Impact</a></li>
                                    <li><a href="iAct.html">iAct</a></li>
                                    <li><a href="apologetics.html">Apologetics</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>
                    <li><a href="humanitarian.html" class="nav-link" data-indicator="Humanitarian">Humanitarian</a></li>
                    <li><a href="give.html" class="nav-link" data-indicator="Give">Give</a></li>
                </ul>
            </div>
        </div>
    `;
}

function ensureTopBar() {
    const topBars = safeQueryAll('.top-bar');
    let topBar = topBars[0];
    if (!topBar && document.body) {
        topBar = document.createElement('div');
        topBar.className = 'top-bar';
        document.body.insertBefore(topBar, document.body.firstChild);
    }
    if (!topBar) {
        return null;
    }

    topBars.slice(1).forEach((bar) => bar.remove());
    if (!topBar.id) {
        topBar.id = 'topBar';
    }
    topBar.innerHTML = buildTopBarMarkup();
    return topBar;
}

function ensureBrandAssets() {
    const iconHref = SITE_CONFIG.logoPath;
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
    }
    icon.type = 'image/png';
    icon.href = iconHref;

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
    }
    appleIcon.href = iconHref;

    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
        themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        document.head.appendChild(themeColor);
    }
    themeColor.content = '#4b248c';
}

function ensureFooter() {
    const footer = safeQuery('footer.home-footer');
    if (!footer) {
        return;
    }

    footer.innerHTML = `
        <div class="footer-container">
            <div class="scripture-section">
                <div class="scripture-box">
                    <p class="scripture-text">"Therefore go and make disciples of all nations..."</p>
                    <p class="scripture-reference">Matthew 28:19</p>
                </div>
            </div>
            <div class="pillars-social-icons">
                <a href="https://www.instagram.com/christhoodministries?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" class="pillars-social-icon pillars-instagram" target="_blank" rel="noreferrer"><i class="fa-brands fa-instagram"></i></a>
                <a href="https://www.facebook.com/christhoodministries" class="pillars-social-icon pillars-facebook" target="_blank" rel="noreferrer"><i class="fa-brands fa-facebook"></i></a>
                <a href="https://www.tiktok.com/@christhoodministries_int?_t=8qla8Z1SWNZ&_r=1" class="pillars-social-icon pillars-tiktok" target="_blank" rel="noreferrer"><i class="fa-brands fa-tiktok"></i></a>
                <a href="https://x.com/christhood_ciom?s=11" class="pillars-social-icon pillars-x-twitter" target="_blank" rel="noreferrer"><i class="fa-brands fa-x-twitter"></i></a>
                <a href="https://youtube.com/@christhoodministries?si=NHa000S6Hx58IMen" class="pillars-social-icon pillars-youtube" target="_blank" rel="noreferrer"><i class="fa-brands fa-youtube"></i></a>
            </div>
        </div>
        <div class="copyright-section">
            <div class="footer-logo">
                <a href="index.html">Christhood<span>Ministries</span></a>
            </div>
            <p class="copyright-text">&copy; <span id="currentYear"></span> Christhood Ministries. All Rights Reserved.</p>
        </div>
    `;

    const yearEl = footer.querySelector('#currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

function normalizeNavigationMarkup() {
    let navbar = safeQuery('#navbar, .navbar');
    if (!navbar && document.body) {
        navbar = document.createElement('nav');
        navbar.className = 'navbar';
        const topBar = safeQuery('#topBar, .top-bar');
        if (topBar && topBar.parentNode === document.body) {
            topBar.insertAdjacentElement('afterend', navbar);
        } else {
            document.body.insertBefore(navbar, document.body.firstChild);
        }
    }
    if (!navbar) {
        return;
    }

    navbar.classList.add('navbar');
    navbar.id = 'navbar';
    navbar.innerHTML = buildNavigationMarkup();
}

function repairMojibakeText(text) {
    if (!text) {
        return text;
    }

    const replacements = new Map([
        ['\u00c2\u00a0', ' '],
        ['\u00e2\u0080\u0093', '–'],
        ['\u00e2\u0080\u0094', '—'],
        ['\u00e2\u0080\u0098', '‘'],
        ['\u00e2\u0080\u0099', '’'],
        ['\u00e2\u0080\u009c', '“'],
        ['\u00e2\u0080\u009d', '”'],
        ['\u00e2\u0080\u00a6', '…'],
        ['\u00e2\u0080\u00a2', '•'],
        ['\u00c3\u0097', '×'],
        ['\u00c3\u00a9', 'é'],
        ['\u00f0\u009f\u0093\u0085', '📅'],
        ['\u00f0\u009f\u0093\u008d', '📍'],
        ['\u00e2\u0086\u0092', '→']
    ]);

    let repaired = text;
    replacements.forEach((value, key) => {
        repaired = repaired.split(key).join(value);
    });

    return repaired;
}

function repairRenderedText() {
    if (!document.body) {
        return;
    }

    if (document.title) {
        document.title = repairMojibakeText(document.title);
    }

    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let currentNode = textWalker.nextNode();
    while (currentNode) {
        const repaired = repairMojibakeText(currentNode.nodeValue);
        if (repaired !== currentNode.nodeValue) {
            currentNode.nodeValue = repaired;
        }
        currentNode = textWalker.nextNode();
    }

    safeQueryAll('[aria-label], [title], [placeholder]').forEach((element) => {
        ['aria-label', 'title', 'placeholder'].forEach((attributeName) => {
            const attributeValue = element.getAttribute(attributeName);
            if (!attributeValue) {
                return;
            }
            const repaired = repairMojibakeText(attributeValue);
            if (repaired !== attributeValue) {
                element.setAttribute(attributeName, repaired);
            }
        });
    });
}

function initTextRepairObserver() {
    if (!document.body || !('MutationObserver' in window)) {
        return;
    }

    const observer = new MutationObserver((mutations) => {
        let shouldRepair = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                shouldRepair = true;
            }
            if (mutation.type === 'attributes') {
                const value = mutation.target.getAttribute(mutation.attributeName);
                if (!value) {
                    return;
                }
                const repaired = repairMojibakeText(value);
                if (repaired !== value) {
                    mutation.target.setAttribute(mutation.attributeName, repaired);
                }
            }
        });

        if (shouldRepair) {
            repairRenderedText();
        }
    });

    observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['aria-label', 'title', 'placeholder']
    });
}

function normalizeNavLinks() {
    const currentPage = getCurrentPage();
    const navLinks = safeQueryAll('.nav-link');

    navLinks.forEach((link) => {
        const indicator = link.getAttribute('data-indicator');
        const href = link.getAttribute('href');
        const mappedHref = indicator ? SITE_CONFIG.navMap[indicator] : null;

        if ((href === '#' || href === '') && mappedHref) {
            link.setAttribute('href', mappedHref);
        }

        const finalHref = link.getAttribute('href') || '';
        if (finalHref === currentPage || finalHref === `./${currentPage}`) {
            link.classList.add('is-current');
            link.setAttribute('aria-current', 'page');
        }
    });
}

function initNavigation() {
    const mobileMenuBtn = safeQuery('.mobile-menu-btn');
    const closeMenuBtn = safeQuery('.close-menu-btn');
    const navLinks = safeQuery('.nav-links');
    const navbar = safeQuery('#navbar, .navbar');
    const topBar = ensureTopBar();
    const activePageIndicator = safeQuery('#activePageIndicator');
    const navLinkItems = safeQueryAll('.nav-link');
    const dropdownTriggers = safeQueryAll('.nav-link.has-dropdown, .has-dropdown > a');
    let isMobileMenuOpen = false;
    let lastScrollY = window.scrollY;

    function syncMenuState(open) {
        if (!navLinks || !mobileMenuBtn || !closeMenuBtn) {
            return;
        }
        isMobileMenuOpen = open;
        navLinks.classList.toggle('active', open);
        mobileMenuBtn.style.display = open ? 'none' : 'block';
        closeMenuBtn.style.display = open ? 'block' : 'none';
        document.body.style.overflow = open ? 'hidden' : 'auto';
        if (!open) {
            safeQueryAll('.dropdown, .dropdown-menu').forEach((dropdown) => dropdown.classList.remove('active'));
            safeQueryAll('.has-dropdown').forEach((item) => item.classList.remove('open'));
        }
    }

    if (mobileMenuBtn && closeMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => syncMenuState(true));
        closeMenuBtn.addEventListener('click', () => syncMenuState(false));

        document.addEventListener('click', (event) => {
            if (window.innerWidth > 992 || !isMobileMenuOpen) {
                return;
            }
            if (!event.target.closest('.nav-links') && !event.target.closest('.mobile-menu-btn')) {
                syncMenuState(false);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && isMobileMenuOpen) {
                syncMenuState(false);
            }
        });
    }

    dropdownTriggers.forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
            if (window.innerWidth > 992 || !trigger.classList.contains('has-dropdown')) {
                return;
            }
            event.preventDefault();
            const listItem = trigger.closest('li');
            if (!listItem) {
                return;
            }
            const isOpen = listItem.classList.contains('open');
            safeQueryAll('.has-dropdown').forEach((item) => item.classList.remove('open'));
            if (!isOpen) {
                listItem.classList.add('open');
            }
        });
    });

    navLinkItems.forEach((link) => {
        link.addEventListener('click', () => {
            if (!activePageIndicator) {
                return;
            }
            const indicatorText = link.getAttribute('data-indicator');
            if (!indicatorText) {
                return;
            }
            activePageIndicator.textContent = indicatorText;
            activePageIndicator.style.display = 'block';
            window.setTimeout(() => {
                activePageIndicator.style.display = 'none';
            }, 3000);
        });
    });

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (topBar) {
            if (currentScroll > lastScrollY && currentScroll > 100) {
                topBar.classList.add('hide');
            } else {
                topBar.classList.remove('hide');
            }
        }

        if (navbar) {
            navbar.classList.toggle('scrolled', currentScroll > 50);
        }
        document.body.classList.toggle('scrolled', currentScroll > 60);
        lastScrollY = currentScroll;
    });
}

function initSmoothScroll() {
    safeQueryAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') {
                return;
            }
            const targetElement = safeQuery(targetId);
            if (!targetElement) {
                return;
            }
            event.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function initHeroSlider() {
    const slider = safeQuery('.hero-slider');
    const slides = safeQueryAll('.slide');
    const dots = safeQueryAll('.slider-dot');
    const prevBtn = safeQuery('.prev-slide');
    const nextBtn = safeQuery('.next-slide');
    const progressBar = safeQuery('.progress-bar');

    if (!slider || !slides.length || !prevBtn || !nextBtn || !progressBar) {
        return;
    }

    let currentSlide = 0;
    let slideInterval = null;
    let progressInterval = null;
    const slideDuration = 4000;

    function updateSlider() {
        slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
        dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
    }

    function updateProgressBar() {
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        const increment = 100 / (slideDuration / 50);
        progressBar.style.width = `${currentWidth >= 100 ? 0 : currentWidth + increment}%`;
    }

    function startSlideTimer() {
        window.clearInterval(slideInterval);
        window.clearInterval(progressInterval);
        progressBar.style.width = '0%';
        slideInterval = window.setInterval(nextSlide, slideDuration);
        progressInterval = window.setInterval(updateProgressBar, 50);
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
        startSlideTimer();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlider();
        startSlideTimer();
    }

    function handleSwipe(startX, endX) {
        const threshold = 50;
        if (endX < startX - threshold) {
            nextSlide();
        } else if (endX > startX + threshold) {
            prevSlide();
        }
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const slideIndex = Number.parseInt(dot.getAttribute('data-slide') || '0', 10);
            if (Number.isNaN(slideIndex)) {
                return;
            }
            currentSlide = slideIndex;
            updateSlider();
            startSlideTimer();
        });
    });

    slider.addEventListener('mouseenter', () => {
        window.clearInterval(slideInterval);
        window.clearInterval(progressInterval);
    });
    slider.addEventListener('mouseleave', startSlideTimer);

    let touchStartX = 0;
    slider.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
        window.clearInterval(slideInterval);
        window.clearInterval(progressInterval);
    }, { passive: true });
    slider.addEventListener('touchend', (event) => {
        handleSwipe(touchStartX, event.changedTouches[0].screenX);
        startSlideTimer();
    }, { passive: true });

    updateSlider();
    startSlideTimer();
}

function adjustSliderForMobile() {
    const slider = safeQuery('.hero-slider');
    const slides = safeQueryAll('.slide');
    if (!slider || !slides.length) {
        return;
    }

    if (window.innerWidth <= 768) {
        slider.style.aspectRatio = '9/16';
    } else {
        slider.style.aspectRatio = '16/9';
    }

    slides.forEach((slide) => {
        slide.style.paddingTop = '0';
    });
}

function initSectionObserver() {
    if (!('IntersectionObserver' in window)) {
        return;
    }
    const sections = safeQueryAll('section, .section-hidden');
    if (!sections.length) {
        return;
    }

    const observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active', 'section-visible');
                if (entry.target.classList.contains('section-hidden')) {
                    activeObserver.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.1 });

    sections.forEach((section) => observer.observe(section));
}

function initReadMoreBlocks() {
    safeQueryAll('.read-more, .christhood-read-more').forEach((button) => {
        button.addEventListener('click', () => {
            const fullContent = button.nextElementSibling;
            if (!fullContent) {
                return;
            }
            const isCurrentlyOpen = fullContent.classList.contains('active') || fullContent.classList.contains('show');
            if (isCurrentlyOpen) {
                fullContent.classList.remove('active', 'show');
                button.classList.remove('active');
                button.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
            } else {
                fullContent.classList.add('active', 'show');
                button.classList.add('active');
                button.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
            }
        });
    });

    safeQueryAll('.christhood-read-more-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.christhood-testimonial-card');
            const content = card ? safeQuery('.christhood-testimonial-content', card) : null;
            if (!card || !content) {
                return;
            }
            const expanding = content.classList.contains('collapsed');
            content.classList.toggle('collapsed', !expanding);
            content.classList.toggle('expanded', expanding);
            button.textContent = expanding ? 'Read Less' : 'Read More';
            card.style.minHeight = expanding ? 'auto' : '300px';
        });
    });
}

function initAccordion() {
    safeQueryAll('.accord-header').forEach((header) => {
        header.addEventListener('click', () => {
            const accordionContent = header.nextElementSibling;
            if (!accordionContent) {
                return;
            }
            const accordionIcon = safeQuery('.accord-icon', header);
            safeQueryAll('.accord-content').forEach((content) => {
                if (content === accordionContent || !content.style.maxHeight) {
                    return;
                }
                content.style.maxHeight = null;
                const peerHeader = content.previousElementSibling;
                const icon = peerHeader ? safeQuery('.accord-icon', peerHeader) : null;
                if (icon) {
                    icon.textContent = '+';
                }
                if (peerHeader) {
                    peerHeader.style.backgroundColor = 'var(--Primary-Blue)';
                }
            });

            const isOpen = Boolean(accordionContent.style.maxHeight);
            accordionContent.style.maxHeight = isOpen ? null : `${accordionContent.scrollHeight}px`;
            if (accordionIcon) {
                accordionIcon.textContent = isOpen ? '+' : '-';
            }
            header.style.backgroundColor = isOpen ? 'var(--Primary-Blue)' : '#003b8e';
        });
    });
}

function initAnimateOnScroll() {
    const animatedSelectors = [
        '.min-content-col',
        '.button-btn a',
        '.flip-card',
        '.mission-section p',
        '.action-section'
    ];
    const animatedElements = safeQueryAll(animatedSelectors.join(', '));
    if (!animatedElements.length) {
        return;
    }

    animatedElements.forEach((element) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    function onScroll() {
        const windowHeight = window.innerHeight;
        animatedElements.forEach((element) => {
            if (element.getBoundingClientRect().top < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }

    window.addEventListener('scroll', onScroll);
    onScroll();
}

function initLeadershipAnimations() {
    if (!('IntersectionObserver' in window)) {
        return;
    }
    const cards = safeQueryAll('.christhood-leader-card, .christhood-testimonial-card');
    if (!cards.length) {
        return;
    }

    const observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                activeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach((card) => observer.observe(card));
}

function initTestimonialCarousel() {
    const track = safeQuery('.christhood-testimonial-track');
    const cards = safeQueryAll('.christhood-testimonial-card');
    const prevBtn = safeQuery('.christhood-carousel-arrow.prev');
    const nextBtn = safeQuery('.christhood-carousel-arrow.next');
    const dotsContainer = safeQuery('.christhood-carousel-dots');

    if (!track || cards.length === 0 || !prevBtn || !nextBtn || !dotsContainer) {
        return;
    }

    const firstCards = cards.slice(0, 3).map((card) => card.cloneNode(true));
    const lastCards = cards.slice(-3).reverse().map((card) => card.cloneNode(true));
    firstCards.forEach((card) => track.appendChild(card));
    lastCards.forEach((card) => track.insertBefore(card, track.firstChild));

    const allCards = safeQueryAll('.christhood-testimonial-card');
    let visibleCards = window.innerWidth >= 992 ? 3 : (window.innerWidth >= 768 ? 2 : 1);
    let currentPosition = 3;
    let cardWidth = allCards[0] ? allCards[0].offsetWidth + 20 : 0;
    let autoScrollInterval = null;

    function buildDots() {
        dotsContainer.innerHTML = '';
        const dotCount = Math.ceil(cards.length / visibleCards);
        for (let index = 0; index < dotCount; index += 1) {
            const dot = document.createElement('div');
            dot.className = 'christhood-carousel-dot';
            dot.addEventListener('click', () => {
                currentPosition = index * visibleCards + 3;
                updateCarousel();
                restartAutoScroll();
            });
            dotsContainer.appendChild(dot);
        }
    }

    function updateCarousel() {
        const dots = safeQueryAll('.christhood-carousel-dot', dotsContainer);
        const dotCount = dots.length || 1;
        track.style.transition = 'transform 0.5s ease';
        track.style.transform = `translateX(-${currentPosition * cardWidth}px)`;
        const activeDot = ((Math.floor((currentPosition - 3) / visibleCards) % dotCount) + dotCount) % dotCount;
        dots.forEach((dot, index) => dot.classList.toggle('active', index === activeDot));
    }

    function normalizePosition() {
        const cardCount = safeQueryAll('.christhood-testimonial-card').length;
        track.style.transition = 'none';
        if (currentPosition <= 2) {
            currentPosition = cardCount - 3;
        } else if (currentPosition >= cardCount - 3) {
            currentPosition = 3;
        }
        track.style.transform = `translateX(-${currentPosition * cardWidth}px)`;
        window.setTimeout(() => {
            track.style.transition = 'transform 0.5s ease';
        }, 10);
    }

    function nextSlide() {
        currentPosition += 1;
        updateCarousel();
        restartAutoScroll();
        window.setTimeout(normalizePosition, 500);
    }

    function prevSlide() {
        currentPosition -= 1;
        updateCarousel();
        restartAutoScroll();
        window.setTimeout(normalizePosition, 500);
    }

    function restartAutoScroll() {
        window.clearInterval(autoScrollInterval);
        autoScrollInterval = window.setInterval(nextSlide, 5000);
    }

    buildDots();
    updateCarousel();
    restartAutoScroll();

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    track.addEventListener('mouseenter', () => window.clearInterval(autoScrollInterval));
    track.addEventListener('mouseleave', restartAutoScroll);
    window.addEventListener('resize', () => {
        visibleCards = window.innerWidth >= 992 ? 3 : (window.innerWidth >= 768 ? 2 : 1);
        cardWidth = allCards[0] ? allCards[0].offsetWidth + 20 : 0;
        buildDots();
        updateCarousel();
    });
}

function initEventSectionCarousel() {
    const eventCards = safeQueryAll('.Events-section .event-card');
    const indicators = safeQueryAll('.Events-section .indicator');
    const prevBtn = safeQuery('#prevBtn');
    const nextBtn = safeQuery('#nextBtn');
    const registrationBtn = safeQuery('.registration-link-btn');

    if (registrationBtn) {
        window.setInterval(() => {
            registrationBtn.style.transform = 'scale(1.02)';
            window.setTimeout(() => {
                registrationBtn.style.transform = '';
            }, 500);
        }, 2000);
    }

    if (!eventCards.length || !prevBtn || !nextBtn) {
        return;
    }

    let currentIndex = 0;

    function updateActiveEvent() {
        eventCards.forEach((card, index) => {
            card.style.transform = index === currentIndex ? 'scale(1.05)' : 'scale(0.95)';
            card.style.zIndex = index === currentIndex ? '10' : '1';
        });
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + eventCards.length) % eventCards.length;
        updateActiveEvent();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % eventCards.length;
        updateActiveEvent();
    });

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentIndex = index;
            updateActiveEvent();
        });
    });

    window.setInterval(() => {
        currentIndex = (currentIndex + 1) % eventCards.length;
        updateActiveEvent();
    }, 5000);

    updateActiveEvent();
}

function initClipboardButtons() {
    window.copyToClipboard = function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied to clipboard: ${text}`);
        }).catch((error) => {
            console.error('Could not copy text: ', error);
        });
    };

    safeQueryAll('.christhood-copy-btn').forEach((button) => {
        button.addEventListener('click', function onCopyClick() {
            const textToCopy = button.getAttribute('data-text');
            if (!textToCopy) {
                return;
            }
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                window.setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            }).catch((error) => {
                console.error('Failed to copy text: ', error);
            });
        });
    });
}

function initTabButtons() {
    safeQueryAll('.christhood-tab-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            if (!tabId) {
                return;
            }
            safeQueryAll('.christhood-tab-btn').forEach((tabButton) => tabButton.classList.remove('active'));
            safeQueryAll('.christhood-tab-content').forEach((tabContent) => tabContent.classList.remove('active'));
            button.classList.add('active');
            const tabPanel = document.getElementById(tabId);
            if (tabPanel) {
                tabPanel.classList.add('active');
            }
        });
    });
}

function initMapLoaderAndForms() {
    const mapLoader = safeQuery('#mapLoader');
    const locationMap = safeQuery('#locationMap');
    if (locationMap) {
        locationMap.addEventListener('load', () => {
            if (mapLoader) {
                mapLoader.style.display = 'none';
            }
        });
    }

    const humanitarianForm = safeQuery('.contact-form');
    if (humanitarianForm) {
        humanitarianForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            humanitarianForm.reset();
        });
    }
}

function initSocialEffects() {
    safeQueryAll('.icon-bar a').forEach((icon) => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'translateY(-5px)';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'translateY(0)';
        });
    });

    safeQueryAll('.social-media-icons a').forEach((icon) => {
        const platform = icon.getAttribute('aria-label')?.toLowerCase();
        if (!platform) {
            return;
        }
        icon.addEventListener('mouseenter', () => {
            const backgrounds = {
                instagram: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                facebook: '#3b5998',
                tiktok: '#000000',
                youtube: '#ff0000',
                twitter: '#000000'
            };
            icon.style.background = backgrounds[platform] || 'transparent';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.background = 'transparent';
        });
    });
}

function initScrollTopButton() {
    if (!document.body || safeQuery('.scroll-top-button')) {
        return;
    }

    const button = document.createElement('button');
    button.className = 'scroll-top-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = '<span class="scroll-top-icon"><i class="bx bx-chevron-up"></i></span>';
    document.body.appendChild(button);

    function getThreshold() {
        const hero = safeQuery('.hero-slider, .bm-main-banner, .apostle-hero, .christhood-hero, .christhood-mission-hero, .protocolministry-intro, .mediaministry-cont-page-intro, .jm-hero-banner, .tlm-hero-v2, .christhood-iact-hero, .christhood-apologetics-hero, .christhood-impact-hero, .hero, .men-ministry-intro, .ladiesministry-intro, .worship-hero, .missions-hero, .pillars-hero');
        return hero ? hero.offsetHeight : 400;
    }

    function onScroll() {
        button.classList.toggle('show', window.scrollY > getThreshold());
    }

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', onScroll);
    window.addEventListener('load', onScroll);
}

function initPwaUpdates() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    let newWorker = null;

    function ensureUpdateBanner() {
        let banner = document.getElementById('updateBanner');
        if (banner) {
            return banner;
        }
        banner = document.createElement('div');
        banner.id = 'updateBanner';
        banner.style.cssText = 'display:none; position:fixed; bottom:0; left:0; right:0; background:linear-gradient(90deg,#4b248c,#0047AB); color:#ffffff; padding:14px 20px; align-items:center; justify-content:space-between; z-index:9999; font-size:0.95rem; box-shadow:0 -4px 20px rgba(0,0,0,0.3);';
        banner.innerHTML = '<span>A new version of Christhood Ministries is available</span><button type="button" id="updateAppBtn" style="background:#F3CC3C; color:#000000; border:none; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer; font-size:0.9rem; margin-left:1rem;">Update Now</button>';
        document.body.appendChild(banner);
        const updateBtn = banner.querySelector('#updateAppBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                if (newWorker) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
        return banner;
    }

    const serviceWorkerPath = 'service-worker.js';
    navigator.serviceWorker.register(serviceWorkerPath).then((registration) => {
        registration.addEventListener('updatefound', () => {
            newWorker = registration.installing;
            if (!newWorker) {
                return;
            }
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    ensureUpdateBanner().style.display = 'flex';
                }
            });
        });
    }).catch((error) => {
        console.error('Service worker registration failed:', error);
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            ensureUpdateBanner().style.display = 'flex';
        }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    }, { once: true });
}

function initStandaloneSplash() {
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator.standalone === true;
    if (!isStandalone && !isIosStandalone) {
        return;
    }
    if (sessionStorage.getItem('appSplashSeen') === 'true') {
        return;
    }
    sessionStorage.setItem('appSplashSeen', 'true');

    const splash = document.createElement('div');
    splash.className = 'app-splash';
    splash.innerHTML = `
        <div class="app-splash__content">
            <img class="app-splash__logo" src="${SITE_CONFIG.logoPath}" alt="Christhood Ministries Logo">
            <div class="app-splash__title">CHRISTHOOD MINISTRIES</div>
            <div class="app-splash__tagline">BELIEVE BELONG BECOME</div>
        </div>
    `;
    document.body.appendChild(splash);

    window.setTimeout(() => {
        splash.classList.add('app-splash--hide');
        window.setTimeout(() => splash.remove(), 450);
    }, 1400);
}

onReady(() => {
    ensureBrandAssets();
    ensureFooter();
    ensureTopBar();
    normalizeNavigationMarkup();
    normalizeNavLinks();
    repairRenderedText();
    initTextRepairObserver();
    initNavigation();
    initSmoothScroll();
    initHeroSlider();
    adjustSliderForMobile();
    initSectionObserver();
    initReadMoreBlocks();
    initAccordion();
    initAnimateOnScroll();
    initLeadershipAnimations();
    initTestimonialCarousel();
    initEventSectionCarousel();
    initClipboardButtons();
    initTabButtons();
    initMapLoaderAndForms();
    initSocialEffects();
    initScrollTopButton();
    initStandaloneSplash();
    initPwaUpdates();
});

window.addEventListener('resize', adjustSliderForMobile);
