const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let pumpHandle, pumpBody, pumpPipe;
let tweenActive = false;
const maxBalloons = 26;
let balloonPool = [];
let currentBalloon = null;
let nextBalloonIndex = 0;
let burstBalloonCount = 0; 
const balloonMaxScale = 0.2; 
const balloonScaleIncrement = 0.05; 
const balloonMoveSpeed = 3000;

const positions = {
    pumpPipe: { x: 1070, y: 480 },
    pumpBody: { x: 1150, y: 500 },
    pumpHandle: { x: 1150, y: 425 },
    balloon: { x: 1032, y: 405 }
};

const scales = {
    pumpPipe: 0.3,
    pumpBody: 0.3,
    pumpHandle: 0.3,
    balloon: 0.1 
};

function preload() {
    this.load.image('background', 'assets/Background.png');
    this.load.image('pumpHandle', 'assets/Handle.png');
    this.load.image('pumpBody', 'assets/Body.png');
    this.load.image('pumpPipe', 'assets/Pipe.png');

    for (let i = 0; i < maxBalloons; i++) {
        this.load.image(`balloon${String.fromCharCode(65 + i)}`, `assets/Balloon${String.fromCharCode(65 + i)}.png`);
    }
}

function create() {
    const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    background.displayWidth = config.width;
    background.displayHeight = config.height;

    pumpHandle = this.add.sprite(positions.pumpHandle.x, positions.pumpHandle.y, 'pumpHandle').setInteractive().setScale(scales.pumpHandle).setDepth(1);
    pumpPipe = this.add.sprite(positions.pumpPipe.x, positions.pumpPipe.y, 'pumpPipe').setScale(scales.pumpPipe).setDepth(1);
    pumpBody = this.add.sprite(positions.pumpBody.x, positions.pumpBody.y, 'pumpBody').setScale(scales.pumpBody).setDepth(1);

    for (let i = 0; i < maxBalloons; i++) {
        const balloonSprite = `balloon${String.fromCharCode(65 + i)}`;
        const balloon = this.add.sprite(positions.balloon.x, positions.balloon.y, balloonSprite)
            .setScale(scales.balloon)
            .setVisible(false)
            .setInteractive()
            .setDepth(0);
        balloon.inflated = false;
        balloon.currentScale = scales.balloon;
        balloon.finalX = getRandomPosition('x', balloon);
        balloon.finalY = getRandomPosition('y', balloon);
        balloon.burst = false;
        balloonPool.push(balloon);
    }

    pumpHandle.on('pointerdown', handlePumpClick.bind(this));
}

function handlePumpClick() {
    if (tweenActive) return;

    tweenActive = true;

    this.tweens.add({
        targets: pumpHandle,
        y: { value: positions.pumpHandle.y + 20, duration: 200, ease: 'Power2', yoyo: true },
        onComplete: () => {
            tweenActive = false;
            incrementBalloonSize.call(this);
        }
    });

    this.tweens.add({
        targets: pumpBody,
        scaleY: { value: scales.pumpBody * 1.1, duration: 200, ease: 'Power2', yoyo: true },
        onUpdate: () => {
            pumpBody.setPosition(positions.pumpBody.x, positions.pumpBody.y);
        }
    });
}

function incrementBalloonSize() {
    if (currentBalloon) {
        if (!currentBalloon.burst && currentBalloon.currentScale < balloonMaxScale) {
            currentBalloon.currentScale = Math.min(currentBalloon.currentScale + balloonScaleIncrement, balloonMaxScale);
            currentBalloon.setScale(currentBalloon.currentScale);
        }

        if (currentBalloon.currentScale >= balloonMaxScale) {
            currentBalloon.inflated = true;
            moveBalloonContinuously.call(this, currentBalloon);
            currentBalloon.on('pointerdown', burstBalloon.bind(this, currentBalloon));
            currentBalloon = null;
            nextBalloonIndex = (nextBalloonIndex + 1) % maxBalloons;
        }
    } else {
        let balloon = balloonPool[nextBalloonIndex];
        if (balloon && !balloon.inflated && !balloon.burst) {
            balloon.setVisible(true);
            balloon.currentScale = scales.balloon;
            balloon.setScale(balloon.currentScale);
            currentBalloon = balloon;
        }
    }
}

function burstBalloon(balloon) {
    if (balloon.burst) return;
    balloon.burst = true;
    burstBalloonCount++;

    this.tweens.add({
        targets: balloon,
        scale: 0,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
            balloon.setVisible(false);
            balloon.setScale(scales.balloon);
            balloon.inflated = false;
            balloon.burst = false;
            checkGameCompletion.call(this); 
        }
    });
}

function moveBalloonContinuously(balloon) {
    if (balloon.tween) {
        balloon.tween.stop();
    }

    balloon.finalX = getRandomPosition('x', balloon);
    balloon.finalY = getRandomPosition('y', balloon);

    balloon.tween = this.tweens.add({
        targets: balloon,
        x: { value: balloon.finalX, duration: balloonMoveSpeed, ease: 'Sine.easeInOut' },
        y: { value: balloon.finalY, duration: balloonMoveSpeed, ease: 'Sine.easeInOut' },
        onComplete: () => {
            if (!balloon.burst) {
                moveBalloonContinuously.call(this, balloon);
            }
        }
    });
}

function getRandomPosition(axis, balloon) {
    const balloonSize = balloon.getBounds();
    if (axis === 'x') {
        return Phaser.Math.Between(balloonSize.width / 2, window.innerWidth - balloonSize.width / 2);
    } else if (axis === 'y') {
        return Phaser.Math.Between(balloonSize.height / 2, window.innerHeight - balloonSize.height / 2);
    }
    return 0;
}

function checkGameCompletion() {
    if (burstBalloonCount >= maxBalloons) {
        this.add.text(config.width / 2, config.height / 2, 'Wow! You completed the game!', {
            fontSize: '32px',
            fill: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);
    }
}

function update() {
}

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
