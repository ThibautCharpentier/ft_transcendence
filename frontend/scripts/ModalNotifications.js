import { closeModal } from '/scripts/ModalProfil.js'
import Request from '/services/Request.js'
import { getFriends } from "/scripts/pages/Friends.js";

export function removeInvitFriendsNotif(dataInvit) {
    const allInvit = document.querySelectorAll("#modal-notifications li");
    const allIdInvit = [];
    let indexInvit;
    
    for (let i = 0; i < allInvit.length; i++) {
        allIdInvit.push(allInvit[i].id);
    }
    for (let i = 0; i < dataInvit.length; i++) {
        indexInvit = allIdInvit.indexOf(dataInvit[i].id.toString());
        if (indexInvit != -1)
            removeCardNotif(document.querySelectorAll("#modal-notifications li")[indexInvit])
    }
}

export async function updateInvitFriendsNotif(dataInvit) {
    let elementUpdate;
    let notifNotExist;
    
    for (let i = 0; i < dataInvit.length; i++) {
        notifNotExist = checkNotAlreadyExist(dataInvit[i].id)
        if (notifNotExist) {
            let divList = document.getElementById("list-notif");
            const cardNotif = await fetch("./views/modals/cardNotification").then((data) => data.text());

            divList.insertAdjacentHTML("afterbegin", cardNotif);
            addInfoCardNotif(dataInvit[i]);
        }
        else {
            elementUpdate = document.getElementById(dataInvit[i].id);
            elementUpdate.querySelector("h4").textContent = dataInvit[i].username;
            if (dataInvit[i].avatar)
                elementUpdate.querySelector("img").src = `data:image/png;base64, ${dataInvit[i].avatar}`;
            else
                elementUpdate.querySelector("img").src = "./assets/img_avatar.png";
        }
    } 
}

function checkNotAlreadyExist(newNotifId) {
    const allInvit = document.querySelectorAll("#modal-notifications li");
    const allIdInvit = [];
    
    if (allInvit.length == 0)
        return (1);
    for (let i = 0; i < allInvit.length; i++) {
        allIdInvit.push(allInvit[i].id);
    }
    if (allIdInvit.indexOf(newNotifId.toString()) != -1)
        return (0);
    return (1);
}

function removeCardNotif(card) {
    card.remove();
    if (document.querySelectorAll("#list-notif li").length === 0) {
        document.querySelector("#navNotification span").classList.add("d-none");
        document.getElementById("msgEmptyNotif").classList.remove("d-none");
    }
}

function addInfoCardNotif(dataNotif) {
    let cardLi = document.querySelectorAll("#list-notif li")[0];

    cardLi.id = dataNotif.id;
    cardLi.querySelector("h4").textContent = dataNotif.username;
    if (dataNotif.avatar != null)
        cardLi.querySelector("img").src = `data:image/png;base64, ${dataNotif.avatar}`;
    else
        cardLi.querySelector("img").src = "./assets/img_avatar.png"
    cardLi.querySelector(".acceptInvit").addEventListener("click", async (event) => {
        const idInvit = event.target.closest("li").id;

        await Request.confirmFriend(idInvit)
        removeCardNotif(cardLi);
    })
    cardLi.querySelector(".refuseInvit").addEventListener("click", async (event) => {
        const idInvit = event.target.closest("li").id;

        await Request.refuseFriend(idInvit)
        removeCardNotif(cardLi);
    })
    document.getElementById("msgEmptyNotif").classList.add("d-none");
}

async function addListNotif(dataNotif) {
    let divList = document.getElementById("list-notif");
    const cardNotif = await fetch("./views/modals/cardNotification").then((data) => data.text());
    let notifNotExist;

    for (let i = 0; i < dataNotif.length; i ++) {
        notifNotExist = checkNotAlreadyExist(dataNotif[i].id)
        if (notifNotExist) {
            divList.insertAdjacentHTML("afterbegin", cardNotif);
            addInfoCardNotif(dataNotif[i]);
        }
    }
}

const ModalNotifications = {
    mainModal: async () => {
        closeModal();

        const dataNotif = await Request.getNotifs();
        if (dataNotif && dataNotif.length != 0) {
            await addListNotif(dataNotif);
        }
        document.getElementById("myModal").classList.remove("d-none");
    }
}

export default ModalNotifications
