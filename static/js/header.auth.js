import { auth, db } from "./firebase.config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const authButtons =
    document.getElementById("authButtons");

if (authButtons) {

    onAuthStateChanged(auth, async user => {

        if (user) {

            let isAdmin = false;

            try {
                const userRef =
                    doc(db, "user", user.uid);

                const userSnap =
                    await getDoc(userRef);

                if (userSnap.exists()) {

                    const userData =
                        userSnap.data();

                    const roleId =
                        String(userData.roleId || "")
                            .trim()
                            .toLowerCase();

                    isAdmin = roleId === "admin";
                }

            } catch (error) {

                console.error(
                    "Cannot check admin role:",
                    error
                );
            }

            authButtons.innerHTML = `
                <a
                    href="cart.html"
                    class="header-cart-btn"
                >
                    CART
                </a>

                <a
                    href="orders.html"
                    class="header-auth-btn"
                >
                    MY ORDERS
                </a>

                ${
                    isAdmin
                        ? `
                            <a
                                href="admin.html"
                                class="header-auth-btn"
                            >
                                ADMIN
                            </a>
                        `
                        : ""
                }

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
                    href="orders.html"
                    class="header-auth-btn"
                >
                    MY ORDERS
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