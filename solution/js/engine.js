var qs = q => document.querySelector(q);

/*
 * click to button
 * show effect
 * */
window.onload = function () {
    $('.btn').click(function () {
        var button = $(this).children('.btn-ripple');
        button.addClass('btn-ripple-animation');

        setTimeout(function () {
            button.removeClass('btn-ripple-animation');
        }, 900);
    });
};


class Drawable {
    constructor(game, img, x, y, w, h) {
        this.game = game;
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

class GameObject extends Drawable {
    constructor(game, img, x, y, w, h, type) {
        super(game, img, x, y, w, h);
        this.type = type;
        this.speedCloud = 2;
        this.speedBird = 3;
        this.speedStar = 6;
        this.speedParachute = 4;
    }

    /**
     * @method void
     * this method
     */
    update() {
        if (this.type == "cloud") {
            this.x -= this.speedCloud;
        }
        if (this.type == "bird") {
            if (this.checkCollision()) {
                this.game.playHitMusic();
                this.game.gameOver();
            }

            this.x -= this.speedBird;
        }
        if (this.type == "star") {
            if (this.checkCollision()) {
                this.game.playStarMusic();
                this.game.stars++;
                this.img.remove();
                this.game.removeGameObject(this.index);
            }
            this.y += this.speedStar;
        }
        if (this.type == "parachute") {
            if (this.checkCollision()) {
                this.game.energy += 10;
                this.img.remove();
                this.game.removeGameObject(this.index);
            }
            this.y += this.speedParachute;
        }


        this.checkBorder();
    }

    /**
     * @method void
     * this method draw element
     */
    draw() {
        this.img.style.left = this.x + "px";
        this.img.style.top = this.y + "px";
        this.img.style.width = this.w + "px";
        this.img.style.height = this.h + "px";
    }

    /**
     * @method void
     * this method check if this element inside in game zone
     */
    checkBorder() {
        if (this.x < 0 || this.y > this.game.offsetHeight) {
            this.img.remove();
            this.game.removeGameObject(this.index);
        }
    }

    /**
     * @method void
     * this method check if did collision with player
     */
    checkCollision() {
        var a = {
            x1: this.x,
            x2: this.x + this.w,
            y1: this.y,
            y2: this.y + this.h
        };
        var b = {
            x1: this.game.player.x,
            x2: this.game.player.x + this.game.player.w,
            y1: this.game.player.y,
            y2: this.game.player.y + this.game.player.h
        };

        return !(
            (a.x2 < b.x1 || a.x1 > b.x2) ||
            (a.y2 < b.y1 || a.y1 > b.y2)
        );
    }
}

class Player extends Drawable {
    constructor(game, img, x, y, w, h) {
        super(game, img, x, y, w, h);
        this.offsetX = 7;
        this.offsetY = 7;
        this.keys = {
            37: false,
            38: false,
            39: false,
            40: false
        };
        this.bindEvents();
    }

    /**
     * @method void
     * this method update information about player
     */
    update() {
        if (this.keys[37] && this.x > 98) {
            this.x -= this.offsetX;
        }
        if (this.keys[38] && this.y > 0) {
            this.y -= this.offsetY;
        }
        if (this.keys[39] && this.x < 903) {
            this.x += this.offsetX;
        }
        if (this.keys[40] && this.y < 657) {
            this.y += this.offsetY;
        }
    }

    /**
     * @method void
     * this method draw player
     */
    draw() {
        this.img.style.width = this.w + "px";
        this.img.style.height = this.h + "px";
        this.img.style.left = this.x + "px";
        this.img.style.top = this.y + "px";
    }

    /**
     * @method bindEvents
     * add key events
     */
    bindEvents() {
        document.addEventListener('keydown', ev => {
            this.setKey(ev.keyCode, true);
        });
        document.addEventListener('keyup', ev => {
            this.setKey(ev.keyCode, false);
        });
    }

    /**
     *
     * @param keyCode
     * @param value
     * this method set information about key
     */
    setKey(keyCode, value) {
        if (keyCode in this.keys) {
            this.keys[keyCode] = value;
        }
    }
}

class Game {
    /**
     * @method
     */
    constructor() {
        this.game = qs('#game');
        this.player = null;


        this.stars = 0;
        this.energy = 10;
        this.time = 0;

        this.isSoundEnable = true;
        this.fontCount = 20;

        this.isNotEnd = true;
        this.isPlaing = false;
        this.gameObjects = [];

        this.speedGenerateClouds = 1000;
        this.speedGenerateBirds = 2000;
        this.speedGenerateStars = 2500;
        this.speedGenerateParachute = 2200;

        this.initMusic();
        this.initGameElements();
        this.bindEvents();
        this.bindKeyEvents();
    }

    /**
     * @method void
     * this method start game
     */
    startGame() {

        this.playBackground();
        this.showPlayer();
        this.startGenerateClouds();
        this.startGenerateBirds();
        this.startGenerateStars();
        this.startGenerateParachute();

        this.starTimer();

        $('.modal-rules').fadeToggle();
        this.isPlaing = true;
        this.loop();
    }

    /**
     *
     * @param index
     * this method remove game object
     */
    removeGameObject(index) {
        delete this.gameObjects[index];
    }

    /**
     * @method void
     * this method do loop all time and show information if game playing
     */
    loop() {
        requestAnimationFrame(_ => {
            if (this.isPlaing) {
                if (this.energy == 0) {
                    this.playFinishMusic();
                    this.gameOver();
                }

                this.updateGameObjects();
                this.drawGameObjects();


                this.player.update();
                this.player.draw();
            }

            this.loop();
        });
    }

    /**
     * @method bindEvents
     * set new events whe user click or press key
     */
    bindEvents() {
        qs('.pause-el').addEventListener('click', _ => {
            this.pause();
        });
        qs('.btn-start').addEventListener('click', _ => {
            this.startGame();
        });
        qs("#username").addEventListener("keydown", ev => {
            if (qs("#username").value.length > 0) {
                qs(".btn-continue").classList.remove('btn-block');
            } else {
                qs(".btn-continue").classList.add('btn-block');
            }
        });
        qs('.btn-continue').addEventListener('click', _ => {
            if (qs("#username").value.length > 0) {
                this.name = qs("#username").value;
                this.continue();
            }
        });
        qs('.btn-reload').addEventListener('click', _ => {
            window.location.reload();
        });
        qs(".font-decrease").addEventListener('click', ev => {
            if (this.fontCount > 16)
                this.fontCount--;
            this.changeFontSize();
        });
        qs(".font-increase").addEventListener('click', ev => {
            if (this.fontCount < 25)
                this.fontCount++;
            this.changeFontSize();
        });
        qs(".sound-control").addEventListener('click', ev => {
            this.isSoundEnable = !this.isSoundEnable;

            this.chechMusicPreferences();
        });
    }

    /**
     * @method
     * this method init all game elements
     */
    initGameElements() {
        var centerY = this.game.offsetHeight / 2;
        this.player = new Player(this, qs('#player'), 140, centerY, 120, 108);
    }

    /**
     * @method void
     * this method send POST information about player
     */
    sendResult() {
        $.ajax({
            url: "/register.php",
            type: "POST",
            data: {
                name: this.name,
                time: this.time,
                stars: this.stars
            },
            success: ev => {
                this.showResults(ev);
            }
        });

    }

    /**
     * @method void
     * this method generate clod
     */
    generateCloud() {
        // random cloud ID
        var cloudNumber = "cloud-" + Math.floor(Math.random() * 9999) + 92;

        var cloud = document.createElement('img');
        cloud.src = "img/cloud.png";
        cloud.classList.add('cloud', cloudNumber);
        this.game.appendChild(cloud);

        var width = 123;
        var height = 67;
        var randomY = Math.floor(Math.random() * 200);
        var lastIndex = this.gameObjects.push(new GameObject(this, qs('.' + cloudNumber), this.game.offsetWidth + width, randomY, width, height, "cloud"));
        this.gameObjects[lastIndex - 1].index = lastIndex - 1;
    }

    /**
     * @method void
     * this method generate Bird
     */
    generateBird() {
        // random cloud ID
        var cloudNumber = "bird-" + Math.floor(Math.random() * 9999) + 92;

        var cloud = document.createElement('img');
        cloud.src = "img/bird.gif";
        cloud.classList.add('bird', cloudNumber);
        this.game.appendChild(cloud);

        var width = 123;
        var height = 67;
        var randomY = Math.floor(Math.random() * this.game.offsetHeight);
        var lastIndex = this.gameObjects.push(new GameObject(this, qs('.' + cloudNumber), this.game.offsetWidth + width, randomY, width, height, "bird"));
        this.gameObjects[lastIndex - 1].index = lastIndex - 1;
    }

    /**
     * @method void
     * this method generate Star
     */
    generateStar() {
        // random cloud ID
        var cloudNumber = "star-" + Math.floor(Math.random() * 9999) + 92;

        var cloud = document.createElement('img');
        cloud.src = "img/star.png";
        cloud.classList.add('star', cloudNumber);
        this.game.appendChild(cloud);

        var width = 123;
        var height = 67;
        var randomX = Math.floor(Math.random() * this.game.offsetWidth);
        var lastIndex = this.gameObjects.push(new GameObject(this, qs('.' + cloudNumber), randomX, -100, width, height, "star"));
        this.gameObjects[lastIndex - 1].index = lastIndex - 1;
    }

    /**
     * @method void
     * this method generate Parachute
     */
    generateParachute() {
        // random cloud ID
        var cloudNumber = "parachute-" + Math.floor(Math.random() * 9999) + 92;

        var cloud = document.createElement('img');
        cloud.src = "img/parachute.png";
        cloud.classList.add('parachute', cloudNumber);
        this.game.appendChild(cloud);

        var width = 123;
        var height = 67;
        var randomX = Math.floor(Math.random() * this.game.offsetWidth);
        var lastIndex = this.gameObjects.push(new GameObject(this, qs('.' + cloudNumber), randomX, -100, width, height, "parachute"));
        this.gameObjects[lastIndex - 1].index = lastIndex - 1;
    }


    /**
     * @method void
     * this method update Game objects
     */
    updateGameObjects() {
        this.gameObjects.forEach(el => {
            el.update();
        });
    }
    /**
     * @method void
     * this method draw all game objects
     */
    drawGameObjects() {
        this.gameObjects.forEach(el => {
            el.draw();
        });
    }

    /*
     * generators
     * this function generation objects
     * */
    startGenerateClouds() {
        this.intervalClouds = setInterval(_ => {
            if (this.isPlaing)
                this.generateCloud();
        }, this.speedGenerateClouds);
    }
    startGenerateBirds() {
        this.intervalBirds = setInterval(_ => {
            if (this.isPlaing)
                this.generateBird();
        }, this.speedGenerateBirds);
    }
    startGenerateStars() {
        this.intervalStars = setInterval(_ => {
            if (this.isPlaing)
                this.generateStar();
        }, this.speedGenerateStars);
    }
    startGenerateParachute() {
        this.intervalParachute = setInterval(_ => {
            if (this.isPlaing)
                this.generateParachute();
        }, this.speedGenerateParachute);
    }


    starTimer() {
        this.timer = setInterval(_ => {

            if (this.isPlaing) {
                this.energy -= 1;
                this.time += 1;

                this.renderStars();
                this.renderEnergy();
                this.renderTime();
            }

        }, 1000);
    }

    /*
    * renders
    * this functions show information to the screen
    * */
    renderTime() {
        qs("#timer-count").innerText = this.time;
    }
    renderEnergy() {
        qs(".gasoline-number").innerText = this.energy;
    }
    renderStars() {
        qs(".star-number").innerText = this.stars;
    }


    bindKeyEvents() {
        document.addEventListener('keypress', ev => {
            if (ev.keyCode == 32) {
                this.pause();
            }
        });
    }

    pause() {
        if (this.isNotEnd) {
            this.isPlaing = !this.isPlaing;

            if(!this.isPlaing) {
                this.background.pause();
            } else {
                if(this.isSoundEnable) {
                    this.background.play();
                }
            }
        }
    }
    /**
     * @method void
     * this method game over
     */
    gameOver() {
        this.isPlaing = false;
        this.isNotEnd = false;
        this.showModalEnd();
    }

    /**
     * @method void
     * this method show modal window
     */
    showModalEnd() {
        $(".modal-name").css("display", "flex");
    }

    /**
     * @method void
     * this method send post requestn and show table result
     */
    continue() {
        this.sendResult();
        $(".modal-name").fadeToggle();
        $(".modal-raking").css("display", "flex");
    }

    /**
     * @method void
     * this method show results
     */
    showResults(ev) {
        var users = JSON.parse(ev);

        users.sort((a, b) => {
            return a.stars - b.stars;
        });

        users.forEach((el, i) => {
            $(".table").append(`
                <div class="flex-row flex-sb">
                    <div class="column smart-font-size">${i + 1}</div>
                    <div class="column smart-font-size">${el.name}</div>
                    <div class="column smart-font-size">${el.stars}</div>
                    <div class="column smart-font-size">${el.time}</div>
                </div>        
            `);
        });


    }
    /**
     * @method void
     * this method change font size
     */
    changeFontSize() {
        console.log(this.fontCount);
        var elements = $(".smart-font-size");

        for (var i = 0; i < elements.length; i++) {
            var size = parseInt($(elements[i]).css('fontSize'));

            $(elements[i]).css('fontSize', this.fontCount + "px");
        }
    }
    /**
     * @method void
     * this method init all musics
     */
    initMusic() {
        var background = new Audio();
        background.src = "sound/background.mp3";

        var hit = new Audio();
        hit.src = "sound/hit.mp3";

        var star = new Audio();
        star.src = "sound/star.mp3";

        var finish = new Audio();
        finish.src = "sound/finish.mp3";

        this.background = background;
        this.hit = hit;
        this.star = star;
        this.finish = finish;
    }

    playBackground() {
        if (this.isSoundEnable) {
            this.background.play();
        }
    }

    playStarMusic() {
        console.log(this.isSoundEnable);

        if (this.isSoundEnable) {
            this.background.pause();
            this.star.play();
            setTimeout(_ => {
                this.background.play();
            }, 200);
        }
    }

    playHitMusic() {
        if (this.isSoundEnable) {
            this.background.pause();
            this.hit.play();
        }
    }

    playFinishMusic() {
        if (this.isSoundEnable) {
            this.background.pause();
            this.finish.play();
        }

    }

    chechMusicPreferences() {
        if (this.isSoundEnable) {
            this.background.pause();
        } else {
            this.background.play();
        }
    }

    showPlayer() {
        qs("#player").classList.add("showPlayer");
    }
}

var game = new Game();