document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const closeMenuBtn = document.querySelector('.close-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const activePageIndicator = document.getElementById('activePageIndicator');
    const navLinksAll = document.querySelectorAll('.nav-link');
    const topBars = document.querySelectorAll('.top-bar');
    let topBar = document.getElementById('topBar');
    const navbar = document.getElementById('navbar');

    // Initialize mobile menu state
    let isMobileMenuOpen = false;
    let lastScrollY = window.scrollY;

    if (topBars.length) {
        const primaryTopBar = topBars[0];
        topBars.forEach((bar, index) => {
            if (index > 0) {
                bar.remove();
            }
        });

        if (!primaryTopBar.id) {
            primaryTopBar.id = 'topBar';
        }

        primaryTopBar.innerHTML = `
            <div class="top-bar-container">
                <a href="#"><i class='bx bx-phone'></i> +254 714 545791</a>
                <a href="#"><i class='bx bx-phone'></i> +254 712 284711</a>
                <a href="#"><i class='bx bx-envelope'></i> christhoodministries01@gmail.com</a>
                <a href="https://instituteofapologetics.org" class="portal-btn"><i class='bx bx-book'></i> Christhood Learning Portal</a>
            </div>
        `;
        topBar = primaryTopBar;
    }


    // Mobile Menu Toggle Functionality
    function toggleMobileMenu() {
        isMobileMenuOpen = !isMobileMenuOpen;

        if (isMobileMenuOpen) {
            // Open menu
            navLinks.classList.add('active');
            mobileMenuBtn.style.display = 'none';
            closeMenuBtn.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            // Close menu
            navLinks.classList.remove('active');
            mobileMenuBtn.style.display = 'block';
            closeMenuBtn.style.display = 'none';
            document.body.style.overflow = 'auto';

            // Close all dropdowns when closing main menu
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });

            document.querySelectorAll('.has-dropdown').forEach(item => {
                item.classList.remove('open');
            });
        }
    }

    // Event Listeners
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    closeMenuBtn.addEventListener('click', toggleMobileMenu);

    // Close menu when clicking outside on mobile
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 992 && isMobileMenuOpen) {
            if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
                toggleMobileMenu();
            }
        }
    });

    // Close menu when window is resized to desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth > 992 && isMobileMenuOpen) {
            toggleMobileMenu();
        }
    });

    // Active page indicator functionality
    navLinksAll.forEach(link => {
        link.addEventListener('click', function (e) {
            // For dropdown toggles, prevent default only on mobile
            if (window.innerWidth <= 992 && this.classList.contains('has-dropdown')) {
                e.preventDefault();
            } else {
                const indicatorText = this.getAttribute('data-indicator');
                activePageIndicator.textContent = indicatorText;
                activePageIndicator.style.display = 'block';

                // Hide after 5 seconds
                setTimeout(() => {
                    activePageIndicator.style.display = 'none';
                }, 5000);
            }
        });
    });

    // Scroll behavior for top bar and navbar
    window.addEventListener('scroll', () => {
        // Top bar hide/show on scroll
        if (topBar) {
            if (window.scrollY > lastScrollY && window.scrollY > 100) {
                topBar.classList.add('hide');
            } else {
                topBar.classList.remove('hide');
            }
        }

        // Navbar sticky behavior
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (window.scrollY > 60) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }

        lastScrollY = window.scrollY;
    });
});

/* ======================
   NAVBAR SCROLL BEHAVIOR
   ====================== */
(function () {
    const navbar = document.querySelector('.navbar');
    const topBar = document.querySelector('.top-bar');
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
        const currentScroll = window.scrollY;
        if (currentScroll <= 0) {
            if (topBar) {
                topBar.classList.remove('hide');
            }
            if (navbar) {
                navbar.classList.remove('scrolled');
            }
        } else if (currentScroll > lastScroll) {
            if (topBar) {
                topBar.classList.add('hide');
            }
            if (navbar) {
                navbar.classList.add('scrolled');
            }
        } else {
            if (topBar) {
                topBar.classList.remove('hide');
            }
            if (navbar) {
                navbar.classList.add('scrolled');
            }
        }

        if (currentScroll > 60) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    });
})();


   /*HERO SLIDER FUNCTIONALITY*/

