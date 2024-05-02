import Request from '/services/Request.js'
import Utils from '/services/Utils.js' 
import { closeModal } from '/scripts/ModalProfil.js' 


async function deletePlayer(target) {
    let parentLi = target.closest('li');
    
    const obj = {
        id: parentLi.id
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
        parentLi.remove();
    })
    .catch((err) => {
        console.log(err);
    });
}

async function addPlayerPong(username, id) {
    let opponent = document.getElementById("divOpponent");
    let infosOpponent;
    
    infosOpponent = await Request.getOtherProfil(id);
    if (infosOpponent) {
        if (infosOpponent.avatar)
            opponent.querySelector('img').src = `data:image/png;base64, ${infosOpponent.avatar}`;
        else
            opponent.querySelector('img').src = "./assets/img_avatar.png";
        opponent.getElementsByClassName("player")[0].id = id;
        opponent.querySelector('h4').textContent = username;
        document.getElementById("divBtnAdd").classList.add("d-none");
        document.getElementById("btnPlayLocal").classList.remove("d-none");
        opponent.classList.remove("d-none");
    }
}

function checkNbrPlayer(nbrPlayer) {
    if (nbrPlayer === 1)
        document.getElementById("nbrPlayers").textContent = nbrPlayer + " joueur enregistré";
    else
        document.getElementById("nbrPlayers").textContent = nbrPlayer + " joueurs enregistrés";
    
    switch (nbrPlayer) {
        case 2:
            document.getElementById("divBtnLaunchTournament").classList.add("d-none");
            break;
        case 3:
            document.getElementById("divBtnLaunchTournament").classList.remove("d-none");
            break;
        case 6:
            document.getElementById("divBtnAddPlayer").classList.remove("d-none");
            break;
        case 7:
            document.getElementById("divBtnAddPlayer").classList.add("d-none");
            break;
        default:
            break;
    }
}

async function addPlayerTournament(username, id) {
    let listPlayers = document.getElementById("listPlayers");
    let infosOpponent;
    let cardPlayer = "<li class='d-flex mx-2 card-friend rounded-pill mt-1 justify-content-start align-items-center p-3 mt-3'><img src='./assets/img_avatar.png' class='rounded-circle avatar' alt='avatar'><h4 class='mt-2 mb-1 username ms-3 h4 text-white text-center '>" + username + "</h4><div class='w-100 d-flex justify-content-end'><i class='bi bi-x-lg h3 mt-2 btnDeletePlayer'></i></div></li>";
    let nbrCard;
    
    infosOpponent = await Request.getOtherProfil(id);
    if (infosOpponent) {
        listPlayers.insertAdjacentHTML("beforeend", cardPlayer);
        nbrCard = listPlayers.getElementsByClassName("card-friend").length
        checkNbrPlayer(nbrCard);
        listPlayers.getElementsByClassName("card-friend")[nbrCard - 1].id = id;
        if (infosOpponent.avatar)
            listPlayers.getElementsByClassName("avatar")[nbrCard - 1].src = `data:image/png;base64, ${infosOpponent.avatar}`;
        else
            listPlayers.getElementsByClassName("avatar")[nbrCard - 1].src = "./assets/img_avatar.png";
        
        document.getElementsByClassName("btnDeletePlayer")[nbrCard - 2].addEventListener("click", async (event) => {
            await deletePlayer(event.target);
            checkNbrPlayer(listPlayers.getElementsByClassName("card-friend").length);
        })
    }
}

function checkRegisteredPlayers(newUserId) {
    let elements = document.querySelectorAll(".card-friend");
    let tabUsername = [];
    let chaineUserId = newUserId.toString();

    elements.forEach(function(element) {
        tabUsername.push(element.id);
    })
    if (tabUsername.indexOf(chaineUserId) != -1) {
        return (0)
    }
    return (1);
}

function checkError(userName, password)
{
    let errUserName = "";
    let errPassword = "";

    if (userName.length === 0)
        errUserName = "Veuillez entrer un nom d'utilisateur";
    if (password.length === 0)
        errPassword = "Veuillez entrer un mot de passe";
    if (errUserName.length != 0)
        document.getElementById("errUserName").textContent = errUserName;
    else
        document.getElementById("errUserName").textContent = "";
    if (errPassword.length != 0)
        document.getElementById("errPassword").textContent = errPassword;
    else
        document.getElementById("errPassword").textContent = "";
    if (errUserName.length === 0 && errPassword.length === 0)
        return (0)
    return (1)
}

async function checkAndAddPlayer()
{
    let password = DOMPurify.sanitize(document.Form.password.value);
    let userName = DOMPurify.sanitize(document.Form.userName.value);
    let modal = document.getElementById("myModal");

    if (userName === window.currentUser.username) {
        document.getElementById("errUserName").textContent = "Ce joueur participe déjà"
        return ;
    }

    if (checkError(userName, password))
        return ;

    const obj = {
        username: userName,
        password: password,
    }

    axios.post(`https://${window.location.hostname}:8000/auth/pong`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 200)
            throw new Error('Une erreur est survenue');
        if (window.location.hash.indexOf("pong-local") != -1)
            addPlayerPong(userName, res.data['id']);
        else if (window.location.hash.indexOf("pong-tournament") != -1) {
            if (!checkRegisteredPlayers(res.data['id'])) {
                document.getElementById("errUserName").textContent = "Ce joueur participe déjà"
                return ;
            }
            addPlayerTournament(userName, res.data['id']);
        }
        modal.remove();
    })
    .catch((err) => {
        console.log(err);
        if (err.response && err.response.data)
        {
            if (err.response.data == "Invalid password")
                document.getElementById("errPassword").textContent = "Mot de passe invalide";
            else if (err.response.data == "Invalid username")
                document.getElementById("errUserName").textContent = "Nom d'utilisateur invalide";
            else if (err.response.data == "Invalid data")
                document.getElementById("errServ").textContent = "Formulaire invalide";
        }
    });
}

async function validWithKey(event) {
    if (event.key === "Enter") {
        if (document.activeElement.id === "userName" || document.activeElement.id === "password")
            await checkAndAddPlayer();
    }
};

const ModalAddPlayer = {
    mainModal: async () => {
        const tabInput = ["userName", "password"];
        const tabErr = ["errUserName", "errPassword"];

        Utils.resetErr(tabInput, tabErr)
        closeModal();
        document.getElementById("submit").addEventListener("click", () => {
            checkAndAddPlayer();
        });

        document.getElementById("userName").addEventListener("keyup", validWithKey);
        document.getElementById("password").addEventListener("keyup", validWithKey);
    }
}

export default ModalAddPlayer
