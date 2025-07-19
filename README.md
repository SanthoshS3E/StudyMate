# 📘 StudyMate

StudyMate is a collaborative study tool that lets you **upload PDFs, take page-based notes, invite friends to join**, and even **talk via voice chat in real-time**.
**🔗 Live Demo:** [https://studymate-com.web.app/](https://studymate-com.web.app/)

## 🚀 Features

✅ **Upload & View PDFs** – Uses Google Docs viewer for smooth display

✅ **Page-Specific Notes** – Notes are saved per PDF page

✅ **Invite Friends** – Share a unique session link for real-time collaboration

✅ **Voice Chat** – Built-in WebRTC-based voice communication

✅ **Firebase Sync** – All notes & session data stored in Firestore
---
## 🛠️ Tech Stack
* **React + TypeScript + Vite**
* **React Router DOM**
* **Firebase (Auth, Firestore, Storage)**
* **WebRTC for voice chat**

---

## 📂 Project Structure

```
src/
 ├── App.tsx            # Main app routes
 ├── Home.tsx           # Upload & start sessions
 ├── PDFWithNotes.tsx   # PDF viewer + notes + invite + voice
 ├── StudyRoom.tsx      # Guest session view
 ├── firebaseConfig.ts  # Firebase setup
 ├── styles.css         # Global styles
 └── main.tsx           # React entry point
```

---

## 🔧 Setup & Run Locally

1️⃣ **Clone the repo**

```sh
git clone https://github.com/SanthoshS3E/StudyMate.git
cd StudyMate
```

2️⃣ **Install dependencies**

```sh
npm install
```

3️⃣ **Configure Firebase**

Edit `src/firebaseConfig.ts` with your Firebase credentials:

```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4️⃣ **Run the dev server**

```sh
npm run dev
```

5️⃣ Open in browser → `http://localhost:5173`

---

## 🌐 Deployment

Deployed on **Firebase Hosting**:

```sh
npm run build
firebase deploy
```

---

## 🤝 Contributing

Feel free to fork and improve! PRs welcome 🙌

---

## 📜 License

MIT License © 2025 **Santhosh S**

---

Happy Studying! 🎉
