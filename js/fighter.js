// Fighter class - handles movement, attacks, HP, state
class Fighter {
    constructor(charId, x, y, facingRight) {
        const data = CHARACTER_DATA[charId];
        this.charId = charId;
        this.name = data.name;
        this.sprites = data.sprites;
        this.spriteWidth = data.spriteWidth;
        this.spriteHeight = data.spriteHeight;
        this.scale = data.scale;
        this.bodyWidth = data.bodyWidth * this.scale;
        this.bodyHeight = data.bodyHeight * this.scale;
        this.offsetX = data.offsetX * this.scale;
        this.offsetY = data.offsetY * this.scale;
        this.speed = data.speed;
        this.jumpForce = data.jumpForce;
        this.punchDamage = data.punchDamage;
        this.kickDamage = data.kickDamage;
        this.special1Damage = data.special1Damage;
        this.special2Damage = data.special2Damage;
        this.superDamage = data.superDamage;
        this.color = data.color;

        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.facingRight = facingRight;
        this.grounded = true;

        this.hp = 100;
        this.maxHp = 100;
        this.superMeter = 0;
        this.maxSuper = 100;

        this.state = 'idle'; // idle, walk, jump, crouch, punch, kick, special1, special2, super, hit, ko, beam
        this.stateTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;

        this.hitBox = null; // active attack hitbox
        this.hasHit = false; // prevent multi-hit per attack

        // Beam away (Rusty & Crusty)
        this.beamTimer = 0;
        this.beamActive = false;
        this.beamStartX = 0;

        // Projectiles
        this.projectiles = [];

        // Hit stun
        this.hitStun = 0;
        this.knockbackX = 0;

        // Round wins
        this.wins = 0;

        // Combo counter
        this.comboCount = 0;
        this.comboTimer = 0;

        // Special cooldowns (2 uses then recharge)
        this.special1Charges = 2;
        this.special1Cooldown = 0;
        this.special2Charges = 2;
        this.special2Cooldown = 0;

        this.gravity = 0.4;
        this.groundY = y;
    }

    getHurtBox() {
        return {
            x: this.x + this.offsetX,
            y: this.y + this.offsetY,
            w: this.bodyWidth,
            h: this.bodyHeight
        };
    }

    reset(x, facingRight) {
        this.x = x;
        this.y = this.groundY;
        this.velX = 0;
        this.velY = 0;
        this.hp = this.maxHp;
        this.superMeter = 0;
        this.state = 'idle';
        this.stateTimer = 0;
        this.hitBox = null;
        this.hasHit = false;
        this.grounded = true;
        this.facingRight = facingRight;
        this.projectiles = [];
        this.beamActive = false;
        this.hitStun = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.special1Charges = 2;
        this.special1Cooldown = 0;
        this.special2Charges = 2;
        this.special2Cooldown = 0;
    }

    update(input, opponent, arenaWidth) {
        // Update projectiles
        this.updateProjectiles(opponent);

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.comboCount = 0;
        }

        // Special cooldowns (recharge when empty)
        if (this.special1Cooldown > 0) {
            this.special1Cooldown--;
            if (this.special1Cooldown <= 0) this.special1Charges = 2;
        }
        if (this.special2Cooldown > 0) {
            this.special2Cooldown--;
            if (this.special2Cooldown <= 0) this.special2Charges = 2;
        }

        // Hit stun
        if (this.hitStun > 0) {
            this.hitStun--;
            this.x += this.knockbackX;
            this.knockbackX *= 0.8;
            if (this.hitStun <= 0) {
                this.state = 'idle';
            }
            this.applyGravity();
            this.clampPosition(arenaWidth);
            return;
        }

        // KO state
        if (this.state === 'ko') return;

