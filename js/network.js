// Network module for online multiplayer using PeerJS
// Host model: P1 hosts and runs game simulation, P2 sends inputs
const Network = {
    peer: null,
    conn: null,
    isHost: false,
    isOnline: false,
    connected: false,
    roomCode: '',
    remoteInput: { left: false, right: false, up: false, down: false, punch: false, kick: false, special1: false, special2: false, superAtk: false },
    status: '', // 'creating', 'waiting', 'joining', 'connected', 'error'
    errorMsg: '',
    onConnected: null,
    onDisconnected: null,
    _onCharSelect: null,
    _onStartGame: null,
    _onCharConfirm: null,
    _onStateReceived: null,

    // Generate a short random room code
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    },

    // Host: create a room and wait for opponent
    createRoom(callback) {
        this.isHost = true;
        this.isOnline = true;
        this.status = 'creating';
        this.roomCode = this.generateCode();

        this.peer = new Peer('hitness-' + this.roomCode, {
            debug: 0
        });

        this.peer.on('open', (id) => {
            this.status = 'waiting';
            if (callback) callback(this.roomCode);
        });

        this.peer.on('connection', (conn) => {
            this.conn = conn;
            this._setupConnection();
        });

        this.peer.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                // Code already taken, try another
                this.peer.destroy();
                this.roomCode = this.generateCode();
                this.peer = new Peer('hitness-' + this.roomCode, { debug: 0 });
                this.peer.on('open', () => {
                    this.status = 'waiting';
                    if (callback) callback(this.roomCode);
                });
                this.peer.on('connection', (conn) => {
                    this.conn = conn;
                    this._setupConnection();
                });
                this.peer.on('error', (e) => {
                    this.status = 'error';
                    this.errorMsg = e.type;
                });
            } else {
                this.status = 'error';
                this.errorMsg = err.type;
            }
        });
    },

    // Guest: join an existing room
    joinRoom(code, callback) {
        this.isHost = false;
        this.isOnline = true;
        this.status = 'joining';
        this.roomCode = code.toUpperCase();

        this.peer = new Peer(null, { debug: 0 });

        this.peer.on('open', () => {
            this.conn = this.peer.connect('hitness-' + this.roomCode, { reliable: true });
            this.conn.on('open', () => {
                this._setupConnection();
                if (callback) callback();
            });
            this.conn.on('error', () => {
                this.status = 'error';
                this.errorMsg = 'connection-failed';
            });
        });

        this.peer.on('error', (err) => {
            this.status = 'error';
            this.errorMsg = err.type === 'peer-unavailable' ? 'Raum nicht gefunden' : err.type;
        });
    },

    _setupConnection() {
        this.connected = true;
        this.status = 'connected';

        this.conn.on('data', (data) => {
            if (data.type === 'input') {
                this.remoteInput = data.input;
            } else if (data.type === 'state') {
                // Guest receives game state from host
                if (!this.isHost && this._onStateReceived) {
                    this._onStateReceived(data.state);
                }
            } else if (data.type === 'charSelect') {
                if (this._onCharSelect) this._onCharSelect(data.charId);
            } else if (data.type === 'startGame') {
                if (this._onStartGame) this._onStartGame(data);
            } else if (data.type === 'charConfirm') {
                if (this._onCharConfirm) this._onCharConfirm();
            }
        });

        this.conn.on('close', () => {
            this.connected = false;
            this.status = 'error';
            this.errorMsg = 'Verbindung getrennt';
            if (this.onDisconnected) this.onDisconnected();
        });

        if (this.onConnected) this.onConnected();
    },

    // Send local input to remote player
    sendInput(input) {
        if (!this.connected || !this.conn) return;
        this.conn.send({
            type: 'input',
            input: {
                left: input.left,
                right: input.right,
                up: input.up,
                down: input.down,
                punch: input.punch,
                kick: input.kick,
                special1: input.special1,
                special2: input.special2,
                superAtk: input.superAtk
            }
        });
    },

    // Host sends compact game state to guest for rendering
    sendGameState(state) {
        if (!this.connected || !this.conn || !this.isHost) return;
        this.conn.send({ type: 'state', state });
    },

    // Send character selection
    sendCharSelect(charId) {
        if (!this.connected || !this.conn) return;
        this.conn.send({ type: 'charSelect', charId });
    },

    // Host sends start game signal
    sendStartGame(p1Char, p2Char) {
        if (!this.connected || !this.conn) return;
        this.conn.send({ type: 'startGame', p1Char, p2Char });
    },

    // Get remote player's input (for host to use as P2 input)
    getRemoteInput() {
        return this.remoteInput;
    },

    // Disconnect and cleanup
    disconnect() {
        if (this.conn) this.conn.close();
        if (this.peer) this.peer.destroy();
        this.peer = null;
        this.conn = null;
        this.isHost = false;
        this.isOnline = false;
        this.connected = false;
        this.status = '';
        this.roomCode = '';
        this.remoteInput = { left: false, right: false, up: false, down: false, punch: false, kick: false, special1: false, special2: false, superAtk: false };
        this._onCharSelect = null;
        this._onStartGame = null;
        this._onCharConfirm = null;
        this._onStateReceived = null;
    }
};
