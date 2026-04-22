import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x0d1117);

        // Bug emoji big
        this.add.text(width / 2, height / 2 - 110, '🐛', {
            fontSize: '60px'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 45, 'A Bug Got You!', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#DD3333',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 20, 'NullPointerException: player hit bug', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#666666'
        }).setOrigin(0.5);

        const retry = this.add.text(width / 2, height / 2 + 70, 'Press R to try again', {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: '#F4831F'
        }).setOrigin(0.5);

        this.tweens.add({ targets: retry, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

        this.input.keyboard!.once('keydown-R', () => {
            this.scene.start('Game');
        });

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
