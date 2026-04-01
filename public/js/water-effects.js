// ============================================
// COSMIC PARTICLE SYSTEM
// Dark space glowing star dust & constellations
// ============================================

class CosmicParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.ripples = [];
        this.mouse = { x: -1000, y: -1000 };
        this.frame = 0;
        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const count = Math.min(150, Math.floor(window.innerWidth / 10));
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle(fromMouse = false) {
        const x = fromMouse ? this.mouse.x + (Math.random() - 0.5) * 80 : Math.random() * this.canvas.width;
        const y = fromMouse ? this.mouse.y + (Math.random() - 0.5) * 80 : Math.random() * this.canvas.height;
        
        // Color palette: neon cyan, purple, white, magenta
        const colorType = Math.random();
        let hue, saturation, lightness;
        if (colorType < 0.4) {
            // Neon Cyan
            hue = 180 + Math.random() * 10;
            saturation = 90 + Math.random() * 10;
            lightness = 55 + Math.random() * 15;
        } else if (colorType < 0.7) {
            // Neon Purple
            hue = 270 + Math.random() * 20;
            saturation = 80 + Math.random() * 20;
            lightness = 50 + Math.random() * 20;
        } else if (colorType < 0.85) {
            // Magenta / Pink
            hue = 300 + Math.random() * 20;
            saturation = 70 + Math.random() * 30;
            lightness = 60 + Math.random() * 15;
        } else {
            // Pure white stars
            hue = 200 + Math.random() * 40;
            saturation = 10 + Math.random() * 20;
            lightness = 85 + Math.random() * 15;
        }

        return {
            x,
            y,
            originX: x,
            originY: y,
            size: Math.random() * 2.5 + 0.5,
            // Smooth floating drift
            speedX: (Math.random() - 0.5) * 0.25,
            speedY: (Math.random() - 0.5) * 0.15,
            opacity: Math.random() * 0.5 + 0.15,
            hue,
            saturation,
            lightness,
            // Twinkle
            twinkleSpeed: Math.random() * 0.03 + 0.008,
            twinklePhase: Math.random() * Math.PI * 2,
            // Floating motion
            amplitude: Math.random() * 20 + 5,
            frequency: Math.random() * 0.008 + 0.002,
            phase: Math.random() * Math.PI * 2,
            life: fromMouse ? 120 + Math.random() * 80 : Infinity,
            maxLife: fromMouse ? 120 + Math.random() * 80 : Infinity,
        };
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('click', (e) => {
            this.addRipple(e.clientX, e.clientY);
            for (let i = 0; i < 10; i++) {
                this.particles.push(this.createParticle(true));
            }
        });
    }

    addRipple(x, y) {
        this.ripples.push({
            x, y,
            radius: 0,
            maxRadius: 150 + Math.random() * 100,
            opacity: 0.4,
            lineWidth: 1.5,
        });
    }

    drawParticle(p) {
        const ctx = this.ctx;
        ctx.save();
        
        // Twinkle effect
        const twinkle = 0.6 + 0.4 * Math.sin(this.frame * p.twinkleSpeed + p.twinklePhase);
        const alpha = p.life !== Infinity ? p.opacity * (p.life / p.maxLife) * twinkle : p.opacity * twinkle;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        gradient.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${alpha})`);
        gradient.addColorStop(0.3, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${alpha * 0.3})`);
        gradient.addColorStop(1, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright core
        ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawRipple(r) {
        const ctx = this.ctx;
        ctx.save();
        
        // Dual-tone ripple
        const gradient = ctx.createRadialGradient(r.x, r.y, r.radius - 2, r.x, r.y, r.radius + 2);
        gradient.addColorStop(0, `hsla(185, 90%, 55%, 0)`);
        gradient.addColorStop(0.5, `hsla(185, 90%, 55%, ${r.opacity})`);
        gradient.addColorStop(1, `hsla(275, 80%, 55%, 0)`);
        
        ctx.strokeStyle = `hsla(185, 90%, 55%, ${r.opacity})`;
        ctx.lineWidth = r.lineWidth;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    update() {
        this.frame++;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Smooth floating drift with gentle sinusoidal wave
            p.x += p.speedX + Math.sin(this.frame * p.frequency + p.phase) * 0.3;
            p.y += p.speedY + Math.cos(this.frame * p.frequency * 0.7 + p.phase) * 0.15;
            
            // Mouse interaction — gentle push away
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
                const force = (180 - dist) / 180;
                p.x -= dx * force * 0.015;
                p.y -= dy * force * 0.015;
                p.opacity = Math.min(p.opacity + 0.005, 0.85);
            }
            
            // Finite-life particles
            if (p.life !== Infinity) {
                p.life--;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
            }
            
            // Soft wrapping
            if (p.x < -30) { p.x = this.canvas.width + 30; p.opacity = Math.random() * 0.5 + 0.15; }
            if (p.x > this.canvas.width + 30) { p.x = -30; p.opacity = Math.random() * 0.5 + 0.15; }
            if (p.y < -30) { p.y = this.canvas.height + 30; p.opacity = Math.random() * 0.5 + 0.15; }
            if (p.y > this.canvas.height + 30) { p.y = -30; p.opacity = Math.random() * 0.5 + 0.15; }
        }
        
        // Update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += 2;
            r.opacity -= 0.006;
            r.lineWidth = Math.max(0.3, r.lineWidth - 0.015);
            if (r.opacity <= 0 || r.radius >= r.maxRadius) {
                this.ripples.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        for (const p of this.particles) {
            this.drawParticle(p);
        }
        
        // Draw ripples
        for (const r of this.ripples) {
            this.drawRipple(r);
        }
        
        // Constellation lines between nearby particles
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    const lineAlpha = 0.06 * (1 - dist / 110);
                    // Gradient from cyan to purple
                    this.ctx.save();
                    const grad = this.ctx.createLinearGradient(
                        this.particles[i].x, this.particles[i].y,
                        this.particles[j].x, this.particles[j].y
                    );
                    grad.addColorStop(0, `hsla(185, 90%, 55%, ${lineAlpha})`);
                    grad.addColorStop(1, `hsla(275, 80%, 55%, ${lineAlpha})`);
                    this.ctx.strokeStyle = grad;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new CosmicParticleSystem('waterCanvas');
});
