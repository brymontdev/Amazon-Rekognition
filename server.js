const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const AWS = require("aws-sdk");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 3000;

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: "us-west-2",
});

const rekognition = new AWS.Rekognition();

io.on("connection", (socket) => {
  socket.on("stream", async (image) => {
    try {
      const params = {
        Image: {
          Bytes: Buffer.from(image, "base64"),
        },
        Attributes: ["ALL"],
      };

      rekognition.detectFaces(params, (err, data) => {
        if (data.FaceDetails && data.FaceDetails.length > 0) {
          io.emit("results", { faceDetails: data.FaceDetails });
        } else {
          console.log("No se detectaron caras en la imagen.");
        }
      });
    } catch (error) {
      console.error("Error al procesar la imagen con Rekognition:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(port, () => {
  console.log(`Servidor Node.js en funcionamiento en http://localhost:${port}`);
});
