import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HumanMessage } from "@langchain/core/messages";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

export const buildVectorStore = async (fullText, documentId, apiKey) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 100,
  });

  const docs = await splitter.createDocuments([fullText], [{ documentId }]); // Thêm metadata documentId

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
  });
  console.log(">> Embedding model in use:", embeddings.modelName);
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  // Serialize vector store để lưu vào Firestore
  const serializedVectorStore = {
    memoryVectors: vectorStore.memoryVectors.map((vec, index) => ({
      content: vec.content,
      metadata: { ...vec.metadata, documentId }, // Gắn documentId vào metadata
      embedding: vec.embedding,
      index,
    })),
  };

  console.log(
    ">>check vectorStore for document:",
    documentId,
    serializedVectorStore
  );
  return serializedVectorStore;
};

export const getRelevantChunks = async (
  query,
  k = 5,
  combinedVectorStore,
  similarityThreshold = 0.7
) => {
  if (!combinedVectorStore) throw new Error("Vector store chưa được cung cấp");

  //---------cách cũ-----------------------------------------
  // const retriever = combinedVectorStore.asRetriever({ k });
  // const docs = await retriever.getRelevantDocuments(query);
  // return docs.map((doc) => doc.pageContent).join("\n\n");
  //---------cách cũ-----------------------------------------

  //-------------cách có điểm số---------------------------------
  const results = await combinedVectorStore.similaritySearchWithScore(query, k);
  console.log(">>>check query with score:", results);
  const relevantDocs = results
    .filter(([_, score]) => score >= similarityThreshold)
    .map(([doc, _]) => doc.pageContent);

  console.log(
    `>> Retrieved ${relevantDocs.length} relevant chunks for query: ${query}`
  );
  return relevantDocs.join("\n\n") || "Không tìm thấy nội dung liên quan.";
  //-------------cách có điểm số---------------------------------
};

export const generateChatTitle = async (message) => {
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      // model: "gemini-1.5-flash",
      // temperature: 0, // độ sáng tạo
      maxRetries: 3,
      apiKey: apiKey,
    });

    const prompt = new HumanMessage({
      content: `
        Bạn là một trợ lý học thuật thông minh.  
        Hãy tạo một **tiêu đề bằng tiếng Việt** cho đoạn hội thoại dựa trên câu hỏi sau của sinh viên.

        ✅ Yêu cầu:
        - Tiêu đề phải **phản ánh rõ nội dung câu hỏi** hoặc chủ đề học thuật được nhắc đến.
        - Được phép dùng **nhiều từ (tối đa 12 từ)** nhưng phải ngắn gọn, **dễ hiểu, dễ nhớ**.
        - Không chứa từ "bot", "AI", "trợ lý", "câu hỏi", "hội thoại" hay các từ dư thừa.
        - Ưu tiên dùng **danh từ, cụm danh từ hoặc cụm động từ liên quan đến học thuật**.
        - Không dùng dấu chấm câu.

        📌 Câu hỏi của sinh viên:
        "${message}"

        👉 Trả về **duy nhất một dòng tiêu đề tiếng Việt** theo yêu cầu trên.
      `,
    });

    const response = await model.invoke([prompt]);
    let title = response.content.trim();

    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }

    return title;
  } catch (error) {
    console.error("Error generating chat title:", error);
    return message.length > 50 ? message.substring(0, 47) + "..." : message;
  }
};
