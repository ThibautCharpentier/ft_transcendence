import Utils from '/services/Utils.js'
import ModalProfil from '/scripts/ModalProfil.js'
import Request from '/services/Request.js'

async function openModalProfil(idProfil) {
    let mainDiv;
    const modal = await fetch("./views/modals/modalProfil").then((data) => data.text());
    let url = window.location.hash;

    if (url.indexOf("friends") != -1)
        mainDiv = document.getElementById("divDashboardFriend");
    else if (url.indexOf("history") != -1)
        mainDiv = document.getElementById("divHistory");
    mainDiv.insertAdjacentHTML("beforeend", modal);
    await ModalProfil.mainModal(idProfil);
}

async function addPong(matchInfos, idMatchs, idProfil)
{
    let list = document.getElementById(idMatchs);
    let idOpponent;
    let match;
    let elementResult;
    const view = await fetch("./views/history/cardHistoryPong.html").then((data) => data.text());

    list.insertAdjacentHTML("beforeend", view);
    match = list.lastChild;
    elementResult = match.getElementsByClassName("result")[0];
    if (matchInfos.matchType === "online")
        match.getElementsByClassName("matchType")[0].textContent = "en ligne";
    else
        match.getElementsByClassName("matchType")[0].textContent = "local";
    match.getElementsByClassName("date")[0].textContent = matchInfos.date;
    if (matchInfos.winnerId == idProfil) {
        elementResult.textContent = "Gagné";
        elementResult.style.color = "rgb(111, 223, 126)"
        match.getElementsByClassName("score")[0].textContent = "7 - " + matchInfos.looserScore;
        match.getElementsByClassName("usernameOpponent")[0].textContent = matchInfos.looser;
        idOpponent = matchInfos.looserId;
        if (matchInfos.looserAvatar != null)
            match.getElementsByClassName("avatarOpponent")[0].src = `data:image/png;base64, ${matchInfos.looserAvatar}`;
    }
    else {
        elementResult.textContent = "Perdu";
        elementResult.style.color = "#f06d6d"
        match.getElementsByClassName("score")[0].textContent = matchInfos.looserScore + " - 7";
        match.getElementsByClassName("usernameOpponent")[0].textContent = matchInfos.winner;
        idOpponent = matchInfos.winnerId;
        if (matchInfos.winnerAvatar != null)
            match.getElementsByClassName("avatarOpponent")[0].src = `data:image/png;base64, ${matchInfos.winnerAvatar}`;
    }
    if (idOpponent === window.currentUser.id)
        match.getElementsByClassName("avatarOpponent")[0].style.cursor = "default";
    else {
        match.getElementsByClassName("avatarOpponent")[0].addEventListener("click", () => {
            let modal = document.getElementById("myModal")

            if (modal)
                modal.remove();
            openModalProfil(idOpponent);
        })
    }
}

async function addCardOpponent(idPlayers, avatarPlayers, usernamePlayers, i, match, idUser) {
    let listOpponent = match.getElementsByClassName("card-opponent")[0];
    let cardOpponent;
    const card = await fetch("./views/history/cardTournamentOpponent.html").then((data) => data.text());

    listOpponent.insertAdjacentHTML("beforeend", card);
    cardOpponent = listOpponent.lastChild;
    if (avatarPlayers[i] != null)
        cardOpponent.getElementsByClassName("avatarOpponent")[0].src = `data:image/png;base64, ${avatarPlayers[i]}`;
    if (i === 1)
        cardOpponent.getElementsByClassName("rank")[0].setAttribute("src", "./assets/second.png");
    else if (i === 2)
        cardOpponent.getElementsByClassName("rank")[0].setAttribute("src", "./assets/third.png");
    else
        cardOpponent.getElementsByClassName("rank")[0].classList.add("d-none");
    cardOpponent.getElementsByClassName("usernameOpponent")[0].textContent = usernamePlayers[i];
    if (idPlayers[i] == idUser)
        match.getElementsByClassName("score")[0].textContent = i + 1 + "ème";
    if (idPlayers[i] == window.currentUser.id || idPlayers[i] == idUser)
        cardOpponent.getElementsByClassName("avatarOpponent")[0].style.cursor = "default";
    else {
        cardOpponent.getElementsByClassName("avatarOpponent")[0].addEventListener("click", () => {
            let modal = document.getElementById("myModal")

            if (modal)
                modal.remove();
            openModalProfil(idPlayers[i]);
        })
    }
}

