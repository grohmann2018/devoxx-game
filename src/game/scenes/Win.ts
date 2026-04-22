import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Win extends Scene
{
    constructor ()
    {
        super('Win');
    }

    create (data: { coffees?: number } = {})
    {
        const { width, height } = this.scale;
        const coffees = data.coffees ?? 0;

        this.add.rectangle(width / 2, height / 2, width, height, 0x0d1117);

        // Gold star banner
        this.add.text(width / 2, height / 2 - 100, '⭐ YOU MADE IT! ⭐', {
            fontSize: '40px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 40, 'You reached the Keynote Stage!', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 20, `☕  ${coffees} / 8 coffees collected`, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#F4831F'
        }).setOrigin(0.5);

        const replay = this.add.text(width / 2, height / 2 + 80, 'Press SPACE to play again', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        this.tweens.add({ targets: replay, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

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
