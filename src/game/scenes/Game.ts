import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

const TILE_SIZE = 18;
const MAP_COLS = 57;
const MAP_ROWS = 43;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;    // 1026 px
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;   // 774 px

// ── Level tile data: [row, colStart, colEnd] ──────────────────────────────────
const LEVEL_TILES: Array<[number, number, number]> = [
    // Ground — 3 sections with 2 pits (Registration, Exhibition, Keynote zones)
    [42, 0,  14],   // Registration floor
    [42, 22, 35],   // Exhibition floor
    [42, 45, 56],   // Keynote floor

    // Low bridges over the pits
    [35, 13, 19],   // Bridge over pit 1
    [35, 34, 41],   // Bridge over pit 2

    // Mid-height stages
    [28, 20, 26],   // Exhibition Stage A
    [28, 37, 44],   // Right Dev Stage  (7 rows above Bridge 2, links to Dev Track C)

    // High stages
    [21, 10, 16],   // Speaker Track B
    [21, 42, 48],   // Dev Track C      (shifted right 2 cols for clean jump to Keynote)

    // Keynote Stage — the goal (far right, highest)
    [14, 50, 56],
];

// Tiles using the orange Devoxx color (everything except ground)
const ORANGE_TILE_ROWS = new Set([35, 28, 21]);
const GOLD_TILE_ROWS   = new Set([14]);

// ── Coffee positions: [col, row] (world tile coords) ─────────────────────────
const COFFEE_POSITIONS: Array<[number, number]> = [
    [5,  41],   // Registration floor
    [10, 41],   // Registration floor
    [15, 34],   // Bridge 1
    [37, 34],   // Bridge 2
    [23, 27],   // Exhibition Stage A
    [12, 20],   // Speaker Track B
    [42, 20],   // Dev Track C
    [53, 13],   // Keynote Stage
];

// ── Bug patrol data: [startCol, row, patrolHalfWidth] ────────────────────────
const BUG_PATROLS: Array<[number, number, number]> = [
    [25, 42, 5],   // Exhibition floor centre
    [22, 28, 3],   // Exhibition Stage A  (was row 27 — one tile too high)
    [48, 42, 4],   // Keynote floor
];

