import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Ollama } from '@langchain/ollama';

const app = express();
app.use(cors());
app.use(express.json());

let customVectorStore = [];
let embeddingsInstance = null;

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function similaritySearch(query, k = 3) {
    if (!embeddingsInstance || customVectorStore.length === 0) return [];
    const queryEmbedding = await embeddingsInstance.embedQuery(query);
    const scored = customVectorStore.map(item => ({
        content: item.content,
        score: cosineSimilarity(queryEmbedding, item.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(item => ({ pageContent: item.content }));
}

async function initializeKnowledgeBase() {
    console.log('Loading documents from ./knowledge...');
    try {
        const activeDir = path.resolve('./knowledge');
        if (!fs.existsSync(activeDir)) {
            console.log('No knowledge directory found. Creating it.');
            fs.mkdirSync(activeDir);
            return;
        }

        const files = fs.readdirSync(activeDir);
        let allText = '';

        for (const file of files) {
            const fullPath = path.join(activeDir, file);
            if (file.endsWith('.pdf')) {
                const dataBuffer = fs.readFileSync(fullPath);
                const pdfParser = new PDFParse({ data: dataBuffer });
                const data = await pdfParser.getText();
                allText += `\n\n--- Document: ${file} ---\n` + data.text;
            } else if (file.endsWith('.txt') && file !== 'README.txt') {
                const textData = fs.readFileSync(fullPath, 'utf-8');
                allText += `\n\n--- Document: ${file} ---\n` + textData;
            }
        }

        if (!allText.trim()) {
            console.log('No documents found in ./knowledge. Skipping vector store creation.');
            return;
        }

        console.log(`Loaded custom text. Chunking...`);
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splitDocs = await splitter.createDocuments([allText]);
        console.log(`Created ${splitDocs.length} chunks. Generating embeddings with nomic-embed-text...`);

        embeddingsInstance = new OllamaEmbeddings({
            model: 'nomic-embed-text',
            baseUrl: 'http://localhost:11434'
        });

        const textsToEmbed = splitDocs.map(d => d.pageContent);
        const generatedEmbeddings = await embeddingsInstance.embedDocuments(textsToEmbed);

        customVectorStore = splitDocs.map((doc, idx) => ({
            content: doc.pageContent,
            embedding: generatedEmbeddings[idx]
        }));

        console.log('Vector store initialized successfully!');
    } catch (error) {
        console.error('Error initializing knowledge base:', error);
    }
}

app.post('/api/analyze', async (req, res) => {
    const { prompt, queryContext } = req.body;
    let augmentedSystemPrompt = prompt;

    try {
        if (customVectorStore.length > 0) {
            const results = await similaritySearch(queryContext || 'air quality health safety', 3);
            if (results.length > 0) {
                const contextStr = results.map(r => r.pageContent).join('\n\n');
                augmentedSystemPrompt += `\n\n--- RELEVANT LEGISLATION & RESEARCH CONTEXT ---\n${contextStr}\n------------------------------------------------\nBase your analysis strictly on this context if it explicitly dictates rules for these sensors. Otherwise, use your general knowledge.`;
            }
        }

        const llm = new Ollama({
            model: 'llama3.1',
            baseUrl: 'http://localhost:11434'
        });

        const response = await llm.invoke(augmentedSystemPrompt);
        res.json({ response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to communicate with LLM' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { messages, queryContext } = req.body;
    let contextStr = '';

    try {
        if (customVectorStore.length > 0) {
            const lastMessage = messages[messages.length - 1].content;
            const results = await similaritySearch(lastMessage, 4);
            if (results.length > 0) {
                contextStr = results.map(r => r.pageContent).join('\n\n');
            }
        }

        let systemPrompt = messages[0].content;
        if (contextStr) {
            systemPrompt += `\n\n--- RELEVANT LEGISLATION & RESEARCH CONTEXT ---\n${contextStr}\n------------------------------------------------\nYou MUST base your conversation on this context if it relates to the user's inquiry.`;
            messages[0].content = systemPrompt;
        }

        const payload = {
            model: 'llama3.1',
            messages: messages,
            stream: false
        };

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to communicate with LLM' });
    }
});

const PORT = 3001;
app.listen(PORT, async () => {
    console.log(`🚀 RAG Server running on port ${PORT}`);
    await initializeKnowledgeBase();
});
