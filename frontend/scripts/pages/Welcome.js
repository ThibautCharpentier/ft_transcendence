// --------------------------------
//  Define Data Sources
// --------------------------------

import Utils from '/services/Utils.js'

let Welcome = {
    render : async () => {
        await axios.get(`https://${window.location.hostname}:8000/auth/getcsrf`, {
            withCredentials: true,
        })
        .then((res) => {
            if (res.status != 200)
                throw new Error('Une erreur est survenue');
        })
        .catch((err) => {
            console.log(err);
        });
        let read_after_render = await Utils.isConnected(true, "#/dashboard");
        if (read_after_render == false)
            return null;
        const view = await fetch("./views/welcome.html").then((data) => data.text());
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
    }
}

export default Welcome;
