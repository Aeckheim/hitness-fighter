// Main game controller
const Game = {
    canvas: null,
    ctx: null,
    width: 768,
    height: 448,
    nativeWidth: 384,
    nativeHeight: 224,
    scale: 2,

    state: 'title', // title, select, fight, announce, win
    p1: null,
    p2: null,
    round: 1,
    timer: 99,
    timerInterval: null,
    announceText: '',

    // Character select
    p1Confirmed: false,
    p2Confirmed: false,

    groundY: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Size canvas to fit window while maintaining aspect ratio
        this.resize();
        window.addEventListener('resize', () => this.resize());

        Input.init();

        this.groundY = this.height - 35 - 32 * 3; // floor minus sprite height

        this.loop();
    },

    resize() {
        const aspect = this.nativeWidth / this.nativeHeight;
        let w = window.innerWidth;
        let h = window.innerHeight;

        if (w / h > aspect) {
            w = h * aspect;
        } else {
            h = w / aspect;
        }

        // Use integer scale for pixel-perfect rendering
        this.scale = Math.max(1, Math.floor(Math.min(w / this.nativeWidth, h / this.nativeHeight)));
        this.width = this.nativeWidth * this.scale;
        this.height = this.nativeHeight * this.scale;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.groundY = this.height - 35 * this.scale / 2 - 32 * 3;

        // Reinit arena if needed
        Arena.init(this.width, this.height);
    },

    loop() {
        this.update();
        this.render();
        Input.update();
        requestAnimationFrame(() => this.loop());
    },

    update() {
        switch (this.state) {
            case 'title':
                this.updateTitle();
                break;
            case 'select':
                this.updateSelect();
                break;
            case 'announce':
                this.updateAnnounce();
                break;
            case 'fight':
                this.updateFight();
                break;
            case 'win':
                this.updateWin();
                break;
        }
    },

    updateTitle() {
        if (Input.justPressed('Enter') || Input.justPressed('Space')) {
            this.state = 'select';
            this.p1Confirmed = false;
            this.p2Confirmed = false;
            Screens.selectP1 = 0;
            Screens.selectP2 = 1;
        }
    },

    updateSelect() {
        // P1 selection
        if (!this.p1Confirmed) {
            if (Input.justPressed('KeyA')) {
                Screens.selectP1 = (Screens.selectP1 - 1 + Screens.charList.length) % Screens.charList.length;
            }
            if (Input.justPressed('KeyD')) {
                Screens.selectP1 = (Screens.selectP1 + 1) % Screens.charList.length;
            }
            if (Input.justPressed('KeyF')) {
                this.p1Confirmed = true;
            }
        }

        // P2 selection
        if (!this.p2Confirmed) {
            if (Input.justPressed('ArrowLeft')) {
                Screens.selectP2 = (Screens.selectP2 - 1 + Screens.charList.length) % Screens.charList.length;
            }
            if (Input.justPressed('ArrowRight')) {
                Screens.selectP2 = (Screens.selectP2 + 1) % Screens.charList.length;
            }
            if (Input.justPressed('Numpad1')) {
                this.p2Confirmed = true;
            }
        }

        // Both confirmed - start fight
        if (this.p1Confirmed && this.p2Confirmed) {
            this.startMatch();
        }
    },

    startMatch() {
        const p1Char = Screens.charList[Screens.selectP1];
        const p2Char = Screens.charList[Screens.selectP2];

        this.p1 = new Fighter(p1Char, 80, this.groundY, true);
        this.p2 = new Fighter(p2Char, this.width - 180, this.groundY, false);
        this.p1.groundY = this.groundY;
        this.p2.groundY = this.groundY;

        this.round = 1;
        this.p1.wins = 0;
        this.p2.wins = 0;

        this.startRound();
    },

    startRound() {
        this.p1.reset(80, true);
        this.p2.reset(this.width - 180, false);
        this.timer = 99;
        this.state = 'announce';
        this.announceText = this.round === 1 ? 'ROUND 1' : this.round === 2 ? 'ROUND 2' : 'FINAL ROUND';
        Screens.announceTimer = 0;

        if (this.timerInterval) clearInterval(this.timerInterval);
    },

    updateAnnounce() {
        Screens.announceTimer++;
        if (Screens.announceTimer > 60) {
            if (this.announceText.includes('ROUND') || this.announceText === 'FINAL ROUND') {
                this.announceText = 'FIGHT!';
                Screens.announceTimer = 0;
            } else {
                this.state = 'fight';
                // Start timer countdown
                if (this.timerInterval) clearInterval(this.timerInterval);
                this.timerInterval = setInterval(() => {
                    if (this.state === 'fight') {
                        this.timer--;
                        if (this.timer <= 0) {
                            this.timer = 0;
                            this.endRound();
                        }
                    }
                }, 1000);
            }
        }
    },

    updateFight() {
        // Effects update (may pause for hit freeze)
        const frozen = Effects.update();
        if (frozen) return;

        Arena.update();

        // Get input
        const p1Input = Input.getPlayer1();
        const p2Input = Input.getPlayer2();

        // Update fighters
        this.p1.update(p1Input, this.p2, this.width);
        this.p2.update(p2Input, this.p1, this.width);

        // Check hitbox collisions
        this.p1.checkHitBoxCollision(this.p2);
        this.p2.checkHitBoxCollision(this.p1);

        // Flag swing visual - always show when special1 starts (not just on hit)
        if (this.p1.state === 'special1' && this.p1.stateTimer === 24 && this.p1.hitBox && this.p1.hitBox.type === 'flag') {
            Effects.startFlagSwing(this.p1);
        }
        if (this.p2.state === 'special1' && this.p2.stateTimer === 24 && this.p2.hitBox && this.p2.hitBox.type === 'flag') {
            Effects.startFlagSwing(this.p2);
        }

        // Hit effects
        if (this.p1.hasHit && this.p1.hitBox) {
            Effects.addHitSpark(this.p1.hitBox.x + this.p1.hitBox.w / 2, this.p1.hitBox.y + this.p1.hitBox.h / 2);
        }
        if (this.p2.hasHit && this.p2.hitBox) {
            Effects.addHitSpark(this.p2.hitBox.x + this.p2.hitBox.w / 2, this.p2.hitBox.y + this.p2.hitBox.h / 2);
        }

        // Super attack triggers
        if (this.p1.state === 'super' && this.p1.stateTimer === 44) {
            if (this.p1.charId === 'rusty_crusty') {
                Effects.startSpaceshipLaser(this.p1, this.p2);
            } else if (this.p1.charId === 'lord_michlok') {
                Effects.startLightningStorm(this.p1, this.p2);
            } else {
                Effects.startMushroomTrip(this.p1, this.p2);
            }
        }
        if (this.p2.state === 'super' && this.p2.stateTimer === 44) {
            if (this.p2.charId === 'rusty_crusty') {
                Effects.startSpaceshipLaser(this.p2, this.p1);
            } else if (this.p2.charId === 'lord_michlok') {
                Effects.startLightningStorm(this.p2, this.p1);
            } else {
                Effects.startMushroomTrip(this.p2, this.p1);
            }
        }

        // Push apart (prevent overlapping)
        this.pushApart();

        // Check KO
        if (this.p1.state === 'ko' || this.p2.state === 'ko') {
            this.endRound();
        }
    },

    pushApart() {
        const b1 = this.p1.getHurtBox();
        const b2 = this.p2.getHurtBox();

        const overlapX = Math.min(b1.x + b1.w, b2.x + b2.w) - Math.max(b1.x, b2.x);
        if (overlapX > 0) {
            const push = overlapX / 2 + 1;
            if (this.p1.x < this.p2.x) {
                this.p1.x -= push;
                this.p2.x += push;
            } else {
                this.p1.x += push;
                this.p2.x -= push;
            }
        }
    },

    endRound() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Determine winner
        let roundWinner;
        if (this.p1.hp <= 0) {
            roundWinner = this.p2;
        } else if (this.p2.hp <= 0) {
            roundWinner = this.p1;
        } else {
            // Time up - whoever has more HP
            roundWinner = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
        }

        roundWinner.wins++;

        // Check for match win (best of 3)
        if (roundWinner.wins >= 2) {
            this.state = 'win';
            this.matchWinner = roundWinner;
            Screens.winTimer = 0;
        } else {
            this.round++;
            setTimeout(() => this.startRound(), 1500);
        }
    },

    updateWin() {
        if (Input.justPressed('Enter') || Input.justPressed('Space')) {
            this.state = 'title';
            Screens.titleTimer = 0;
        }
    },

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        switch (this.state) {
            case 'title':
                Screens.drawTitle(ctx, this.width, this.height);
                break;

            case 'select':
                Screens.drawCharSelect(ctx, this.width, this.height);
                break;

            case 'announce':
                // Draw arena + fighters behind announcement
                this.renderFightScene(ctx);
                Screens.drawAnnouncement(ctx, this.width, this.height, this.announceText);
                break;

            case 'fight':
                this.renderFightScene(ctx);
                break;

            case 'win':
                this.renderFightScene(ctx);
                Screens.drawWinScreen(ctx, this.width, this.height, this.matchWinner);
                break;
        }
    },

    renderFightScene(ctx) {
        // Screen shake
        const shake = Effects.getShakeOffset();
        ctx.save();
        ctx.translate(Math.round(shake.x), Math.round(shake.y));

        // Arena background
        Arena.draw(ctx);

        // Fighters
        if (this.p1) this.p1.draw(ctx);
        if (this.p2) this.p2.draw(ctx);

        // Effects
        Effects.draw(ctx, this.width, this.height);

        ctx.restore();

        // HUD (not affected by shake)
        if (this.p1 && this.p2) {
            UI.drawHUD(ctx, this.p1, this.p2, this.timer, this.round, this.width);
        }
    }
};

// Start game when page loads
window.addEventListener('load', () => Game.init());
