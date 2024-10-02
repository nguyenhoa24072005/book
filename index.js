const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // Địa chỉ frontend của bạn
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
});

const db = admin.firestore();
const collection = db.collection("movieId_1"); // Bộ sưu tập chứa thông tin phim

// 1. Đặt vé: POST
app.post("/bookings/:movieId", async (req, res) => {
  const { seatNumber, userName } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!seatNumber || !userName) {
    return res.status(400).send("Seat number and user name are required");
  }

  try {
    const movieRef = collection.doc(req.params.movieId);
    const movieDoc = await movieRef.get();

    if (!movieDoc.exists) {
      return res.status(404).send("Movie not found");
    }

    const movieData = movieDoc.data();
    const seats = movieData.seats;

    // Kiểm tra trạng thái ghế
    const seat = seats.find((s) => s.seatNumber === seatNumber);
    if (!seat) {
      return res.status(404).send("Seat not found");
    }
    if (seat.isBooked) {
      return res.status(400).send("Seat is already booked");
    }

    // Đặt ghế
    seat.isBooked = true;
    await movieRef.update({ seats });

    res.status(201).send("Seat booked successfully");

    // Hủy đặt ghế nếu không thanh toán trong 10 phút (giả lập)
    setTimeout(async () => {
      seat.isBooked = false;
      await movieRef.update({ seats });
      console.log(`Seat ${seatNumber} has been released after 10 minutes`);
    }, 10 * 60 * 1000); // 10 phút
  } catch (error) {
    console.error("Error booking seat:", error);
    res.status(500).send("Error booking seat: " + error.message);
  }
});

// 2. Đọc thông tin ghế của một phim: GET
app.get("/movies/:id/seats", async (req, res) => {
  try {
    const movieDoc = await collection.doc(req.params.id).get();
    if (!movieDoc.exists) {
      return res.status(404).send("Movie not found");
    }
    const { seats } = movieDoc.data();
    res.status(200).json(seats);
  } catch (error) {
    console.error("Error fetching seats:", error);
    res.status(500).send("Error fetching seats: " + error.message);
  }
});

// Chạy server với port online hoặc 5000 local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