document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    const progressBar = document.querySelector('.progress-bar');

    let currentSlide = 0;
    let slideInterval;
    let progressInterval;
    const slideDuration = 4000; // 4 seconds

    // Initialize slider
    function initSlider() {
        updateSlider();
        startSlideTimer();
    }

    // Start automatic slide timer
    function startSlideTimer() {
        clearInterval(slideInterval);
        clearInterval(progressInterval);

        progressBar.style.width = '0%';

        slideInterval = setInterval(nextSlide, slideDuration);
        progressInterval = setInterval(updateProgressBar, 50);
    }

    // Update progress bar
    function updateProgressBar() {
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        const increment = (100 / (slideDuration / 50));

        if (currentWidth >= 100) {
            progressBar.style.width = '0%';
        } else {
            progressBar.style.width = (currentWidth + increment) + '%';
        }
    }

    // Go to next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
        startSlideTimer();
    }

    // Go to previous slide
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlider();
        startSlideTimer();
    }

    // Update slider display
    function updateSlider() {
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === currentSlide) {
                slide.classList.add('active');
            }
        });

        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === currentSlide) {
                dot.classList.add('active');
            }
        });
    }

    // Go to specific slide
    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
        startSlideTimer();
    }

    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    dots.forEach(dot => {
        dot.addEventListener('click', function () {
            const slideIndex = parseInt(this.getAttribute('data-slide'));
            goToSlide(slideIndex);
        });
    });

    // Pause on hover
    const slider = document.querySelector('.hero-slider');
    slider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
        clearInterval(progressInterval);
    });

    slider.addEventListener('mouseleave', startSlideTimer);

    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(slideInterval);
        clearInterval(progressInterval);
    }, { passive: true });

    slider.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startSlideTimer();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            nextSlide();
        } else if (touchEndX > touchStartX + threshold) {
            prevSlide();
        }
    }

    // Initialize the slider
    initSlider();
});

/* ======================
   MOBILE SLIDER ADJUSTMENTS
   ====================== */
function adjustSliderForMobile() {
    const slider = document.querySelector('.hero-slider');
    const slides = document.querySelectorAll('.slide');

    if (window.innerWidth <= 768) {
        // Mobile adjustments
        slider.style.aspectRatio = '9/16';
        slides.forEach(slide => {
            slide.style.paddingTop = '177.78%'; // 9:16 aspect ratio
        });
    } else {
        // Desktop settings
        slider.style.aspectRatio = '16/9';
        slides.forEach(slide => {
            slide.style.paddingTop = '56.25%'; // 16:9 aspect ratio
        });
    }
}

// Run on load and resize
window.addEventListener('load', adjustSliderForMobile);
window.addEventListener('resize', adjustSliderForMobile);

/* ======================
   FELLOWSHIP DETAILS ANIMATIONS
   ====================== */
document.addEventListener('DOMContentLoaded', function () {
    // Initialize elements with opacity 0
    const elements = [
        { element: document.querySelector('.image-container'), delay: 0 },
        { element: document.querySelector('.fellowship-details'), delay: 300 },
        { element: document.querySelector('.upcoming-events'), delay: 600 },
        { element: document.querySelector('.icon-bar'), delay: 900 }
    ];

    // Set initial opacity to 0 for all animated elements
    elements.forEach(item => {
        if (item.element) {
            item.element.style.opacity = '0';
        }
    });

    // Animate elements with staggered delays
    elements.forEach(item => {
        if (item.element) {
            setTimeout(() => {
                item.element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                item.element.style.opacity = '1';
                item.element.style.transform = 'translateY(0)';
            }, item.delay);
        }
    });
});

/* ======================
   GENERAL PAGE ANIMATIONS
   ====================== */
document.addEventListener('DOMContentLoaded', function () {
    // Section Observer for animations
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Social media icon hover effects
    const socialIcons = document.querySelectorAll('.icon-bar a');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
        });
        icon.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
});

/* ======================
   UTILITY FUNCTIONS
   ====================== */
