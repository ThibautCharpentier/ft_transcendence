import Utils from '/services/Utils.js'
import Request from '/services/Request.js'


function resetModeGame() {
    document.getElementById("modeNormal").classList.remove("d-none");
    document.getElementById("modeTournament").classList.remove("d-none");
    document.getElementById("btnModeLocal").classList.add("d-none");
    document.getElementById("btnModeOnline").classList.add("d-none");
    document.getElementById("btnReturn").classList.add("d-none");
}

function addInfos()
{
    document.getElementById("gamePlayed").textContent = window.currentUser.games;
    document.getElementById("username").textContent = window.currentUser.username;
    document.getElementById("successNbr").textContent = window.currentUser.victory;
    document.getElementById("winStreak").textContent = window.currentUser.biggestWinStreak;
    if (window.currentUser.avatar)
        document.getElementById("mainAvatar").src = `data:image/png;base64, ${window.currentUser.avatar}`;
}

let Dashboard = {

    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/dashboard.html").then((data) => data.text());
        return view
    }
    , after_render: async () => {
        Utils.activeLinkNavbar("navMenu");
        if (window.currentUser == null)
            await Utils.getMyProfile();
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
        document.getElementById("ball").classList.add("d-none");
        if (document.querySelector("#navNotification span").classList.contains("d-none"))
            Utils.addNotifOrNot();
        addInfos();
        document.getElementById("modeNormal").addEventListener("click", () => {
            document.getElementById("modeNormal").classList.add("d-none");
            document.getElementById("modeTournament").classList.add("d-none");
            document.getElementById("btnModeLocal").classList.remove("d-none");
            document.getElementById("btnModeOnline").classList.remove("d-none");
            document.getElementById("btnReturn").classList.remove("d-none");
        })

        document.getElementById("btnReturn").addEventListener("click", () => {
            resetModeGame();
        })

        document.getElementById("btnModeLocal").addEventListener("click", () => {
            window.location.href = "/#/pong-local";
        })

        document.getElementById("btnModeOnline").addEventListener("click", () => {
            window.location.href = "/#/pong-online";
        })

        document.getElementById("modeTournament").addEventListener("click", () => {
            window.location.href = "/#/pong-tournament";
        })

        Utils.displayPage("divDashboard");
    }
}

export default Dashboard;