async function addTournament(matchInfos, idCard, idMatchs, idUser)
{
    let list = document.getElementById(idMatchs);
    let match;
    let elementResult;
    let players = matchInfos.players;
    let idPlayers = matchInfos.id;
    let avatarPlayers = matchInfos.avatars;
    const view = await fetch("./views/history/cardHistoryTournament.html").then((data) => data.text());

    list.insertAdjacentHTML("beforeend", view);
    match = list.lastChild;
    elementResult = match.getElementsByClassName("result")[0];
    match.getElementsByClassName("date")[0].textContent = matchInfos.date;
    match.getElementsByClassName("nbrPlayers")[0].textContent = Object.keys(matchInfos.players).length + " joueurs";
    if (idPlayers[0] ==  idUser) {
        elementResult.textContent = "Gagné";
        elementResult.style.color = "rgb(111, 223, 126)"
        match.getElementsByClassName("score")[0].textContent = "1er";
    }
    else {
        elementResult.textContent = "Perdu";
        elementResult.style.color = "#f06d6d"
    }
    if (avatarPlayers[0] != null)
        match.getElementsByClassName("avatarFirst")[0].src = `data:image/png;base64, ${avatarPlayers[0]}`;
    match.getElementsByClassName("usernameFirst")[0].textContent = players[0];
    for (let i = 1; i < players.length; i++) {
        await addCardOpponent(idPlayers, avatarPlayers, players, i, match, idUser);
    }
    if (idPlayers[0] == idUser || idPlayers[0] == window.currentUser.id) 
        match.getElementsByClassName("avatarFirst")[0].style.cursor = "default";
    else {
        match.getElementsByClassName("avatarFirst")[0].addEventListener("click", () => {
        let modal = document.getElementById("myModal");
        if (modal)
            modal.remove();
        openModalProfil(idPlayers[0]);
        });
    }
    document.getElementById("btnDown").setAttribute("data-bs-target", "#collapse" + idCard);
    document.getElementById("btnDown").setAttribute("aria-controls", "collapse" + idCard);
    document.getElementById("btnDown").id = "btnDown" + idCard;
    document.getElementById("collapseExample").id = "collapse" + idCard;
    
}

export async function addMatchInfos(matchInfos, idCard, idMatchs, idUser) {
    if (matchInfos.matchType != null)
        await addPong(matchInfos, idMatchs, idUser);
    else
        await addTournament(matchInfos, idCard, idMatchs, idUser);
}

let History = {

    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/history/history.html").then((data) => data.text());
        return view
    }

    , after_render: async () => {
        Utils.activeLinkNavbar("navHistory");
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
        Utils.deleteJTCookies();
        if (window.currentUser == null)
            await Utils.getMyProfile();
        if (document.querySelector("#navNotification span").classList.contains("d-none"))
            Utils.addNotifOrNot();
        await axios.get(`https://${window.location.hostname}:8000/history/getmygames`, {
            withCredentials: true,
        })
        .then(async (res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            if (res.data.length != 0)
                document.getElementById("EmptyHistory").classList.add("d-none")
            for (let i in res.data) {
                await addMatchInfos(res.data[i], "History" + i, "listMatchs", window.currentUser.id);
            }
        })
        .catch((err) => {
            console.log(err);
        });
        Utils.displayPage("divHistory");
    }
}

export default History;