document.addEventListener('DOMContentLoaded', function () {
    // Map loader
    const mapLoader = document.getElementById('mapLoader');
    const locationMap = document.getElementById('locationMap');

    if (locationMap) {
        locationMap.addEventListener('load', function () {
            if (mapLoader) mapLoader.style.display = 'none';
        });
    }

    // Set current year in footer
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});

/* ======================
   BACK TO TOP BUTTON
   ======================
document.addEventListener('DOMContentLoaded', function () {
    const backToTopButton = document.getElementById('backToTop');
    if (!backToTopButton) return;

    const navbarHeight = document.querySelector('nav')?.offsetHeight || 50;
    const scrollThreshold = Math.max(window.innerHeight * 0.5, 300); // At least 50vh or 300px

    function toggleBackToTop() {
        if (window.pageYOffset > scrollThreshold) {
            backToTopButton.classList.add('active');
        } else {
            backToTopButton.classList.remove('active');
        }
    }

    // Initial check
    toggleBackToTop();

    // Scroll event listener
    window.addEventListener('scroll', function () {
        toggleBackToTop();
    });

    // More reliable scroll detection
    function checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        const halfViewport = window.innerHeight / 2;

        if (scrollPosition > halfViewport) {
            backToTopButton.classList.add('active');
        } else {
            backToTopButton.classList.remove('active');
        }
    }

    // Throttled scroll event for better performance
    let isScrolling;
    window.addEventListener('scroll', function () {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(checkScroll, 50);
    }, false);

    // Smooth scroll with offset if you have fixed navbar
    backToTopButton.addEventListener('click', function (e) {
        e.preventDefault();
        const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;

        window.scrollTo({
            top: navbarHeight, // Stops at navbar if exists
            behavior: 'smooth'
        });
    });

    // Handle resize events
    window.addEventListener('resize', checkScroll);
});/*

======================
 /*  COPY TO CLIPBOARD FUNCTION
   ====================== */
window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text).then(function () {
        alert('Copied to clipboard: ' + text);
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
};

/* ======================
   SOCIAL MEDIA ICON EFFECTS
   ====================== */
document.addEventListener('DOMContentLoaded', function () {
    const socialIcons = document.querySelectorAll('.social-media-icons a');
    socialIcons.forEach(icon => {
        const platform = icon.getAttribute('aria-label')?.toLowerCase();
        if (!platform) return;

        icon.addEventListener('mouseenter', () => {
            switch (platform) {
                case 'instagram':
                    icon.style.background = 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)';
                    break;
                case 'facebook':
                    icon.style.background = '#3b5998';
                    break;
                case 'tiktok':
                    icon.style.background = '#000000';
                    break;
                case 'youtube':
                    icon.style.background = '#ff0000';
                    break;
                case 'twitter':
                    icon.style.background = '#000000';
                    break;
            }
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.background = 'transparent';
        });
    });
});

/* ======================
   READ MORE FUNCTIONALITY (GENERAL)
   ====================== */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.read-more').forEach(button => {
        button.addEventListener('click', function () {
            const fullContent = this.nextElementSibling;
            this.classList.toggle('active');

            if (fullContent.classList.contains('show')) {
                fullContent.classList.remove('show');
                this.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
            } else {
                fullContent.classList.add('show');
                this.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
            }
        });
    });
});

/* ======================
   CHRISTHOOD LEADERSHIP SECTION
   ====================== */
