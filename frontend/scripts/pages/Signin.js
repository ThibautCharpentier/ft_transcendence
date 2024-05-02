import Utils from '/services/Utils.js'

let name_user;

function checkError(userName, password)
{
    let errUserName = "";
    let errPassword = "";
    let url = window.location.hash;

    if (userName.length === 0)
        errUserName = "Veuillez entrer un nom d'utilisateur";
    else if (userName.length < 3 || userName.length > 10)
        errUserName = "Nom d'utilisateur invalide";  
    if (password.length === 0)
        errPassword = "Veuillez entrer un mot de passe";
    else if (password.length < 10 || password.length > 20)
            errPassword = "Mot de passe invalide"
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

async function connectUser()
{
    let password = DOMPurify.sanitize(document.Form.password.value);
    name_user = DOMPurify.sanitize(document.Form.userName.value);
    
    if (checkError(userName, password))
        return 
    
    const obj = {
        username: name_user,
        password: password
    }
    axios.post(`https://${window.location.hostname}:8000/auth/signin`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 200)
            throw new Error('Une erreur est survenue');
        if (!(res.data.message)) {
            document.getElementById("errServ").textContent = "";
            document.getElementById("divSign").classList.add("d-none");
            document.getElementById("divCode2FA").classList.remove("d-none");
        }
        else
            window.location.href = "#/dashboard";
    })
    .catch((err) => {
        console.log(err);
        if (err.response.data == "Invalid password")
            document.getElementById("errPassword").textContent = "Mot de passe invalide";
        else if (err.response.data == "Invalid username")
            document.getElementById("errUserName").textContent = "Nom d'utilisateur invalide";
        else if (err.response.data == "Invalid data")
            document.getElementById("errServ").textContent = "Formulaire invalide";
    });
}

async function valideCode()
{
    let code = DOMPurify.sanitize(document.getElementById("code").value);

    if (code === "") {
        document.getElementById("errCode").textContent = "Veuillez entrer un code";
        return ;
    }

    const obj = {
        username: name_user,
        codeTwoFactorAuth: code
    }
    axios.post(`https://${window.location.hostname}:8000/auth/validate2fa`, obj, {
        withCredentials: true,
        headers: {
            'X-CSRFToken': Utils.getCookie('csrf_token'),
        }
    })
    .then((res) => {
        if (res.status != 200)
            throw new Error('Une erreur est survenue');
        window.location.href = "#/dashboard";
    })
    .catch((err) => {
        console.log(err);
        if (err.response && err.response.data)
        {
            if (err.response.data == "Invalid 2FA")
                document.getElementById("errCode").textContent = "Code incorrect";
            else if (err.response.data == "Invalid data")
                document.getElementById("errCode").textContent = "Formulaire invalide";
        }
    });
}

async function validWithKey(event) {
    if (event.key === "Enter") {
        if (document.activeElement.id === "userName" || document.activeElement.id === "password")
                connectUser(); 
            else if (document.activeElement.id === "code")
                valideCode();
    }
};

let Signin = {

    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        let read_after_render = await Utils.isConnected(true, "#/dashboard");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/signIn.html").then((data) => data.text());
        return view
    },
    after_render: async () => {
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
        
        const tabInput = ["userName", "password", "code"];
        const tabErr = ["errUserName", "errPassword", "errCode"];

        document.getElementById("ball").classList.remove("d-none");
        Utils.resetErr(tabInput, tabErr);
        document.getElementById("submit").addEventListener("click", () => {
            connectUser();
        });

        document.getElementById("txtReturn").addEventListener("click", () => {
            document.getElementById("divSign").classList.remove("d-none");
            document.getElementById("divCode2FA").classList.add("d-none");
        })

        document.getElementById("btnValidateCode").addEventListener("click", () => {
            valideCode();        
        });

        document.getElementById("userName").addEventListener("keyup", validWithKey);
        document.getElementById("password").addEventListener("keyup", validWithKey);
        document.getElementById("code").addEventListener("keyup", validWithKey);
    }
}

export default Signin;
