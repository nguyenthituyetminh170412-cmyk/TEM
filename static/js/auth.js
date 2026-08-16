import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    setDoc,
    doc,
    serverTimestamp
} from "./firebase-config.js";
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name =
            document.getElementById("signupName").value.trim();
        const email =
            document.getElementById("signupEmail").value.trim();
        const password =
            document.getElementById("signupPassword").value;
        try {
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
            const user = userCredential.user;
            await updateProfile(user, {
                displayName: name
            });
            await setDoc(
                doc(db, "users", user.uid),
                {
                    uid: user.uid,
                    name: name,
                    email: email,
                    role: "user",
                    createdAt: serverTimestamp()
                }
            );
            document.getElementById(
                "signupMessage"
            ).textContent =
                "Account created successfully!";
            signupForm.reset();
            setTimeout(function () {
                window.location.href = "signin.html";
            }, 1000);
        } catch (error) {
            console.error(error);
            document.getElementById(
                "signupMessage"
            ).textContent =
                getErrorMessage(error.code);
        }
    });
}
const signinForm = document.getElementById("signinForm");
if (signinForm) {
    signinForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email =
            document.getElementById("signinEmail").value.trim();
        const password =
            document.getElementById("signinPassword").value;
        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            document.getElementById(
                "signinMessage"
            ).textContent =
                "Sign in successful!";
            setTimeout(function () {
                window.location.href = "index.html";
            }, 1000);
        } catch (error) {
            console.error(error);
            document.getElementById(
                "signinMessage"
            ).textContent =
                getErrorMessage(error.code);
        }
    });
}
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case "auth/email-already-in-use":
            return "This email is already in use.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/weak-password":
            return "Password must be at least 6 characters.";
        case "auth/invalid-credential":
            return "Incorrect email or password.";
        case "auth/user-not-found":
            return "Account not found.";
        case "auth/wrong-password":
            return "Incorrect password.";
        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";
        case "auth/network-request-failed":
            return "Network error. Please check your connection.";
        default:
            return "Something went wrong. Please try again.";
    }
}`11`