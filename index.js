// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from 'firebase/app';

// Add the Firebase products that you want to use
import 'firebase/auth';
import 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;

async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {
    apiKey: 'AIzaSyBNYQ24v3nGQl25pBA9n8tSAD7UxIxVdPM',
    authDomain: 'firebare-web-codelab.firebaseapp.com',
    projectId: 'firebare-web-codelab',
    storageBucket: 'firebare-web-codelab.appspot.com',
    messagingSenderId: '208145435770',
    appId: '1:208145435770:web:4d8a3b68c6b731081bffc3',
    measurementId: 'G-B5VDS9R84T'
  };

  firebase.initializeApp(firebaseConfig);

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      }
    }
  };
  
  const ui = new firebaseui.auth.AuthUI(firebase.auth());

  startRsvpButton.addEventListener('click', () => {
    if (firebase.auth().currentUser) {
      // User is signed in; allows user to sign out
      firebase.auth().signOut();
    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      startRsvpButton.textContent = 'LOGOUT';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';

      // Subscribe to the guestbook collection
      subscribeGuestbook();
      // Subscribe to the guestbook collection
      subscribeCurrentRSVP(user);
    } else {
      startRsvpButton.textContent = 'RSVP';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none';

      // Unsubscribe from the guestbook collection
      unsubscribeGuestbook();
      // Unsubscribe from the guestbook collection
      unsubscribeCurrentRSVP();
    }
  });

  // Listen to the form submission
  form.addEventListener('submit', e => {
    // Prevent the default form redirect
    e.preventDefault();
    // Write a new message to the database collection "guestbook"
    firebase
      .firestore()
      .collection('guestbook')
      .add({
        text: input.value,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        userId: firebase.auth().currentUser.uid
      });
    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });

  firebase
    .firestore()
    .collection('guestbook')
    .orderBy('timestamp', 'desc')
    .onSnapshot(snaps => {
      // Reset page
      guestbook.innerHTML = '';
      // Loop through documents in database
      snaps.forEach(doc => {
        // Create an HTML entry for each document and add it to the chat
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + ': ' + doc.data().text;
        guestbook.appendChild(entry);
      });
    });

  // Subscribe from guestbook updates
  function subscribeGuestbook() {
    // Create query for messages
    guestbookListener = firebase
      .firestore()
      .collection('guestbook')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snaps => {
        // Reset page
        guestbook.innerHTML = '';
        // Loop through documents in database
        snaps.forEach(doc => {
          // Create an HTML entry for each document and add it to the chat
          const entry = document.createElement('p');
          entry.textContent = doc.data().name + ': ' + doc.data().text;
          guestbook.appendChild(entry);
        });
      });
  }

  // Unsubscribe from guestbook updates
  function unsubscribeGuestbook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }

  rsvpYes.onclick = () => {
    // Get a reference to the user's document in the attendees collection
    const userDoc = firebase
      .firestore()
      .collection('attendees')
      .doc(firebase.auth().currentUser.uid);

    // If they RSVP'd yes, save a document with attending: true
    userDoc
      .set({
        attending: true
      })
      .catch(console.error);
  };
  rsvpNo.onclick = () => {
    // Get a reference to the user's document in the attendees collection
    const userDoc = firebase
      .firestore()
      .collection('attendees')
      .doc(firebase.auth().currentUser.uid);

    // If they RSVP'd no, save a document with attending: false
    userDoc
      .set({
        attending: false
      })
      .catch(console.error);
  };

  // Listen for attendee list
  firebase
    .firestore()
    .collection('attendees')
    .where('attending', '==', true)
    .onSnapshot(snap => {
      const newAttendeeCount = snap.docs.length;

      numberAttending.innerHTML = newAttendeeCount + ' people going';
    });

  function subscribeCurrentRSVP(user) {
    rsvpListener = firebase
      .firestore()
      .collection('attendees')
      .doc(user.uid)
      .onSnapshot(doc => {
        if (doc && doc.data()) {
          const attendingResponse = doc.data().attending;

          // Update css classes for buttons
          if (attendingResponse) {
            rsvpYes.className = 'clicked';
            rsvpNo.className = '';
          } else {
            rsvpYes.className = '';
            rsvpNo.className = 'clicked';
          }
        }
      });
  }

  function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
      rsvpListener();
      rsvpListener = null;
    }
    rsvpYes.className = '';
    rsvpNo.className = '';
  }
}
main();
