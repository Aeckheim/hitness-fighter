// Title screen, character select, round announcements, win screen
const Screens = {
    titleTimer: 0,
    selectP1: 0,
    selectP2: 1,
    charList: ['rusty_crusty', 'zyo', 'lord_michlok'],
    announceTimer: 0,
    announceText: '',
    winTimer: 0,

    drawTitle(ctx, w, h) {
        this.titleTimer++;

        // Background
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, w, h);

        // Scanlines
        for (let y = 0; y < h; y += 3) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, y, w, 1);
        }

        // Title glow
        const pulse = Math.sin(this.titleTimer * 0.03) * 0.3 + 0.7;
        const grd = ctx.createRadialGradient(w / 2, h * 0.3, 10, w / 2, h * 0.3, 200);
        grd.addColorStop(0, `rgba(200, 50, 50, ${pulse * 0.15})`);
        grd.addColorStop(1, 'rgba(200, 50, 50, 0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);

        // Title text
        ctx.textAlign = 'center';

        // Shadow
        ctx.fillStyle = '#330000';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('HITNESS CLUB', w / 2 + 2, h * 0.25 + 2);
        ctx.font = 'bold 36px monospace';
        ctx.fillText('FIGHTER', w / 2 + 2, h * 0.38 + 2);

        // Main text
        ctx.fillStyle = `rgba(255, ${100 + pulse * 100}, 50, ${pulse})`;
        ctx.font = 'bold 28px monospace';
        ctx.fillText('HITNESS CLUB', w / 2, h * 0.25);

        ctx.fillStyle = `rgba(255, ${150 + pulse * 100}, 0, 1)`;
        ctx.font = 'bold 36px monospace';
        ctx.fillText('FIGHTER', w / 2, h * 0.38);

        // Subtitle
        ctx.fillStyle = '#667788';
        ctx.font = '10px monospace';
        ctx.fillText('- Where Fitness Meets Fists -', w / 2, h * 0.45);

        // VS silhouettes
        // Rusty & Crusty silhouette (left)
        ctx.fillStyle = 'rgba(100, 50, 50, 0.3)';
        ctx.fillRect(w * 0.15, h * 0.5, 60, 80);
        ctx.fillRect(w * 0.15 + 10, h * 0.5 - 15, 15, 18);
        ctx.fillRect(w * 0.15 + 35, h * 0.5 - 15, 15, 18);

        // Zyo silhouette (right)
        ctx.fillStyle = 'rgba(50, 50, 100, 0.3)';
        ctx.fillRect(w * 0.7, h * 0.52, 40, 75);
        ctx.fillRect(w * 0.7 + 8, h * 0.52 - 18, 24, 20);

        // Lord Michlok silhouette (center back, menacing)
        ctx.fillStyle = 'rgba(30, 30, 80, 0.25)';
        ctx.fillRect(w * 0.44, h * 0.48, 45, 85);
        ctx.fillRect(w * 0.44 + 10, h * 0.48 - 20, 25, 22);
        // Crown
        ctx.fillStyle = 'rgba(100, 50, 150, 0.2)';
        ctx.fillRect(w * 0.44 + 8, h * 0.48 - 25, 29, 8);

        // VS
        ctx.fillStyle = '#cc4444';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('VS', w / 2, h * 0.65);

        // Press Start blink
        if (Math.sin(this.titleTimer * 0.06) > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('PRESS ENTER TO START', w / 2, h * 0.85);
        }

        // Controls info
        ctx.fillStyle = '#445566';
        ctx.font = '8px monospace';
        ctx.fillText('P1: WASD + F/G/R/T    P2: ARROWS + NUM 1/2/4/5', w / 2, h * 0.93);
    },

    drawCharSelect(ctx, w, h) {
        ctx.fillStyle = '#0a0a18';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ccccff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('SELECT YOUR FIGHTER', w / 2, 30);

        const charNames = this.charList.map(id => CHARACTER_DATA[id].name);
        const boxW = 120;
        const boxH = 140;
        const gap = 30;
        const totalW = this.charList.length * boxW + (this.charList.length - 1) * gap;
        const startX = (w - totalW) / 2;

        for (let i = 0; i < this.charList.length; i++) {
            const x = startX + i * (boxW + gap);
            const y = 50;
            const charId = this.charList[i];
            const data = CHARACTER_DATA[charId];

            // Box
            const isP1 = this.selectP1 === i;
            const isP2 = this.selectP2 === i;
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(x, y, boxW, boxH);

            // Selection border
            if (isP1 && isP2) {
                ctx.strokeStyle = '#ff88ff';
                ctx.lineWidth = 3;
            } else if (isP1) {
                ctx.strokeStyle = '#4488ff';
                ctx.lineWidth = 3;
            } else if (isP2) {
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#333344';
                ctx.lineWidth = 1;
            }
            ctx.strokeRect(x, y, boxW, boxH);

            // Draw character sprite preview
            const sprite = data.sprites.idle[0];
            const previewScale = 2;
            const sx = x + (boxW - data.spriteWidth * previewScale) / 2;
            const sy = y + 10;
            drawSprite(ctx, sprite, sx, sy, previewScale, false);

            // Name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(data.name, x + boxW / 2, y + boxH - 20);

            // P1/P2 labels
            if (isP1) {
                ctx.fillStyle = '#4488ff';
                ctx.font = 'bold 10px monospace';
                ctx.fillText('P1', x + 15, y + boxH - 5);
            }
            if (isP2) {
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 10px monospace';
                ctx.fillText('P2', x + boxW - 15, y + boxH - 5);
            }
        }

        // Instructions
        ctx.fillStyle = '#556677';
        ctx.font = '8px monospace';
        ctx.fillText('P1: A/D to select, F to confirm    P2: LEFT/RIGHT to select, NUM1 to confirm', w / 2, h - 20);

        // Ready indicators
        ctx.fillStyle = '#667788';
        ctx.font = '10px monospace';
    },

    drawAnnouncement(ctx, w, h, text) {
        this.announceTimer++;
        const alpha = this.announceTimer < 15 ? this.announceTimer / 15 :
                      this.announceTimer > 45 ? Math.max(0, 1 - (this.announceTimer - 45) / 15) : 1;

        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.fillRect(0, h * 0.35, w, h * 0.3);

        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255, 220, 50, ${alpha})`;
        ctx.font = 'bold 28px monospace';
        ctx.fillText(text, w / 2, h * 0.52);
    },

    drawWinScreen(ctx, w, h, winner) {
        this.winTimer++;

        // Darken
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(this.winTimer / 30, 0.7)})`;
        ctx.fillRect(0, 0, w, h);

        if (this.winTimer > 20) {
            ctx.textAlign = 'center';

            // Winner name
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 24px monospace';
            ctx.fillText(winner.name, w / 2, h * 0.35);

            // WINS
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px monospace';
            ctx.fillText('WINS!', w / 2, h * 0.50);

            // Draw winner sprite
            const data = CHARACTER_DATA[winner.charId];
            const sprite = data.sprites.idle[0];
            const previewScale = 4;
            drawSprite(ctx, sprite, w / 2 - data.spriteWidth * previewScale / 2, h * 0.55, previewScale, false);

            if (this.winTimer > 60 && Math.sin(this.winTimer * 0.06) > 0) {
                ctx.fillStyle = '#aaaacc';
                ctx.font = '12px monospace';
                ctx.fillText('PRESS ENTER FOR REMATCH', w / 2, h * 0.92);
            }
        }
    }
};
