import { updateInfosFollowedSocket, updateRemoveFriendSocket } from "/scripts/pages/Friends.js";
import { updateInvitFriendsNotif, removeInvitFriendsNotif } from "/scripts/ModalNotifications.js";
import Request from '/services/Request.js'

class userData {
    constructor(data) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }
    }
}

const Utils = { 
    getCookie: (name) => {
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++)
        {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '='))
                return cookie.substring(name.length + 1);
        }
        return null;
    }
    , deleteJTCookies: () => {
        const nameCookies = ["J2_token", "J3_token", "J4_token", "J5_token", "J6_token", "J7_token"];

        for (let i = 0; i < nameCookies.length; i++) {
            if (Utils.getCookie(nameCookies[i]) != null)
                document.cookie = `${nameCookies[i]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    }
    , isConnected: async (redirect, page) => {
        let result = await axios.get(`https://${window.location.hostname}:8000/auth/myconnection`, {
            withCredentials: true,
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            if (window.currentUser != null && window.currentUser.id != res.data)
                window.currentUser = null;
            return true;
        })
        .catch((err) => {
            if (err.response && err.response.status && (err.response.status == 403 || err.response.status == 401))
            {
                return axios.post(`https://${window.location.hostname}:8000/auth/refresh`, null, {
                    withCredentials: true,
                    headers: {
                        'X-CSRFToken': Utils.getCookie('csrf_token'),
                    }
                })
                .then((res) => {
                    if (res.status != 200)
                        throw new Error('Une erreur est survenue');
                    return true;
                })
                .catch((err) => {
                    console.log(err);
                    return false;
                })
            }
            return false;
        });
        if (redirect == result)
        {
            if (page == "#/signin")
            {
                if (window.socket_token != null)
                    window.socket_token.close();
                if (window.socket_followed != null)
                    window.socket_followed.close();
            }
            window.location.href = page;
            return false;
        }
        return true;
    }
    , getMyProfile : async () => {
        await axios.get(`https://${window.location.hostname}:8000/profile/getmyprofile`, {
            withCredentials: true,
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            const currentUser = new userData(res.data);
            window.currentUser = currentUser;            
        })
        .catch((err) => {
            console.log(err);
        });
    }
    , resetErr: (tabInput, tabErr) => {
        for (let i = 0; i < tabInput.length ; i++) {
            document.getElementById(tabInput[i]).addEventListener("click", () => {
                document.getElementById([tabErr[i]]).textContent = "";
                document.getElementById(tabInput[i]).classList.remove("valid");
            })
        }
    }
    , socketToken: () => {
        const socket = new WebSocket(`wss://${window.location.hostname}:8000/ws/accesstoken`);
        let repeat;

        socket.onopen = function(event) {
            repeat = setInterval(() => {
                socket.send("");
            }, 50000);
        };

        socket.onmessage = function(event) {
            axios.post(`https://${window.location.hostname}:8000/auth/refresh`, null, {
                withCredentials: true,
                headers: {
                    'X-CSRFToken': Utils.getCookie('csrf_token'),
                }
            })
            .then((res) => {
                if (res.status != 200)
                    throw new Error('Une erreur est survenue');
                setTimeout(Utils.socketToken, 3000);
            })
            .catch((err) => {
                console.log(err);
            })
            socket.close();
        };
        
        socket.onclose = function(event) {
            clearInterval(repeat);
            window.socket_token = null;
        };

        socket.onerror = function(event) {
            console.error('erreur de connexion :', event);
            clearInterval(repeat);
            window.socket_token = null;
        };
        
        window.socket_token = socket;
    }
    , socketFollowed: () => {
        const socket = new WebSocket(`wss://${window.location.hostname}:8000/ws/getfollowed`);
        let repeat;

        socket.onopen = function(event) {
            repeat = setInterval(() => {
                socket.send("");
            }, 100);
        };

        socket.onmessage = function(event) {
            try {
                const dataObject = JSON.parse(event.data);
                if (window.location.hash.indexOf("friends") != -1 && dataObject[0] != null)
                    updateRemoveFriendSocket(dataObject[0]);
                if (document.getElementById("modal-notifications") && dataObject[2])
                    removeInvitFriendsNotif(dataObject[2]);
                if (document.querySelector("nav") && (dataObject[2] || dataObject[3]))
                    Utils.addNotifOrNot();
                if (window.location.hash.indexOf("friends") != -1 && dataObject[1])
                    updateInfosFollowedSocket(dataObject[1]);
                if (document.getElementById("modal-notifications") && dataObject[3])
                    updateInvitFriendsNotif(dataObject[3]);
            }
            catch (error) {
                console.error("Erreur lors de l'analyse de la chaîne JSON :", error);
            }

        };

        socket.onclose = function(event) {
            clearInterval(repeat);
            window.socket_followed = null;
        };

        socket.onerror = function(event) {
            console.error('erreur de connexion :', event);
            clearInterval(repeat);
            window.socket_followed = null;
        };
        
        window.socket_followed = socket;
    }
    , activeLinkNavbar: (nameDiv) => {
        document.querySelectorAll("nav a").forEach(link => {
            link.classList.remove("item-active", "active");
        })
        if (nameDiv)
            document.getElementById(nameDiv).classList.add("item-active", "active");
    }
    , displayPage: (nameDiv) => {
        if (document.getElementById("spinner"))
            document.getElementById("spinner").remove();
        if (document.getElementById(nameDiv))
            document.getElementById(nameDiv).classList.remove("d-none");
    }
    , addNotifOrNot: async () => {
        let notif = await Request.getNotifs()
        if (notif && document.querySelector("nav")) {
            if (notif.length > 0)
                document.querySelector("#navNotification span").classList.remove("d-none");
            else
                document.querySelector("#navNotification span").classList.add("d-none");
        }
    }
}

export default Utils;
