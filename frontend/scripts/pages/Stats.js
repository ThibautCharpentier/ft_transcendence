import Utils from '/services/Utils.js'
import Navbar from '/scripts/Navbar.js'
import Request from '/services/Request.js'

function addInfos()
{
    let successRate = (window.currentUser.victory * 100) / window.currentUser.games;

    if (isNaN(successRate))
        successRate = 0;
    document.getElementById("nbrGames").textContent = window.currentUser.games;
    document.getElementById("successRate").textContent = successRate.toFixed(0) + "%";
    document.getElementById("victory").textContent = window.currentUser.victory;
    document.getElementById("winStreak").textContent = window.currentUser.winStreak;
    document.getElementById("bestWinStreak").textContent = window.currentUser.biggestWinStreak + " 🔥";
    document.getElementById("nbrTournaments").textContent = window.currentUser.tournaments;
    document.getElementById("victoryInTournaments").textContent = window.currentUser.winInTournaments;
    document.getElementById("winStreakInTournaments").textContent = window.currentUser.winStreakInTournament;
    document.getElementById("bestWinStreakInTournaments").textContent = window.currentUser.biggestWinStreakInTournament + " 🔥";
}

let Stats = {

    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/stats.html").then((data) => data.text());
        return view
    }
    , after_render: async () => {
        Utils.activeLinkNavbar("navStats");
        if (window.socket_followed == null)
            await Utils.socketFollowed();
        if (window.socket_token == null)
            await Utils.socketToken();
        if (window.in_local_game == 1)
        {
            Request.updateStatus("online");
            window.in_local_game = 0;
            window.location.reload();
        }
        if (window.socket_pong != null)
        {
            Request.updateStatus("online");
            window.socket_pong.close();
        }
        await Utils.getMyProfile();
        Utils.deleteJTCookies();
        if (document.querySelector("#navNotification span").classList.contains("d-none"))
            Utils.addNotifOrNot();
        addInfos();
        Utils.displayPage("divStats");
    }
}

export default Stats;
