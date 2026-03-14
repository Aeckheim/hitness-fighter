// Special effects for attacks and supers
const Effects = {
    active: [],
    screenShake: 0,
    hitFreeze: 0,
    mushroomTrip: 0,
    mushroomTarget: null,
    spaceshipLaser: null,
    flagSwing: null,
    lightningStorm: null,

    addHitSpark(x, y) {
        this.active.push({
            type: 'spark',
            x, y,
            life: 8,
            particles: Array.from({ length: 6 }, () => ({
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                size: 2 + Math.random() * 3
            }))
        });
        this.screenShake = 4;
        this.hitFreeze = 3;
    },

    startFlagSwing(fighter) {
        const dir = fighter.facingRight ? 1 : -1;
        const hb = fighter.getHurtBox();
        this.flagSwing = {
            x: fighter.facingRight ? hb.x + hb.w - 5 : hb.x + 5,
            y: hb.y + hb.h * 0.3,
            dir,
            angle: dir > 0 ? -2.0 : 2.0, // start far back
            targetAngle: dir > 0 ? 0.8 : -0.8, // swing forward
            life: 25,
            maxLife: 25,
            fighter
        };
    },

    startSpaceshipLaser(fighter, opponent) {
        this.spaceshipLaser = {
            shipX: opponent.x + opponent.bodyWidth / 2,
            shipY: -40,
            targetX: opponent.x + opponent.bodyWidth / 2,
            targetY: opponent.y,
            phase: 'descend', // descend, fire, ascend
            timer: 0,
            damage: fighter.superDamage,
            fighter,
            opponent,
            hasHit: false
        };
        this.screenShake = 8;
    },

    startLightningStorm(fighter, opponent) {
        // 3 bolts instead of 5, with bigger delays - can be dodged
        this.lightningStorm = {
            timer: 0,
            bolts: [],
            fighter,
            opponent,
            totalDamage: fighter.superDamage,
            hitsLeft: 3,
            nextBolt: 5
        };
        this.screenShake = 8;
    },

    startMushroomTrip(fighter, opponent) {
        this.mushroomTrip = 120; // 2 seconds
        this.mushroomTarget = opponent;
        // Deal damage over time
        opponent.takeHit(fighter.superDamage, fighter.facingRight ? 2 : -2);
        this.screenShake = 6;
    },

    update() {
        // Screen shake decay
        if (this.screenShake > 0) this.screenShake *= 0.8;
        if (this.screenShake < 0.5) this.screenShake = 0;

        // Hit freeze
        if (this.hitFreeze > 0) {
            this.hitFreeze--;
            return true; // signal to pause game
        }

        // Update particles
        for (let i = this.active.length - 1; i >= 0; i--) {
            this.active[i].life--;
            if (this.active[i].life <= 0) {
                this.active.splice(i, 1);
            }
        }

        // Flag swing
        if (this.flagSwing) {
            this.flagSwing.life--;
            // Smooth swing animation from back to front
            const progress = 1 - (this.flagSwing.life / this.flagSwing.maxLife);
            const swingCurve = Math.sin(progress * Math.PI); // smooth arc
            const startAngle = this.flagSwing.dir > 0 ? -2.0 : 2.0;
            const endAngle = this.flagSwing.dir > 0 ? 0.8 : -0.8;
            this.flagSwing.angle = startAngle + (endAngle - startAngle) * progress;
            if (this.flagSwing.life <= 0) this.flagSwing = null;
        }

        // Spaceship laser
        if (this.spaceshipLaser) {
            const sl = this.spaceshipLaser;
            sl.timer++;
            if (sl.phase === 'descend') {
                sl.shipY += 3;
                if (sl.shipY >= 20) {
                    sl.phase = 'fire';
                    sl.timer = 0;
                }
            } else if (sl.phase === 'fire') {
                if (sl.timer > 10 && !sl.hasHit) {
                    // Laser hits
                    sl.opponent.takeHit(sl.damage, sl.fighter.facingRight ? 5 : -5);
                    sl.hasHit = true;
                    this.screenShake = 12;
                    this.addHitSpark(sl.targetX, sl.targetY);
                }
                if (sl.timer > 30) {
                    sl.phase = 'ascend';
                    sl.timer = 0;
                }
            } else if (sl.phase === 'ascend') {
                sl.shipY -= 4;
                if (sl.shipY < -60) {
                    this.spaceshipLaser = null;
                }
            }
        }

        // Lightning storm (super) - spawns projectile bolts that can be dodged
        if (this.lightningStorm) {
            const ls = this.lightningStorm;
            ls.timer++;
            if (ls.timer >= ls.nextBolt && ls.hitsLeft > 0) {
                // Spawn a bolt as a projectile on the fighter
                const dir = ls.fighter.facingRight ? 1 : -1;
                const ox = ls.fighter.x + ls.fighter.spriteWidth * ls.fighter.scale / 2;
                // Spread bolts across the arena ahead of Michlok
                const spread = (3 - ls.hitsLeft) * 60 * dir;
                const bx = ox + 80 * dir + spread;
                ls.bolts.push({
                    x: bx,
                    y: 0,
                    targetY: ls.fighter.groundY,
                    life: 15,
                    width: 4 + Math.random() * 4
                });
                // Spawn as actual projectile that needs to hit
                ls.fighter.projectiles.push({
                    x: bx - 8,
                    y: -20,
                    velX: 0,
                    velY: 8,
                    w: 16,
                    h: 24,
                    damage: Math.ceil(ls.totalDamage / 3),
                    knockback: 3 * dir,
                    type: 'thunderbolt',
                    life: 50,
                    gravity: 0
                });
                this.screenShake = 5;
                ls.hitsLeft--;
                ls.nextBolt = ls.timer + 12 + Math.floor(Math.random() * 6);
            }
            // Update bolt visuals
            for (let i = ls.bolts.length - 1; i >= 0; i--) {
                ls.bolts[i].life--;
                if (ls.bolts[i].life <= 0) ls.bolts.splice(i, 1);
            }
            if (ls.hitsLeft <= 0 && ls.bolts.length === 0) {
                this.lightningStorm = null;
            }
        }

        // Mushroom trip
        if (this.mushroomTrip > 0) {
            this.mushroomTrip--;
        }

        return false;
    },

    draw(ctx, canvasWidth, canvasHeight) {
        // Hit sparks
        for (const effect of this.active) {
            if (effect.type === 'spark') {
                for (const p of effect.particles) {
                    const alpha = effect.life / 8;
                    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
                    ctx.fillRect(
                        effect.x + p.dx * (8 - effect.life) * 0.5,
                        effect.y + p.dy * (8 - effect.life) * 0.5,
                        p.size, p.size
                    );
                    ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.6})`;
                    ctx.fillRect(
                        effect.x + p.dx * (8 - effect.life) * 0.5 - 1,
                        effect.y + p.dy * (8 - effect.life) * 0.5 - 1,
                        p.size + 2, p.size + 2
                    );
                }
            }
        }

        // Flag swing effect - BIG communist flag
        if (this.flagSwing) {
            const f = this.flagSwing;
            ctx.save();
            ctx.translate(f.x, f.y);

            // Long pole
            const poleLen = 80;
            const endX = Math.cos(f.angle) * poleLen;
            const endY = Math.sin(f.angle) * poleLen;

            // Pole (thick wooden stick)
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#6B3510';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#8B5520';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // === BIG FLAG ===
            const flagW = 65;
            const flagH = 45;
            const wave1 = Math.sin(f.life * 0.4) * 4;
            const wave2 = Math.sin(f.life * 0.5 + 1) * 3;
            const fDir = f.dir;

            // Flag attached to end of pole, hanging in swing direction
            const fx = endX;
            const fy = endY - flagH / 2;

            // Flag fabric (red with wave distortion)
            ctx.fillStyle = '#cc1111';
            ctx.fillRect(fx, fy + wave1, flagW * fDir, flagH);
            // Darker red border
            ctx.fillStyle = '#aa0000';
            const bx = fDir > 0 ? fx : fx + flagW * fDir;
            const bw = Math.abs(flagW * fDir);
            ctx.fillRect(bx, fy + wave1, bw, 3);
            ctx.fillRect(bx, fy + wave1 + flagH - 3, bw, 3);
            ctx.fillRect(bx + bw - 3 * fDir, fy + wave1, 3, flagH);
            // Fabric wave stripes
            ctx.fillStyle = '#bb1515';
            ctx.fillRect(bx, fy + wave1 + 12, bw, 3);
            ctx.fillRect(bx, fy + wave1 + 28, bw, 2);

            // === HAMMER & SICKLE (big, yellow, centered on flag) ===
            const hx = fx + (flagW * fDir) / 2 - 12 * fDir;
            const hy = fy + wave1 + flagH / 2 - 12;
            ctx.fillStyle = '#ffcc00';

            if (fDir > 0) {
                // HAMMER (left side)
                // Handle (vertical)
                ctx.fillRect(hx + 4, hy + 4, 3, 18);
                // Head (horizontal on top)
                ctx.fillRect(hx, hy + 2, 11, 5);
                ctx.fillRect(hx + 1, hy, 9, 3);

                // SICKLE (right side, curves around)
                // Blade curve (top arc)
                ctx.fillRect(hx + 12, hy + 6, 10, 3);
                ctx.fillRect(hx + 20, hy + 8, 3, 6);
                ctx.fillRect(hx + 18, hy + 13, 4, 3);
                ctx.fillRect(hx + 14, hy + 15, 5, 3);
                ctx.fillRect(hx + 10, hy + 16, 5, 3);
                // Handle
                ctx.fillRect(hx + 8, hy + 14, 3, 8);
            } else {
                // Mirrored for other direction
                const mx = hx;
                // HAMMER
                ctx.fillRect(mx - 4, hy + 4, 3, 18);
                ctx.fillRect(mx - 8, hy + 2, 11, 5);
                ctx.fillRect(mx - 7, hy, 9, 3);

                // SICKLE
                ctx.fillRect(mx - 19, hy + 6, 10, 3);
                ctx.fillRect(mx - 20, hy + 8, 3, 6);
                ctx.fillRect(mx - 19, hy + 13, 4, 3);
                ctx.fillRect(mx - 16, hy + 15, 5, 3);
                ctx.fillRect(mx - 12, hy + 16, 5, 3);
                ctx.fillRect(mx - 8, hy + 14, 3, 8);
            }

            // Gold shimmer on hammer & sickle
            ctx.fillStyle = 'rgba(255, 240, 100, 0.3)';
            if (fDir > 0) {
                ctx.fillRect(hx + 2, hy + 3, 7, 3);
                ctx.fillRect(hx + 14, hy + 7, 6, 2);
            } else {
                ctx.fillRect(hx - 6, hy + 3, 7, 3);
                ctx.fillRect(hx - 17, hy + 7, 6, 2);
            }

            // Wind trail particles during swing
            const progress = 1 - (f.life / f.maxLife);
            if (progress > 0.2 && progress < 0.8) {
                for (let i = 0; i < 4; i++) {
                    const px = fx + Math.random() * flagW * fDir;
                    const py = fy + wave1 + Math.random() * flagH;
                    ctx.fillStyle = `rgba(200, 20, 20, ${0.3 - progress * 0.3})`;
                    ctx.fillRect(px - 8 * fDir, py, 6, 2);
                }
            }

            ctx.restore();
        }

        // Spaceship laser
        if (this.spaceshipLaser) {
            const sl = this.spaceshipLaser;
            // Draw spaceship (UFO style)
            ctx.fillStyle = '#555566';
            ctx.fillRect(sl.shipX - 20, sl.shipY, 40, 12);
            ctx.fillStyle = '#666677';
            ctx.fillRect(sl.shipX - 12, sl.shipY - 6, 24, 8);
            // Dome
            ctx.fillStyle = '#8888aa';
            ctx.fillRect(sl.shipX - 8, sl.shipY - 12, 16, 8);
            // Lights
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(sl.shipX - 18, sl.shipY + 2, 4, 4);
            ctx.fillStyle = '#44ff44';
            ctx.fillRect(sl.shipX + 14, sl.shipY + 2, 4, 4);
            // Red star
            ctx.fillStyle = COLORS.flagRed;
            ctx.fillRect(sl.shipX - 3, sl.shipY - 10, 6, 6);
            ctx.fillStyle = COLORS.hammerSickle;
            ctx.fillRect(sl.shipX - 1, sl.shipY - 8, 2, 2);

            // Laser beam
            if (sl.phase === 'fire' && sl.timer > 5) {
                const laserAlpha = Math.sin(sl.timer * 0.3) * 0.3 + 0.7;
                // Wide beam
                ctx.fillStyle = `rgba(255, 50, 50, ${laserAlpha * 0.3})`;
                ctx.fillRect(sl.shipX - 15, sl.shipY + 12, 30, sl.targetY - sl.shipY);
                // Core beam
                ctx.fillStyle = `rgba(255, 100, 100, ${laserAlpha * 0.6})`;
                ctx.fillRect(sl.shipX - 6, sl.shipY + 12, 12, sl.targetY - sl.shipY);
                // Bright core
                ctx.fillStyle = `rgba(255, 200, 200, ${laserAlpha})`;
                ctx.fillRect(sl.shipX - 2, sl.shipY + 12, 4, sl.targetY - sl.shipY);
                // Impact flash
                if (sl.timer > 10) {
                    ctx.fillStyle = `rgba(255, 255, 200, ${laserAlpha * 0.5})`;
                    ctx.fillRect(sl.targetX - 20, sl.targetY - 5, 40, 15);
                }
            }
        }

        // Lightning storm
        if (this.lightningStorm) {
            const ls = this.lightningStorm;
            // Dark overlay
            ctx.fillStyle = `rgba(0, 0, 30, ${Math.min(ls.timer / 10, 0.3)})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            // Draw all active bolts
            for (const bolt of ls.bolts) {
                const alpha = bolt.life / 15;
                this.drawLightningBolt(ctx, bolt.x, bolt.y, bolt.x + (Math.random() - 0.5) * 15, bolt.targetY, alpha, bolt.width);
                // Ground impact
                ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.5})`;
                ctx.fillRect(bolt.x - 15, bolt.targetY - 5, 30, 12);
            }
        }

        // Mushroom trip distortion
        if (this.mushroomTrip > 0) {
            this.drawMushroomTrip(ctx, canvasWidth, canvasHeight);
        }
    },

    drawMushroomTrip(ctx, w, h) {
        const intensity = Math.min(this.mushroomTrip / 30, 1);
        const t = Date.now() * 0.003;

        // Color overlay waves
        ctx.globalCompositeOperation = 'overlay';
        for (let i = 0; i < 3; i++) {
            const hue = (t * 50 + i * 120) % 360;
            const y = Math.sin(t + i * 2) * h * 0.3 + h / 2;
            ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${intensity * 0.15})`;
            ctx.fillRect(0, y - 30, w, 60);
        }

        // Pulsing circles
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
            const cx = Math.sin(t * 0.7 + i) * w * 0.3 + w / 2;
            const cy = Math.cos(t * 0.5 + i * 1.5) * h * 0.3 + h / 2;
            const r = (Math.sin(t + i) * 0.5 + 0.5) * 40 + 10;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            const hue = (t * 30 + i * 72) % 360;
            grd.addColorStop(0, `hsla(${hue}, 90%, 60%, ${intensity * 0.2})`);
            grd.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }

        // Mushroom icon floating
        if (this.mushroomTrip > 80) {
            const mx = w / 2 + Math.sin(t * 2) * 30;
            const my = h / 3 + Math.cos(t * 1.5) * 15;
            ctx.globalCompositeOperation = 'source-over';
            // Stem
            ctx.fillStyle = `rgba(240, 220, 180, ${intensity})`;
            ctx.fillRect(mx - 4, my + 8, 8, 12);
            // Cap
            ctx.fillStyle = `rgba(200, 60, 30, ${intensity})`;
            ctx.fillRect(mx - 12, my - 4, 24, 14);
            ctx.fillRect(mx - 8, my - 8, 16, 6);
            // Dots
            ctx.fillStyle = `rgba(255, 255, 200, ${intensity})`;
            ctx.fillRect(mx - 6, my - 2, 3, 3);
            ctx.fillRect(mx + 4, my - 2, 3, 3);
            ctx.fillRect(mx - 1, my - 6, 3, 3);
        }

        ctx.globalCompositeOperation = 'source-over';

        // Screen wave distortion (using pixel shift)
        if (intensity > 0.3) {
            const waveData = ctx.getImageData(0, 0, w, h);
            const data = waveData.data;
            const shift = Math.round(Math.sin(t * 3) * 4 * intensity);
            if (shift !== 0) {
                // Shift some scan lines
                for (let y = 0; y < h; y += 3) {
                    const lineShift = Math.round(Math.sin(t * 2 + y * 0.05) * 3 * intensity);
                    if (lineShift !== 0 && lineShift > 0) {
                        const rowStart = y * w * 4;
                        for (let x = w - 1; x >= lineShift; x--) {
                            const dst = rowStart + x * 4;
                            const src = rowStart + (x - lineShift) * 4;
                            data[dst] = data[src];
                            data[dst + 1] = data[src + 1];
                            data[dst + 2] = data[src + 2];
                        }
                    }
                }
                ctx.putImageData(waveData, 0, 0);
            }
        }
    },

    drawLightningBolt(ctx, x1, y1, x2, y2, alpha, width) {
        const segments = 8;
        const dy = (y2 - y1) / segments;
        let cx = x1, cy = y1;
        // Outer glow
        ctx.strokeStyle = `rgba(100, 130, 255, ${alpha * 0.4})`;
        ctx.lineWidth = width + 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let i = 0; i < segments; i++) {
            cx += (Math.random() - 0.5) * 20;
            cy += dy;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        // Core
        cx = x1; cy = y1;
        ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let i = 0; i < segments; i++) {
            cx += (Math.random() - 0.5) * 16;
            cy += dy;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        // Bright center
        cx = x1; cy = y1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = Math.max(1, width - 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let i = 0; i < segments; i++) {
            cx += (Math.random() - 0.5) * 10;
            cy += dy;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    },

    getShakeOffset() {
        if (this.screenShake <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.screenShake * 2,
            y: (Math.random() - 0.5) * this.screenShake * 2
        };
    }
};
