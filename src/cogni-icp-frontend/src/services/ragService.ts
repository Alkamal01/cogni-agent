// RAG Service now delegates ingest and search to the Python backend.
// We preserve the public API used by hooks/components to avoid UI changes.
import { pythonBackend } from './pythonBackendService';

export interface DocumentChunk {
  id: string;
  tutorId: string;
  fileName: string;
  content: string;
  embedding: number[];
  metadata: {
    page?: number;
    section?: string;
    timestamp: number;
  };
}

export interface RAGSearchResult {
  chunks: DocumentChunk[];
  query: string;
  context: string;
}

class FrontendRAGService {
  // No local DB anymore; Python backend handles storage and vector DB.

  // Extract text from various file types (kept for potential local preview; not required for ingest)
  async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        return await this.extractTextFromTxt(file);
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await this.extractTextFromPdf(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return await this.extractTextFromDocx(file);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error(`Failed to extract text from ${file.name}`);
    }
  }

  // Extract text from TXT files
  private async extractTextFromTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  // Extract text from PDF files (using PDF.js)
  private async extractTextFromPdf(file: File): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Dynamically import PDF.js
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            
            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              fullText += pageText + '\n';
            }
            
            resolve(fullText.trim() || `PDF content from ${file.name} (no text extracted)`);
          } catch (error) {
            console.error('PDF parsing error:', error);
            resolve(`PDF content from ${file.name} (PDF parsing failed)`);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('PDF.js import error:', error);
        // Fallback to placeholder
        resolve(`PDF content from ${file.name} (PDF parsing not available)`);
      }
    });
  }

  // Extract text from DOCX files
  private async extractTextFromDocx(file: File): Promise<string> {
    // For now, return a placeholder - implement DOCX parsing
    return `DOCX content from ${file.name} (DOCX parsing not implemented yet)`;
  }

  // Split text into chunks
  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastSentenceEnd = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastSentenceEnd, lastNewline);
        
        if (breakPoint > start + chunkSize * 0.5) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  // Process and store a document (delegate to Python backend file upload endpoint)
  async processDocument(tutorId: string, file: File): Promise<void> {
    console.log(`Uploading knowledge base file for tutor ${tutorId}:`, file.name);
    await pythonBackend.uploadKnowledgeBaseFiles(tutorId, [file]);
  }

  // Search for relevant chunks (delegate to Python RAG)
  async searchChunks(tutorId: string, query: string, limit: number = 5): Promise<RAGSearchResult> {
    // Use backend KB search
    const kb = await (pythonBackend as any).kbSearch?.(tutorId, query, limit);
    const docs: any[] = (kb?.results) || [];
    const mapped: DocumentChunk[] = docs.map((d: any, idx: number) => ({
      id: d.id || `${tutorId}_doc_${idx}`,
      tutorId,
      fileName: d.source || d.file_name || 'document',
      content: d.text || d.content || '',
      embedding: [],
      metadata: { timestamp: Date.now() },
    }));
    const context = mapped.map(m => m.content).join('\n\n');
    return { chunks: mapped, query, context };
  }

  // Local stores and cosine similarity removed; Python backend handles ranking

  // Delete all chunks – not applicable locally; expose a placeholder for API symmetry
  async deleteTutorChunks(_tutorId: string): Promise<void> {
    // Optional: implement a Python endpoint to clear RAG docs if needed
    return;
  }

  // Get document statistics for a tutor
  async getTutorDocumentStats(tutorId: string): Promise<{
    totalChunks: number;
    totalFiles: number;
    fileNames: string[];
  }> {
    // If Python exposes an info endpoint, call it; otherwise return minimal stats
    try {
      const r = await (pythonBackend as any).getKnowledgeBaseInfo?.(tutorId);
      if (r?.knowledge_base || r?.files) {
        const files = r.files || [];
        return {
          totalChunks: r.knowledge_base?.total_chunks || 0,
          totalFiles: files.length,
          fileNames: files.map((f: any) => f.file_name),
        };
      }
    } catch (e) {
      // ignore and fallback
    }
    return { totalChunks: 0, totalFiles: 0, fileNames: [] };
  }
}

// Export singleton instance
export const ragService = new FrontendRAGService();
export default ragService;
