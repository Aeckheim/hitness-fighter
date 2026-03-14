// Input handler for 2 local players
const Input = {
    keys: {},
    prevKeys: {},

    init() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    },

    update() {
        this.prevKeys = { ...this.keys };
    },

    isDown(code) {
        return !!this.keys[code];
    },

    justPressed(code) {
        return !!this.keys[code] && !this.prevKeys[code];
    },

    // Player 1: WASD + F/G/R/T
    getPlayer1() {
        return {
            left: this.isDown('KeyA'),
            right: this.isDown('KeyD'),
            up: this.justPressed('KeyW'),
            down: this.isDown('KeyS'),
            punch: this.justPressed('KeyF'),
            kick: this.justPressed('KeyG'),
            special1: this.justPressed('KeyR'),
            special2: this.justPressed('KeyT'),
            superAtk: this.isDown('KeyR') && this.isDown('KeyT') && (this.justPressed('KeyR') || this.justPressed('KeyT'))
        };
    },

    // Player 2: Arrows + Numpad 1/2/4/5
    getPlayer2() {
        return {
            left: this.isDown('ArrowLeft'),
            right: this.isDown('ArrowRight'),
            up: this.justPressed('ArrowUp'),
            down: this.isDown('ArrowDown'),
            punch: this.justPressed('Numpad1'),
            kick: this.justPressed('Numpad2'),
            special1: this.justPressed('Numpad4'),
            special2: this.justPressed('Numpad5'),
            superAtk: this.isDown('Numpad4') && this.isDown('Numpad5') && (this.justPressed('Numpad4') || this.justPressed('Numpad5'))
        };
    }
};
