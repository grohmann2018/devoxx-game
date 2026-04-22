import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.add.image(512, 384, 'background');

        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload ()
    {
        this.load.setPath('assets');

        // Kenney Pixel Platformer (CC0) — tilemap_packed: 18×18 tiles, characters_packed: 24×24 frames
        this.load.spritesheet('tiles', 'tilemap_packed.png', {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.spritesheet('player', 'tilemap-characters_packed.png', {
            frameWidth: 24,
            frameHeight: 24
        });
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
