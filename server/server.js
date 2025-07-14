import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import OpenAI from 'openai';
import { matchComponents } from './utils/matchComponent.ts';
import { generatePrompt } from './utils/generatePrompt.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { componentsMap } from './data/componentsMap';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());


// components suggestions API
app.post('/api/v1/match-components', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required', success: false });
    }
    const matches = matchComponents(prompt);
    res.status(201).json({ matches, success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to match components', success: false, details: error.message });
  }
});


// code generation API
app.post('/api/v1/generate', async (req, res) => {
  try {
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://ashevkar.github.io/portfolio/',
        'X-Title': 'React App',
      },
    });

    const { prompt, components } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const payload = generatePrompt(prompt, components);

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4.1',
      messages: payload,
    });

    const generatedCode = completion.choices[0].message?.content;

    // Save to history.json(Read from JSON file)
    const historyPath = path.join(__dirname, 'data', 'history.json');
    let history = [];
    try {
      const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      history = Array.isArray(data.history) ? data.history : [];
    } catch (err) {
      console.error('Error reading history.json:', err);
      history = [];
    }

    // generate new id, extract & store only component names to save space, & write the object to history file
    const uniqueId = uuidv4();  //library id
    const componentNames = Array.isArray(components)
      ? components.map(c => typeof c === 'string' ? c : c.name)
      : [];
    const newEntry = {
      id: uniqueId,
      name: prompt.length > 18 ? prompt.slice(0, 18) : prompt,
      prompt,
      components: componentNames,
      snippet: generatedCode,
    };
    history.push(newEntry);
    try {
      fs.writeFileSync(historyPath, JSON.stringify({ history }, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to history.json:', err);
    }

    res.status(201).json({ result: generatedCode });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate code', details: error.message });
  }
});


// History API
app.get('/api/v1/history', (req, res) => {
  const historyPath = path.join(__dirname, 'data', 'history.json');
  fs.readFile(historyPath, 'utf-8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {  // file missing, treat as empty history
        return res.status(200).json({ history: [] });
      }
      return res.status(500).json({ error: 'Failed to read history', details: err.message });
    }
    let historyObj;
    try {
      if (!data || data.trim() === '') {  // file empty, treat as empty history
        historyObj = { history: [] };
      } else {
        historyObj = JSON.parse(data);
      }
    } catch (parseErr) {
      return res.status(200).json({ history: [] });  // file not valid JSON, treat as empty history
    }
    const historyArr = Array.isArray(historyObj.history) ? historyObj.history : [];
    const mappedHistory = historyArr.map(entry => ({  // map component names to full objects
      ...entry,
      components: Array.isArray(entry.components)
        ? entry.components.map(name => componentsMap.find(c => c.name === name) || { name, notFound: true })
        : [],
    }));
    res.status(200).json({ history: mappedHistory });
  });
});


// delete chat from library
app.delete('/api/v1/history/:id', (req, res) => {
  const historyPath = path.join(__dirname, 'data', 'history.json');
  const { id } = req.params;
  let history = [];
  try {
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    history = Array.isArray(data.history) ? data.history : [];
  } catch (e) {
    console.error('Error reading history:', e);
    return res.status(500).json({ error: 'Failed to read history.' });
  }
  const newHistory = history.filter(item => item.id !== id);
  try {
    fs.writeFileSync(historyPath, JSON.stringify({ history: newHistory }, null, 2));
    res.status(204).json({ success: true });
  } catch (e) {
    console.error('Error writing history:', e);
    res.status(500).json({ error: 'Failed to write history.' });
  }
});


// PATCH endpoint to rename a chat
app.patch('/api/v1/history/:id', (req, res) => {
  const historyPath = path.join(__dirname, 'data', 'history.json');
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  let history = [];
  try {
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    history = Array.isArray(data.history) ? data.history : [];
  } catch (e) {
    return res.status(500).json({ error: 'Failed to read history.' });
  }
  const idx = history.findIndex(item => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'History item not found' });
  }
  history[idx].name = name;
  try {
    fs.writeFileSync(historyPath, JSON.stringify({ history }, null, 2));
    return res.status(200).json({ item: history[idx] });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to write history.' });
  }
});


// summarize a prompt to a brief name
function summarizePrompt(prompt) {
  if (!prompt) return '';

  // remove whitespace, split words & take first 7
  const words = prompt.trim().split(/\s+/).slice(0, 4);
  let summary = words.join(' ');

  // Remove trailing punctuation
  summary = summary.replace(/[.,;:!?]+$/, '');
  return summary;
}


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});