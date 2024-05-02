"use strict";

import Error404         from './scripts/pages/Error404.js'
import Welcome          from './scripts/pages/Welcome.js'
import Signin           from './scripts/pages/Signin.js'
import Signup           from './scripts/pages/Signup.js'
import Dashboard        from './scripts/pages/Dashboard.js'
import Stats            from './scripts/pages/Stats.js';
import History          from './scripts/pages/History.js';
import Friends          from './scripts/pages/Friends.js'
import Parameters       from './scripts/pages/Parameters.js'
import PongLocal        from './scripts/pages/PongLocal.js'
import PongTournament   from './scripts/pages/PongTournament.js'
import PongOnline       from './scripts/pages/PongOnline.js'
import Navbar           from './scripts/Navbar.js'
import Utils            from './services/Utils.js'

// List of supported routes. Any url other than these routes will throw a 404 error
const routes = {
    '/'                 : Welcome,
    '/signin'           : Signin,
    '/signup'           : Signup,
    '/dashboard'        : Dashboard,
    '/stats'            : Stats,
    '/history'          : History,
    '/friends'          : Friends,
    '/parameters'       : Parameters,
    '/pong-local'       : PongLocal,
    '/pong-tournament'  : PongTournament,
    '/pong-online'      : PongOnline
};


// The router code. Takes a URL, checks against the list of supported routes and then renders the corresponding content page.
const router = async () => {

    document.body.style.setProperty('touch-action', 'auto');
 
    const header = null || document.getElementById('header_container');
    const content = null || document.getElementById('page_container');
    const tabPageHaveNav = ["/dashboard", "/stats", "/history", "/friends", "/parameters", "/pong-local", "/pong-tournament", "/pong-online"];
    
    let parsedURL = location.hash.slice(1).toLowerCase() || '/';

    // Get the page from our hash of supported routes.
    // If the parsed URL is not in our list of supported routes, select the 404 page instead
    let page = routes[parsedURL] ? routes[parsedURL] : Error404
   
    let result = await page.render();
    if (result != null)
    {
        if (tabPageHaveNav.indexOf(parsedURL) != -1 && !(document.querySelector('nav'))) {
            header.innerHTML = await fetch("./views/navbar.html").then((data) => data.text());
            Navbar.disconnectionButton();
            Navbar.notificationButton();
        }
        else if (tabPageHaveNav.indexOf(parsedURL) === -1 && document.querySelector('nav'))
            document.querySelector('nav').remove();
        content.innerHTML = result;
        await page.after_render();
    }
}

async function    validateCertificate() {
    if (window.location.protocol === "https:") {
        await axios.get(`https://${window.location.hostname}:8000/auth/getcsrf`, {
            withCredentials: true,
        })
        .then(response => {
            if (response.status != 200)
                throw new Error('Une erreur est survenue');
        })
        .catch(error => {
            window.open(`https://${window.location.hostname}:8000`, '_self');
            console.error("Erreur lors de la vérification du certificat SSL :", error);
        });
    }
}

validateCertificate();

window.addEventListener('hashchange', router);

window.addEventListener('load', router);