        // Beam away / Ship flyby (invincible)
        if (this.beamActive) {
            this.beamTimer--;

            // Ship flyby update
            if (this.shipFlyby) {
                const sf = this.shipFlyby;
                sf.timer++;

                if (sf.phase === 'launch') {
                    // Fly upward off screen
                    this.y -= 8;
                    if (sf.timer > 10) {
                        sf.phase = 'fly';
                        sf.timer = 0;
                        this.y = -50; // off screen
                    }
                } else if (sf.phase === 'fly') {
                    // Flying across top, shooting down at opponent
                    this.y = -50;
                    if (opponent) {
                        this.x += (opponent.x - this.x) * 0.08; // track toward opponent
                    }
                    // Fire shots downward
                    if (sf.timer % 8 === 0 && sf.timer <= 24) {
                        const hurtBox = this.getHurtBox();
                        this.projectiles.push({
                            x: this.x + this.spriteWidth * this.scale / 2,
                            y: 0,
                            velX: (Math.random() - 0.5) * 2,
                            velY: 6,
                            w: 6,
                            h: 10,
                            damage: 8,
                            knockback: this.facingRight ? 2 : -2,
                            type: 'laser',
                            life: 80,
                            gravity: 0
                        });
                    }
                    if (sf.timer > 30) {
                        sf.phase = 'land';
                        sf.timer = 0;
                        this.x = sf.startX;
                    }
                } else if (sf.phase === 'land') {
                    // Beam back down
                    this.y = sf.startY - (10 - sf.timer) * ((sf.startY + 50) / 10);
                    if (this.y >= sf.startY) {
                        this.y = sf.startY;
                        this.shipFlyby = null;
                    }
                }
            }

            if (this.beamTimer <= 0) {
                this.beamActive = false;
                this.shipFlyby = null;
                this.y = this.groundY;
                this.state = 'idle';
            }
            return;
        }

