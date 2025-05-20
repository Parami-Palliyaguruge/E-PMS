import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { auth, db, storage, rtdb, app } from './firebase/firebaseConfig';

// Log Firebase initialization status
console.log('Firebase app initialized:', app.name);
console.log('Firebase services initialized:', { 
  auth: !!auth, 
  firestore: !!db, 
  storage: !!storage,
  realtimeDatabase: !!rtdb
});

// Log Firebase project information
console.log('Connected to Firebase project:', app.options.projectId);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
