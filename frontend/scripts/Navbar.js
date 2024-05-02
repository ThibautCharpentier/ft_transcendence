import Utils from '/services/Utils.js'
import ModalNotifications from '/scripts/ModalNotifications.js';

const Navbar = {
    disconnectionButton : () => {
        document.getElementById("disconnection").addEventListener("click", () => {
            axios.post(`https://${window.location.hostname}:8000/auth/signout`, null, {
                withCredentials: true,
                headers: {
                    'X-CSRFToken': Utils.getCookie('csrf_token'),
                }
            })
            .then((res) => {
                if (res.status != 200)
                    throw new Error('Une erreur est survenue');
                window.location.href = "#/";
            })
            .catch((err) => {
                console.log(err);
            });
        })
    }
    , notificationButton : () => {
        document.getElementById("navNotification").addEventListener("click", async () => {
            let mainDiv = document.getElementById("page_container");
            const modal = await fetch("./views/modals/modalNotifications").then((data) => data.text());
            
            mainDiv.insertAdjacentHTML("beforeend", modal);
            ModalNotifications.mainModal();

        })

    }
}

export default Navbar;
