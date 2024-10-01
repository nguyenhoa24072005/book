const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors"); // Thêm middleware CORS
require("dotenv").config(); // Nạp biến môi trường từ file .env

const app = express();
app.use(express.json()); // Để đọc dữ liệu JSON từ request body
app.use(
  cors({
    origin: "http://localhost:3000", // Cho phép nguồn từ localhost:3000
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
); // Bật CORS cho tất cả các route

// Khởi tạo SDK Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Xử lý ký tự xuống dòng
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
});

const db = admin.firestore();
const collection = db.collection("Book movie tickets"); // Collection "bookings" trong Firestore

// 1. Tạo đặt vé mới: POST
app.post("/bookings", async (req, res) => {
  try {
    const { movieName, userName, seatNumber, showTime } = req.body;
    const booking = { movieName, userName, seatNumber, showTime };
    const docRef = await collection.add(booking);
    res
      .status(201)
      .send({ id: docRef.id, message: "Booking created successfully" });
  } catch (error) {
    res.status(500).send("Error creating booking: " + error.message);
  }
});

// 2. Đọc tất cả đặt vé: GET
app.get("/bookings", async (req, res) => {
  try {
    const snapshot = await collection.get();
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching bookings", details: error.message });
  }
});

// 3. Đọc đặt vé theo ID: GET/id
app.get("/bookings/:id", async (req, res) => {
  try {
    const doc = await collection.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).send("Booking not found");
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).send("Error fetching booking: " + error.message);
  }
});

// 4. Cập nhật đặt vé theo ID: PUT/id
app.put("/bookings/:id", async (req, res) => {
  try {
    const { movieName, userName, seatNumber, showTime } = req.body;
    const updatedBooking = { movieName, userName, seatNumber, showTime };
    await collection.doc(req.params.id).update(updatedBooking);
    res.status(200).send("Booking updated successfully");
  } catch (error) {
    res.status(500).send("Error updating booking: " + error.message);
  }
});

// 5. Xóa đặt vé theo ID: DELETE/id
app.delete("/bookings/:id", async (req, res) => {
  try {
    await collection.doc(req.params.id).delete();
    res.status(200).send("Booking deleted successfully");
  } catch (error) {
    res.status(500).send("Error deleting booking: " + error.message);
  }
});

// Chạy server với port online hoặc 5000 local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
