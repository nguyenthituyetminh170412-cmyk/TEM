import {
    auth,
    db,
    signInWithEmailAndPassword,
    doc,
    getDoc,
    onAuthStateChanged
} from "./firebase.config.js";

const adminLoginForm = document.getElementById("adminLoginForm");
const message = document.getElementById("adminLoginMessage");

onAuthStateChanged(auth, async user => {
    if (!user) {
        return;
    }

    try {
        const userDoc = await getDoc(
            doc(db, "user", user.uid)
        );

        if (!userDoc.exists()) {
            await auth.signOut();
            return;
        }

        const userData = userDoc.data();

        const roleId = String(userData.roleId || "")
            .trim()
            .toLowerCase();

        if (roleId === "admin") {
            window.location.href = "./index.html";
        }
    } catch (error) {
        console.error("Admin check error:", error);
    }
});

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document
            .getElementById("adminEmail")
            .value
            .trim();

        const password =
            document.getElementById("adminPassword").value;

        try {
            message.textContent = "Signing in...";

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            const userDoc = await getDoc(
                doc(db, "user", user.uid)
            );

            if (!userDoc.exists()) {
                await auth.signOut();

                message.textContent =
                    "This account is not registered as an administrator.";

                return;
            }

            const userData = userDoc.data();

            const roleId = String(userData.roleId || "")
                .trim()
                .toLowerCase();

            if (roleId !== "admin") {
                await auth.signOut();

                message.textContent =
                    "Access denied. This account is not an administrator.";

                return;
            }

            message.textContent =
                "Admin login successful.";

            setTimeout(() => {
                window.location.href = "./index.html";
            }, 500);

        } catch (error) {
            console.error("Admin login error:", error);

            switch (error.code) {
                case "auth/invalid-credential":
                    message.textContent =
                        "Incorrect email or password.";
                    break;

                case "auth/invalid-email":
                    message.textContent =
                        "Please enter a valid email address.";
                    break;

                case "auth/too-many-requests":
                    message.textContent =
                        "Too many attempts. Please try again later.";
                    break;

                case "auth/network-request-failed":
                    message.textContent =
                        "Network error. Please check your connection.";
                    break;

                default:
                    message.textContent =
                        "Unable to sign in as administrator.";
            }
        }
    });
}