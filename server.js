const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./leaderboard.db");

// create table once
db.run(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    score INTEGER,
    avatar TEXT
  )
`);

// SAVE SCORE
app.post("/save-score", (req, res) => {
  const { username, score, avatar } = req.body;

  if (!username || score == null) {
    return res.status(400).json({ error: "Invalid data" });
  }

  db.get(
    "SELECT * FROM leaderboard WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (row) {
        if (score > row.score) {
          db.run(
            "UPDATE leaderboard SET score = ?, avatar = ? WHERE username = ?",
            [score, avatar, username],
            (err) => {
              if (err) console.error("Update error:", err);
              res.json({ success: true });
            }
          );
        } else {
          res.json({ success: true, message: "Score not better" });
        }
      } else {
        db.run(
          "INSERT INTO leaderboard (username, score, avatar) VALUES (?, ?, ?)",
          [username, score, avatar],
          (err) => {
            if (err) console.error("Insert error:", err);
            res.json({ success: true });
          }
        );
      }
    }
  );
});

// GET LEADERBOARD
app.get("/leaderboard", (req, res) => {
  db.all(
    "SELECT username, score, avatar FROM leaderboard ORDER BY score DESC LIMIT 10",
    (err, rows) => {
      if (err) {
        console.error("DB Error:", err);
        return res.json([]);
      }
      res.json(rows || []);
    }
  );
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
