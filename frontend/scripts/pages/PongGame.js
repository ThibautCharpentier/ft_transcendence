import Utils from '/services/Utils.js';
import Request from '/services/Request.js'

import * as THREE from 'three';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'; //local font
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
//import { LuminosityShader } from "three/addons/shaders/LuminosityShader.js";
//import { SobelOperatorShader } from "three/addons/shaders/SobelOperatorShader.js";
//import { ColorifyShader } from "three/addons/shaders/ColorifyShader.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
//import Stats from 'three/addons/libs/stats.module.js';

let index_1;
let index_2;
let check_matchs;
let tab_more_matchs;
let tab_results;
let tab_players;
let nbr_win;
let nbr_defeat;

async function addInfosLobby(player, numberPlayer) {
    let dataPlayer;
    let divInfosPlayer = document.getElementById(numberPlayer);

    if (player.id != window.currentUser.id) {
        dataPlayer = await Request.getOtherProfil(player.id);
        if (dataPlayer == null)
            return ;
        if (dataPlayer.avatar != null)
            divInfosPlayer.querySelector(".avatar").src = `data:image/png;base64, ${dataPlayer.avatar}`;
        else
            divInfosPlayer.querySelector(".avatar").src = "./assets/img_avatar.png";
    }
    else {
        if (window.currentUser.avatar != null)
            divInfosPlayer.querySelector(".avatar").src = `data:image/png;base64, ${window.currentUser.avatar}`;
        else
            divInfosPlayer.querySelector(".avatar").src = "./assets/img_avatar.png";
    }
    divInfosPlayer.querySelector("h4").textContent = player.username;
}

