// 3D Tilt Effect
document.querySelectorAll('.social-tile').forEach(tile => {
    tile.addEventListener('mousemove', (e) => {
        const rect = tile.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const angleX = (y - centerY) / 20;
        const angleY = (centerX - x) / 20;

        tile.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
        tile.style.boxShadow = `${-angleY * 2}px ${angleX * 2}px 30px rgba(0,0,0,0.3)`;
    });

    tile.addEventListener('mouseleave', () => {
        tile.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        tile.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    });
});

// Dynamic Background Responder
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    document.querySelector('.cosmic-bg').style.backgroundPosition =
        `${x * 100}% ${y * 100}%`;

    // Parallax effect for tiles
    document.querySelectorAll('.social-tile').forEach((tile, index) => {
        const speed = 0.05 * (index + 1);
        const xOffset = (0.5 - x) * 30 * speed;
        const yOffset = (0.5 - y) * 30 * speed;
        tile.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    });
});

// Particle System on Click
document.querySelectorAll('.social-cta').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();

        // Create 10 particles in a burst
        for (let i = 0; i < 10; i++) {
            const particles = document.createElement('div');
            particles.className = 'click-particles';

            // Position at click location
            particles.style.left = `${e.clientX}px`;
            particles.style.top = `${e.clientY}px`;

            // Randomize particle properties based on platform
            const platform = btn.getAttribute('data-platform');
            let color1, color2;

            if (platform === 'instagram') {
                color1 = 'rgba(225,48,108,0.8)';
                color2 = 'rgba(253,148,39,0.8)';
            } else if (platform === 'facebook') {
                color1 = 'rgba(66,103,178,0.8)';
                color2 = 'rgba(108,142,220,0.8)';
            } else {
                color1 = 'rgba(0,242,234,0.8)';
                color2 = 'rgba(254,44,85,0.8)';
            }

            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 50;

            particles.style.background = `radial-gradient(circle, ${color1}, ${color2})`;
            particles.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
            particles.style.setProperty('--y', `${Math.sin(angle) * distance}px`);

            document.body.appendChild(particles);

            // Remove after animation
            setTimeout(() => {
                particles.remove();
            }, 1000);
        }

        // Open link after animation
        setTimeout(() => {
            window.open(btn.href, '_blank');
        }, 300);
    });
});

// Additional CSS for particles animation
const style = document.createElement('style');
style.textContent = `
    @keyframes particles-explode {
        0% { 
            transform: translate(0, 0) scale(0);
            opacity: 1;
        }
        100% { 
            transform: translate(var(--x), var(--y)) scale(1);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);