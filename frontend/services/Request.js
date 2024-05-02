import Utils from '/services/Utils.js'

const Request = { 
    deleteFriend : async (idFriend) => {
        const obj = {
            id: idFriend
        }
        return axios.patch(`https://${window.location.hostname}:8000/profile/delfollow`, obj, {
            withCredentials: true,
            headers: {
                'X-CSRFToken': Utils.getCookie('csrf_token'),
            }
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            return (1);
        })
        .catch((err) => {
            console.log(err);
            return (0);
        });
    }
    , requestFriend: async (username) => {
        const obj = {
            username: username
        }

        return axios.patch(`https://${window.location.hostname}:8000/profile/requestfollow`, obj, {
            withCredentials: true,
            headers: {
                'X-CSRFToken': Utils.getCookie('csrf_token'),
            }
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            return (1)
        })
        .catch((err) => {
            console.log(err);
            if (err.response && err.response.data)
            {   
                if (window.location.hash.indexOf("friends") != -1 && !document.getElementById("modal-notifications")) {
                    if (err.response.data === "User already followed")
                        document.getElementById("errorAddFriend").textContent = "Vous êtes ami avec " + obj.username;
                    else if (err.response.data === "Invalid username")
                        document.getElementById("errorAddFriend").textContent = "Cet utilisateur n'existe pas";
                }
            }
            return (0)
        });
    }
    , confirmFriend : async (id) => {
        const obj = {
            id: id
        }

        return axios.patch(`https://${window.location.hostname}:8000/profile/acceptfollow`, obj, {
            withCredentials: true,
            headers: {
                'X-CSRFToken': Utils.getCookie('csrf_token'),
            }
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
        })
        .catch((err) => {
            console.log(err);
        });
    }
    , refuseFriend: async  (id) => {
        const obj = {
            id: id
        }

        return axios.patch(`https://${window.location.hostname}:8000/profile/refusefollow`, obj, {
            withCredentials: true,
            headers: {
                'X-CSRFToken': Utils.getCookie('csrf_token'),
            }
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
        })
        .catch((err) => {
            console.log(err);
        });
    }
    , getNotifs: async () => {
        let data = null;

        await axios.get(`https://${window.location.hostname}:8000/profile/getmyrequests`, {
            withCredentials: true,
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            data = res.data;
        })
        .catch((err) => {
            console.log(err);
        });
        return (data);
    }
    , getFollows: async () => {
        let data = null;

        await axios.get(`https://${window.location.hostname}:8000/profile/getmyfollows`, {
            withCredentials: true,
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            data = res.data;
        })
        .catch((err) => {
            console.log(err);
        });
        return (data);
    }
    , getOtherProfil: async (id) => {
        let data = null;

        await axios.get(`https://${window.location.hostname}:8000/profile/getotherprofile?id=${id}`, {
            withCredentials: true,
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
            data = res.data;
        })
        .catch((err) => {
            console.log(err);
        });
        return (data);
    }
    , updateStatus: async (status) => {
        const obj = {
            status: status
        }

        await axios.patch(`https://${window.location.hostname}:8000/profile/updatestatus`, obj, {
            withCredentials: true,
            headers: {
                'X-CSRFToken': Utils.getCookie('csrf_token'),
            }
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
        })
        .catch((err) => {
            console.log(err);
        });
    }
}

export default Request;
