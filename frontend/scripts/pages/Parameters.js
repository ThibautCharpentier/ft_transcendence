import Utils from '/services/Utils.js'
import Request from '/services/Request.js'

async function changeUsername(userName) {
    const obj = {
        username : userName
    }

    await axios.patch(`https://${window.location.hostname}:8000/profile/updateusername`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 200)
            throw new Error('Une erreur est survenue');
        document.getElementById("userName").classList.add("valid");
        document.getElementById("userName").value = "";
    })
    .catch((err) => {
        console.log(err);
        if (err.response && err.response.data)
        {
            if (err.response.data === "Username already exists")
                document.getElementById("errUserName").textContent = "Ce nom d'utilisateur est déjà pris";
            else if (err.response.data == "Invalid data")
                document.getElementById("errUserName").textContent = "Formulaire invalide";
        }
    });
}

async function changeMail(mail) {
    const obj = {
        mail : mail
    }

    await axios.patch(`https://${window.location.hostname}:8000/profile/updatemail`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 200)
            throw new Error('Une erreur est survenue');
        document.getElementById("mail").classList.add("valid");
        document.getElementById("mail").value = "";
    })
    .catch((err) => {
        console.log(err);
        if (err.response && err.response.data)
        {
            if (err.response.data === "Mail already exists")
                document.getElementById("errMail").textContent = "Ce mail est déjà utilisé";
            else if (err.response.data == "Invalid data")
                document.getElementById("errMail").textContent = "Formulaire invalide";
        }
    });
}

async function changePassword(currentPassword, newPassword) {
    const obj = {
        old_password: currentPassword,
        new_password: newPassword
    }

    await axios.patch(`https://${window.location.hostname}:8000/profile/updatepassword`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 200)
            throw new Error('Une erreur est survenue');
        if (res.data == "OK")
        {
            document.getElementById("password").classList.add("valid");
            document.getElementById("confirmPassword").classList.add("valid");
            document.getElementById("passwordCurrent").value = "";
            document.getElementById("password").value = "";
            document.getElementById("confirmPassword").value = "";
        }
    })
    .catch((err) => {
        console.log(err);
        if (err.response && err.response.data)
        {
            if (err.response.data === "Invalid password")
                document.getElementById("errPasswordCurrent").textContent = "Mot de passe incorrect";
            else if (err.response.data === "Invalid new password")
                document.getElementById("errPassword").textContent = "Nouveau mot de passe invalide";
            else if (err.response.data === "Invalid data")
                document.getElementById("errPassword").textContent = "Formulaire invalide";
        }
    });
}

