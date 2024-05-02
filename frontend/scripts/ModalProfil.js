import { addMatchInfos } from "./pages/History.js"
import { deleteCardFriend, getFriends } from "./pages/Friends.js"
import Request from '/services/Request.js'

function addInfosGames(data) {
    if (data.avatar != null)
        document.getElementById("mainAvatar").src = `data:image/png;base64, ${data.avatar}`;
    else
        document.getElementById("mainAvatar").src = "./assets/img_avatar.png";
    document.getElementById("username").textContent = data.username;
    document.getElementById("gamePlayed").textContent = data.games;
    document.getElementById("successNbr").textContent = data.victory;
    document.getElementById("winStreak").textContent = data.biggestWinStreak;
}

export function closeModal() {
    let modal = document.getElementById("myModal");
    let btnClose = document.getElementById("btnCloseModal")
    
    btnClose.onclick = function() {
        modal.remove();
    }
    window.onclick = function(event) {
        if (event.target == modal)
          modal.remove();
    }
}

const ModalProfil = {
    mainModal: async (id) => {
        let follows;
        let data;
        let indexFollows = 0;
        let username;
        
        closeModal();
        follows = await Request.getFollows();
        if (!follows)
            return ;
        for (indexFollows; indexFollows < follows.length; indexFollows++) {
            if (follows[indexFollows].id == id) {
                document.getElementById("btnModalDeleteFriend").classList.remove("d-none");
                document.getElementById("btnModalAddFriend").classList.add("d-none");
                break ;
            }
        }
        if (indexFollows === follows.length || follows.length === 0) {
            document.getElementById("btnModalAddFriend").classList.remove("d-none");
            document.getElementById("btnModalDeleteFriend").classList.add("d-none");
        }
        data = await Request.getOtherProfil(id);
        if (data) {
            addInfosGames(data);
            username = data.username;
        }

        await axios.get(`https://${window.location.hostname}:8000/history/getothergames?id=${id}`, {
            withCredentials: true,
        })
        .then(async (res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            if (res.data.length === 0)
                document.getElementById("msgEmptyHistory").classList.remove("d-none");
            else {
                for (let i in res.data) {
                    await addMatchInfos(res.data[i], "Modal" + i, "listMatchsModal", id);
                }
            }
        })
        .catch((err) => {
            console.log(err);
        });

        document.getElementById("btnModalDeleteFriend").addEventListener("click", async () => {
            let url = window.location.hash;
            
            if (await Request.deleteFriend(id)) {
                if (url.indexOf("friends") != -1)
                    deleteCardFriend(id);
                document.getElementById("btnModalDeleteFriend").classList.add("d-none");
                document.getElementById("btnModalAddFriend").classList.remove("d-none");
            }
        })

        document.getElementById("btnModalAddFriend").addEventListener("click", async ()  => {

            if (await Request.requestFriend(username)) {
                document.getElementById("btnModalWaitingFriend").classList.remove("d-none");
                document.getElementById("btnModalAddFriend").classList.add("d-none");
            }
        })
        document.getElementById("myModal").classList.remove("d-none");
    }
}

export default ModalProfil;
