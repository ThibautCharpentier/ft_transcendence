import Utils from '/services/Utils.js'
import Navbar from '/scripts/Navbar.js'
import { openModal } from '/scripts/pages/PongLocal.js'
import PongGame from '/scripts/pages/PongGame.js'
import Request from '/services/Request.js'

function addInfosPlayer() {
    if (window.currentUser.avatar)
        document.querySelector('ul img').src = `data:image/png;base64, ${window.currentUser.avatar}`;
    else
        document.querySelector('ul img').src = "./assets/img_avatar.png"
    document.querySelector('ul .card-friend').id = window.currentUser.id;
    document.querySelector('ul h4').textContent = window.currentUser.username;
}

async function openGame(tabUsername) {
    let mainDiv = document.getElementsByClassName("pong-tournament");
    const viewGame = await fetch("./views/game/lobby.html").then((data) => data.text());

    mainDiv[0].insertAdjacentHTML("beforeend", viewGame);
    await PongGame.gameTournamentLocal(tabUsername);
}

let PongTournament = {
    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/game/pongTournament.html").then((data) => data.text());
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
                content: "<ul><li>Un tournoi se joue entre <B>3 et 7 joueurs</B></li> <li>Tous les participants s'affrontent en 1vs1 </li> <li>Le joueur de gauche dirige son paddle avec les touches <B>W</B> et <B>S</B></li> <li>Le joueur de droite dirige son paddle avec les touches <B>flèches</B> ↑ et ↓ </li> <li>Le tournoi se termine quand tous les duels ont été joués</li> <li>Si il y a des joueurs à égalité, ils s'affrontent dans des duels bonus pour être départagés</li></ul>"
            })
        })
        addInfosPlayer();
        document.getElementById("btnAddPlayer").addEventListener("click", () => {
            openModal("pong-tournament");
        })
        document.getElementById("btnLaunchTournament").addEventListener("click", () => {
            let elements = document.querySelectorAll(".card-friend");
            let tabUser = [];

            elements.forEach(function(element) {
                let objectUser = {
                username: element.querySelector("h4").textContent, 
                id: element.id
                };
                tabUser.push(objectUser);
            })
            document.getElementById("beforeGame").remove();
            document.querySelector("nav").remove();  
            openGame(tabUser);
        })
    }
}

export default PongTournament
