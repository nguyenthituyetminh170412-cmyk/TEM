import { auth } from "./firebase.config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const authButtons =
    document.getElementById("authButtons");

if (authButtons) {

    onAuthStateChanged(auth, user => {

        if (user) {

            authButtons.innerHTML = `
                <a href="cart.html" class="header-cart-btn">
                    CART
                </a>

                <button
                    type="button"
                    id="signOutBtn"
                    class="header-signout-btn"
                >
                    SIGN OUT
                </button>
            `;

            const signOutBtn =
                document.getElementById("signOutBtn");

            signOutBtn.addEventListener(
                "click",
                async () => {

                    try {

                        await signOut(auth);

                        window.location.href =
                            "index.html";

                    } catch (error) {

                        console.error(
                            "Sign out error:",
                            error
                        );

                        alert(
                            "Unable to sign out."
                        );
                    }
                }
            );

        } else {

            authButtons.innerHTML = `
                <a
                    href="cart.html"
                    class="header-cart-btn"
                >
                    CART
                </a>

                <a
                    href="signin.html"
                    class="header-auth-btn"
                >
                    SIGN IN
                </a>

                <a
                    href="signup.html"
                    class="header-auth-btn"
                >
                    SIGN UP
                </a>
            `;
        }

    });

}