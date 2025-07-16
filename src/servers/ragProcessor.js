import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HumanMessage } from "@langchain/core/messages";

let vectorStore = null; // cache tại runtime
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

export const buildVectorStore = async (fullText, apiKey) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 100,
  });

  const docs = await splitter.createDocuments([fullText]);

  const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });
  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  console.log(">>check vectorStore: ", vectorStore);
};

export const getRelevantChunks = async (query, k = 5) => {
  if (!vectorStore) throw new Error("Vector store chưa được khởi tạo");

  const retriever = vectorStore.asRetriever({ k });
  const docs = await retriever.getRelevantDocuments(query);
  return docs.map((doc) => doc.pageContent).join("\n\n");
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
