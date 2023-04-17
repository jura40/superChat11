const express = require("express");
const bodyParser = require("body-parser");
const lowdb = require("lowdb");
const path = require("path");
const jwt = require("jsonwebtoken");
const FileSync = require("lowdb/adapters/FileSync");

const app = express();

// Create user database
const usersAdapter = new FileSync("users.json");
const usersDB = lowdb(usersAdapter);

// Create public channel database
const publicAdapter = new FileSync("public.json");
const publicDB = lowdb(publicAdapter);

// Create private channel database
const privateAdapter = new FileSync("private.json");
const privateDB = lowdb(privateAdapter);

//registrera
const bcrypt = require("bcrypt");

// Set up middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/logout-now", (req, res) => {
  // Remove the token from local storage
  res.clearCookie("token");
  // Redirect the user to the login page
  res.redirect("/");
});
// Serve index.html as the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "www", "index.html"));
});

app.get("/private-chatt", (req, res) => {
  res.sendFile(path.join(__dirname, "www", "display-private.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "www", "home.html"));
});
// Serve index.html as the home page
app.get("/get-register", (req, res) => {
  res.sendFile(path.join(__dirname, "www", "register.html"));
});

app.get("/public", (req, res) => {
  const channels = publicDB.get("channels").value();
  const publicChannel = channels.find((channel) => channel.name === "public");
  const messages = publicChannel.messages;
  res.json(messages);
});
// Endpoint for submitting public messages
app.post("/public", (req, res) => {
  const { username, text } = req.body;

  const date = new Date();
  const formattedDate = date.toLocaleString(); // format the date and time as a string
  const message = { username, text, date: formattedDate }; // add the formatted date and time to the message object

  // Add message to public channel database
  const channel = publicDB.get("channels").find({ name: "public" }).value();
  channel.messages.push(message); // add the message object to the channel's message array
  publicDB.write();

  res.json({ message: "Message sent" });
});

app.post("/private", (req, res) => {
  const { username, text } = req.body;

  const date = new Date();
  const formattedDate = date.toLocaleString(); // format the date and time as a string
  const message = { username, text, date: formattedDate }; // add the formatted date and time to the message object

  // Add message to public channel database
  const channel = privateDB.get("channels").find({ name: "private" }).value();
  channel.messages.push(message); // add the message object to the channel's message array
  privateDB.write();

  res.json({ message: "Message sent" });
});

// Endpoint for getting all private channels (requires authentication)
app.get("/private", (req, res) => {
  const channels = privateDB.get("channels").value();
  const privateChannel = channels.find((channel) => channel.name === "private");
  const messages = privateChannel.messages;
  res.json(messages);
});

// Endpoint for registering new users
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  const userExists = usersDB.get("users").find({ username }).value();
  if (userExists) {
    return res.status(400).send("User already exists");
  }

  // Hash password and add new user to database
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword };
  usersDB.get("users").push(newUser).write();

  res.json({ message: "Registration successful" });
});

// Endpoint for handling login requests
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  const user = usersDB.get("users").find({ username }).value();
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Check if password is correct
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Create JWT token and send back to client
  const token = jwt.sign(
    { username },
    "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTY3ODM1NDQ1NCwiaWF0IjoxNjc4MzU0NDU0fQ.FhDfWpd4tql7yWPUkqtRwlTE70qurPDXAwe-z03WleY"
  );

  res.json({ token });
});

// Start server
app.listen(3000, () => console.log("Server started on port 3000"));
