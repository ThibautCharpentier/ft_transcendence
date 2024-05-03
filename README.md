# ft_transcendence

ft_transcendence is a 42 school team project where we have to create a **SPA (Single Page Application) website** allowing us to play **Pong Game**.

## Status

* Success
* Grade: 100/100

## Rules

* Our application must be compatible with **Google Chrome**. We have to use **Javascript** to develop **the frontend**. The user must be able to use the browser's **Back** and **Forward** buttons.

* Users must be able to participate in a **Pong Game** match in real-time against another user on the same computer using the same keyboard. A player must also be able to organize a tournament.
A tournament consists of several players who can play against each other.

* Any password stored in the database must be **encrypted**. The website must be protected against **SQL/XSS injections**. It is mandatory to implement an **SSL certificate** (which can be self-signed).

### Modules

To validate the project, we have to choose several modules from a list. Each module is worth either **1 or 0.5 point**. We have to implement a value of **7 points**.

| Value | Theme | Module | Description |
| ----- | ----- | ------ | ----------- |
| 1 | Web | Using a backend framework | We have to use **Django** framework. |
| 0.5 | Web | Using a frontend toolkit/framework | We have to use **Bootstrap** toolkit. |
| 0.5 | Web | Using a database | We have to use **PostgreSQL**. |
| 1 | User management | Standard user management | Users must be able to **register/authenticate** to the application. Users have an **unique username**. They must be able to update their **profile** and upload an **avatar**. They must also be able to add other users as **friends** and view their **status**. User profiles display **statistics**, such as wins and looses. Each user has a **game history**. |
| 1 | User management | Remote players | It is possible to have two remote players. Each player is on a different computer and playing the same **Pong Game** match. |
| 1 | Cybersecurity | Implementation of 2FA and JWT | Users must be able to use ** two-factor authentication (2FA)**. Then, if they use **2FA**, they receive a **single-use code** by **email** to use as double authentication. We have to implement **JSON Web Tokens (JWT)** as a method of authentication and authorization, ensuring user sessions and access to resources are managed securely. |
| 1 | Graphics | Implementation of advanced 3D technicals | We have to use **ThreeJS/WebGL**. |
| 0.5 | Accessibility | Support on all types of devices | The website must be compatible with **tablets** and **smartphones** (using the touch screen). |
| 0.5 | Accessibility | Extend web browsers compatibility | The website must work on at least one additional browser, like **Firefox**. |
