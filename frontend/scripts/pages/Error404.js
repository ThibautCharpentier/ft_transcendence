import Utils from '/services/Utils.js'

let Error404 = {
    render: async () => {
        if (Utils.getCookie('csrf_token') == null)
        {
            window.location.href = "#/";
            return null;
        }
        document.getElementById("ball").classList.add("d-none");
        const view = await fetch("./views/error404.html").then((data) => data.text());
        return view
    }
    , after_render: async () => {
        if (window.socket_pong != null)
            window.socket_pong.close();
        if (window.in_local_game == 1)
        {
            window.in_local_game = 0;
            window.location.reload();
        }
        Utils.deleteJTCookies();
    }
}

export default Error404;
