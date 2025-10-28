import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");
const PUBLIC_VAPID_KEY = "BJG8hsfOVY1FvJBpKUYz0xj5M1y_x7rLmfcaG1mj8sxLRkUaqj4738Ca5PVzFOhZoz6AiuIaN7ge3yoapVCiRkQ";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}


function User() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = event => {
      if (event.data?.type === "notification") {
        setMessages(prev => [event.data.data, ...prev]);
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        await fetch("http://localhost:4000/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription)
        });
      }
    })();

    socket.on("new-message", msg => setMessages(prev => [msg, ...prev]));

    return () => socket.off("new-message");
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>User Panel</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg, i) => (
          <li key={i} style={{ border: "1px solid #ccc", margin: "10px auto", padding: "10px", borderRadius: "5px", maxWidth: "400px" }}>
            <strong>{msg.title}</strong>
            <p>{msg.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}


function Admin() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const sendNotification = async () => {
    await fetch("http://localhost:4000/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, adminKey: "636164" })
    });
    alert("Notification sent!");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Admin Panel</h1>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Body" value={body} onChange={e => setBody(e.target.value)} />
      <br />
      <button style={{ marginTop: "10px", padding: "8px 16px" }} onClick={sendNotification}>
        Send Notification
      </button>
    </div>
  );
}


export default function App() {
  return (
    <Router>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <Link to="/user" style={{ margin: "0 10px" }}>User</Link>
        <Link to="/admin" style={{ margin: "0 10px" }}>Admin</Link>
      </div>
      <Routes>
        <Route path="/user" element={<User />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<User />} />
      </Routes>
    </Router>
  );
}