async function changeTwoFA(twoFA) {
    const obj = {
        twoFactorAuth : twoFA
    }

    await axios.patch(`https://${window.location.hostname}:8000/profile/update2fa`, obj, {
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

async function changeAvatar(avatarData) {
    let avatarDecode = atob(avatarData);
    let avatarArray = new Uint8Array(avatarDecode.length);
    for (let i = 0; i < avatarDecode.length; i++)
        avatarArray[i] = avatarDecode.charCodeAt(i);
    let avatarFile = new File([avatarArray], "avatar.png", { type: "image/png" });
    let formData = new FormData();
    formData.append("avatar", avatarFile);
    await axios.post(`https://${window.location.hostname}:8000/profile/setavatar`, formData, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 201)
            throw new Error('Une erreur est survenue');
        document.getElementById("mainAvatar").classList.add("valid");
    })
    .catch((err) => {
        console.log(err);
    }); 
}

async function changeInfos(userName, mail, currentPassword, newPassword, twoFA, avatarData) {
    let currentTwoFA = window.currentUser.twoFactorAuth;
    let currentAvatarData = window.currentUser.avatar;
    let currentUsername = window.currentUser.username;
    let currentMail = window.currentUser.mail;

    if (document.getElementById("errUserName").textContent == "" && userName != "" && userName != currentUsername)
        await changeUsername(userName);
    if (document.getElementById("errMail").textContent == "" && mail != "" && mail != currentMail)
        await changeMail(mail);
    if ((document.getElementById("errPasswordCurrent").textContent == "" && document.getElementById("errPassword").textContent == "" && document.getElementById("errConfirmPassword").textContent == "") && newPassword != "" && currentPassword != "")
        await changePassword(currentPassword, newPassword);
    if (twoFA != currentTwoFA)
        await changeTwoFA(twoFA);
    if (currentAvatarData != avatarData)
        await changeAvatar(avatarData);
}

function addError(tabId, tabErr) {
    for (let i = 0; i < tabId.length; i++)
        document.getElementById(tabId[i]).textContent = tabErr[i];
}

function checkError(userName, mail, currentPassword, newPassword, confirmNewPassword, twoFA) {
    let errUserName = "";
    let errMail = "";
    let errCurrentPassword = "";
    let errPassword = "";
    let errConfirmPassword = "";
    let tabId = ["errUserName", "errMail", "errPasswordCurrent", "errPassword", "errConfirmPassword"];
    let tabErr;

    if (userName != "" && (userName.length < 3 || userName.length > 10))
        errUserName = "Le nom d'utilisateur doit contenir entre 3 et 10 caractères";
    if (mail != "" && (mail.indexOf('@') == -1))
        errMail = "Veuillez entrer une adresse mail valide";
    if (currentPassword == "" && (newPassword != "" || confirmNewPassword != ""))
        errCurrentPassword = "Veuillez entrer votre mot de passe";
    if (newPassword != confirmNewPassword)
        errConfirmPassword = "Les mots de passe ne correspondent pas"
    if (newPassword == "" && (currentPassword != "" || confirmNewPassword != ""))
        errPassword = "Veuillez entrer un nouveau mot de passe";
    if (newPassword != "" && (newPassword.length < 10 || newPassword.length > 20))
        errPassword = "Le mot de passe doit contenir entre 10 et 20 caractères";
    if (confirmNewPassword == "" && (currentPassword != "" || newPassword != ""))
        errConfirmPassword = "Veuillez confirmer votre nouveau mot de passe";

    tabErr = [errUserName, errMail, errCurrentPassword, errPassword, errConfirmPassword];
    addError(tabId, tabErr);
}


function addInfos() {
    document.getElementById('userName').placeholder = window.currentUser.username;
    document.getElementById('mail').placeholder = window.currentUser.mail;
    if (window.currentUser.avatar)
        document.getElementById("mainAvatar").src = `data:image/png;base64, ${window.currentUser.avatar}`;
    if (window.currentUser.twoFactorAuth === false)
        document.getElementById("checkBox").checked = false;
    else
        document.getElementById("checkBox").checked = true;
}

let Parameters = {

    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(false, "#/signin");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/parameters.html").then((data) => data.text());
        return view
    },
    after_render: async () => {
        const tabInput = ["userName", "mail", "passwordCurrent", "password", "confirmPassword"];
        const tabErr = ["errUserName", "errMail", "errPasswordCurrent", "errPassword", "errConfirmPassword"];

        if (document.querySelector("#navNotification span").classList.contains("d-none"))
            Utils.addNotifOrNot();
        Utils.activeLinkNavbar("navParameters");
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
        addInfos();
        Utils.resetErr(tabInput, tabErr);

        document.getElementById("btnChangePassword").addEventListener("click", () => {
            document.getElementById("divBtnPassword").classList.add("d-none");
            document.getElementById("divChangePassword").classList.remove("d-none");
        })
        
        document.getElementById("btnSave").addEventListener("click", async () => {
            let userName = DOMPurify.sanitize(document.getElementById("userName").value);
            let mail = DOMPurify.sanitize(document.getElementById("mail").value);
            let currentPassword = DOMPurify.sanitize(document.getElementById("passwordCurrent").value);
            let newPassword = DOMPurify.sanitize(document.getElementById("password").value);
            let confirmNewPassword = DOMPurify.sanitize(document.getElementById("confirmPassword").value);
            let twoFA = document.getElementById("checkBox").checked;
            let avatarData = document.getElementById("mainAvatar").src.split(',')[1];

            checkError(userName, mail, currentPassword, newPassword, confirmNewPassword, twoFA)
            await changeInfos(userName, mail, currentPassword, newPassword, twoFA, avatarData);
            await Utils.getMyProfile();
            addInfos();
        })

        let preview;
        document.getElementById("btnModifyAvatar").addEventListener("click", () => {
            document.getElementById("mainAvatar").classList.remove("valid");
            document.getElementById("avatarInput").click();
        })
        document.getElementById("avatarInput").addEventListener("change", (event) => {
            const avatarInput = event.target;
            const mainAvatar = document.getElementById("mainAvatar");
            const avatarPreview = document.getElementById("avatarPreview");
            const previewCanvas = document.getElementById("previewCanvas");
            const btnModify = document.getElementById("btnModifyAvatar");

            btnModify.style.display = "none";
            document.getElementById("errAvatar").textContent = "";
            if (avatarInput.files.length > 0)
            {
                const selectedAvatar = avatarInput.files[0];
                if (selectedAvatar.type.startsWith("image/"))
                {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        avatarPreview.style.display = "block";
                        mainAvatar.style.display = "none";
                        preview = new Croppie(previewCanvas, {
                            viewport: { width: 70, height: 70, type: 'circle' },
                            boundary: { width: 200, height: 200 }
                        })
                        preview.bind({
                            url: e.target.result
                        }).catch((err) => {
                            console.log(err);
                            document.getElementById("errAvatar").textContent = "Image non valide";
                            btnModify.style.display = "";
                            avatarPreview.style.display = "none";
                            mainAvatar.style.display = "";
                            preview.destroy();
                        });
                    }
                    reader.readAsDataURL(selectedAvatar);
                }
                else
                {
                    document.getElementById("errAvatar").textContent = "Image non valide";
                    btnModify.style.display = "";
                }
            }
            else
            {
                document.getElementById("errAvatar").textContent = "Veuillez sélectionner une image";
                btnModify.style.display = "";
            }
            avatarInput.value = "";
        })
        document.getElementById("applyPreview").addEventListener("click", () => {
            preview.result().then((res) => {
                document.getElementById("mainAvatar").src = res;
                document.getElementById("avatarPreview").style.display = "none";
                document.getElementById("mainAvatar").style.display = "";
                document.getElementById("btnModifyAvatar").style.display = "";
                preview.destroy();
            })
        });
    }
}

export default Parameters;
