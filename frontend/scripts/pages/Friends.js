import Utils from '/services/Utils.js'
import ModalProfil from '/scripts/ModalProfil.js'
import Request from '/services/Request.js'

export function updateRemoveFriendSocket(dataFriends) {
    for (let i = 0; i < dataFriends.length; i++) {
        let list = document.querySelectorAll("#listFriends li");
        for (let j = 0; j < list.length; j++) {
            if (list[j].id == dataFriends[i].id) {
                list[j].remove();
                list = document.querySelectorAll("#listFriends li");
                if (list.length === 0)
                        document.getElementById("msgEmptyFriend").classList.remove("d-none");
                break ;
            }
        }
    }
}

export function updateInfosFollowedSocket(dataFollowed) {
    for (let i = 0; i < dataFollowed.length; i++) {
        let listFollowed = document.getElementById(dataFollowed[i].id);
        if (listFollowed) {
            if (dataFollowed[i].avatar)
                listFollowed.getElementsByClassName("avatar")[0].src = `data:image/png;base64, ${dataFollowed[i].avatar}`;
            listFollowed.getElementsByClassName("usernameFriend")[0].textContent = dataFollowed[i].username;
            if (dataFollowed[i].status === "online") 
                addStatusInfos(listFollowed, "en ligne", "statusOnline")
            else if (dataFollowed[i].status === "in game")
                addStatusInfos(listFollowed, "en jeu", "statusIngame")
            else
                addStatusInfos(listFollowed, "hors ligne", "statusOffline")
        }
        else {
            getFriends(dataFollowed[i].id);
        }
    }
}

function removeClassStatus(nameClass, mainElement) {
    mainElement.getElementsByClassName("status")[0].classList.remove(nameClass);
    mainElement.getElementsByClassName("avatar")[0].classList.remove(nameClass);
    mainElement.classList.remove(nameClass);
}

export function addStatusInfos(friend, statusTxt, classColor) {
    removeClassStatus("statusOffline", friend);
    removeClassStatus("statusOnline", friend);
    removeClassStatus("statusIngame", friend);
    friend.getElementsByClassName("status")[0].textContent = statusTxt;
    friend.getElementsByClassName("avatar")[0].classList.add(classColor);
    friend.getElementsByClassName("status")[0].classList.add(classColor);
    friend.classList.add(classColor)
}

async function openModalProfil(event) {
    let liFriend = event.target.closest("li");
    let mainDiv = document.getElementById("divDashboardFriend");
    const modal = await fetch("./views/modals/modalProfil").then((data) => data.text());

    mainDiv.insertAdjacentHTML("beforeend", modal);
    await ModalProfil.mainModal(liFriend.id);
}

export function deleteCardFriend(idFriend) {
    let listFriend;

    document.getElementById(idFriend).remove();
    listFriend = document.getElementsByClassName("card-friend");
    if (listFriend.length === 0)
            document.getElementById("msgEmptyFriend").classList.remove("d-none");
}

async function addCardFriend(dataFriend) {
    let list = document.getElementById("listFriends");
    let friend;
    const card = await fetch("./views/friends/cardFriend.html").then((data) => data.text());

    list.insertAdjacentHTML("beforeend", card);
    friend = list.lastChild;
    friend.id = dataFriend.id;
    friend.getElementsByClassName("usernameFriend")[0].textContent = dataFriend.username;
    if (dataFriend.status === "online") 
        addStatusInfos(friend, "en ligne", "statusOnline")
    else if (dataFriend.status === "in game")
        addStatusInfos(friend, "en jeu", "statusIngame")
    else
        addStatusInfos(friend, "hors ligne", "statusOffline")
    if (dataFriend.avatar != null)
        friend.getElementsByClassName("avatar")[0].src = `data:image/png;base64, ${dataFriend.avatar}`;
    friend.getElementsByClassName("gamesPlayed")[0].textContent = dataFriend.games;
    friend.getElementsByClassName("gamesWon")[0].textContent = dataFriend.victory;
    friend.getElementsByClassName("winStreak")[0].textContent = dataFriend.biggestWinStreak;
    friend.getElementsByClassName("btnDeleteFriend")[0].addEventListener("click", async (event) => {
        let liFriend = event.target.closest("li");
        const idFriend = liFriend.id;
        
        await Request.deleteFriend(idFriend);
    })
    friend.getElementsByClassName("avatar")[0].addEventListener("click", (event) => {
        openModalProfil(event);
    })
}

export async function getFriends(id) {
    let dataFriends;

    dataFriends = await Request.getFollows();
    if (dataFriends) {
        if (dataFriends.length === 0)
            document.getElementById("msgEmptyFriend").classList.remove("d-none");
        else
            document.getElementById("msgEmptyFriend").classList.add("d-none");
        if (id === null) {
            for (let i in dataFriends) {
                addCardFriend(dataFriends[i]);
            }
        }
        else {
            for (let i in dataFriends) {
                if (dataFriends[i].id == id) {
                    addCardFriend(dataFriends[i]);
                    break ;
                }
            }
        }
    }
}

async function addFriend() {
    let username = DOMPurify.sanitize(document.getElementById("usernameFriend").value);
    let sendInvit;

    document.getElementById("errorAddFriend").textContent = "";
    if (username === "") {
        document.getElementById("errorAddFriend").textContent = "Veuillez entrer un nom d'utilsateur";
        document.getElementById("usernameFriend").classList.add("requestNotSend");
        return ;
    }
    if (username === window.currentUser.username) {
        document.getElementById("errorAddFriend").textContent = "Vous ne pouvez pas vous ajouter";
        document.getElementById("usernameFriend").classList.add("requestNotSend");
        return ;
    }
    sendInvit = await Request.requestFriend(username);
    if (sendInvit)
        document.getElementById("usernameFriend").classList.add("requestSend");
    else
        document.getElementById("usernameFriend").classList.add("requestNotSend");
}

async function validWithKey(event) {
    if (event.key === "Enter") { 
            addFriend();
    }
}

let Friends = {
    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/friends/friends.html").then((data) => data.text());
        return view
    }
    , after_render: async () => {
        Utils.activeLinkNavbar("navFriends");
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
        getFriends(null);
        document.getElementById("usernameFriend").addEventListener("click", () => {
            document.getElementById("errorAddFriend").textContent = "";
            document.getElementById("usernameFriend").classList.remove("requestSend");
            document.getElementById("usernameFriend").classList.remove("requestNotSend");
        })

        document.getElementById("btnAddFriend").addEventListener("click", async () => {
            addFriend(); 
        })

        document.getElementById("usernameFriend").addEventListener("keyup", validWithKey);
        Utils.displayPage("divDashboardFriend");
    }
}

export default Friends;
