
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function extractHandwrittenText(imageBase64: string): Promise<string> {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          text: `Extract all handwritten text from this exam paper image. 
          Support both English and Bengali (Bangla) text. 
          Focus ONLY on the content (answers/questions). 
          Preserve question numbers or labels if possible. 
          If there are multiple sections, separate them clearly. 
          Return ONLY the extracted text.`
        }
      ]
    },
  });

  return response.text || '';
}

export async function evaluateStudentWork(
  studentFullText: string, 
  masterKeyText: string
): Promise<EvaluationReport> {
  const model = 'gemini-3-pro-preview';

  const response = await ai.models.generateContent({
    model,
    contents: `
      You are an expert examiner. Your task is to evaluate a student's exam answers based on a master answer key.
      
      MASTER ANSWER KEY (Correct answers and marks):
      ${masterKeyText}
      
      STUDENT ANSWERS (Extracted from handwriting):
      ${studentFullText}
      
      EVALUATION RULES:
      1. Identify every question listed in the MASTER ANSWER KEY.
      2. If a student has not provided an answer for a question found in the master key, mark it as "skipped" with 0 marks.
      3. For answered questions, compare student content against the master key content.
      4. Support evaluation in both English and Bengali.
      
      Please provide a detailed evaluation in JSON format. 
      The JSON should match the following schema:
      - totalMarks: total possible marks in the whole exam
      - totalObtained: total marks the student earned
      - overallFeedback: summary of student performance
      - questions: array of objects containing:
        - questionNumber: string (e.g., "Q1", "2.a")
        - maxMarks: number
        - obtainedMarks: number
        - status: "answered" | "skipped" | "partially_answered"
        - feedback: string (what was correct/wrong/missing)
        - studentAnswer: string (quote student's response or "No response")
        - actualAnswer: string (quote master answer)
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalMarks: { type: Type.NUMBER },
          totalObtained: { type: Type.NUMBER },
          overallFeedback: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionNumber: { type: Type.STRING },
                maxMarks: { type: Type.NUMBER },
                obtainedMarks: { type: Type.NUMBER },
                status: { type: Type.STRING },
                feedback: { type: Type.STRING },
                studentAnswer: { type: Type.STRING },
                actualAnswer: { type: Type.STRING }
              },
              required: ["questionNumber", "maxMarks", "obtainedMarks", "status", "feedback", "studentAnswer", "actualAnswer"]
            }
          }
        },
        required: ["totalMarks", "totalObtained", "overallFeedback", "questions"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as EvaluationReport;
  } catch (e) {
    console.error("Failed to parse evaluation JSON", e);
    throw new Error("Evaluation parsing failed.");
  }
}
