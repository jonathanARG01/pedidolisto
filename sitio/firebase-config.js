/*
  Configuración pública de Firebase para PedidoListo (no es secreta: la protegen las reglas de firestore.rules).
  Si queda en null, las tiendas siguen leyendo /tiendas/<slug>/tienda.json y el panel /admin muestra cómo configurarlo.
*/
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD99rUUrBKrWAq4XXL9GW5poGhZzgOoGTw",
  authDomain: "pedidolisto-1c7ac.firebaseapp.com",
  projectId: "pedidolisto-1c7ac",
  storageBucket: "pedidolisto-1c7ac.firebasestorage.app",
  messagingSenderId: "633486865784",
  appId: "1:633486865784:web:6d1e39bc0731285f67048d"
};
