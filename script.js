// Decent Animation Hook - Intersection Observer
document.addEventListener("DOMContentLoaded", () => {
    // Select all elements with the fade-up class
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.fade-up');
    elementsToAnimate.forEach(el => {
        scrollObserver.observe(el);
    });

    // ==========================================
    // Light / Dark Mode Toggle Logic
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Check for user's saved theme in localStorage
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = 'light_mode'; // Change icon to sun when in dark mode
    }

    // Toggle mechanism
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');

        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('portfolio-theme', 'dark');
            themeIcon.textContent = 'light_mode';
            // In dark mode, the button shows the light-mode icon meaning "click to go light"
        } else {
            localStorage.setItem('portfolio-theme', 'light');
            themeIcon.textContent = 'dark_mode';
            // In light mode, the button shows dark-mode icon meaning "click to go dark"
        }
    });

    // Runtime safety: remove any leftover per-project GitHub links that may still be served from cache
    try {
        const ghLinks = document.querySelectorAll('.project-actions a[href*="github.com"]');
        ghLinks.forEach(a => a.remove());

        // Ensure hero CTAs are always visible (force inline styles as last resort)
        const heroCtas = document.querySelectorAll('.hero-ctas .btn');
        heroCtas.forEach(btn => {
            btn.style.zIndex = '9999';
            btn.style.position = 'relative';
            btn.style.opacity = '1';
        });
    } catch (e) {
        // ignore; this is a non-critical enhancement
        console.warn('Runtime CTA fixes skipped', e);
    }
});
