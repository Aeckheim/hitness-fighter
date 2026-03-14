// HUD and UI rendering
const UI = {
    // Pixel font characters (5x5 grid each)
    fontChars: null,

    drawText(ctx, text, x, y, size, color) {
        ctx.fillStyle = color || '#ffffff';
        ctx.font = `bold ${size}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
    },

    drawTextLeft(ctx, text, x, y, size, color) {
        ctx.fillStyle = color || '#ffffff';
        ctx.font = `bold ${size}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(text, x, y);
    },

    drawHPBar(ctx, x, y, w, h, hp, maxHp, flipped, color) {
        // Background
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = '#333340';
        ctx.fillRect(x, y, w, h);

        // HP fill
        const ratio = Math.max(0, hp / maxHp);
        const fillW = w * ratio;

        // Color gradient based on HP
        let hpColor;
        if (ratio > 0.5) {
            hpColor = '#44cc44';
        } else if (ratio > 0.25) {
            hpColor = '#cccc22';
        } else {
            hpColor = '#cc2222';
        }

        if (flipped) {
            ctx.fillStyle = hpColor;
            ctx.fillRect(x + w - fillW, y, fillW, h);
        } else {
            ctx.fillStyle = hpColor;
            ctx.fillRect(x, y, fillW, h);
        }

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        if (flipped) {
            ctx.fillRect(x + w - fillW, y, fillW, h / 3);
        } else {
            ctx.fillRect(x, y, fillW, h / 3);
        }

        // Border
        ctx.strokeStyle = '#aaaacc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    },

    drawSuperMeter(ctx, x, y, w, h, meter, maxMeter, color) {
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(x, y, w, h);

        const ratio = meter / maxMeter;
        ctx.fillStyle = ratio >= 1 ? '#ffaa00' : '#4466cc';
        ctx.fillRect(x + 1, y + 1, (w - 2) * ratio, h - 2);

        if (ratio >= 1) {
            // Pulsing glow when full
            const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 200, 50, ${pulse * 0.3})`;
            ctx.fillRect(x, y, w, h);
        }

        ctx.strokeStyle = '#666688';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    },

    drawHUD(ctx, p1, p2, timer, round, canvasWidth) {
        const barW = canvasWidth * 0.35;
        const barH = 14;
        const barY = 15;
        const margin = 15;

        // P1 HP (left, fills from left)
        this.drawHPBar(ctx, margin, barY, barW, barH, p1.hp, p1.maxHp, false, p1.color);
        // P2 HP (right, fills from right)
        this.drawHPBar(ctx, canvasWidth - margin - barW, barY, barW, barH, p2.hp, p2.maxHp, true, p2.color);

        // Super meters
        const superW = barW * 0.6;
        const superH = 6;
        this.drawSuperMeter(ctx, margin, barY + barH + 4, superW, superH, p1.superMeter, p1.maxSuper);
        this.drawSuperMeter(ctx, canvasWidth - margin - superW, barY + barH + 4, superW, superH, p2.superMeter, p2.maxSuper);

        // Names
        this.drawTextLeft(ctx, p1.name, margin, barY - 3, 10, '#ffffff');
        ctx.textAlign = 'right';
        ctx.fillText(p2.name, canvasWidth - margin, barY - 3);

        // Timer
        this.drawText(ctx, String(Math.ceil(timer)).padStart(2, '0'), canvasWidth / 2, barY + 12, 18, '#ffcc00');

        // Round indicator
        this.drawText(ctx, `ROUND ${round}`, canvasWidth / 2, barY + 28, 8, '#aaaacc');

        // Win indicators (dots)
        for (let i = 0; i < p1.wins; i++) {
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(margin + i * 10, barY + barH + 14, 6, 6);
        }
        for (let i = 0; i < p2.wins; i++) {
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(canvasWidth - margin - 6 - i * 10, barY + barH + 14, 6, 6);
        }

        // Combo counter
        if (p1.comboCount > 1) {
            const alpha = Math.min(p1.comboTimer / 30, 1);
            this.drawText(ctx, `${p1.comboCount} HIT COMBO!`, canvasWidth * 0.25, canvasWidth > 600 ? 80 : 60, 10, `rgba(255, 200, 50, ${alpha})`);
        }
        if (p2.comboCount > 1) {
            const alpha = Math.min(p2.comboTimer / 30, 1);
            this.drawText(ctx, `${p2.comboCount} HIT COMBO!`, canvasWidth * 0.75, canvasWidth > 600 ? 80 : 60, 10, `rgba(255, 200, 50, ${alpha})`);
        }

        // Super ready flash
        if (p1.superMeter >= p1.maxSuper) {
            const pulse = Math.sin(Date.now() * 0.006) > 0;
            if (pulse) this.drawTextLeft(ctx, 'SUPER READY!', margin, barY + barH + 28, 7, '#ffaa00');
        }
        if (p2.superMeter >= p2.maxSuper) {
            const pulse = Math.sin(Date.now() * 0.006) > 0;
            if (pulse) {
                ctx.textAlign = 'right';
                ctx.fillStyle = '#ffaa00';
                ctx.font = 'bold 7px monospace';
                ctx.fillText('SUPER READY!', canvasWidth - margin, barY + barH + 28);
            }
        }
    }
};