document.addEventListener('DOMContentLoaded', function () {
    // Read More Functionality
    document.querySelectorAll('.christhood-read-more').forEach(button => {
        button.addEventListener('click', function () {
            const fullMessage = this.nextElementSibling;
            this.classList.toggle('active');

            if (fullMessage.classList.contains('show')) {
                fullMessage.classList.remove('show');
                this.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
            } else {
                fullMessage.classList.add('show');
                this.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
            }
        });
    });

    // Scroll Animation
    const observerOptions = {
        threshold: 0.1
    };

    const leaderObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const testimonialObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger the animations
                setTimeout(() => {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }, index * 200);
            }
        });
    }, observerOptions);

    // Observe leader cards
    document.querySelectorAll('.christhood-leader-card').forEach(card => {
        leaderObserver.observe(card);
    });

    // Observe testimonial cards
    document.querySelectorAll('.christhood-testimonial-card').forEach(card => {
        testimonialObserver.observe(card);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Read More functionality
    const readMoreButtons = document.querySelectorAll('.christhood-read-more-btn');

    readMoreButtons.forEach(button => {
        button.addEventListener('click', function () {
            const card = this.closest('.christhood-testimonial-card');
            const content = card.querySelector('.christhood-testimonial-content');

            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                this.textContent = 'Read Less';
                card.style.minHeight = 'auto'; // Adjust height to fit expanded content
            } else {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                this.textContent = 'Read More';
                card.style.minHeight = '300px'; // Reset to original height
            }
        });
    });

    // Original carousel functionality
    const track = document.querySelector('.christhood-testimonial-track');
    const cards = document.querySelectorAll('.christhood-testimonial-card');
    const prevBtn = document.querySelector('.christhood-carousel-arrow.prev');
    const nextBtn = document.querySelector('.christhood-carousel-arrow.next');
    const dotsContainer = document.querySelector('.christhood-carousel-dots');

    if (!track || cards.length === 0) return;

    // Clone first few cards and append to end for infinite effect
    const firstCards = Array.from(cards).slice(0, 3);
    firstCards.forEach(card => {
        const clone = card.cloneNode(true);
        track.appendChild(clone);
    });

    // Clone last few cards and prepend to beginning for infinite effect
    const lastCards = Array.from(cards).slice(-3);
    lastCards.reverse().forEach(card => {
        const clone = card.cloneNode(true);
        track.insertBefore(clone, track.firstChild);
    });

    const allCards = document.querySelectorAll('.christhood-testimonial-card');
    const cardCount = allCards.length;
    let cardWidth = allCards[0].offsetWidth + 20; // including gap
    let currentPosition = 3; // Start at original first card
    let autoScrollInterval;
    let visibleCards = window.innerWidth >= 992 ? 3 : (window.innerWidth >= 768 ? 2 : 1);
    const dotCount = Math.ceil(cards.length / visibleCards);

    // Create dots
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.classList.add('christhood-carousel-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    const dots = document.querySelectorAll('.christhood-carousel-dot');

    // Update carousel position
    function updateCarousel() {
        track.style.transition = 'transform 0.5s ease';
        track.style.transform = `translateX(-${currentPosition * cardWidth}px)`;

        // Update active dot
        const activeDot = Math.floor((currentPosition - 3) / visibleCards) % dotCount;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeDot);
        });
    }

    // Handle infinite loop
    function checkPosition() {
        track.style.transition = 'none';

        if (currentPosition <= 2) {
            currentPosition = cardCount - 3;
            track.style.transform = `translateX(-${currentPosition * cardWidth}px)`;
        } else if (currentPosition >= cardCount - 3) {
            currentPosition = 3;
            track.style.transform = `translateX(-${currentPosition * cardWidth}px)`;
        }

        setTimeout(() => {
            track.style.transition = 'transform 0.5s ease';
        }, 10);
    }

    // Go to specific slide
    function goToSlide(index) {
        currentPosition = index * visibleCards + 3;
        updateCarousel();
        resetAutoScroll();
    }

    // Next slide
    function nextSlide() {
        currentPosition++;
        updateCarousel();
        resetAutoScroll();

        if (currentPosition >= cardCount - 3) {
            setTimeout(checkPosition, 500);
        }
    }

    // Previous slide
    function prevSlide() {
        currentPosition--;
        updateCarousel();
        resetAutoScroll();

        if (currentPosition <= 2) {
            setTimeout(checkPosition, 500);
        }
    }

    // Auto-scroll functionality
    function startAutoScroll() {
        autoScrollInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoScroll() {
        clearInterval(autoScrollInterval);
        startAutoScroll();
    }

    // Event listeners
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Start auto-scroll
    startAutoScroll();

    // Pause auto-scroll on hover
    track.addEventListener('mouseenter', () => {
        clearInterval(autoScrollInterval);
    });

    track.addEventListener('mouseleave', () => {
        startAutoScroll();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        const newVisibleCards = window.innerWidth >= 992 ? 3 : (window.innerWidth >= 768 ? 2 : 1);
        cardWidth = allCards[0].offsetWidth + 20;

        // Recreate dots if visible cards count changes
        if (newVisibleCards !== visibleCards) {
            visibleCards = newVisibleCards;
            dotsContainer.innerHTML = '';
            const newDotCount = Math.ceil(cards.length / visibleCards);

            for (let i = 0; i < newDotCount; i++) {
                const dot = document.createElement('div');
                dot.classList.add('christhood-carousel-dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }

        updateCarousel();
    });
});


/* ======================
   CHRISTHOOD MISSION/VISION PAGE
   ====================== */
// Toggle read more buttons
document.querySelectorAll('.read-more').forEach(button => {
    button.addEventListener('click', function () {
        const fullContent = this.nextElementSibling;
        fullContent.classList.toggle('active');
        this.classList.toggle('active');

        if (fullContent.classList.contains('active')) {
            this.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
        } else {
            this.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
        }
    });
});
 


/* ======================
   ADMINISTRATION PAGE
   ====================== */
document.addEventListener('DOMContentLoaded', function () {
    // Accordion functionality for mobile
    const accordHeaders = document.querySelectorAll('.accord-header');

    accordHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const accordionItem = this.parentElement;
            const accordionContent = this.nextElementSibling;
            const accordionIcon = this.querySelector('.accord-icon');

            // Close all other open accordion items
            document.querySelectorAll('.accord-content').forEach(content => {
                if (content !== accordionContent && content.style.maxHeight) {
                    content.style.maxHeight = null;
                    const icon = content.previousElementSibling.querySelector('.accord-icon');
                    if (icon) icon.textContent = '+';
                    content.previousElementSibling.style.backgroundColor = 'var(--Primary-Blue)';
                }
            });

            // Toggle current item
            if (accordionContent.style.maxHeight) {
                accordionContent.style.maxHeight = null;
                if (accordionIcon) accordionIcon.textContent = '+';
                this.style.backgroundColor = 'var(--Primary-Blue)';
            } else {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                if (accordionIcon) accordionIcon.textContent = '-';
                this.style.backgroundColor = '#003b8e';
            }
        });
    });

    // Animation on scroll
    function animateOnScroll() {
        const elements = document.querySelectorAll('.min-content-col, .button-btn a');
        const windowHeight = window.innerHeight;

        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementPosition < windowHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }

    // Set initial state for animation
    document.querySelectorAll('.min-content-col, .button-btn a').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on load
});

