// Main game controller
const Game = {
    canvas: null,
    ctx: null,
    width: 768,
    height: 448,
    nativeWidth: 384,
    nativeHeight: 224,
    scale: 2,

    state: 'title', // title, modeSelect, lobby, select, fight, announce, win
    p1: null,
    p2: null,
    round: 1,
    timer: 99,
    timerInterval: null,
    announceText: '',

    // Character select
    p1Confirmed: false,
    p2Confirmed: false,

    // Online
    isOnline: false,
    lobbyKeyHandler: null,
    remoteCharIndex: 1,
    remoteCharConfirmed: false,

    groundY: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        Input.init();

        this.groundY = this.height - 35 - 32 * 3;

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

        this.scale = Math.max(1, Math.floor(Math.min(w / this.nativeWidth, h / this.nativeHeight)));
        this.width = this.nativeWidth * this.scale;
        this.height = this.nativeHeight * this.scale;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.groundY = this.height - 35 * this.scale / 2 - 32 * 3;

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
            case 'modeSelect':
                this.updateModeSelect();
                break;
            case 'lobby':
                this.updateLobby();
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
            this.state = 'modeSelect';
        }
    },

    updateModeSelect() {
        if (Input.justPressed('Digit1')) {
            // Local mode
            this.isOnline = false;
            this.state = 'select';
            this.p1Confirmed = false;
            this.p2Confirmed = false;
            Screens.selectP1 = 0;
            Screens.selectP2 = 1;
        }
        if (Input.justPressed('Digit2')) {
            // Online mode
            this.isOnline = true;
            this.state = 'lobby';
            Network.status = '';
            Screens.onlineCodeInput = '';
            this._setupLobbyKeyHandler();
        }
        if (Input.justPressed('Escape')) {
            this.state = 'title';
            Screens.titleTimer = 0;
        }
    },

    _setupLobbyKeyHandler() {
        // Remove old handler if any
        if (this.lobbyKeyHandler) {
            window.removeEventListener('keydown', this.lobbyKeyHandler);
        }
        this.lobbyKeyHandler = (e) => {
            if (this.state !== 'lobby' || Network.status !== 'joining') return;
            if (e.key === 'Backspace') {
                Screens.onlineCodeInput = Screens.onlineCodeInput.slice(0, -1);
                e.preventDefault();
            } else if (e.key.length === 1 && /[A-Za-z0-9]/.test(e.key) && Screens.onlineCodeInput.length < 5) {
                Screens.onlineCodeInput += e.key.toUpperCase();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', this.lobbyKeyHandler);
    },

    _removeLobbyKeyHandler() {
        if (this.lobbyKeyHandler) {
            window.removeEventListener('keydown', this.lobbyKeyHandler);
            this.lobbyKeyHandler = null;
        }
    },

    updateLobby() {
        const status = Network.status;

        if (!status) {
            // Lobby menu
            if (Input.justPressed('Digit1')) {
                // Create room
                Network.createRoom((code) => {
                    // Room created, waiting for opponent
                });
                Network.onConnected = () => {
                    // Opponent joined! Go to char select
                    this._removeLobbyKeyHandler();
                    this._goToOnlineSelect();
                };
            }
            if (Input.justPressed('Digit2')) {
                // Join room - switch to code input mode
                Network.status = 'joining';
            }
            if (Input.justPressed('Escape')) {
                this._removeLobbyKeyHandler();
                Network.disconnect();
                this.isOnline = false;
                this.state = 'modeSelect';
            }
        } else if (status === 'waiting') {
            // Waiting for opponent
            if (Input.justPressed('Escape')) {
                this._removeLobbyKeyHandler();
                Network.disconnect();
                this.isOnline = false;
                this.state = 'modeSelect';
            }
        } else if (status === 'joining') {
            // Typing room code
            if (Input.justPressed('Enter') && Screens.onlineCodeInput.length >= 3) {
                Network.joinRoom(Screens.onlineCodeInput, () => {
                    // Connected! Go to char select
                    this._removeLobbyKeyHandler();
                    this._goToOnlineSelect();
                });
            }
            if (Input.justPressed('Escape')) {
                this._removeLobbyKeyHandler();
                Network.disconnect();
                Network.status = '';
                Screens.onlineCodeInput = '';
                this.isOnline = false;
                this.state = 'modeSelect';
            }
        } else if (status === 'connected') {
            // Will transition via callback
        } else if (status === 'error') {
            if (Input.justPressed('Escape')) {
                this._removeLobbyKeyHandler();
                Network.disconnect();
                this.isOnline = false;
                this.state = 'modeSelect';
            }
        }
    },

    _goToOnlineSelect() {
        this.state = 'select';
        this.p1Confirmed = false;
        this.p2Confirmed = false;
        this.remoteCharConfirmed = false;
        Screens.selectP1 = 0;
        Screens.selectP2 = 1;
        this.remoteCharIndex = 1;

        // Setup network callbacks for char select
        Network._onCharSelect = (charIdx) => {
            if (Network.isHost) {
                // Host received guest's char selection
                Screens.selectP2 = charIdx;
                this.remoteCharIndex = charIdx;
            } else {
                // Guest received host's char selection
                Screens.selectP1 = charIdx;
            }
        };

        Network._onStartGame = (data) => {
            // Guest receives start signal from host
            if (!Network.isHost) {
                Screens.selectP1 = Screens.charList.indexOf(data.p1Char);
                Screens.selectP2 = Screens.charList.indexOf(data.p2Char);
                this.p1Confirmed = true;
                this.p2Confirmed = true;
                this._setupOnlineStateReceiver();
                this.startMatch();
            }
        };

        Network._onCharConfirm = () => {
            // Host receives guest's confirmation
            if (Network.isHost) {
                this.remoteCharConfirmed = true;
            }
        };
    },

    updateSelect() {
        if (this.isOnline) {
            this._updateOnlineSelect();
        } else {
            this._updateLocalSelect();
        }
    },

    _updateLocalSelect() {
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

        if (this.p1Confirmed && this.p2Confirmed) {
            this.startMatch();
        }
    },

    _updateOnlineSelect() {
        if (Network.isHost) {
            // Host controls P1 with A/D/F
            if (!this.p1Confirmed) {
                let changed = false;
                if (Input.justPressed('KeyA')) {
                    Screens.selectP1 = (Screens.selectP1 - 1 + Screens.charList.length) % Screens.charList.length;
                    changed = true;
                }
                if (Input.justPressed('KeyD')) {
                    Screens.selectP1 = (Screens.selectP1 + 1) % Screens.charList.length;
                    changed = true;
                }
                if (changed) {
                    Network.sendCharSelect(Screens.selectP1);
                }
                if (Input.justPressed('KeyF')) {
                    this.p1Confirmed = true;
                }
            }

            // P2 confirmed remotely?
            // Guest sends 'charConfirm' - we handle it via a special message
            // For simplicity: host waits for both, then starts game
            if (this.p1Confirmed && this.remoteCharConfirmed) {
                const p1Char = Screens.charList[Screens.selectP1];
                const p2Char = Screens.charList[Screens.selectP2];
                Network.sendStartGame(p1Char, p2Char);
                this._setupOnlineStateReceiver();
                this.startMatch();
            }
        } else {
            // Guest controls P2 with A/D/F (their local P1 keys)
            if (!this.p2Confirmed) {
                let changed = false;
                if (Input.justPressed('KeyA')) {
                    Screens.selectP2 = (Screens.selectP2 - 1 + Screens.charList.length) % Screens.charList.length;
                    changed = true;
                }
                if (Input.justPressed('KeyD')) {
                    Screens.selectP2 = (Screens.selectP2 + 1) % Screens.charList.length;
                    changed = true;
                }
                if (changed) {
                    Network.sendCharSelect(Screens.selectP2);
                }
                if (Input.justPressed('KeyF')) {
                    this.p2Confirmed = true;
                    // Tell host we confirmed
                    if (Network.conn) {
                        Network.conn.send({ type: 'charConfirm' });
                    }
                }
            }
            // Guest waits for startGame signal from host (handled in _onStartGame callback)
        }
    },

    _setupOnlineStateReceiver() {
        // Guest receives full game state from host each frame
        Network._onStateReceived = (state) => {
            if (!this.p1 || !this.p2) return;
            this._applyFighterState(this.p1, state.p1);
            this._applyFighterState(this.p2, state.p2);
            this.timer = state.timer;
            this.round = state.round;

            // Sync game state transitions
            if (state.gameState && state.gameState !== this.state) {
                this.state = state.gameState;
                if (state.gameState === 'announce') {
                    this.announceText = state.announceText || '';
                    Screens.announceTimer = state.announceTimer || 0;
                }
                if (state.gameState === 'win') {
                    this.matchWinner = state.winnerId === 'p1' ? this.p1 : this.p2;
                    Screens.winTimer = 0;
                }
            }
            if (this.state === 'announce') {
                this.announceText = state.announceText || this.announceText;
                Screens.announceTimer = state.announceTimer || Screens.announceTimer;
            }
        };

    },

    _extractFighterState(fighter) {
        return {
            x: fighter.x,
            y: fighter.y,
            hp: fighter.hp,
            maxHp: fighter.maxHp,
            state: fighter.state,
            stateTimer: fighter.stateTimer,
            facingRight: fighter.facingRight,
            charId: fighter.charId,
            wins: fighter.wins,
            superMeter: fighter.superMeter,
            velX: fighter.velX,
            velY: fighter.velY,
            special1Charges: fighter.special1Charges,
            special2Charges: fighter.special2Charges,
            special1Cooldown: fighter.special1Cooldown,
            special2Cooldown: fighter.special2Cooldown,
            projectiles: fighter.projectiles.map(p => ({
                x: p.x, y: p.y, velX: p.velX, velY: p.velY,
                type: p.type, damage: p.damage, life: p.life
            }))
        };
    },

    _applyFighterState(fighter, state) {
        if (!state) return;
        fighter.x = state.x;
        fighter.y = state.y;
        fighter.hp = state.hp;
        fighter.state = state.state;
        fighter.stateTimer = state.stateTimer;
        fighter.facingRight = state.facingRight;
        fighter.wins = state.wins;
        fighter.superMeter = state.superMeter;
        fighter.velX = state.velX;
        fighter.velY = state.velY;
        fighter.special1Charges = state.special1Charges;
        fighter.special2Charges = state.special2Charges;
        fighter.special1Cooldown = state.special1Cooldown;
        fighter.special2Cooldown = state.special2Cooldown;
        if (state.projectiles) {
            fighter.projectiles = state.projectiles;
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
        // Guest doesn't drive announce timing - host sends state
        if (this.isOnline && !Network.isHost) {
            // Guest: send input even during announce (host needs it)
            const localInput = Input.getPlayer1();
            Network.sendInput(localInput);
            return;
        }

        Screens.announceTimer++;
        if (Screens.announceTimer > 60) {
            if (this.announceText.includes('ROUND') || this.announceText === 'FINAL ROUND') {
                this.announceText = 'FIGHT!';
                Screens.announceTimer = 0;
            } else {
                this.state = 'fight';
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

        // Host sends announce state to guest
        if (this.isOnline && Network.isHost) {
            Network.sendGameState({
                p1: this._extractFighterState(this.p1),
                p2: this._extractFighterState(this.p2),
                timer: this.timer,
                round: this.round,
                gameState: this.state,
                announceText: this.announceText,
                announceTimer: Screens.announceTimer
            });
        }
    },

    updateFight() {
        // Online guest: just send input and render received state
        if (this.isOnline && !Network.isHost) {
            const localInput = Input.getPlayer1();
            Network.sendInput(localInput);
            // State is applied via _onStateReceived callback
            // Still update effects locally for visuals
            Effects.update();
            Arena.update();
            return;
        }

        // Effects update (may pause for hit freeze)
        const frozen = Effects.update();
        if (frozen) return;

        Arena.update();

        // Get input
        const p1Input = Input.getPlayer1();
        let p2Input;

        if (this.isOnline && Network.isHost) {
            // Host: P2 input comes from network
            p2Input = Network.getRemoteInput();
        } else {
            p2Input = Input.getPlayer2();
        }

        // Update fighters
        this.p1.update(p1Input, this.p2, this.width);
        this.p2.update(p2Input, this.p1, this.width);

        // Check hitbox collisions
        this.p1.checkHitBoxCollision(this.p2);
        this.p2.checkHitBoxCollision(this.p1);

        // Flag swing visual
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

        // Push apart
        this.pushApart();

        // Check KO
        if (this.p1.state === 'ko' || this.p2.state === 'ko') {
            this.endRound();
        }

        // Host sends game state to guest
        if (this.isOnline && Network.isHost) {
            Network.sendGameState({
                p1: this._extractFighterState(this.p1),
                p2: this._extractFighterState(this.p2),
                timer: this.timer,
                round: this.round,
                gameState: this.state
            });
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

        let roundWinner;
        if (this.p1.hp <= 0) {
            roundWinner = this.p2;
        } else if (this.p2.hp <= 0) {
            roundWinner = this.p1;
        } else {
            roundWinner = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
        }

        roundWinner.wins++;

        if (roundWinner.wins >= 2) {
            this.state = 'win';
            this.matchWinner = roundWinner;
            Screens.winTimer = 0;

            // Host tells guest about win
            if (this.isOnline && Network.isHost) {
                Network.sendGameState({
                    p1: this._extractFighterState(this.p1),
                    p2: this._extractFighterState(this.p2),
                    timer: this.timer,
                    round: this.round,
                    gameState: 'win',
                    winnerId: roundWinner === this.p1 ? 'p1' : 'p2'
                });
            }
        } else {
            this.round++;
            setTimeout(() => this.startRound(), 1500);
        }
    },

    updateWin() {
        // Guest sends input during win too
        if (this.isOnline && !Network.isHost) {
            return; // Guest waits for host to restart
        }

        if (Input.justPressed('Enter') || Input.justPressed('Space')) {
            if (this.isOnline) {
                Network.disconnect();
                this.isOnline = false;
            }
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

            case 'modeSelect':
                Screens.drawModeSelect(ctx, this.width, this.height);
                break;

            case 'lobby':
                Screens.drawLobby(ctx, this.width, this.height);
                break;

            case 'select':
                Screens.drawCharSelect(ctx, this.width, this.height);
                break;

            case 'announce':
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
        const shake = Effects.getShakeOffset();
        ctx.save();
        ctx.translate(Math.round(shake.x), Math.round(shake.y));

        Arena.draw(ctx);

        if (this.p1) this.p1.draw(ctx);
        if (this.p2) this.p2.draw(ctx);

        Effects.draw(ctx, this.width, this.height);

        ctx.restore();

        if (this.p1 && this.p2) {
            UI.drawHUD(ctx, this.p1, this.p2, this.timer, this.round, this.width);
        }
    }
};

// Start game when page loads
window.addEventListener('load', () => Game.init());
