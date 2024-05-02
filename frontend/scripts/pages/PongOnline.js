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

let in_game = 0;

let PongOnline = {
	render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/game/pongOnline.html").then((data) => data.text());
        return view
    }
    , after_render: async () => {
        Utils.activeLinkNavbar(null);
        if (window.socket_followed == null)
            await Utils.socketFollowed();
        if (window.socket_token == null)
            await Utils.socketToken();
        if (window.socket_pong != null)
        {
            Request.updateStatus("online");
            window.socket_pong.close();
        }
        if (window.in_local_game == 1)
        {
            Request.updateStatus("online");
            window.in_local_game = 0;
            window.location.reload();
        }
        if (window.currentUser == null)
            await Utils.getMyProfile();
        Utils.deleteJTCookies();
        if (document.querySelector("#navNotification span").classList.contains("d-none"))
            Utils.addNotifOrNot();
        let popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        let popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl, {
                title: "<h3 class='text-center mb-0 text-dark'>Règles</h3>",
                content: "<ul><li>Un match se joue en <B>7 points gagnants</B></li> <li>Vous dirigez votre paddle avec les touches <B>flèches</B> ↑ et ↓ </li>"
            })
        })

        if (window.currentUser.avatar != null)
            document.querySelector("#cardPlayer img").src = `data:image/png;base64, ${window.currentUser.avatar}`;
        else
            document.querySelector("#cardPlayer img").src = "./assets/img_avatar.png"
        document.querySelector("#cardPlayer h4").textContent = window.currentUser.username;

        in_game = 0;
		const socket_pong = new WebSocket(`wss://${window.location.hostname}:8000/ws/pongonline`);

		socket_pong.onopen = function(event) {
		};

		socket_pong.onmessage = function(event) {
            var data = JSON.parse(event.data);
			if (data["message"] == "match found")
            {
                let player1 = {username: data["player_1"], id: data["id_1"]};
                let player2 = {username: data["player_2"], id: data["id_2"]};
                Request.updateStatus("in game");
                document.getElementById("beforeGame").classList.add("d-none");
                document.querySelector("nav").remove();
                document.getElementById("gameOnline").classList.remove("d-none");
                PongOnline.startGameOnline(data["player"], player1, player2, data["ball_initial_angle"]);
            }
            else if (data["message"] == "already in queue")
                window.location.href = "#/dashboard"
		};

		socket_pong.onclose = function(event) {
			window.socket_pong = null;
            if (in_game == 1)
                window.location.reload();
		};

		socket_pong.onerror = function(event) {
			console.error('erreur de connexion :', event);
			window.socket_pong = null;
		};

        window.socket_pong = socket_pong;
    }
    , startGameOnline: async (player, player1, player2, ball_initial_angle) => {
        in_game = 1;
        const keysPressed = [];
        const P1_KEY_UP1 = 39; // >
        const P1_KEY_UP2 = 38; // /\
        const P1_KEY_DOWN1 = 37; // <
        const P1_KEY_DOWN2 = 40; // \/
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

        window.socket_pong.onmessage = function(event) {
            var data = JSON.parse(event.data);
            if (data["message"] == "scoring")
            {
                Ball.obj.position.x = data["ball_x"];
                Ball.obj.position.y = grid_height - data["ball_y"];
                Ball.obj.position.z = data["ball_z"];
                if (data["player"] != player && data["player"] == 1)
                {
                    Paddle1.obj.position.x = data["paddle_adv_x"];
                    Paddle1.obj.position.y = grid_height - data["paddle_adv_y"];
                }
                else if (data["player"] != player && data["player" == 2])
                {
                    Paddle2.obj.position.x = data["paddle_adv_x"];
                    Paddle2.obj.position.y = grid_height - data["paddle_adv_y"];
                }
                //Camera.start();
                if (data["scoring"] == 1)
                {
                    P1_score.score++;
                    for (let i = 0; i <= score_max; i++)
                        scene.remove(P1_score.obj[i]);
                    if (P1_score.obj[P1_score.score])
                        scene.add(P1_score.obj[P1_score.score]);
                }
                else
                {
                    P2_score.score++;
                    for (let i = 0; i <= score_max; i++)
                        scene.remove(P2_score.obj[i]);
                    if (P2_score.obj[P2_score.score])
                        scene.add(P2_score.obj[P2_score.score]);
                }
                Countdown.start();
            }
            else if (data["message"] == "countdown")
                Countdown.decrease_countdown(data["count"]);
            else if (data["message"] == "collision")
            {
                Ball.obj.position.x = data["ball_x"];
                Ball.obj.position.y = grid_height - data["ball_y"];
                Ball.obj.position.z = data["ball_z"];
                if (data["player"] != player && data["player"] == 1)
                {
                    Paddle1.obj.position.x = data["paddle_adv_x"];
                    Paddle1.obj.position.y = grid_height - data["paddle_adv_y"];
                    Paddle1.start();
                }
                else if (data["player"] != player && data["player"] == 2)
                {
                    Paddle2.obj.position.x = data["paddle_adv_x"];
                    Paddle2.obj.position.y = grid_height - data["paddle_adv_y"];
                    Paddle2.start();
                }
                else if (data["player"] == player && data["player"] == 1)
                {
                    Paddle1.obj.position.x = data["paddle_x"];
                    Paddle1.obj.position.y = grid_height - data["paddle_y"];
                    Paddle1.start();
                }
                else if (data["player"] == player && data["player"] == 2)
                {
                    Paddle2.obj.position.x = data["paddle_x"];
                    Paddle2.obj.position.y = grid_height - data["paddle_y"];
                    Paddle2.start();
                }
            }
            else if (data["message"] == "check" && data["player"] != player)
            {
                if (data["player"] == 1)
                {
                    Paddle1.obj.position.x = data["paddle_adv_x"];
                    Paddle1.obj.position.y = grid_height - data["paddle_adv_y"];
                }
                else
                {
                    Paddle2.obj.position.x = data["paddle_adv_x"];
                    Paddle2.obj.position.y = grid_height - data["paddle_adv_y"];
                }
            }
            else if (data["message"] == "update")
            {
                Ball.obj.position.x = data["ball_x"];
                Ball.obj.position.y = grid_height - data["ball_y"];
                Ball.obj.position.z = data["ball_z"];
                if (data["player"] == 1)
                {
                    Paddle1.obj.position.x = data["paddle_x"];
                    Paddle1.obj.position.y = grid_height - data["paddle_y"];
                }
                else
                {
                    Paddle2.obj.position.x = data["paddle_x"];
                    Paddle2.obj.position.y = grid_height - data["paddle_y"];
                }
            }
            else if (data["message"] == "finish")
            {
                finish = true;
                finish_animation = true; 
                document.body.style.setProperty('touch-action', 'auto');
                in_game = 0;
                Request.updateStatus("online");
                Utils.getMyProfile();
                Btn_end.display();
            }
		};

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
            if (player == 1)
            {
                if (P1_TOUCH.i == -1 && touchsPressed[event.changedTouches[0].identifier].side == 1)
                    P1_TOUCH.i = event.changedTouches[0].identifier;
            }
            else if (player == 2)
            {
                if (P2_TOUCH.i == -1 && touchsPressed[event.changedTouches[0].identifier].side == 2)
                    P2_TOUCH.i = event.changedTouches[0].identifier;
            }
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

            decrease_countdown = function(count) {
                if (count <= 0)
                {
                    for (let i = 1; i <= 3; i++)
                        scene.remove(this.obj[i]);
                    if (begin == 0)
                        countdown_status = 0;
                    else
                        countdown_status = 2;
                    begin = 1;
                }
                else
                {
                    for (let i = 1; i <= 3; i++)
                        scene.remove(this.obj[i]);
                    if (this.obj[count])
                        scene.add(this.obj[count]);
                }
            }

            start = function() {
                countdown_status = 1;
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
                removeEventListener("keydown", function (event) {keysPressed[event.keyCode] = true;});
                removeEventListener("keyup", function (event) {keysPressed[event.keyCode] = false;});
                removeEventListener("touchstart", touchstart);
                removeEventListener("touchmove", touchmove);
                removeEventListener("touchend", touchend);
                removeEventListener("touchcancel", touchend);
                removeEventListener("resize", update_canvas);
                window.location.href = "/#/dashboard";
            }
        }

        class ball
        {
            constructor(scene) {
                this.pos = vector(ball_X_start, ball_Y_start);
                this.z = 0;
                this.geometry = new THREE.BoxGeometry(ball_size, ball_size, 40);
                this.material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 1});
                this.obj = new THREE.Mesh(this.geometry, this.material);
                scene.add(this.obj);

                this.obj.position.x = this.pos.x;
                this.obj.position.y = grid_height - this.pos.y;
            }

            wall_collision = function() {
                if (this.obj.position.x + ball_radius >= grid_width)
                    this.scoring(0);
                if (this.obj.position.x - ball_radius <= 0)
                    this.scoring(180 * (Math.PI / 180));
            };

            scoring = function(angle) {
                //if (countdown_status == 1)
                //    Camera.centering();
                if (countdown_status == 2)
                    countdown_status = 0;
            }

            update = function () {
                this.wall_collision();
            };
        }

        class paddle
        {
            constructor(pos, keys, touchs, scene) {
                this.pos = pos;
                this.keys = keys;
                this.up = false;
                this.down = false;
                this.touchs = touchs;
                this.geometry = new THREE.BoxGeometry(paddle_width, paddle_height, 40);
                this.material = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6ca8da, emissiveIntensity: 0.2});
                this.emissive_min = this.material.emissiveIntensity;
                this.obj = new THREE.Mesh(this.geometry, this.material);
                scene.add(this.obj);

                this.obj.position.x = this.pos.x;
                this.obj.position.y = grid_height - this.pos.y;
            }

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
            
            update = function (who_playing) {
                if (who_playing == player)
                {
                    this.up = false;
                    this.down = false;
                    if (keysPressed[this.keys.up1] || keysPressed[this.keys.up2] || (this.touchs.i >= 0 && touchsPressed[this.touchs.i].coordY < (grid_height - this.obj.position.y) * (canvas.width / grid_width)))
                        this.up = true;
                    if (keysPressed[this.keys.down1] || keysPressed[this.keys.down2] || (this.touchs.i >= 0 && touchsPressed[this.touchs.i].coordY > (grid_height - this.obj.position.y) * (canvas.height / grid_height)))
                        this.down = true;
                }
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
                this.ball_x_start = Ball.obj.position.x;
                this.position_x_start = this.obj.position.x;
                this.rotation_z_start = this.obj.rotation.z;
            };

            centering = function () {
                this.time = Time.time - this.time_start;
                this.obj.position.x = grid_width / 2 - (this.position_x_start - grid_width / 2) * (this.time - 3000) / 3000;
                this.obj.lookAt(grid_width / 2, grid_height / 2, 0);
                this.obj.rotation.z = -this.rotation_z_start * (this.time - 3000) / 3000;
            };

            pause = function () {
                this.time_start = Time.time - this.time;
            }
            
            update = function () {
                if (countdown_status == 0)
                {
                    this.obj.position.x = grid_width / 2 + (Ball.obj.position.x - grid_width / 2) / 10;
                    this.obj.lookAt(grid_width / 2, grid_height / 2, 0);
                    this.obj.rotation.z = (Ball.obj.position.x - grid_width / 2) * Math.PI / (1920 * 20);
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
            if (begin == 1)
                Ball.update();
            Paddle1.update(1);
            Paddle2.update(2);
            if (finish)
                return
            let obj;
            if (player == 1)
            {
                obj = {
                    up:  Paddle1.up,
                    down: Paddle1.down,
                    message: "check"
                }
            }
            else
            {
                obj = {
                    up:  Paddle2.up,
                    down: Paddle2.down,
                    message: "check"
                }
            }
            window.socket_pong.send(JSON.stringify(obj));
        }

        function gameDraw()
        {
            Time.update_draw();
            if ( P1_model.model_obj )
                P1_model.mixer.update( Time.dt_fps );
            if ( P2_model.model_obj )
                P2_model.mixer.update( Time.dt_fps );
            //Camera.update();
            //fps.update();
            //renderer.render(scene, Camera.obj);
            composer.render();
            if (!finish_animation)
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
        const Btn_end = new btn_end();
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

export default PongOnline;