let PongGame = {
    
    displayResults: async (results) => {
        const cardResultPlayer = await fetch("./views/game/cardResultPlayer.html").then((data) => data.text());
        let mainUl = document.getElementById("listResult");

        for (let i = 0; i < tab_results.length; i++) {
            let dataProfile = await Request.getOtherProfil(tab_results[i].id);
            let nbrCard;
            let cardPlayer;

            if (dataProfile == null)
                return ;
            mainUl.insertAdjacentHTML("beforeend", cardResultPlayer);

            nbrCard = document.querySelectorAll("li").length;
            cardPlayer = document.querySelectorAll("li")[nbrCard - 1];
            if (dataProfile.avatar)
                cardPlayer.querySelector("img").src = `data:image/png;base64, ${dataProfile.avatar}`;
            else
                cardPlayer.querySelector("img").src = "./assets/img_avatar.png";
            cardPlayer.getElementsByClassName("username")[0].textContent = tab_results[i].username;
            cardPlayer.getElementsByClassName("victoryTournament")[0].textContent = nbr_win[tab_results[i].username];
            cardPlayer.getElementsByClassName("defeatTournament")[0].textContent = nbr_defeat[tab_results[i].username];
            cardPlayer.getElementsByClassName("rank")[0].textContent = i + 1 + '.';
        }
    }
    , prepareNextMoreMatch: async (winner, looser, looserScore) => {
        check_matchs[winner.username] += 1;
        nbr_win[winner.username] += 1;
        nbr_defeat[looser.username] += 1;
        if (index_2 < tab_more_matchs.length - 1)
            index_2 += 1;
        else
        {
            index_1 += 1;
            index_2 = index_1 + 1;
        }
        addInfosLobby(tab_more_matchs[index_1], "firstPlayer");
        addInfosLobby(tab_more_matchs[index_2], "secondPlayer");
        document.getElementById("btnPlayNextMatch").addEventListener("click", async () => {
            document.getElementById("lobby").remove();
            let mainDiv = document.getElementsByClassName("pong-tournament");
            const viewGame = await fetch("./views/game/pongGame.html").then((data) => data.text());

            mainDiv[0].insertAdjacentHTML("beforeend", viewGame);
            if (index_1 == tab_more_matchs.length - 2 && index_2 == index_1 + 1)
                PongGame.startGameLocal(tab_more_matchs[index_1], tab_more_matchs[index_2], PongGame.checkResults, true);
            else
                PongGame.startGameLocal(tab_more_matchs[index_1], tab_more_matchs[index_2], PongGame.prepareNextMoreMatch, true);
        })
    }
    , checkResults: (winner, looser, looserScore) => {
        check_matchs[winner.username] += 1;
        nbr_win[winner.username] += 1;
        nbr_defeat[looser.username] += 1;
        
        tab_more_matchs = [];
        let max_score;

        while (true)
        {
            max_score = 0;
            for (let key in check_matchs)
            {
                if (check_matchs[key] > max_score)
                    max_score = check_matchs[key];
            }
            for (let key in check_matchs)
            {
                if (check_matchs[key] == max_score)
                for (let i = 0; i < tab_players.length; i++)
                {
                    if (tab_players[i].username == key)
                    {
                        tab_more_matchs.push(tab_players[i]);
                        break ;
                    }
                }
            }
            if (tab_more_matchs.length == 1)
            {
                tab_results.push(tab_more_matchs[0]);
                delete check_matchs[tab_more_matchs[0].username];
                tab_more_matchs = []
                if (check_matchs.length == 0)
                    break ;
            }
            else
                break ;
        }
        if (Object.keys(check_matchs).length > 0)
        {
            index_1 = 0;
            index_2 = 1;
            addInfosLobby(tab_more_matchs[index_1], "firstPlayer");
            addInfosLobby(tab_more_matchs[index_2], "secondPlayer");
            document.getElementById("btnPlayNextMatch").addEventListener("click", async () => {
                document.getElementById("lobby").remove();
                let mainDiv = document.getElementsByClassName("pong-tournament");
                const viewGame = await fetch("./views/game/pongGame.html").then((data) => data.text());

                mainDiv[0].insertAdjacentHTML("beforeend", viewGame);
                if (tab_more_matchs.length == 2)
                    await PongGame.startGameLocal(tab_more_matchs[index_1], tab_more_matchs[index_2], PongGame.checkResults, true);
                else
                    await PongGame.startGameLocal(tab_more_matchs[index_1], tab_more_matchs[index_2], PongGame.prepareNextMoreMatch, true);
            })
        }
        else
        {
            window.in_local_game = 0;
            document.getElementById("announceNextMatch").classList.add("d-none");
            let obj = {};
            const keys = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
            for (let i = 0; i < tab_results.length; i++) {
                obj[keys[i]] = tab_results[i].id;
            }

            axios.post(`https://${window.location.hostname}:8000/history/addtournament`, obj, {
                withCredentials: true,
                headers: {
                    'X-CSRFToken': Utils.getCookie('csrf_token'),
                }
            })
            .then((res) => {
                if (res.status != 200)
                    throw new Error('Une erreur est survenue');
                Utils.getMyProfile();
            })
            .catch((err) => {
                console.log(err);
            });
            Request.updateStatus("online");
            PongGame.displayResults(obj);
            document.getElementById("resultTournament").classList.remove("d-none");
        }
    }
    , prepareNextMatch: (winner, looser, looserScore) => {
        check_matchs[winner.username] += 1;
        nbr_win[winner.username] += 1;
        nbr_defeat[looser.username] += 1;
        if (index_2 < tab_players.length - 1)
            index_2 += 1;
        else
        {
            index_1 += 1;
            index_2 = index_1 + 1;
        }
        addInfosLobby(tab_players[index_1], "firstPlayer");
        addInfosLobby(tab_players[index_2], "secondPlayer");
        document.getElementById("btnPlayNextMatch").addEventListener("click", async () => {
            document.getElementById("lobby").remove();
            let mainDiv = document.getElementsByClassName("pong-tournament");
            const viewGame = await fetch("./views/game/pongGame.html").then((data) => data.text());

            mainDiv[0].insertAdjacentHTML("beforeend", viewGame);
            if (index_1 == tab_players.length - 2 && index_2 == index_1 + 1)
                await PongGame.startGameLocal(tab_players[index_1], tab_players[index_2], PongGame.checkResults, true);
            else
                await PongGame.startGameLocal(tab_players[index_1], tab_players[index_2], PongGame.prepareNextMatch, true);
        })
    }

    /////////

    , gameTournamentLocal: (tabObject) => {
        window.in_local_game = 1;
        Request.updateStatus("in game");

        check_matchs = {};
        nbr_win = {};
        nbr_defeat = {};
        tab_players = tabObject;

        for (let i = 0; i < tab_players.length; i++) {
            check_matchs[tab_players[i].username] = 0;
            nbr_win[tab_players[i].username] = 0;
            nbr_defeat[tab_players[i].username] = 0;
        }

        index_1 = 0;
        index_2 = 1;
        tab_results = [];

        addInfosLobby(tab_players[index_1], "firstPlayer");
        addInfosLobby(tab_players[index_2], "secondPlayer");
        // document.getElementById("announceNextMatch").classList.remove("d-none");
        document.getElementById("btnPlayNextMatch").addEventListener("click", async () => {
            document.getElementById("lobby").remove();
            let mainDiv = document.getElementsByClassName("pong-tournament");
            const viewGame = await fetch("./views/game/pongGame.html").then((data) => data.text());

            mainDiv[0].insertAdjacentHTML("beforeend", viewGame);
            await PongGame.startGameLocal(tab_players[index_1], tab_players[index_2], PongGame.prepareNextMatch, true);
        })
    }
    , gameLocal: async (player_1, player_2) => {
        window.in_local_game = 1;
        Request.updateStatus("in game");
        await PongGame.startGameLocal(player_1, player_2, async (winner, looser, looserScore) => {
            const obj = {
                winner: winner.id,
                looser: looser.id,
                looserScore: looserScore,
                matchType: 'offline'
            }
            await axios.post(`https://${window.location.hostname}:8000/history/addmatch`, obj, {
                withCredentials: true,
                headers: {
                    'X-CSRFToken': Utils.getCookie('csrf_token'),
                }
            })
            .then((res) => {
                if (res.status != 200)
                    throw new Error('Une erreur est survenue');
                Utils.getMyProfile();
            })
            .catch((err) => {
                console.log(err);
            });
            await Request.updateStatus("online");
        });
    }
    , startGameLocal: async (player1, player2, callback, tournament=null) => {
        const keysPressed = [];
        const P1_KEY_UP1 = 65; // A
        const P1_KEY_UP2 = 87; // W
        const P1_KEY_DOWN1 = 68; // D
        const P1_KEY_DOWN2 = 83; // S
        const P2_KEY_UP1 = 39; // >
        const P2_KEY_UP2 = 38; // /\
        const P2_KEY_DOWN1 = 37; // <
        const P2_KEY_DOWN2 = 40; // \/
        const P1_KEYS = {up1: P1_KEY_UP1, up2: P1_KEY_UP2, down1: P1_KEY_DOWN1, down2: P1_KEY_DOWN2};
        const P2_KEYS = {up1: P2_KEY_UP1, up2: P2_KEY_UP2, down1: P2_KEY_DOWN1, down2: P2_KEY_DOWN2};

        const touchsPressed = [];
        const P1_TOUCH = {i: -1};
        const P2_TOUCH = {i: -1};

        const grid_width = 1920;
        const grid_height = 1080;

        const ball_size = 40;
        const ball_initial_speed = 1;
        const ball_max_speed = 2.49;
        const ball_acc = 0.05;
        const ball_radius = ball_size / 2;
        const ball_X_start = grid_width / 2;
        const ball_Y_start = grid_height / 2;
        const bounce_angle_max = 75 * (Math.PI / 180);
        let ball_initial_angle;
        if (Math.floor(Math.random() * 2) >= 1)
            ball_initial_angle = 0;
        else
            ball_initial_angle = 180 * (Math.PI / 180);

        const score_police_size = 300;
        const score_police_height = 40;
        const p1_score_X = grid_width / 2 - 300;
        const p1_score_Y = grid_height - 100;
        const p2_score_X = grid_width / 2 + 300;
        const p2_score_Y = grid_height - 100;
        const score_max = 7;

        const name_police_size = 100;
        const name_police_height = 20;
        const p1_name_X = -200;
        const p1_name_Y = grid_height;
        const p1_name_rotation = 45 * (Math.PI / 180);
        const p2_name_X = grid_width + 200;
        const p2_name_Y = grid_height;
        const p2_name_rotation = -45 * (Math.PI / 180);

        const p1_model_X = 200;
        const p1_model_Y = grid_height + 100;
        const p1_model_rotation = 0;
        const p2_model_X = grid_width - 200;
        const p2_model_Y = grid_height + 100;
        const p2_model_rotation = 0;

        const paddle_width = 40;
        const paddle_height = 200;
        const paddle_speed = 1;
        const paddle_margin = 80;
        const paddle_width_range = paddle_width / 2;
        const paddle_height_range = paddle_height / 2;
        const paddle1_X_start = paddle_width_range + paddle_margin;
        const paddle1_Y_start = grid_height / 2;
        const paddle2_X_start = grid_width - paddle_width_range - paddle_margin;
        const paddle2_Y_start = grid_height / 2;

        let pause_status = 0;
        let countdown_status = 0;
        let begin = false;
        let finish = false;
        let finish_animation = false;

        document.body.style.setProperty('touch-action', 'none');
        window.addEventListener("keydown", function (event) {keysPressed[event.keyCode] = true;});
        window.addEventListener("keyup", function (event) {keysPressed[event.keyCode] = false;});
        window.addEventListener("touchstart", touchstart);
        window.addEventListener("touchmove", touchmove);
        window.addEventListener("touchend", touchend);
        window.addEventListener("touchcancel", touchend);
        window.addEventListener("resize", update_canvas);

        function touch(status, side, coordY)
        {
            return {status: status, side: side, coordY: coordY};
        }

        function touchstart(event)
        {
            let status = true;
            let side;
            if (event.changedTouches[0].pageX < window.innerWidth / 2)
                side = 1;
            else
                side = 2;
            let coordY = event.changedTouches[0].pageY;

            touchsPressed[event.changedTouches[0].identifier] = touch(status, side, coordY);
            if (P1_TOUCH.i == -1 && touchsPressed[event.changedTouches[0].identifier].side == 1)
                P1_TOUCH.i = event.changedTouches[0].identifier;
            else if (P2_TOUCH.i == -1 && touchsPressed[event.changedTouches[0].identifier].side == 2)
                P2_TOUCH.i = event.changedTouches[0].identifier;
        }

        function touchmove(event)
        {
            for (let i = 0; i < event.touches.length; i++)
            {
                let status = true;
                let side = touchsPressed[event.touches[i].identifier].side;
                let coordY = event.touches[i].pageY;

                touchsPressed[event.touches[i].identifier] = touch(status, side, coordY);
            }
        }

        function touchend(event)
        {
            let status = false;
            let side = 0;
            let coordY = 0;

            if (P1_TOUCH.i == event.changedTouches[0].identifier)
                P1_TOUCH.i = -1;
            else if (P2_TOUCH.i == event.changedTouches[0].identifier)
                P2_TOUCH.i = -1;
            touchsPressed[event.changedTouches[0].identifier] = touch(status, side, coordY);
        }

        function update_canvas(event)
        {
            if (window.innerWidth * grid_height > window.innerHeight * grid_width)
            {
                canvas.height = window.innerHeight;
                canvas.width = window.innerHeight * grid_width / grid_height;
            }
            else
            {
                canvas.width = window.innerWidth;
                canvas.height = window.innerWidth * grid_height / grid_width;
            }
            Camera.changeAspect(canvas.width / canvas.height);
            renderer.setSize(canvas.width, canvas.height);
            composer.setSize(canvas.width, canvas.height);
        }

        function vector(x, y)
        {
            return {x: x, y: y};
        }

        class countdown
        {
            constructor(scene) {
                this.police_height = 20;
                this.police_size = 300;

                this.obj = [];
                this.createMeshes(this.police_height, this.police_size);
            }

            createMeshes = function(height, size) {
                const roboto_ttf = new TTFLoader();
                roboto_ttf.load("/assets/fonts/Roboto-Bold.ttf", (json) => {
                    const fontLoader = new FontLoader();
                    const roboto_font = fontLoader.parse(json);
                    const material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 0.3});
                    for (let i = 3; i >= 1; i--)
                    {
                        const geometry = new TextGeometry(i.toString(), {height: height, size: size, font: roboto_font});
                        geometry.center();
                        this.obj[i] = new THREE.Mesh(geometry, material);
                        this.obj[i].position.x = grid_width / 2;
                        this.obj[i].position.y = 0;
                        this.obj[i].position.z = 600;
                        this.obj[i].rotation.x = Math.PI / 4;
                    }
                    scene.add(this.obj[3]);
                });
            }

            start = function() {
                countdown_status = 1;
                if (!finish)
                {
                    this.count = 3;
                    this.decrease_countdown();
                    this.interval = setInterval(() => this.decrease_countdown(), 1000);
                }
            }

            decrease_countdown = function() {
                if (pause_status == 0)
                {
                    for (let i = 1; i <= 3; i++)
                        scene.remove(this.obj[i]);
                    if (this.obj[this.count])
                        scene.add(this.obj[this.count]);
                    if (this.count <= 0)
                    {
                        clearInterval(this.interval);
                        for (let i = 1; i <= 3; i++)
                            scene.remove(this.obj[i]);
                        if (begin == false)
                        {
                            countdown_status = 0;
                            begin = true;
                        }
                        else
                            countdown_status = 2;
                    }
                    this.count--;
                }
            }
        }

        class btn_continue
        {
            constructor() {
                document.getElementById("continue").addEventListener("click", this.run_game);
                window.addEventListener("blur", this.pause_game);
            }

            run_game = function() {
                document.getElementById("continue").classList.add("d-none");
                pause_status = 0;
            }

            pause_game = function(event) {
                if (!finish)
                {
                    document.getElementById("continue").classList.remove("d-none");
                    pause_status = 1;
                }
            }
        }

        class btn_end
        {
            constructor() {
                document.getElementById("end").addEventListener("click", this.redirect);
            }

            display = function(event) {
                document.getElementById("end").classList.remove("d-none");
            }

            redirect = function() {
                window.in_local_game = 0;
                removeEventListener("keydown",  function (event) {keysPressed[event.keyCode] = true;});
                removeEventListener("keyup", function (event) {keysPressed[event.keyCode] = false;});
                removeEventListener("touchstart", touchstart);
                removeEventListener("touchmove", touchmove);
                removeEventListener("touchend", touchend);
                removeEventListener("touchcancel", touchend);
                removeEventListener("resize", update_canvas);
                window.location.href = "/#/dashboard";
            }
        }

        class btn_next
        {
            constructor() {
                document.getElementById("next").addEventListener("click", this.next_game);
            }

            display = function(event) {
                document.getElementById("next").classList.remove("d-none");
            }

            next_game = async function() {
                document.getElementById("next").classList.add("d-none");
                document.getElementById("pongLocal").remove();
                let mainDiv = document.getElementsByClassName("pong-tournament");
                const viewGame = await fetch("./views/game/lobby.html").then((data) => data.text());

                mainDiv[0].insertAdjacentHTML("beforeend", viewGame);
                if (P1_score.score == score_max)
                    callback(player1, player2, P2_score.score);
                else
                    callback(player2, player1, P1_score.score);
            }
        }

        class ball
        {
            constructor(scene) {
                this.pos = vector(ball_X_start, ball_Y_start);
                this.last_pos = vector(ball_X_start, ball_Y_start);
                this.z = 0;
                this.angle = ball_initial_angle;
                this.speed = ball_initial_speed;
                this.engage = 1;
                this.geometry = new THREE.BoxGeometry(ball_size, ball_size, 40);
                this.material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 1});
                this.obj = new THREE.Mesh(this.geometry, this.material);
                scene.add(this.obj);

                this.obj.position.x = this.pos.x;
                this.obj.position.y = grid_height - this.pos.y;
            }

            calcul_next_pos = function(collision) {
                if (collision == true)
                {
                    this.last_pos.x = this.collision_x;
                    this.last_pos.y = this.collision_y;
                    let dist = Math.sqrt((this.collision_x - this.pos.x) * (this.collision_x - this.pos.x) + (this.collision_y - this.pos.y) * (this.collision_y - this.pos.y));
                    this.pos.x = this.collision_x + Math.cos(this.angle) * dist;
                    this.pos.y = this.collision_y + Math.sin(this.angle) * dist;
                }
                else
                {
                    if (this.engage == 1)
                    {
                        this.pos.x += Math.cos(this.angle) * this.speed * Time.dt / 2;
                        this.pos.y += Math.sin(this.angle) * this.speed * Time.dt / 2;
                    }
                    else
                    {
                        this.pos.x += Math.cos(this.angle) * this.speed * Time.dt;
                        this.pos.y += Math.sin(this.angle) * this.speed * Time.dt;
                    }
                }
            };

            paddle_collision = function(paddle) {
                if (this.pos.x != this.last_pos.x
                    && (this.pos.x + ball_radius >= paddle.pos.x - paddle_width_range && paddle.pos.x + paddle_width_range > this.last_pos.x - ball_radius
                    || this.pos.x - ball_radius <= paddle.pos.x + paddle_width_range && paddle.pos.x - paddle_width_range < this.last_pos.x + ball_radius)
                    && (this.pos.y + ball_radius >= paddle.pos.y - paddle_height_range && paddle.pos.y + paddle_height_range > this.last_pos.y - ball_radius
                    || this.pos.y - ball_radius <= paddle.pos.y + paddle_height_range && paddle.pos.y - paddle_height_range < this.last_pos.y + ball_radius))
                {
                    this.coef = (this.last_pos.y - this.pos.y) / (this.last_pos.x - this.pos.x);
                    if (this.pos.x + ball_radius >= paddle.pos.x - paddle_width_range && paddle.pos.x - paddle_width_range > this.last_pos.x + ball_radius) //collision gauche
                    {
                        this.collision_x = paddle.pos.x - paddle_width_range - ball_radius;
                        this.collision_y = this.coef * (this.collision_x - this.pos.x) + this.pos.y;
                    }
                    else if (this.pos.x - ball_radius <= paddle.pos.x + paddle_width_range && paddle.pos.x + paddle_width_range < this.last_pos.x - ball_radius) //collision droite
                    {
                        this.collision_x = paddle.pos.x + paddle_width_range + ball_radius;
                        this.collision_y = this.coef * (this.collision_x - this.pos.x) + this.pos.y;
                    }
                    else if (this.pos.y + ball_radius >= paddle.pos.y - paddle_height_range && paddle.pos.y - paddle_height_range > this.last_pos.y + ball_radius) //collision haut
                    {
                        this.collision_y = paddle.pos.y - paddle_height_range - ball_radius;
                        this.collision_x = (this.collision_y - this.pos.y) / this.coef + this.pos.x;
                    }
                    else if (this.pos.y - ball_radius <= paddle.pos.y + paddle_height_range && paddle.pos.y + paddle_height_range < this.last_pos.y - ball_radius) //collision bas
                    {
                        this.collision_y = paddle.pos.y + paddle_height_range + ball_radius;
                        this.collision_x = (this.collision_y - this.pos.y) / this.coef + this.pos.x;
                    }
                    else if ((this.last_pos.y - paddle.pos.y) * (this.last_pos.y - this.pos.y) >= 0) //collision interne quand le paddle bouge
                    {
                        this.collision_y = this.pos.y;
                        this.collision_x = this.pos.x;
                    }
                    else
                        return;
                        
                    if (this.collision_x >= paddle.pos.x) //collision droite
                        this.angle = bounce_angle_max * (this.collision_y - paddle.pos.y) / (ball_radius + paddle_height_range);
                    else //collision gauche
                        this.angle = Math.PI - bounce_angle_max * (this.collision_y - paddle.pos.y) / (ball_radius + paddle_height_range);

                    if (this.engage == 1)
                        this.engage = 0;
                    if (this.speed < ball_max_speed)
                        this.speed += ball_acc;
                    this.calcul_next_pos(true);
                    paddle.start();
                }
            };

            wall_collision = function() {
                while (this.pos.y + ball_radius >= grid_height || this.pos.y - ball_radius <= 0)
                {
                    if (this.pos.y + ball_radius >= grid_height)
                    {
                        this.coef = (this.last_pos.x - this.pos.x) / (this.last_pos.y - this.pos.y);
                        this.collision_y = grid_height - ball_radius;
                        this.collision_x = this.coef * (this.collision_y - this.pos.y) + this.pos.x;
                        this.angle = -Math.acos(Math.cos(this.angle));
                    }
                    if (this.pos.y - ball_radius <= 0)
                    {
                        this.coef = (this.last_pos.x - this.pos.x) / (this.last_pos.y - this.pos.y);
                        this.collision_y = ball_radius;
                        this.collision_x = this.coef * (this.collision_y - this.pos.y) + this.pos.x;
                        this.angle = Math.acos(Math.cos(this.angle));
                    }
                    this.calcul_next_pos(true);
                }
                if (this.pos.x + ball_radius >= grid_width)
                    this.scoring(P1_score, 0);
                if (this.pos.x - ball_radius <= 0)
                    this.scoring(P2_score, 180 * (Math.PI / 180));
            };

            scoring = function(score, angle) {
                if (countdown_status == 0)
                {
                    this.time_start = Time.time;
                    //Camera.start();
                    if (!finish)
                    {
                        score.increase();
                        Countdown.start();
                    }
                }
                if (countdown_status == 1)
                {
                    this.falling();
                    //Camera.centering();
                }
                if (countdown_status == 2)
                {
                    this.reset(angle);
                    countdown_status = 0;
                }
            };

            falling = function() {
                this.time = Time.time - this.time_start;
                this.z = - (this.time) * (this.time) / 1000;
            };

            reset = function (angle) {
                this.engage = 1;
                this.pos.x = ball_X_start
                this.pos.y = ball_Y_start;
                this.last_pos.x = ball_X_start
                this.last_pos.y = ball_Y_start;
                this.z = 0;
                this.speed = ball_initial_speed;
                this.angle = angle;
            };

            update = function () {
                this.last_pos.x = this.pos.x;
                this.last_pos.y = this.pos.y;
                this.calcul_next_pos(false);
                this.paddle_collision(Paddle1);
                this.paddle_collision(Paddle2);
                this.wall_collision();

                this.obj.position.x = this.pos.x;
                this.obj.position.y = grid_height - this.pos.y;
                this.obj.position.z = this.z;
            };
        }

        class paddle
        {
            constructor(pos, keys, touchs, scene) {
                this.pos = pos;
                this.keys = keys;
                this.touchs = touchs;
                this.geometry = new THREE.BoxGeometry(paddle_width, paddle_height, 40);
                this.material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 0.2});
                this.emissive_min = this.material.emissiveIntensity;
                this.obj = new THREE.Mesh(this.geometry, this.material);
                scene.add(this.obj);

                this.obj.position.x = this.pos.x;
                this.obj.position.y = grid_height - this.pos.y;
            }

            wall_limits = function () {
                if (this.pos.y < paddle_height_range)
                    this.pos.y = paddle_height_range;
                if (this.pos.y > grid_height - paddle_height_range)
                    this.pos.y = grid_height - paddle_height_range;
            };

            start = function () {
                this.time_start = Time.time;
                this.material.emissiveIntensity = 1;
            };

            fading = function () {
                this.time = Time.time - this.time_start;
                this.material.emissiveIntensity = (3000 - this.time) / 3000;
                if (this.material.emissiveIntensity <= this.emissive_min)
                    this.material.emissiveIntensity = this.emissive_min;
            };
            
            update = function () {
                this.speed = paddle_speed * Time.dt;
                if (keysPressed[this.keys.up1] || keysPressed[this.keys.up2] || (this.touchs.i >= 0 && touchsPressed[this.touchs.i].coordY < this.pos.y * (canvas.width / grid_width)))
                    this.pos.y -= this.speed;
                if (keysPressed[this.keys.down1] || keysPressed[this.keys.down2] || (this.touchs.i >= 0 && touchsPressed[this.touchs.i].coordY > this.pos.y * (canvas.height / grid_height)))
                    this.pos.y += this.speed;
                this.wall_limits();

                this.obj.position.x = this.pos.x;
                this.obj.position.y = grid_height - this.pos.y;
                if (this.material.emissiveIntensity != this.emissive_min)
                    this.fading();
            };
        }

        class playground
        {
            constructor(scene) {
                this.floor(scene);
                this.walls(scene);
            }

            floor = function (scene) {
                this.floor_geometry = new THREE.BoxGeometry(grid_width, grid_height, 3000);
                this.floor_material = new THREE.MeshPhongMaterial({color: 0x354ea8});
                this.floor_obj = new THREE.Mesh(this.floor_geometry, this.floor_material);
                scene.add(this.floor_obj);
                this.floor_obj.position.x = grid_width / 2;
                this.floor_obj.position.y = grid_height / 2;
                this.floor_obj.position.z = -1500;
            };
        
            walls = function (scene) {
                this.material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 0.5});

                this.topwall_geometry = new THREE.BoxGeometry(grid_width, 40, 40);
                this.topwall_obj = new THREE.Mesh(this.topwall_geometry, this.material);
                scene.add(this.topwall_obj);
                this.topwall_obj.position.x = grid_width / 2;
                this.topwall_obj.position.y = grid_height + 20;

                this.botwall_geometry = new THREE.BoxGeometry(grid_width, 40, 40);
                this.botwall_obj = new THREE.Mesh(this.botwall_geometry, this.material);
                scene.add(this.botwall_obj);
                this.botwall_obj.position.x = grid_width / 2;
                this.botwall_obj.position.y = -20;
            };
        }

        class score
        {
            constructor(pos, scene) {
                this.police_height = score_police_height;
                this.police_size = score_police_size;

                this.score = 0;
                this.obj = [];
                this.createMeshes(pos, this.police_height, this.police_size);
            }

            createMeshes = function(pos, height, size) {
                const roboto_ttf = new TTFLoader();
                roboto_ttf.load("/assets/fonts/Roboto-Bold.ttf", (json) => {
                    const fontLoader = new FontLoader();
                    const roboto_font = fontLoader.parse(json);
                    const material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 0.8});
                    for (let i = 0; i <= score_max; i++)
                    {
                        const geometry = new TextGeometry(i.toString(), {height: height, size: size, font: roboto_font});
                        geometry.center();
                        this.obj[i] = new THREE.Mesh(geometry, material);
                        this.obj[i].position.x = pos.x;
                        this.obj[i].position.y = pos.y;
                        this.obj[i].position.z = 300;
                        this.obj[i].rotation.x = Math.PI / 2;
                    }
                    scene.add(this.obj[0]);
                });
            }

            increase = function() {
                this.score++;
                for (let i = 0; i <= score_max; i++)
                    scene.remove(this.obj[i]);
                if (this.obj[this.score])
                    scene.add(this.obj[this.score]);
                if (this.score == score_max)
                {
                    finish = true;
                    setTimeout(() => {finish_animation = true; document.body.style.setProperty('touch-action', 'auto');}, 3000);
                    if (!tournament)
                    {
                        if (P1_score.score == score_max)
                            callback(player1, player2, P2_score.score);
                        else
                            callback(player2, player1, P1_score.score);
                        Btn_end.display();
                    }
                    else
                        Btn_next.display();
                }
            }
        }

        class name
        {
            constructor(username, pos, rot, scene) {
                this.police_height = name_police_height;
                this.police_size = name_police_size;

                this.score = 0;
                this.geometry = new TextGeometry();
                this.material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 0.8});
                this.obj = new THREE.Mesh(this.geometry, this.material);
                this.changeText(username, this.police_height, this.police_size);
                scene.add(this.obj);
                this.obj.position.x = pos.x;
                this.obj.position.y = pos.y;
                this.obj.position.z = 300;
                this.obj.rotation.x = Math.PI / 2;
                this.obj.rotation.y = rot;
            }

            changeText = function(text, height, size) {
                const roboto_ttf = new TTFLoader();
                roboto_ttf.load("/assets/fonts/Roboto-Bold.ttf", (json) => {
                    const fontLoader = new FontLoader();
                    const roboto_font = fontLoader.parse(json);
                    this.obj.geometry.dispose();
                    this.obj.geometry = new TextGeometry(text, { height: height, size: size, font: roboto_font});
                    this.obj.geometry.center();
                });
            }
        }

        class Model
        {
            constructor(pos, rot, scene) {
                this.model_obj = null;
                this.mixer = null;
                this.loader = new GLTFLoader();
                this.loader.load('/assets/models/Xbot.glb', (gltf) => {
                    this.model_obj = gltf.scene;
                    this.model_obj.scale.set(300, 300, 300);
                    this.model_obj.rotation.x = 90 * (Math.PI / 180);
                    this.model_obj.rotation.y = rot;
                    this.model_obj.position.set(pos.x, pos.y, -330);
                    this.mixer = new THREE.AnimationMixer( this.model_obj );
                    const action = this.mixer.clipAction( gltf.animations[ 0 ] );
                    action.play();
                    scene.add(this.model_obj);
                });
            }
        }

        class spotlight
        {
            constructor(pos, target, color, scene) {
                this.obj = new THREE.SpotLight(color, 4000000, 0, Math.PI/40, 0.4);
                scene.add(this.obj);
                this.obj.position.set(pos.x, pos.y, 1000);
                this.obj.target.position.set(Ball.obj.position.x, Ball.obj.position.y, 0);
                this.obj.target.position.x = target.x;
                this.obj.target.position.y = target.y + 800;
                this.obj.target.position.z = -400;
                scene.add(this.obj.target);
            }
        }

        class time
        {
            constructor() {
                this.lastTime = 0;
                this.time;
                this.dt;
                this.fps;
                this.i = -1;
                this.clock = new THREE.Clock();
                this.dt_fps;
            }

            update = function ()
            {
                this.time = performance.now();
                this.dt = this.time - this.lastTime;
                this.lastTime = this.time;
            };

            update_draw = function ()
            {
                this.dt_fps = this.clock.getDelta();
            };

            draw_fps = function ()
            {
                if (parseInt(this.time_fps / 500) != this.i)
                {
                    this.i++;
                    this.fps = 1000 / this.dt_fps;
                    this.dt_fps = 0;
                }
            };
        }

        class camera
        {
            constructor() {
                this.obj = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 1, 5000); //FOV, Aspect Ratio, Near, Far
                this.obj.position.set(grid_width / 2, grid_height / 2 - 1000, 1200);
                this.obj.lookAt(grid_width / 2, grid_height / 2, 0);
            }

            changeAspect = function (aspect) {
                this.obj.aspect = aspect;
            };

            start = function () {
                this.time_start = Time.time;
                this.ball_x_start = Ball.pos.x;
                this.position_x_start = this.obj.position.x;
                this.rotation_z_start = this.obj.rotation.z;
            };

            pause = function () {
                this.time_start = Time.time - this.time;
            }

            centering = function () {
                this.time = Time.time - this.time_start;
                this.obj.position.x = grid_width / 2 - (this.position_x_start - grid_width / 2) * (this.time - 3000) / 3000;
                this.obj.lookAt(grid_width / 2, grid_height / 2, 0);
                this.obj.rotation.z = -this.rotation_z_start * (this.time - 3000) / 3000;
            };
            
            update = function () {
                if (countdown_status == 0)
                {
                    this.obj.position.x = grid_width / 2 + (Ball.pos.x - grid_width / 2) / 10;
                    this.obj.lookAt(grid_width / 2, grid_height / 2, 0);
                    this.obj.rotation.z = (Ball.pos.x - grid_width / 2) * Math.PI / (1920 * 20);
                }
            };
        }

        class AmbiantLight
        {
            constructor(scene) {
                this.obj = new THREE.PointLight(0xffffff, 250000);
                scene.add(this.obj);
                this.obj.position.set(grid_width / 2, grid_height / 2 - 400, 1000);
            }
        }

        function gameUpdate()
        {
            Time.update();
            if (pause_status == 0)
            {
                if (begin == true)
                    Ball.update();
                Paddle1.update();
                Paddle2.update();
            }
        }

        function gameDraw()
        {
            Time.update_draw();
            if ( P1_model.model_obj )
                P1_model.mixer.update( Time.dt_fps );
            if ( P2_model.model_obj )
                P2_model.mixer.update( Time.dt_fps );
            //Camera.update();
            //if (pause_status)
                //Camera.pause();
            //fps.update();
            //renderer.render(scene, Camera.obj);
            composer.render();
            if (!finish_animation && window.in_local_game == 1)
                window.requestAnimationFrame(gameDraw);
            else
                clearInterval(repeat);
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000515);
        const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true});
        const Camera = new camera();
        const composer = new EffectComposer( renderer );
		composer.setPixelRatio( window.devicePixelRatio );
        const renderpass = new RenderPass(scene, Camera.obj);
        const fxaapass = new ShaderPass( FXAAShader );
        //const luminosityEffect = new ShaderPass(LuminosityShader);
        //const sobelEffect = new ShaderPass(SobelOperatorShader);
        //sobelEffect.uniforms["resolution"].value.x = window.innerWidth * window.devicePixelRatio;
        //sobelEffect.uniforms["resolution"].value.y = window.innerHeight * window.devicePixelRatio;
        //const colorify = new ShaderPass(ColorifyShader);
        //colorify.uniforms["color"].value.setRGB(1,0,0);
        const bloompass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.3, 0.05);
        composer.addPass(renderpass);
        composer.addPass(fxaapass);
        //composer.addPass(luminosityEffect);
        //composer.addPass(sobelEffect);
        //composer.addPass(colorify);
        composer.addPass(bloompass);
        //let fps = new Stats();
        //document.body.appendChild( fps.dom );

        const light = new AmbiantLight(scene);
        const Countdown = new countdown(scene);
        const Btn_continue = new btn_continue();
        const Btn_end = new btn_end();
        const Btn_next = new btn_next();
        const Time = new time();
        const Paddle1 = new paddle(vector(paddle1_X_start, paddle1_Y_start), P1_KEYS, P1_TOUCH, scene);
        const Paddle2 = new paddle(vector(paddle2_X_start, paddle2_Y_start), P2_KEYS, P2_TOUCH, scene);
        const P1_score = new score(vector(p1_score_X, p1_score_Y), scene);
        const P2_score = new score(vector(p2_score_X, p2_score_Y), scene);
        const Ball = new ball(scene);
        const Playground = new playground(scene);
        const P1_name = new name(player1.username, vector(p1_name_X, p1_name_Y), p1_name_rotation, scene);
        const P2_name = new name(player2.username, vector(p2_name_X, p2_name_Y), p2_name_rotation, scene);
        const P1_model = new Model(vector(p1_model_X, p1_model_Y), p1_model_rotation, scene);
        const P2_model = new Model(vector(p2_model_X, p2_model_Y), p2_model_rotation, scene);
        const Spotlight1 = new spotlight(vector(grid_width / 2, 0), vector(p1_name_X, p1_name_Y), 0xffffff, scene);
        const Spotlight2 = new spotlight(vector(grid_width / 2, 0), vector(p2_name_X, p2_name_Y), 0xffffff, scene);

        update_canvas(Camera);
        window.requestAnimationFrame(gameDraw);
        Time.update();
        let repeat = setInterval(gameUpdate);
        Countdown.start();
    }
}

export default PongGame;
