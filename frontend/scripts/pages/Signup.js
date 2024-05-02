import Utils from '/services/Utils.js'

function checkError(userName, mail, password, confirmPassword)
{
    let errUserName = "";
    let errMail = "";
    let errPassword = "";
    let errConfirmPassword = "";

    if (userName.length === 0)
        errUserName = "Veuillez entrer un nom d'utilisateur";
    else if (userName.length < 3 || userName.length > 10)
        errUserName = "Le nom d'utilisateur doit contenir entre 3 et 10 caractères";
    if (mail.length === 0)
        errMail = "Veuillez entrer un e-mail";
    if (password.length === 0)
        errPassword = "Veuillez entrer un mot de passe";
    else if (password.length < 10 || password.length > 20)
        errPassword = "Le mot de passe doit contenir entre 10 et 20 caractères";
    if (confirmPassword.length === 0)
        errConfirmPassword = "Veuillez confirmer votre mot de passe"
    else if (confirmPassword != password)
        errConfirmPassword = "Les mots de passe ne correspondent pas";

    if (errUserName.length != 0)
        document.getElementById("errUserName").textContent = errUserName;
    else
        document.getElementById("errUserName").textContent = "";
    if (errMail.length != 0)
        document.getElementById("errMail").textContent = errMail;
    else
        document.getElementById("errMail").textContent = "";
    if (errPassword.length != 0)
        document.getElementById("errPassword").textContent = errPassword;
    else
        document.getElementById("errPassword").textContent = "";
    if (errConfirmPassword.length != 0)
        document.getElementById("errConfirmPassword").textContent = errConfirmPassword;
    else
        document.getElementById("errConfirmPassword").textContent = "";
    document.getElementById("errServ").textContent = "";

    if (errUserName.length === 0 && errMail.length === 0 && errPassword.length === 0 && errConfirmPassword.length === 0)
        return (0)
    return (1)
}

async function signupUser()
{
    let userName = DOMPurify.sanitize(document.Form.userName.value);
    let mail = DOMPurify.sanitize(document.Form.mail.value);
    let password = DOMPurify.sanitize(document.Form.password.value);
    let confirmPassword = DOMPurify.sanitize(document.Form.confirmPassword.value);

    if (checkError(userName, mail, password, confirmPassword))
        return 
    
    const obj = {
        mail:       mail,
        username:   userName,
        password:   password
    }

    await axios.post(`https://${window.location.hostname}:8000/auth/signup`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 201)
            throw new Error('Une erreur est survenue');
        window.location.href = "#/signin";
    })
    .catch((err) => {
        console.log(err);
        if (err.response && err.response.data)
        {
            if (err.response.data == "Invalid password")
                document.getElementById("errPassword").textContent = "Mot de passe trop commun";
            else if (err.response.data == "Username already exists")
                document.getElementById("errUserName").textContent = "Nom d'utilisateur déjà utilisé";
            else if (err.response.data == "Mail already exists")
                document.getElementById("errMail").textContent = "Mail déjà utilisé";
            else if (err.response.data == "Invalid data")
                document.getElementById("errServ").textContent = "Formulaire invalide";
        }
    });
}

async function validWithKey(event) {
    if (event.key === "Enter") {
        if (document.activeElement.id === "userName" || document.activeElement.id === "password" || document.activeElement.id === "confirmPassword" || document.activeElement.id === "mail")
            signupUser();
    }
};

let Signup = {
    render : async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(true, "#/dashboard");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/signUp.html").then((data) => data.text());
        return view
    }
    , after_render: async () => {
        if (window.socket_followed != null)
            window.socket_followed.close();
        if (window.socket_token != null)
            window.socket_token.close();
        if (window.in_local_game == 1)
        {
            window.in_local_game = 0;
            window.location.reload();
        }
        if (window.socket_pong != null)
            window.socket_pong.close();
        Utils.deleteJTCookies();
        document.getElementById("ball").classList.remove("d-none");
        document.getElementById("submit").addEventListener("click", () => {
            signupUser();
        });

        document.getElementById("userName").addEventListener("keyup", validWithKey);
        document.getElementById("password").addEventListener("keyup", validWithKey);
        document.getElementById("confirmPassword").addEventListener("keyup", validWithKey);
        document.getElementById("mail").addEventListener("keyup", validWithKey);
    }

}

export default Signup;
