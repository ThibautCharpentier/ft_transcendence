import Utils from '/services/Utils.js'
import Navbar from '/scripts/Navbar.js'
import PongGame from '/scripts/pages/PongGame.js'
import ModalAddPlayer from '/scripts/ModalAddPlayer.js'
import Request from '/services/Request.js'

export async function openModal(idDiv) {
    let mainDiv = document.getElementsByClassName(idDiv);
    const modal = await fetch("./views/modals/modalAddPlayer.html").then((data) => data.text());

    mainDiv[0].insertAdjacentHTML("beforeend", modal);
    await ModalAddPlayer.mainModal();
}

function addInfosPlayer() {
    let firstPlayer = document.getElementById("firstPlayer");

    if (window.currentUser.avatar)
        firstPlayer.querySelector('img').src = `data:image/png;base64, ${window.currentUser.avatar}`;
    else
        firstPlayer.querySelector('img').src = "./assets/img_avatar.png"
    firstPlayer.querySelector('h4').textContent = window.currentUser.username;
}

async function openGame(firstPlayer, secondPlayer) {
    let mainDiv = document.getElementsByClassName("pagePongLocal");
    const modal = await fetch("./views/game/pongGame.html").then((data) => data.text());

    mainDiv[0].insertAdjacentHTML("beforeend", modal);
    await PongGame.gameLocal(firstPlayer, secondPlayer);
}

async function deleteOpponent() {
    let opponent = document.getElementById("divOpponent");

    const obj = {
        id: opponent.getElementsByClassName("player")[0].id
    }

    await axios.post(`https://${window.location.hostname}:8000/auth/pongout`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 200)
            throw new Error('Une erreur est survenue');
        opponent.classList.add("d-none");
        opponent.querySelector("h4").textContent = "";
        opponent.querySelector("img").src = "";
        document.getElementById("btnPlayLocal").classList.add("d-none");
        document.getElementById("divBtnAdd").classList.remove("d-none");
    })
    .catch((err) => {
        console.log(err);
    });
}

let PongLocal = {

    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/game/pongLocal.html").then((data) => data.text());
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
                
                content: "<ul><li>Un match se joue en <B>7 points gagnants</B></li> <li>Le joueur de gauche dirige son paddle avec les touches <B>W</B> et <B>S</B></li> <li>Le joueur de droite dirige son paddle avec les touches <B>flèches</B> ↑ et ↓ </li> <li>Le jeu se met en pause si la page n'est plus active</li>"
            })
        })
        addInfosPlayer();
        document.getElementById("btnAddPlayer").addEventListener("click", () => {
            openModal("pagePongLocal");
        })
        document.getElementById("btnPlayLocal").addEventListener("click", () => {
            let firstPlayer = {username: window.currentUser.username, id: window.currentUser.id};
            let secondPlayer = {username: document.querySelector("#divOpponent h4").textContent, id: document.querySelector("#divOpponent .player").id};

            document.getElementById("beforeGame").remove();
            document.querySelector("nav").remove();
            openGame(firstPlayer, secondPlayer);
        })
        document.getElementById("btnDeleteOpponent").addEventListener("click", () => {
            deleteOpponent();
        })
    }
}

export default PongLocal;
