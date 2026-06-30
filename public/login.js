// =========================================================================
// CSSC - Login & Session Management JavaScript (Firebase Auth & Firestore)
// =========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration matching your project setup
const firebaseConfig = {
  apiKey: "AIzaSyD7KrouSG4fiDNipOGT6IoUJp6ssyFakzc",
  authDomain: "cssc-webpage.firebaseapp.com",
  projectId: "cssc-webpage",
  storageBucket: "cssc-webpage.firebasestorage.app",
  messagingSenderId: "353738134153",
  appId: "1:353738134153:web:1534b3983f2ca7de3b2c58"
};

// Initialize Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Exposure for HTML Inline scripts / Oneliners
window.FirebaseSession = {
  // Simple Oneliner to log out from any button or event
  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem('cssc_user'); // Sync local storage cache
      window.location.href = 'index.html';
    } catch (err) {
      console.error("Logout Error: ", err);
    }
  },

  // Simple Oneliner to protect a private page. Put this at the very top of HTML body.
  protectPage(redirectTarget = 'login.html') {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in -> bounce back to login page with current URL saved
        const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `${redirectTarget}?redirect=${currentPath}`;
      } else {
        // If logged in but local session is missing, rebuild it
        if (!localStorage.getItem('cssc_user')) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const sessionPayload = {
              uid: user.uid,
              email: user.email,
              name: userData.name || userData.fullName || user.email,
              fullName: userData.fullName || userData.name || user.email,
              firstName: userData.firstName || (userData.fullName || userData.name || user.email).split(' ')[0] || '',
              lastName: userData.lastName || (userData.fullName || userData.name || user.email).split(' ').slice(1).join(' ') || '',
              role: userData.role || 'member',
              isActive: userData.isActive !== false && userData.status !== 'inactive',
              studentId: userData.studentId || '',
              joinedDate: userData.joinedDate || new Date().toISOString()
            };
            if (window.Auth && typeof window.Auth.setUser === 'function') {
              window.Auth.setUser(sessionPayload);
            } else {
              localStorage.setItem('cssc_user', JSON.stringify(sessionPayload));
            }
            if (window.Auth && typeof window.Auth.updateNav === 'function') window.Auth.updateNav();
          }
        }
      }
    });
  }
};

// Handle traditional login form elements if present on the current DOM page
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginAlert = document.getElementById('loginAlert');
  const loginAlertMsg = document.getElementById('loginAlertMsg');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Reset Alert State
    if (loginAlert) loginAlert.classList.add('hidden');

    if (!email || !password) {
      showError('Please fill out all fields.');
      return;
    }

    try {
      if (loginBtn) {
        loginBtn.innerHTML = '<span class="spinner"></span> Logging in...';
        loginBtn.disabled = true;
      }

      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Retrieve extra profile details from Cloud Firestore using UID Strategy
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Guard Check: Block account if status is explicitly set to inactive
        if (userData.isActive === false || userData.status === 'inactive') {
          await signOut(auth);
          showError('Your account is inactive. Please contact an administrator.');
          resetBtn();
          return;
        }

        // 3. Save profile into shared local wrapper to keep navbar updates reactive
        const sessionPayload = {
          uid: user.uid,
          email: user.email,
          name: userData.name || userData.fullName || user.email,
          fullName: userData.fullName || userData.name || user.email,
          firstName: userData.firstName || (userData.fullName || userData.name || user.email).split(' ')[0] || '',
          lastName: userData.lastName || (userData.fullName || userData.name || user.email).split(' ').slice(1).join(' ') || '',
          role: userData.role || 'member',
          isActive: userData.isActive !== false && userData.status !== 'inactive',
          studentId: userData.studentId || '',
          joinedDate: userData.joinedDate || new Date().toISOString()
        };
        if (window.Auth && typeof window.Auth.setUser === 'function') {
          window.Auth.setUser(sessionPayload);
        } else {
          localStorage.setItem('cssc_user', JSON.stringify(sessionPayload));
        }
        
        // Update navigation if Auth context object exists
        if (window.Auth && typeof window.Auth.updateNav === 'function') {
          window.Auth.updateNav();
        }

        // 4. Redirect Back to destination route or a fallback home page
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        window.location.href = redirectUrl ? decodeURIComponent(redirectUrl) : 'home.html';

      } else {
        // Fallback if auth exists but firestore profile wasn't made
        localStorage.setItem('cssc_user', JSON.stringify({ uid: user.uid, email: user.email, role: 'member', isActive: true }));
        window.location.href = 'home.html';
      }

    } catch (error) {
      console.error("Firebase Auth Sign-In Error: ", error);
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          showError('Invalid email credentials or incorrect password.');
          break;
        case 'auth/too-many-requests':
          showError('Account temporarily locked due to too many failed attempts.');
          break;
        default:
          showError(`Login failed: ${error.message}`);
      }
      resetBtn();
    }
  });

  function showError(msg) {
    if (loginAlert && loginAlertMsg) {
      loginAlert.classList.remove('hidden');
      loginAlertMsg.textContent = msg;
    } else {
      alert(msg);
    }
  }

  function resetBtn() {
    if (loginBtn) {
      loginBtn.innerHTML = 'Sign In →';
      loginBtn.disabled = false;
    }
  }
});