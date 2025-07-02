import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

let vectorStore = null; // cache tại runtime

export const buildVectorStore = async (fullText, apiKey) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 100,
  });

  const docs = await splitter.createDocuments([fullText]);

  const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });
  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
};

export const getRelevantChunks = async (query, k = 5) => {
  if (!vectorStore) throw new Error("Vector store chưa được khởi tạo");

  const retriever = vectorStore.asRetriever({ k });
  const docs = await retriever.getRelevantDocuments(query);
  return docs.map((doc) => doc.pageContent).join("\n\n");
};