        // Attack state timer
        if (this.state === 'punch' || this.state === 'kick' || this.state === 'special1' || this.state === 'special2' || this.state === 'super') {
            this.stateTimer--;
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.hitBox = null;
                this.hasHit = false;
            }
            this.applyGravity();
            this.clampPosition(arenaWidth);
            return;
        }

        // Face opponent
        if (opponent) {
            this.facingRight = this.x < opponent.x;
        }

        // Movement
        this.velX = 0;
        if (input.left) {
            this.velX = -this.speed;
            if (this.grounded) this.state = 'walk';
        } else if (input.right) {
            this.velX = this.speed;
            if (this.grounded) this.state = 'walk';
        } else if (this.grounded) {
            this.state = input.down ? 'crouch' : 'idle';
        }

        // Jump
        if (input.up && this.grounded) {
            this.velY = -this.jumpForce;
            this.grounded = false;
            this.state = 'jump';
        }

        // Attacks (priority: super > special > normal)
        if (input.superAtk && this.superMeter >= this.maxSuper && this.grounded) {
            this.doSuper();
        } else if (input.special1 && this.grounded && this.special1Charges > 0) {
            this.doSpecial1();
        } else if (input.special2 && this.grounded && this.special2Charges > 0) {
            this.doSpecial2();
        } else if (input.punch) {
            this.doPunch();
        } else if (input.kick) {
            this.doKick();
        }

        this.x += this.velX;
        this.applyGravity();
        this.clampPosition(arenaWidth);

        // Animation
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
    }

    applyGravity() {
        if (!this.grounded) {
            this.velY += this.gravity;
            this.y += this.velY;
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velY = 0;
                this.grounded = true;
                if (this.state === 'jump') this.state = 'idle';
            }
        }
    }

    clampPosition(arenaWidth) {
        const totalW = this.spriteWidth * this.scale;
        if (this.x < 0) this.x = 0;
        if (this.x + totalW > arenaWidth) this.x = arenaWidth - totalW;
    }

    doPunch() {
        this.state = 'punch';
        this.stateTimer = 12;
        this.hasHit = false;
        const dir = this.facingRight ? 1 : -1;
        const hurtBox = this.getHurtBox();
        this.hitBox = {
            x: this.facingRight ? hurtBox.x + hurtBox.w : hurtBox.x - 20 * this.scale / 3,
            y: hurtBox.y + 10,
            w: 20 * this.scale / 3,
            h: 15,
            damage: this.punchDamage,
            knockback: 3 * dir,
            type: 'punch'
        };
    }

    doKick() {
        this.state = 'kick';
        this.stateTimer = 15;
        this.hasHit = false;
        const dir = this.facingRight ? 1 : -1;
        const hurtBox = this.getHurtBox();
        this.hitBox = {
            x: this.facingRight ? hurtBox.x + hurtBox.w : hurtBox.x - 25 * this.scale / 3,
            y: hurtBox.y + hurtBox.h - 25,
            w: 25 * this.scale / 3,
            h: 20,
            damage: this.kickDamage,
            knockback: 4 * dir,
            type: 'kick'
        };
    }

    doSpecial1() {
        this.state = 'special1';
        this.stateTimer = 25;
        this.hasHit = false;
        const dir = this.facingRight ? 1 : -1;

        if (this.charId === 'rusty_crusty') {
            // Communist flag swing - wide arc attack
            const hurtBox = this.getHurtBox();
            this.hitBox = {
                x: this.facingRight ? hurtBox.x + hurtBox.w - 10 : hurtBox.x - 40 * this.scale / 3,
                y: hurtBox.y - 10,
                w: 40 * this.scale / 3,
                h: hurtBox.h,
                damage: this.special1Damage,
                knockback: 6 * dir,
                type: 'flag'
            };
        } else if (this.charId === 'lord_michlok') {
            // Lightning Bolt projectile
            const hurtBox = this.getHurtBox();
            this.projectiles.push({
                x: this.facingRight ? hurtBox.x + hurtBox.w : hurtBox.x - 12,
                y: hurtBox.y + 10,
                velX: 6 * dir,
                w: 16,
                h: 16,
                damage: this.special1Damage,
                knockback: 5 * dir,
                type: 'lightning',
                life: 50
            });
        } else {
            // Zyo - Sonic Scream projectile
            const hurtBox = this.getHurtBox();
            this.projectiles.push({
                x: this.facingRight ? hurtBox.x + hurtBox.w : hurtBox.x - 10,
                y: hurtBox.y + 15,
                velX: 5 * dir,
                w: 20,
                h: 12,
                damage: this.special1Damage,
                knockback: 4 * dir,
                type: 'sonic',
                life: 60
            });
        }
        this.superMeter = Math.min(this.maxSuper, this.superMeter + 10);
        this.special1Charges--;
        if (this.special1Charges <= 0) this.special1Cooldown = 90; // ~1.5 sec recharge
    }

    doSpecial2() {
        this.state = 'special2';
        this.stateTimer = 20;
        this.hasHit = false;

        if (this.charId === 'rusty_crusty') {
            // Beam Away - teleport dodge
            this.beamActive = true;
            this.beamTimer = 20;
            this.beamStartX = this.x;
            const dir = this.facingRight ? -1 : 1; // teleport backward
            this.x += dir * 80;
        } else if (this.charId === 'lord_michlok') {
            // Thunder Strike - lightning drops at a fixed spot ahead
            this.stateTimer = 25;
            const dir = this.facingRight ? 1 : -1;
            const hurtBox = this.getHurtBox();
            // Drops 100px ahead of Michlok - opponent can dodge
            this.projectiles.push({
                x: hurtBox.x + hurtBox.w / 2 + dir * 100,
                y: -20,
                velX: 0,
                velY: 7,
                w: 12,
                h: 20,
                damage: this.special2Damage,
                knockback: 2 * dir,
                type: 'thunderbolt',
                life: 60,
                gravity: 0
            });
        } else {
            // Zyo - Mic Drop projectile
            const dir = this.facingRight ? 1 : -1;
            const hurtBox = this.getHurtBox();
            this.projectiles.push({
                x: this.facingRight ? hurtBox.x + hurtBox.w : hurtBox.x - 8,
                y: hurtBox.y,
                velX: 4 * dir,
                velY: -3,
                w: 8,
                h: 16,
                damage: this.special2Damage,
                knockback: 3 * dir,
                type: 'mic',
                life: 50,
                gravity: 0.2
            });
        }
        this.superMeter = Math.min(this.maxSuper, this.superMeter + 10);
        this.special2Charges--;
        if (this.special2Charges <= 0) this.special2Cooldown = 90; // ~1.5 sec recharge
    }

    doSuper() {
        this.state = 'super';
        this.stateTimer = 45;
        this.hasHit = false;
        this.superMeter = 0;

        if (this.charId === 'lord_michlok') {
            // Lightning Storm - multiple bolts rain down
            this.stateTimer = 60;
            // Handled in effects.js
        } else if (this.charId === 'rusty_crusty') {
            // Spaceship Flyby - fly up in a small ship and shoot down
            this.stateTimer = 50;
            this.shipFlyby = {
                phase: 'launch',
                timer: 0,
                startX: this.x,
                startY: this.y,
                shots: [],
                hasShot: false
            };
            this.beamActive = true;
            this.beamTimer = 50;
        } else {
            // Pilztrip - screen distortion + damage
            // Handled in effects.js
        }
    }

    updateProjectiles(opponent) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.velX;
            if (p.velY !== undefined) {
                p.velY += (p.gravity || 0);
                p.y += p.velY;
            }
            p.life--;

            // Hit opponent
            if (opponent && !opponent.beamActive && opponent.hitStun <= 0) {
                const ob = opponent.getHurtBox();
                if (p.x < ob.x + ob.w && p.x + p.w > ob.x && p.y < ob.y + ob.h && p.y + p.h > ob.y) {
                    opponent.takeHit(p.damage, p.knockback);
                    this.superMeter = Math.min(this.maxSuper, this.superMeter + 5);
                    this.comboCount++;
                    this.comboTimer = 60;
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            if (p.life <= 0 || p.x < -50 || p.x > 1200 || p.y > 600) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    takeHit(damage, knockback) {
        if (this.beamActive) return; // invincible during beam
        this.hp -= damage;
        this.hitStun = 15;
        this.knockbackX = knockback;
        this.state = 'hit';
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = 'ko';
        }
    }

    checkHitBoxCollision(opponent) {
        if (!this.hitBox || this.hasHit || !opponent || opponent.beamActive) return;
        const ob = opponent.getHurtBox();
        const h = this.hitBox;
        if (h.x < ob.x + ob.w && h.x + h.w > ob.x && h.y < ob.y + ob.h && h.y + h.h > ob.y) {
            opponent.takeHit(h.damage, h.knockback);
            this.hasHit = true;
            this.superMeter = Math.min(this.maxSuper, this.superMeter + 8);
            this.comboCount++;
            this.comboTimer = 60;
        }
    }

    draw(ctx) {
        // Ship flyby effect
        if (this.beamActive && this.shipFlyby) {
            const sf = this.shipFlyby;
            const shipCX = this.x + this.spriteWidth * this.scale / 2;

            if (sf.phase === 'launch') {
                // Draw character flying up with rocket flames
                const spriteSet = this.sprites.idle[0];
                drawSprite(ctx, spriteSet, Math.round(this.x), Math.round(this.y), this.scale, !this.facingRight);
                // Rocket flames below
                for (let i = 0; i < 4; i++) {
                    ctx.fillStyle = i % 2 === 0 ? '#ff4422' : '#ffaa22';
                    const fx = this.x + this.spriteWidth * this.scale / 2 - 6 + Math.random() * 12;
                    const fy = this.y + this.spriteHeight * this.scale + Math.random() * 15;
                    ctx.fillRect(fx, fy, 4 + Math.random() * 4, 6 + Math.random() * 8);
                }
            } else if (sf.phase === 'fly') {
                // Draw spaceship at top of screen
                const sx = shipCX - 18;
                const sy = 10;
                // Ship body
                ctx.fillStyle = '#555566';
                ctx.fillRect(sx, sy, 36, 10);
                ctx.fillStyle = '#666677';
                ctx.fillRect(sx + 6, sy - 5, 24, 7);
                // Dome
                ctx.fillStyle = '#8888aa';
                ctx.fillRect(sx + 10, sy - 10, 16, 7);
                // Red star
                ctx.fillStyle = '#cc2222';
                ctx.fillRect(sx + 15, sy - 8, 6, 5);
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(sx + 17, sy - 6, 2, 2);
                // Engine glow
                ctx.fillStyle = '#44ccff';
                ctx.fillRect(sx + 2, sy + 10, 6, 3);
                ctx.fillRect(sx + 28, sy + 10, 6, 3);
                // Muzzle flash when shooting
                if (sf.timer % 8 < 3) {
                    ctx.fillStyle = '#ff6644';
                    ctx.fillRect(sx + 14, sy + 10, 8, 5);
                    ctx.fillStyle = '#ffaa44';
                    ctx.fillRect(sx + 16, sy + 12, 4, 4);
                }
            } else if (sf.phase === 'land') {
                // Beam down effect
                const spriteSet = this.sprites.idle[0];
                ctx.globalAlpha = 0.5 + sf.timer * 0.05;
                drawSprite(ctx, spriteSet, Math.round(this.x), Math.round(this.y), this.scale, !this.facingRight);
                ctx.globalAlpha = 1;
                // Cyan beam column
                ctx.fillStyle = `rgba(0, 255, 255, ${0.15 - sf.timer * 0.01})`;
                ctx.fillRect(this.x + 10, 0, this.spriteWidth * this.scale - 20, this.y);
            }

            // Draw projectiles even during flyby
            this.drawProjectiles(ctx);
            return;
        }

        // Beam effect (legacy/other beam uses)
        if (this.beamActive) {
            const alpha = Math.sin(this.beamTimer * 0.5) * 0.5 + 0.5;
            ctx.globalAlpha = alpha * 0.3;
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = COLORS.beamCyan;
                const bx = this.x + Math.random() * this.spriteWidth * this.scale;
                const by = this.y + Math.random() * this.spriteHeight * this.scale;
                ctx.fillRect(bx, by, 4, 4);
            }
            ctx.globalAlpha = 1;
            this.drawProjectiles(ctx);
            return;
        }

        // Select sprite
        let spriteSet;
        const sprites = this.sprites;
        switch (this.state) {
            case 'punch': spriteSet = sprites.punch[0]; break;
            case 'kick': spriteSet = sprites.kick[0]; break;
            case 'hit': spriteSet = sprites.hit[0]; break;
            case 'ko': spriteSet = sprites.hit[0]; break;
            default: spriteSet = sprites.idle[this.animFrame % sprites.idle.length]; break;
        }

        // Flash white when hit
        if (this.hitStun > 0 && this.hitStun % 4 < 2) {
            ctx.globalAlpha = 0.5;
        }

        // Floating effect for Lord Michlok
        let drawY = this.y;
        if (CHARACTER_DATA[this.charId].floats && this.grounded) {
            drawY -= 8 + Math.sin(Date.now() * 0.004) * 4; // hover above ground with bob
            // Shadow on ground
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(this.x + this.spriteWidth * this.scale / 2, this.y + this.spriteHeight * this.scale - 2, 18, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Dark aura particles
            if (Math.random() < 0.3) {
                ctx.fillStyle = `rgba(100, 50, 200, ${0.2 + Math.random() * 0.3})`;
                const px = this.x + Math.random() * this.spriteWidth * this.scale;
                const py = drawY + this.spriteHeight * this.scale + Math.random() * 10;
                ctx.fillRect(px, py, 2, 3);
            }
        }

        drawSprite(ctx, spriteSet, Math.round(this.x), Math.round(drawY), this.scale, !this.facingRight);

        ctx.globalAlpha = 1;

        // Draw projectiles
        this.drawProjectiles(ctx);

        // Draw hitbox (debug - remove later)
        // if (this.hitBox) {
        //     ctx.strokeStyle = 'red';
        //     ctx.strokeRect(this.hitBox.x, this.hitBox.y, this.hitBox.w, this.hitBox.h);
        // }
    }

    drawProjectiles(ctx) {
        for (const p of this.projectiles) {
            if (p.type === 'sonic') {
                // Sonic scream - yellow/orange waves
                ctx.fillStyle = COLORS.sonicYellow;
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = COLORS.sonicOrange;
                ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, p.h - 4);
                // Wave lines
                ctx.fillStyle = COLORS.sonicYellow;
                for (let i = 0; i < 3; i++) {
                    const wy = p.y - 4 + i * 6 + Math.sin(Date.now() * 0.01 + i) * 3;
                    ctx.fillRect(p.x + 2, wy, p.w - 4, 2);
                }
            } else if (p.type === 'mic') {
                // Microphone projectile
                ctx.fillStyle = COLORS.micSilver;
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = COLORS.micDark;
                ctx.fillRect(p.x + 1, p.y, p.w - 2, 4);
            } else if (p.type === 'lightning') {
                // Lightning bolt projectile - zigzag shape
                ctx.fillStyle = '#ffff44';
                ctx.fillRect(p.x, p.y + 2, p.w, 3);
                ctx.fillRect(p.x + 4, p.y, 3, 7);
                ctx.fillRect(p.x + 8, p.y + 4, 3, 7);
                ctx.fillRect(p.x + 12, p.y + 1, 3, 6);
                // Glow
                ctx.fillStyle = 'rgba(100, 140, 255, 0.4)';
                ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
                // Spark particles
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(p.x + Math.random() * p.w, p.y + Math.random() * p.h, 2, 2);
            } else if (p.type === 'thunderbolt') {
                // Vertical lightning bolt falling from sky
                // Glow trail above
                ctx.fillStyle = 'rgba(100, 130, 255, 0.3)';
                ctx.fillRect(p.x + 2, p.y - 30, p.w - 4, 30);
                // Core bolt
                ctx.fillStyle = '#ffff44';
                ctx.fillRect(p.x + 2, p.y, p.w - 4, p.h);
                // Zigzag details
                ctx.fillRect(p.x, p.y + 4, p.w, 3);
                ctx.fillRect(p.x + 4, p.y + 10, p.w - 4, 3);
                // Bright center
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(p.x + 4, p.y + 2, p.w - 8, p.h - 4);
                // Sparks
                ctx.fillStyle = `rgba(255, 255, 100, ${0.5 + Math.random() * 0.5})`;
                ctx.fillRect(p.x - 3 + Math.random() * (p.w + 6), p.y + Math.random() * p.h, 3, 3);
            } else if (p.type === 'laser') {
                // Spaceship laser bolt (red/orange, falling down)
                ctx.fillStyle = '#ff4422';
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#ffaa44';
                ctx.fillRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
                // Trail
                ctx.fillStyle = 'rgba(255, 100, 50, 0.3)';
                ctx.fillRect(p.x + 1, p.y - 8, p.w - 2, 8);
            }
        }
    }
}
