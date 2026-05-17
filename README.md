RAG Document Search
Upload PDFs and ask questions about them in plain language. The app finds the relevant sections and uses Claude to generate a contextual answer with source citations.
How it works

Upload a PDF — the text is extracted and split into chunks
Each chunk is converted to an embedding using the Anthropic API
When you ask a question, your query is also embedded and compared against the stored chunks
The most relevant chunks are sent to Claude as context
Claude generates an answer grounded in the actual document content

Stack

Next.js 14 / TypeScript
Tailwind CSS
Anthropic SDK (embeddings + Claude Haiku)
pdf-parse for text extraction
vectra for local vector storage

Getting started
bashnpm install
Create a .env.local file:
ANTHROPIC_API_KEY=your_key_here
bashnpm run dev
Open http://localhost:3000.
Features

PDF upload with drag and drop
Automatic chunking and embedding on upload
Semantic search across all uploaded documents
Answers with source citations and relevance scores
Document management (add, remove, refresh)
