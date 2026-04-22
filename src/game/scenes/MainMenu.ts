import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

        this.add.text(width / 2, height / 2 - 60, 'DEVOXX PLATFORMER', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const hint = this.add.text(width / 2, height / 2 + 20, 'Press SPACE to play', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Blink the hint text
        this.tweens.add({
            targets: hint,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.input.keyboard!.once('keydown-SPACE', () => {
            this.scene.start('Game');
        });

        EventBus.emit('current-scene-ready', this);
    }

    // Satisfy the IRefPhaserGame interface used in PhaserGame.tsx
    changeScene ()
    {
        this.scene.start('Game');
    }
}
