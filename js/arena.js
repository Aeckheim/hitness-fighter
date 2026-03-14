// Hitness Club Arena Background
// Based on real photos: walls & ceiling COVERED in large mirror/metal panels,
// CRT TVs, cables everywhere, warm orange/pink/purple lighting,
// surveillance cameras, beer crates, plants, instruments, Hitness Club logo

const Arena = {
    bgCanvas: null,
    bgCtx: null,
    ledTimer: 0,
    crtTimer: 0,

    init(width, height) {
        this.width = width;
        this.height = height;
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = width;
        this.bgCanvas.height = height;
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.renderStatic();
    },

    renderStatic() {
        const ctx = this.bgCtx;
        const w = this.width;
        const h = this.height;
        const floorY = h - 35;

        // === DARK BASE ===
        ctx.fillStyle = '#0c0a10';
        ctx.fillRect(0, 0, w, h);

        // === CEILING WITH MIRROR PANELS ===
        // The ceiling in Hitness Club is covered with angled mirror/metal sheets
        ctx.fillStyle = '#101018';
        ctx.fillRect(0, 0, w, 50);

        // Large irregular mirror panels on ceiling (like the photos show)
        for (let x = 0; x < w; x += 18 + Math.random() * 12) {
            const pw = 14 + Math.random() * 18;
            const ph = 8 + Math.random() * 12;
            const py = 3 + Math.random() * 30;
            // Base mirror panel
            const base = 25 + Math.random() * 30;
            const warmth = Math.random() * 20;
            ctx.fillStyle = `rgb(${base + warmth}, ${base + warmth * 0.5}, ${base + 10})`;
            ctx.fillRect(x, py, pw, ph);
            // Bright reflection spot (angled light hitting mirror)
            const refX = x + Math.random() * (pw - 5);
            const refBright = 60 + Math.random() * 50;
            ctx.fillStyle = `rgba(${refBright + 40}, ${refBright + 20}, ${refBright + 50}, 0.3)`;
            ctx.fillRect(refX, py + 1, 6 + Math.random() * 5, ph - 2);
            // Edge highlight
            ctx.fillStyle = `rgba(180, 170, 200, 0.08)`;
            ctx.fillRect(x, py, pw, 1);
        }

        // Ceiling structural beams
        ctx.fillStyle = '#0e0e18';
        for (let x = 0; x < w; x += 95) {
            ctx.fillRect(x, 0, 6, 50);
        }

        // === BACK WALL - COVERED IN MIRRORS ===
        // The Hitness Club walls are completely covered in mirror/metal panels
        // creating a fragmented, reflective surface
        ctx.fillStyle = '#0e0c14';
        ctx.fillRect(0, 50, w, floorY - 50);

        // Large mirror wall panels - irregular sizes like real photos
        for (let x = 0; x < w; x += 12 + Math.random() * 15) {
            for (let y = 50; y < floorY - 40; y += 15 + Math.random() * 20) {
                const pw = 10 + Math.random() * 22;
                const ph = 12 + Math.random() * 22;
                if (y + ph > floorY - 30) continue;

                // Mirror panel with slight color variation
                const base = 18 + Math.random() * 22;
                const hueShift = Math.random();
                let r, g, b;
                if (hueShift < 0.3) {
                    // Warm/pink tone (from orange/pink lights)
                    r = base + 15 + Math.random() * 10;
                    g = base + 5;
                    b = base + 10 + Math.random() * 8;
                } else if (hueShift < 0.6) {
                    // Cool/blue tone
                    r = base;
                    g = base + 3;
                    b = base + 12 + Math.random() * 10;
                } else {
                    // Neutral silver
                    r = base + 5;
                    g = base + 5;
                    b = base + 8;
                }
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, pw, ph);

                // Reflection streaks (light bouncing off mirrors)
                if (Math.random() > 0.4) {
                    const streakBright = 50 + Math.random() * 60;
                    ctx.fillStyle = `rgba(${streakBright + 30}, ${streakBright + 10}, ${streakBright + 40}, 0.12)`;
                    const sx = x + Math.random() * (pw - 4);
                    ctx.fillRect(sx, y + 1, 3 + Math.random() * 5, ph - 2);
                }

                // Edge gap between panels
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(x + pw - 1, y, 1, ph);
                ctx.fillRect(x, y + ph - 1, pw, 1);
            }
        }

        // Some panels have visible distorted reflections (like people/lights)
        for (let i = 0; i < 8; i++) {
            const rx = 30 + Math.random() * (w - 60);
            const ry = 60 + Math.random() * 60;
            const rw = 8 + Math.random() * 15;
            const rh = 10 + Math.random() * 20;
            // Blurry warm reflection (stage lights bouncing)
            const grd = ctx.createRadialGradient(rx + rw / 2, ry + rh / 2, 2, rx + rw / 2, ry + rh / 2, rw);
            const hue = Math.random() > 0.5 ? '180, 100, 160' : '160, 120, 80';
            grd.addColorStop(0, `rgba(${hue}, 0.12)`);
            grd.addColorStop(1, `rgba(${hue}, 0)`);
            ctx.fillStyle = grd;
            ctx.fillRect(rx, ry, rw, rh);
        }

        // === HITNESS CLUB LOGO (dezent auf der Wand) ===
        // Drawn subtly on a mirror panel, like a whiteboard sketch
        this.drawLogo(ctx, w / 2 - 35, 58);

        // === CRT TVs scattered on walls ===
        this.drawCRT(ctx, 20, 58, 32, 25);
        this.drawCRT(ctx, 8, 95, 26, 20);
        this.drawCRT(ctx, w - 56, 55, 32, 25);
        this.drawCRT(ctx, w - 38, 90, 26, 20);
        // Small TV mounted higher
        this.drawCRT(ctx, w / 2 + 50, 52, 22, 17);

        // === HANGING CABLES (lots of them, like the photos) ===
        // Thin cables
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const cx = 20 + Math.random() * (w - 40);
            const cLen = 15 + Math.random() * 70;
            ctx.strokeStyle = `rgba(30, 28, 40, ${0.4 + Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(cx, 48);
            const sag = (Math.random() - 0.5) * 40;
            ctx.quadraticCurveTo(cx + sag, 48 + cLen * 0.6, cx + sag * 0.3, 48 + cLen);
            ctx.stroke();
        }
        // Thicker cables (power cables)
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const cx = 40 + Math.random() * (w - 80);
            ctx.strokeStyle = `rgba(20, 18, 30, ${0.5 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(cx, 48);
            const endX = cx + (Math.random() - 0.5) * 50;
            ctx.bezierCurveTo(cx - 15, 85, cx + 25, 110, endX, 100 + Math.random() * 40);
            ctx.stroke();
        }
        // A few cables hanging down to near floor
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const cx = 80 + Math.random() * (w - 160);
            ctx.strokeStyle = 'rgba(25, 22, 35, 0.5)';
            ctx.beginPath();
            ctx.moveTo(cx, 48);
            ctx.bezierCurveTo(cx + 10, floorY * 0.4, cx - 15, floorY * 0.7, cx + 5, floorY - 45);
            ctx.stroke();
        }

        // === SURVEILLANCE CAMERAS ===
        this.drawCamera(ctx, 18, 45, false);
        this.drawCamera(ctx, w - 35, 45, true);
        // Extra camera mid-left
        this.drawCamera(ctx, w * 0.3, 48, false);

        // === STAGE LIGHTS (warm orange/pink/purple) ===
        // Mounted on ceiling, casting colored light down
        this.drawStageLight(ctx, w * 0.2, 42, '#cc6633');
        this.drawStageLight(ctx, w * 0.5, 42, '#aa44aa');
        this.drawStageLight(ctx, w * 0.8, 42, '#cc6633');

        // === FLOOR (worn concrete/carpet) ===
        // The floor in photos looks like a mix of concrete and old carpet
        ctx.fillStyle = '#2a2428';
        ctx.fillRect(0, floorY, w, 35);
        // Texture
        for (let x = 0; x < w; x += 2) {
            for (let y = floorY; y < h; y += 2) {
                if (Math.random() > 0.6) {
                    const fb = 35 + Math.random() * 15;
                    const warm = Math.random() * 8;
                    ctx.fillStyle = `rgb(${fb + warm}, ${fb + warm * 0.3}, ${fb})`;
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
        // Floor edge
        ctx.fillStyle = '#3a3438';
        ctx.fillRect(0, floorY, w, 2);

        // === BEER CRATES ===
        this.drawBeerCrate(ctx, 5, floorY - 18);
        this.drawBeerCrate(ctx, 28, floorY - 18);
        this.drawBeerCrate(ctx, 16, floorY - 35);
        this.drawBeerCrate(ctx, w - 50, floorY - 18);
        this.drawBeerCrate(ctx, w - 27, floorY - 18);
        this.drawBeerCrate(ctx, w - 40, floorY - 35);

        // === BEER BOTTLES on floor ===
        this.drawBeerBottle(ctx, 58, floorY - 5);
        this.drawBeerBottle(ctx, 68, floorY - 4);
        this.drawBeerBottle(ctx, 75, floorY - 6);
        this.drawBeerBottle(ctx, w - 70, floorY - 5);
        this.drawBeerBottle(ctx, w - 85, floorY - 4);

        // === PLANTS ===
        this.drawPlant(ctx, 2, floorY - 38);
        this.drawPlant(ctx, w - 28, floorY - 42);

        // === INSTRUMENTS (keyboard, amp, mic stand, guitars) ===
        this.drawAmp(ctx, 52, floorY - 15);
        this.drawMicStand(ctx, w - 65, floorY - 30);
        // Guitars leaning against wall
        this.drawGuitar(ctx, 65, floorY - 45, '#8B4513', '#cc9944'); // acoustic brown
        this.drawGuitar(ctx, w - 80, floorY - 48, '#222233', '#cc2222'); // electric black/red
        // Bass guitar on the other side
        this.drawGuitar(ctx, w - 95, floorY - 43, '#333344', '#4488cc'); // bass blue

        // === VOLLGEPINKELTES URINAL ===
        this.drawUrinal(ctx, w - 18, floorY - 40);

        // === WARM LIGHT CONES from stage lights (baked into static) ===
        const cone1 = ctx.createRadialGradient(w * 0.2, 50, 5, w * 0.2, floorY, 80);
        cone1.addColorStop(0, 'rgba(200, 100, 50, 0.06)');
        cone1.addColorStop(1, 'rgba(200, 100, 50, 0)');
        ctx.fillStyle = cone1;
        ctx.fillRect(0, 40, w * 0.4, floorY);

        const cone2 = ctx.createRadialGradient(w * 0.8, 50, 5, w * 0.8, floorY, 80);
        cone2.addColorStop(0, 'rgba(200, 100, 50, 0.06)');
        cone2.addColorStop(1, 'rgba(200, 100, 50, 0)');
        ctx.fillStyle = cone2;
        ctx.fillRect(w * 0.6, 40, w * 0.4, floorY);

        const cone3 = ctx.createRadialGradient(w * 0.5, 50, 5, w * 0.5, floorY, 100);
        cone3.addColorStop(0, 'rgba(160, 60, 160, 0.05)');
        cone3.addColorStop(1, 'rgba(160, 60, 160, 0)');
        ctx.fillStyle = cone3;
        ctx.fillRect(w * 0.3, 40, w * 0.4, floorY);
    },

    drawLogo(ctx, x, y) {
        // Hitness Club logo - subtle on a mirror panel
        // Whiteboard/frame style like the real logo
        const alpha = 0.15; // very subtle

        // Frame
        ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 70, 45);

        // "HITNESS" text
        ctx.fillStyle = `rgba(230, 210, 80, ${alpha + 0.05})`;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('HITNESS', x + 18, y + 16);

        // "CLUB" text (slightly offset, yellow)
        ctx.fillStyle = `rgba(230, 200, 50, ${alpha + 0.05})`;
        ctx.font = 'bold 8px monospace';
        ctx.fillText('CLUB', x + 35, y + 27);

        // Guitar icon (simplified)
        ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`;
        ctx.lineWidth = 1;
        // Guitar body
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 30);
        ctx.lineTo(x + 30, y + 18);
        ctx.stroke();
        // Guitar head circles
        ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
        ctx.fillRect(x + 8, y + 28, 5, 5);
        ctx.fillRect(x + 8, y + 34, 5, 5);

        // Flame (small, yellow-orange)
        ctx.fillStyle = `rgba(230, 180, 50, ${alpha})`;
        ctx.fillRect(x + 50, y + 28, 5, 7);
        ctx.fillRect(x + 51, y + 25, 3, 4);
        ctx.fillStyle = `rgba(230, 130, 30, ${alpha})`;
        ctx.fillRect(x + 52, y + 30, 3, 5);
    },

    drawCRT(ctx, x, y, w, h) {
        // CRT body (bulky)
        ctx.fillStyle = '#151518';
        ctx.fillRect(x - 3, y - 3, w + 6, h + 8);
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 5);
        // Screen
        ctx.fillStyle = '#08101a';
        ctx.fillRect(x, y, w, h);
        // Static noise
        for (let px = x; px < x + w; px += 2) {
            for (let py = y; py < y + h; py += 2) {
                if (Math.random() > 0.55) {
                    const sv = Math.random() * 30 + 8;
                    const warm = Math.random() * 10;
                    ctx.fillStyle = `rgb(${sv + warm}, ${sv + warm * 0.5}, ${sv + 15})`;
                    ctx.fillRect(px, py, 2, 2);
                }
            }
        }
        // Scan line effect
        for (let py = y; py < y + h; py += 3) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(x, py, w, 1);
        }
        // Screen glow
        ctx.fillStyle = 'rgba(60, 80, 120, 0.04)';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    },

    drawCamera(ctx, x, y, flipped) {
        // Wall mount bracket
        ctx.fillStyle = '#1a1a25';
        ctx.fillRect(x + 5, y - 6, 4, 9);
        // Camera body
        ctx.fillStyle = '#161620';
        ctx.fillRect(x, y, 14, 9);
        // Lens
        ctx.fillStyle = '#2a2a35';
        ctx.fillRect(flipped ? x - 4 : x + 14, y + 2, 5, 5);
        // Red record LED
        ctx.fillStyle = '#dd2222';
        ctx.fillRect(x + 6, y + 1, 2, 2);
    },

    drawStageLight(ctx, x, y, color) {
        // Light fixture body
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(x - 5, y - 3, 10, 6);
        // Mount arm
        ctx.fillStyle = '#141420';
        ctx.fillRect(x - 1, y - 8, 2, 6);
        // Light lens
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x - 4, y + 3, 8, 3);
        ctx.globalAlpha = 1;
    },

    drawBeerCrate(ctx, x, y) {
        ctx.fillStyle = '#1a6030';
        ctx.fillRect(x, y, 20, 16);
        ctx.fillStyle = '#15502a';
        ctx.fillRect(x + 1, y + 1, 18, 14);
        // Grid
        ctx.fillStyle = '#1a6030';
        ctx.fillRect(x + 6, y, 2, 16);
        ctx.fillRect(x + 13, y, 2, 16);
        ctx.fillRect(x, y + 5, 20, 1);
        ctx.fillRect(x, y + 10, 20, 1);
        // Bottle tops
        ctx.fillStyle = '#2a7a3a';
        for (let bx = x + 2; bx < x + 18; bx += 7) {
            for (let by = y + 1; by < y + 14; by += 5) {
                ctx.fillRect(bx, by, 3, 3);
            }
        }
    },

    drawBeerBottle(ctx, x, y) {
        ctx.fillStyle = '#1a5528';
        ctx.fillRect(x, y, 3, 10);
        ctx.fillRect(x + 1, y - 3, 1, 4);
        ctx.fillStyle = '#887744';
        ctx.fillRect(x, y - 4, 3, 2);
    },

    drawPlant(ctx, x, y) {
        ctx.fillStyle = '#44301e';
        ctx.fillRect(x + 2, y + 10, 16, 10);
        ctx.fillRect(x, y + 8, 20, 3);
        ctx.fillStyle = '#2a6622';
        ctx.fillRect(x + 6, y - 2, 8, 5);
        ctx.fillRect(x + 2, y + 1, 6, 5);
        ctx.fillRect(x + 12, y, 7, 5);
        ctx.fillStyle = '#3a8833';
        ctx.fillRect(x + 5, y - 5, 5, 5);
        ctx.fillRect(x + 11, y - 3, 6, 4);
        ctx.fillRect(x + 1, y + 3, 4, 4);
        ctx.fillRect(x + 15, y + 2, 4, 4);
    },

    drawAmp(ctx, x, y) {
        // Guitar amp
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(x, y, 18, 14);
        ctx.fillStyle = '#222226';
        ctx.fillRect(x + 2, y + 2, 14, 7);
        // Speaker grille dots
        ctx.fillStyle = '#2a2a30';
        for (let gx = x + 3; gx < x + 15; gx += 3) {
            for (let gy = y + 3; gy < y + 8; gy += 3) {
                ctx.fillRect(gx, gy, 1, 1);
            }
        }
        // Knobs
        ctx.fillStyle = '#333338';
        ctx.fillRect(x + 4, y + 10, 2, 2);
        ctx.fillRect(x + 8, y + 10, 2, 2);
        ctx.fillRect(x + 12, y + 10, 2, 2);
    },

    drawMicStand(ctx, x, y) {
        // Stand pole
        ctx.fillStyle = '#333340';
        ctx.fillRect(x, y, 2, 30);
        // Base
        ctx.fillStyle = '#2a2a35';
        ctx.fillRect(x - 4, y + 28, 10, 3);
        // Mic clip
        ctx.fillStyle = '#444455';
        ctx.fillRect(x - 1, y, 4, 3);
        // Mic head
        ctx.fillStyle = '#555566';
        ctx.fillRect(x - 2, y - 5, 6, 6);
        ctx.fillStyle = '#666677';
        ctx.fillRect(x - 1, y - 4, 4, 4);
    },

    drawGuitar(ctx, x, y, bodyColor, accentColor) {
        // Guitar leaning against wall at slight angle
        // Neck (angled)
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(x + 3, y - 18, 3, 20);
        // Headstock
        ctx.fillStyle = '#3a2510';
        ctx.fillRect(x + 2, y - 22, 5, 6);
        // Tuning pegs
        ctx.fillStyle = '#888888';
        ctx.fillRect(x + 1, y - 21, 2, 1);
        ctx.fillRect(x + 6, y - 21, 2, 1);
        ctx.fillRect(x + 1, y - 18, 2, 1);
        ctx.fillRect(x + 6, y - 18, 2, 1);
        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x - 2, y, 13, 18);
        ctx.fillRect(x - 4, y + 4, 17, 12);
        ctx.fillRect(x - 2, y + 14, 13, 6);
        // Sound hole / pickup
        ctx.fillStyle = accentColor;
        ctx.fillRect(x + 1, y + 7, 7, 5);
        // Strings
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(x + 4, y - 16, 1, 30);
        // Bridge
        ctx.fillStyle = '#444444';
        ctx.fillRect(x, y + 15, 9, 2);
    },

    drawUrinal(ctx, x, y) {
        // Wall-mounted urinal, gloriously pissed on
        // Back plate / mounting
        ctx.fillStyle = '#ccccbb';
        ctx.fillRect(x, y, 14, 28);
        // Bowl shape
        ctx.fillStyle = '#ddddcc';
        ctx.fillRect(x + 1, y + 3, 12, 22);
        // Inner bowl
        ctx.fillStyle = '#bbbbaa';
        ctx.fillRect(x + 3, y + 6, 8, 16);
        // The "piss" stains - yellow/brown discoloration
        ctx.fillStyle = 'rgba(180, 160, 40, 0.4)';
        ctx.fillRect(x + 3, y + 10, 8, 12);
        ctx.fillStyle = 'rgba(160, 140, 20, 0.5)';
        ctx.fillRect(x + 4, y + 14, 6, 8);
        ctx.fillStyle = 'rgba(140, 120, 10, 0.3)';
        ctx.fillRect(x + 5, y + 8, 4, 6);
        // Crusty rim stains
        ctx.fillStyle = 'rgba(150, 130, 30, 0.35)';
        ctx.fillRect(x + 2, y + 5, 10, 2);
        // Drain
        ctx.fillStyle = '#666655';
        ctx.fillRect(x + 5, y + 20, 4, 3);
        // Flush pipe going up
        ctx.fillStyle = '#999988';
        ctx.fillRect(x + 6, y - 5, 2, 8);
        // Flush handle
        ctx.fillStyle = '#888877';
        ctx.fillRect(x + 3, y - 4, 4, 2);
        // Puddle on floor
        ctx.fillStyle = 'rgba(180, 170, 40, 0.2)';
        ctx.fillRect(x - 2, y + 27, 18, 4);
        ctx.fillStyle = 'rgba(170, 160, 30, 0.15)';
        ctx.fillRect(x - 4, y + 29, 22, 3);
    },

    update() {
        this.ledTimer++;
        this.crtTimer++;
    },

    draw(ctx) {
        // Draw static background
        ctx.drawImage(this.bgCanvas, 0, 0);

        const w = this.width;
        const h = this.height;

        // === ANIMATED LED DOTS (green, scattered like in the photos) ===
        for (let i = 0; i < 35; i++) {
            const lx = (i * 37 + 15) % w;
            const ly = 45 + (i * 23 + 7) % (h - 90);
            const pulse = Math.sin(this.ledTimer * 0.04 + i * 0.7) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(30, 220, 60, ${0.2 + pulse * 0.6})`;
            ctx.fillRect(lx, ly, 2, 2);
            // Glow
            ctx.fillStyle = `rgba(30, 220, 60, ${pulse * 0.08})`;
            ctx.fillRect(lx - 4, ly - 4, 10, 10);
        }

        // === WARM LIGHT PULSES (orange/pink like stage lights) ===
        const t = this.ledTimer * 0.008;
        // Left warm light
        const grd1 = ctx.createRadialGradient(w * 0.2, h * 0.4, 10, w * 0.2, h * 0.4, 120);
        const warmPulse1 = Math.sin(t) * 0.02 + 0.04;
        grd1.addColorStop(0, `rgba(200, 100, 50, ${warmPulse1})`);
        grd1.addColorStop(1, 'rgba(200, 100, 50, 0)');
        ctx.fillStyle = grd1;
        ctx.fillRect(0, 0, w * 0.5, h);

        // Right warm light
        const grd2 = ctx.createRadialGradient(w * 0.8, h * 0.4, 10, w * 0.8, h * 0.4, 120);
        const warmPulse2 = Math.sin(t + 2) * 0.02 + 0.04;
        grd2.addColorStop(0, `rgba(200, 100, 50, ${warmPulse2})`);
        grd2.addColorStop(1, 'rgba(200, 100, 50, 0)');
        ctx.fillStyle = grd2;
        ctx.fillRect(w * 0.5, 0, w * 0.5, h);

        // Center purple/pink light
        const grd3 = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.35, 140);
        const purplePulse = Math.sin(t * 0.7 + 1) * 0.015 + 0.03;
        grd3.addColorStop(0, `rgba(160, 60, 160, ${purplePulse})`);
        grd3.addColorStop(1, 'rgba(160, 60, 160, 0)');
        ctx.fillStyle = grd3;
        ctx.fillRect(0, 0, w, h);

        // === MIRROR REFLECTIONS (animated shimmer) ===
        // Random bright reflection flashes on mirror panels
        if (Math.random() > 0.92) {
            const rx = 10 + Math.random() * (w - 20);
            const ry = 50 + Math.random() * 80;
            ctx.fillStyle = 'rgba(180, 160, 200, 0.06)';
            ctx.fillRect(rx, ry, 8 + Math.random() * 15, 5 + Math.random() * 10);
        }

        // === CRT FLICKER ===
        if (Math.random() > 0.95) {
            // Random CRT screen flickers blue
            const crtPositions = [[20, 58, 32, 25], [w - 56, 55, 32, 25], [w / 2 + 50, 52, 22, 17]];
            const crt = crtPositions[Math.floor(Math.random() * crtPositions.length)];
            ctx.fillStyle = `rgba(40, 70, 120, ${0.03 + Math.random() * 0.05})`;
            ctx.fillRect(crt[0], crt[1], crt[2], crt[3]);
        }

        // === SURVEILLANCE CAMERA RED LED BLINK ===
        if (Math.sin(this.ledTimer * 0.08) > 0) {
            ctx.fillStyle = '#ee2222';
            ctx.fillRect(24, 46, 2, 2);
            ctx.fillRect(w - 29, 46, 2, 2);
            ctx.fillRect(w * 0.3 + 6, 49, 2, 2);
        }

        // === STAGE LIGHT GLOW (animated, on the fixtures) ===
        const lightPositions = [w * 0.2, w * 0.5, w * 0.8];
        const lightColors = ['200, 100, 50', '170, 60, 170', '200, 100, 50'];
        for (let i = 0; i < 3; i++) {
            const lPulse = Math.sin(this.ledTimer * 0.03 + i * 2) * 0.15 + 0.35;
            ctx.fillStyle = `rgba(${lightColors[i]}, ${lPulse})`;
            ctx.fillRect(lightPositions[i] - 4, 45, 8, 3);
        }
    }
};
