const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

async function readEvents() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeEvents(events) {
  await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
}

app.get('/events', async (req, res) => {
  const events = await readEvents();
  res.json(events);
});

app.post('/events', async (req, res) => {
  const ev = req.body;
  const events = await readEvents();
  ev.id = Date.now().toString();
  events.push(ev);
  await writeEvents(events);
  res.json(ev);
});

app.put('/events/:id', async (req, res) => {
  const id = req.params.id;
  const update = req.body;
  let events = await readEvents();
  events = events.map(ev => (ev.id === id ? { ...ev, ...update, id } : ev));
  await writeEvents(events);
  res.json({ ok: true });
});

app.delete('/events/:id', async (req, res) => {
  const id = req.params.id;
  let events = await readEvents();
  events = events.filter(ev => ev.id !== id);
  await writeEvents(events);
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
