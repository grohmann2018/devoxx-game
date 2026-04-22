import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

const TILE_SIZE = 18;
const MAP_COLS = 57;
const MAP_ROWS = 43;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;   // 1026 px
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;  // 774 px

// Level data: [row, colStart, colEnd] — row 0 is top, row MAP_ROWS-1 is bottom
// Ground has two pits so the player must use platforms to cross.
const LEVEL_TILES: Array<[number, number, number]> = [
    // Ground sections (row 42 = bottom)
    [42, 0,  15],   // left ground
    [42, 22, 38],   // middle ground
    [42, 45, 56],   // right ground

    // Low platforms (bridge over pits)
    [35, 13, 18],   // over first pit
    [35, 36, 41],   // over second pit

    // Higher platforms (optional path upward)
    [28, 20, 26],
    [21, 10, 15],
    [21, 40, 46],
];

// Frame 1 from tilemap_packed.png — the centre-top grass tile
const TILE_FRAME = 1;

export class Game extends Scene
{
    private player!: Phaser.Physics.Arcade.Sprite;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Extend world bounds downward so the player can fall into pits
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT + 300);

        // Sky background
        this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT + 300, 0x87ceeb);

        // Build platforms from the level data
        this.platforms = this.physics.add.staticGroup();
        for (const [row, colStart, colEnd] of LEVEL_TILES)
        {
            for (let col = colStart; col <= colEnd; col++)
            {
                const x = col * TILE_SIZE + TILE_SIZE / 2;
                const y = row * TILE_SIZE + TILE_SIZE / 2;
                this.platforms.create(x, y, 'tiles', TILE_FRAME);
            }
        }

        // Player — spawn above the left ground section
        this.player = this.physics.add.sprite(50, WORLD_HEIGHT - 120, 'player', 0);
        (this.player.body as Phaser.Physics.Arcade.Body).setMaxVelocityY(800);

        this.physics.add.collider(this.player, this.platforms);

        // Camera follows the player within the world
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // HUD text (fixed to camera)
        this.add.text(16, 16, '← → to move   ↑ / SPACE to jump', {
            fontSize: '14px',
            color: '#000000',
            backgroundColor: '#ffffffaa',
            padding: { x: 6, y: 4 }
        }).setScrollFactor(0).setDepth(100);

        this.cursors = this.input.keyboard!.createCursorKeys();

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        if (this.cursors.left.isDown)
        {
            body.setVelocityX(-200);
            this.player.setFlipX(true);
        }
        else if (this.cursors.right.isDown)
        {
            body.setVelocityX(200);
            this.player.setFlipX(false);
        }
        else
        {
            body.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.cursors.space.isDown) && body.blocked.down)
        {
            body.setVelocityY(-550);
        }

        // Fell into a pit → Game Over
        if (this.player.y > WORLD_HEIGHT + 100)
        {
            this.scene.start('GameOver');
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