export class Game extends Scene
{
    private player!: Phaser.Physics.Arcade.Sprite;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private coffees!: Phaser.Physics.Arcade.StaticGroup;
    private bugs!: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private scoreText!: Phaser.GameObjects.Text;
    private score = 0;
    private dead = false;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.score = 0;
        this.dead  = false;

        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT + 300);

        // ── Background ────────────────────────────────────────────────────────
        this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
            WORLD_WIDTH, WORLD_HEIGHT + 300, 0x0d1117);

        this.buildSlides();

        // ── Generate procedural textures ──────────────────────────────────────
        this.makeCoffeeTexture();
        this.makeBugTexture();

        // ── Platforms ─────────────────────────────────────────────────────────
        this.platforms = this.physics.add.staticGroup();
        for (const [row, colStart, colEnd] of LEVEL_TILES)
        {
            for (let col = colStart; col <= colEnd; col++)
            {
                const x = col * TILE_SIZE + TILE_SIZE / 2;
                const y = row * TILE_SIZE + TILE_SIZE / 2;
                const tile = this.platforms.create(x, y, 'tiles', 1) as Phaser.Physics.Arcade.Sprite;

                if (GOLD_TILE_ROWS.has(row))
                    tile.setTint(0xFFD700);
                else if (ORANGE_TILE_ROWS.has(row))
                    tile.setTint(0xF4831F);
                else
                    tile.setTint(0x334455);
            }
        }

        // ── Keynote sign ──────────────────────────────────────────────────────
        const signX = 53 * TILE_SIZE + TILE_SIZE / 2;
        const signY = 14 * TILE_SIZE - 18;
        this.add.text(signX, signY, '★  KEYNOTE  ★', {
            fontSize: '10px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 1);

        // ── Coffee collectibles ───────────────────────────────────────────────
        this.coffees = this.physics.add.staticGroup();
        for (const [col, row] of COFFEE_POSITIONS)
        {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE - 10;
            const c = this.coffees.create(x, y, 'coffee') as Phaser.Physics.Arcade.Sprite;
            // Gentle bobbing
            this.tweens.add({
                targets: c,
                y: y - 4,
                duration: 800 + Math.random() * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // ── Bug enemies ───────────────────────────────────────────────────────
        this.bugs = this.physics.add.group();
        for (const [startCol, row, half] of BUG_PATROLS)
        {
            const x = startCol * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE - 8;
            const bug = this.bugs.create(x, y, 'bug') as Phaser.Physics.Arcade.Sprite;
            const body = bug.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setVelocityX(60);
            body.setImmovable(false);
            // Store patrol bounds as custom data
            bug.setData('minX', (startCol - half) * TILE_SIZE);
            bug.setData('maxX', (startCol + half) * TILE_SIZE);
        }

        // ── Player ────────────────────────────────────────────────────────────
        this.player = this.physics.add.sprite(
            3 * TILE_SIZE, (42 - 3) * TILE_SIZE, 'player', 0
        );
        (this.player.body as Phaser.Physics.Arcade.Body).setMaxVelocityY(900);

        this.physics.add.collider(this.player, this.platforms);

        // Coffee overlap
        this.physics.add.overlap(
            this.player, this.coffees,
            (_p, coffee) => this.collectCoffee(coffee as Phaser.Physics.Arcade.Sprite),
            undefined, this
        );

        // Bug overlap
        this.physics.add.overlap(
            this.player, this.bugs,
            () => this.hitBug(),
            undefined, this
        );

        // ── Win zone ──────────────────────────────────────────────────────────
        const winZone = this.add.zone(
            53 * TILE_SIZE, (14 - 1) * TILE_SIZE,
            6 * TILE_SIZE, 2 * TILE_SIZE
        );
        this.physics.add.existing(winZone, true);
        this.physics.add.overlap(this.player, winZone, () => this.reachKeynote(), undefined, this);

        // ── Camera ────────────────────────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setZoom(1.78);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // ── HUD ───────────────────────────────────────────────────────────────
        this.add.text(10, 10, '← → move   ↑ / SPACE jump', {
            fontSize: '11px', color: '#aaaaaa',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setScrollFactor(0).setDepth(100);

        this.scoreText = this.add.text(10, 32, '☕  0 / 8', {
            fontSize: '14px',
            fontFamily: 'Arial Black',
            color: '#F4831F',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setScrollFactor(0).setDepth(100);

        // Devoxx banner (fixed)
        this.add.text(1014, 10, 'DEVOXX', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#F4831F',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(100).setOrigin(1, 0);

        this.cursors = this.input.keyboard!.createCursorKeys();

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        if (this.dead) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;

        if (this.cursors.left.isDown)
        {
            body.setVelocityX(-160);
            this.player.setFlipX(true);
        }
        else if (this.cursors.right.isDown)
        {
            body.setVelocityX(160);
            this.player.setFlipX(false);
        }
        else
        {
            body.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.cursors.space.isDown) && body.blocked.down)
        {
            body.setVelocityY(-480);
        }

        // Bug patrol direction flip
        this.bugs.getChildren().forEach(obj => {
            const bug  = obj as Phaser.Physics.Arcade.Sprite;
            const bugBody = bug.body as Phaser.Physics.Arcade.Body;
            const minX = bug.getData('minX') as number;
            const maxX = bug.getData('maxX') as number;
            if (bug.x <= minX) { bugBody.setVelocityX(60);  bug.setFlipX(false); }
            if (bug.x >= maxX) { bugBody.setVelocityX(-60); bug.setFlipX(true);  }
        });

        // Fell into pit
        if (this.player.y > WORLD_HEIGHT + 100)
        {
            this.scene.start('GameOver');
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private collectCoffee (coffee: Phaser.Physics.Arcade.Sprite)
    {
        this.tweens.killTweensOf(coffee);
        this.tweens.add({
            targets: coffee,
            scaleX: 2, scaleY: 2, alpha: 0,
            duration: 200,
            onComplete: () => coffee.destroy()
        });
        this.score++;
        this.scoreText.setText(`☕  ${this.score} / 8`);
    }

    private hitBug ()
    {
        if (this.dead) return;
        this.dead = true;
        this.cameras.main.shake(300, 0.02);
        this.time.delayedCall(400, () => this.scene.start('GameOver'));
    }

    private reachKeynote ()
    {
        if (this.dead) return;
        this.dead = true;
        this.cameras.main.flash(500, 255, 215, 0);
        this.time.delayedCall(600, () =>
            this.scene.start('Win', { coffees: this.score })
        );
    }

    /** Decorative conference slide panels in the background */
    private buildSlides ()
    {
        const slides: Array<[number, number, string, number]> = [
            [3 * TILE_SIZE,  26 * TILE_SIZE, 'Java 21\nVirtual Threads', 0x1a3a5c],
            [22 * TILE_SIZE, 18 * TILE_SIZE, 'Cloud Native\nKubernetes', 0x1a3a2c],
            [42 * TILE_SIZE, 18 * TILE_SIZE, 'AI / ML\nwith Java', 0x2c1a3a],
        ];

        for (const [x, y, label, bg] of slides)
        {
            const w = 7 * TILE_SIZE;
            const h = 5 * TILE_SIZE;
            const panel = this.add.graphics();
            panel.fillStyle(bg, 0.85);
            panel.fillRect(x, y, w, h);
            panel.lineStyle(2, 0xF4831F, 0.6);
            panel.strokeRect(x, y, w, h);

            this.add.text(x + w / 2, y + h / 2, label, {
                fontSize: '9px',
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
        }
    }

    /** Brown coffee cup (14×16 px) */
    private makeCoffeeTexture ()
    {
        if (this.textures.exists('coffee')) return;
        const g = this.add.graphics();
        // Cup body
        g.fillStyle(0x8B4513);
        g.fillRoundedRect(1, 4, 10, 9, 2);
        // Coffee surface
        g.fillStyle(0x3d1a00);
        g.fillEllipse(6, 5, 8, 3);
        // Steam dots
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(4, 2, 1);
        g.fillCircle(7, 1, 1);
        // Handle
        g.lineStyle(2, 0x6b3410);
        g.strokeCircle(13, 7, 2);
        g.generateTexture('coffee', 16, 14);
        g.destroy();
    }

    /** Red bug creature (16×12 px) */
    private makeBugTexture ()
    {
        if (this.textures.exists('bug')) return;
        const g = this.add.graphics();
        // Body
        g.fillStyle(0xDD3333);
        g.fillRoundedRect(2, 3, 12, 8, 3);
        // Eyes
        g.fillStyle(0xffffff);
        g.fillCircle(5, 5, 2);
        g.fillCircle(11, 5, 2);
        g.fillStyle(0x000000);
        g.fillCircle(5, 5, 1);
        g.fillCircle(11, 5, 1);
        // Legs
        g.lineStyle(1, 0xAA2222);
        g.lineBetween(4, 11, 2, 13);
        g.lineBetween(8, 11, 8, 13);
        g.lineBetween(12, 11, 14, 13);
        g.generateTexture('bug', 16, 14);
        g.destroy();
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
