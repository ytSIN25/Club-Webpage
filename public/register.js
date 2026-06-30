// =========================================================================
// CSSC - Register JavaScript (Firebase Authentication & Firestore Sync)
// =========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Your Firebase Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7KrouSG4fiDNipOGT6IoUJp6ssyFakzc",
  authDomain: "cssc-webpage.firebaseapp.com",
  projectId: "cssc-webpage",
  storageBucket: "cssc-webpage.firebasestorage.app",
  messagingSenderId: "353738134153",
  appId: "1:353738134153:web:1534b3983f2ca7de3b2c58"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to handle input status styling and error message display
function setError(inputId, errorId, isError, message = '') {
    const inputEl = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    
    if (!inputEl) return;
    
    if (isError) {
        inputEl.classList.add('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    } else {
        inputEl.classList.remove('error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    }
}

// Ensure DOM is fully loaded before targeting form element
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const regAlert = document.getElementById('regAlert');
    const regAlertMsg = document.getElementById('regAlertMsg');
    const termsCheckbox = document.getElementById('agreeTerms');
    const termsError = document.getElementById('termsError');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Capture input values from the updated form
        const fullName = document.getElementById('fullName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const contactNumber = document.getElementById('contactNumber').value.trim();
        const cohort = document.getElementById('cohort').value.trim();
        const year = document.getElementById('year').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Reset global alert state
        if (regAlert) regAlert.classList.add('hidden');

        let isValid = true;

        // --- Frontend Form Validation ---
        if (!fullName) {
            setError('fullName', 'fullNameError', true, 'Full name is required.');
            isValid = false;
        } else {
            setError('fullName', 'fullNameError', false);
        }

        if (!studentId) {
            setError('studentId', 'studentIdError', true, 'Student ID is required.');
            isValid = false;
        } else {
            setError('studentId', 'studentIdError', false);
        }

        if (!contactNumber) {
            setError('contactNumber', 'contactNumberError', true, 'Contact number is required.');
            isValid = false;
        } else {
            setError('contactNumber', 'contactNumberError', false);
        }

        if (!cohort) {
            setError('cohort', 'cohortError', true, 'Cohort is required.');
            isValid = false;
        } else {
            setError('cohort', 'cohortError', false);
        }

        if (!year) {
            setError('year', 'yearError', true, 'Year is required.');
            isValid = false;
        } else {
            setError('year', 'yearError', false);
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('regEmail', 'regEmailError', true, 'Please enter a valid email address.');
            isValid = false;
        } else {
            setError('regEmail', 'regEmailError', false);
        }

        if (password.length < 8) {
            setError('regPassword', 'regPwdError', true, 'Password must be at least 8 characters long.');
            isValid = false;
        } else {
            setError('regPassword', 'regPwdError', false);
        }

        if (password !== confirmPassword) {
            setError('confirmPassword', 'confirmPwdError', true, 'Passwords do not match.');
            isValid = false;
        } else {
            setError('confirmPassword', 'confirmPwdError', false);
        }

        if (!isValid) return;

        // --- Firebase Integration Logic ---
        // Provide visual feedback during registration sequence
        if (registerBtn) {
            registerBtn.innerHTML = '<div class="spinner"></div> Creating account...';
            registerBtn.disabled = true;
        }

        try {
            // Step 1: Create authentication user in Firebase Auth backend
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Step 2: Write additional user attributes directly into Cloud Firestore using the Auth UID
            const [firstName, ...lastParts] = fullName.split(' ');
            const userProfileData = {
                name: fullName,
                fullName: fullName,
                studentId: studentId,
                contactNumber: contactNumber,
                cohort: cohort,
                year: year,
                email: email,
                role: 'guest',
                isActive: true,
                joinedDate: new Date().toISOString()
            };

            await setDoc(doc(db, "users", user.uid), userProfileData);

            // Step 3: Synchronize session state via fallback LocalStorage layer if needed by shared.js
            if (typeof Auth !== 'undefined' && Auth.setUser) {
                Auth.setUser(userProfileData);
            } else {
                localStorage.setItem('cssc_user', JSON.stringify(userProfileData));
            }

            // Trigger success banner and move user forward
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show(`Welcome to CSSC, ${fullName}! 🎉`, 'success');
            } else {
                alert(`Welcome to CSSC, ${fullName}! Registration successful.`);
            }

            // Dynamic short sleep to let Toast / visual animation complete smoothly before redirect
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 800);

        } catch (error) {
            console.error("Firebase Registration Error Details: ", error);
            
            // Re-enable form interactions
            if (registerBtn) {
                registerBtn.innerHTML = 'Create Account';
                registerBtn.disabled = false;
            }

            // Handle specific error responses generated by Firebase Auth services
            if (regAlert && regAlertMsg) {
                regAlert.classList.remove('hidden');
                
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        regAlertMsg.textContent = 'An account with this email already exists. Please log in.';
                        setError('regEmail', 'regEmailError', true, 'Email already registered.');
                        break;
                    case 'auth/invalid-email':
                        regAlertMsg.textContent = 'The email address format is invalid.';
                        break;
                    case 'auth/weak-password':
                        regAlertMsg.textContent = 'The password chosen is too weak.';
                        break;
                    default:
                        regAlertMsg.textContent = `Registration error: ${error.message}`;
                        break;
                }
            }
        }
    });
});