/*EVENTS SECTION */
document.addEventListener('DOMContentLoaded', function () {
    const eventCards = document.querySelectorAll('.Events-section .event-card');
    const indicators = document.querySelectorAll('.Events-section .indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    let currentIndex = 0;

    // Function to update active event
    function updateActiveEvent() {
        eventCards.forEach((card, index) => {
            if (index === currentIndex) {
                card.style.transform = 'scale(1.05)';
                card.style.zIndex = '10';
            } else {
                card.style.transform = 'scale(0.95)';
                card.style.zIndex = '1';
            }
        });

        // Update active indicator
        indicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    // Navigation event listeners
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + eventCards.length) % eventCards.length;
        updateActiveEvent();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % eventCards.length;
        updateActiveEvent();
    });

    // Indicator click event
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentIndex = index;
            updateActiveEvent();
        });
    });

    // Add click handlers for buttons
    document.querySelectorAll('.Events-section .learn-more').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventName = e.target.closest('.event-card').querySelector('h3').textContent;
            alert(`Learn more about: ${eventName}`);
        });
    });

    document.querySelectorAll('.Events-section .register').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventName = e.target.closest('.event-card').querySelector('h3').textContent;
            alert(`Register for: ${eventName}`);
        });
    });

    // Initialize
    updateActiveEvent();

    // Auto-advance carousel every 5 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % eventCards.length;
        updateActiveEvent();
    }, 5000);
});


/*EVENTS JS */
// Simple animation for the registration link
document.addEventListener('DOMContentLoaded', function () {
    const registrationBtn = document.querySelector('.registration-link-btn');

    // Add a subtle pulsing animation
    setInterval(() => {
        registrationBtn.style.transform = 'scale(1.02)';
        setTimeout(() => {
            registrationBtn.style.transform = '';
        }, 500);
    }, 2000);
});

