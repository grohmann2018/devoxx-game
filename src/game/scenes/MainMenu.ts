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

        // Dark auditorium background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0d1117);

        // Orange accent bar at top
        this.add.rectangle(width / 2, 6, width, 12, 0xF4831F);

        // DEVOXX title
        this.add.text(width / 2, height / 2 - 90, 'DEVOXX', {
            fontSize: '72px',
            fontFamily: 'Arial Black',
            color: '#F4831F',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 - 20, 'CONFERENCE RUN', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            letterSpacing: 6
        }).setOrigin(0.5);

        // Tagline
        this.add.text(width / 2, height / 2 + 30, 'Collect ☕  coffees · Dodge 🐛  bugs · Reach the Keynote!', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Press SPACE prompt (blinking)
        const hint = this.add.text(width / 2, height / 2 + 90, 'Press SPACE to run', {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: '#F4831F'
        }).setOrigin(0.5);

        this.tweens.add({ targets: hint, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

        // Orange accent bar at bottom
        this.add.rectangle(width / 2, height - 6, width, 12, 0xF4831F);

        this.input.keyboard!.once('keydown-SPACE', () => {
            this.scene.start('Game');
        });

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