// ── MOBILE NAV ──
(function () {
    const nav = document.querySelector('nav, #navbar, .navbar, header nav');
    if (!nav) return;

    const navLinks = nav.querySelector('.nav-links');
    let dropdownItems = [];

    try {
        dropdownItems = nav.querySelectorAll('li:has(ul), li:has(.dropdown-menu)');
    } catch (error) {
        dropdownItems = Array.from(nav.querySelectorAll('li')).filter(item => {
            return item.querySelector(':scope > ul, :scope > .dropdown-menu');
        });
    }

    dropdownItems.forEach(item => {
        item.classList.add('has-dropdown');
        const link = item.querySelector(':scope > a');
        if (link && !link.querySelector('.nav-chevron')) {
            const chevron = document.createElement('span');
            chevron.className = 'nav-chevron';
            chevron.setAttribute('aria-hidden', 'true');
            link.appendChild(chevron);
        }
    });

    dropdownItems.forEach(item => {
        const link = item.querySelector(':scope > a');
        if (!link) return;
        link.addEventListener('click', function (e) {
            if (window.innerWidth > 768) return;
            e.preventDefault();
            const isOpen = item.classList.contains('open');
            dropdownItems.forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    const subLinks = nav.querySelectorAll('.has-dropdown ul a, .has-dropdown .dropdown-menu a');
    subLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth > 768) return;
            dropdownItems.forEach(i => i.classList.remove('open'));
            if (!navLinks) return;
            navLinks.classList.remove('active');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const closeMenuBtn = document.querySelector('.close-menu-btn');
            if (mobileMenuBtn) mobileMenuBtn.style.display = 'block';
            if (closeMenuBtn) closeMenuBtn.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

})();

(function initAppSplash() {
    function showSplash() {
        if (!document.body) return;
        const splash = document.createElement('div');
        splash.className = 'app-splash';
        splash.innerHTML = `
            <div class="app-splash__content">
                <img class="app-splash__logo" src="/image/logo.png" alt="Christhood Ministries Logo">
                <div class="app-splash__title">CHRISTHOOD MINISTRIES</div>
                <div class="app-splash__tagline">BELEIVE BELONG BECOME</div>
            </div>
        `;
        document.body.appendChild(splash);

        setTimeout(() => {
            splash.classList.add('app-splash--hide');
            setTimeout(() => splash.remove(), 450);
        }, 1400);
    }

    if (sessionStorage.getItem('appSplashSeen') === 'true') return;
    sessionStorage.setItem('appSplashSeen', 'true');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showSplash);
    } else {
        showSplash();
    }
})();

(function initPwaUpdates() {
    let newWorker;

    function ensureUpdateBanner() {
        if (!document.body) return null;
        let banner = document.getElementById('updateBanner');
        if (banner) return banner;

        banner = document.createElement('div');
        banner.id = 'updateBanner';
        banner.style.cssText = 'display:none; position:fixed; bottom:0; left:0; right:0; background:linear-gradient(90deg,#4b248c,#0047AB); color:#ffffff; padding:14px 20px; align-items:center; justify-content:space-between; z-index:9999; font-size:0.95rem; box-shadow:0 -4px 20px rgba(0,0,0,0.3);';
        banner.innerHTML = '<span>✨ A new version of Christhood Ministries is available</span>' +
            '<button type="button" id="updateAppBtn" style="background:#F3CC3C; color:#000000; border:none; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer; font-size:0.9rem; margin-left:1rem;">Update Now</button>';
        document.body.appendChild(banner);

        const updateBtn = banner.querySelector('#updateAppBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                if (typeof window.applyUpdate === 'function') {
                    window.applyUpdate();
                }
            });
        }

        return banner;
    }

    function showUpdateBanner() {
        const banner = ensureUpdateBanner();
        if (banner) {
            banner.style.display = 'flex';
        }
    }

    if (!('serviceWorker' in navigator)) return;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureUpdateBanner);
    } else {
        ensureUpdateBanner();
    }

    navigator.serviceWorker.register('/service-worker.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateBanner();
                }
            });
        });
    });

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            showUpdateBanner();
        }
    });

    window.applyUpdate = function () {
        if (newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        }, { once: true });
    };
})();