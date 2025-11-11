import { GoogleGenAI, Type } from "@google/genai";
import { TodoItem, QuizQuestion, QuestionType } from '../types';

const TODO_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    task: {
      type: Type.STRING,
      description: 'A concise description of the assignment, exam, or task.',
    },
    dueDate: {
      type: Type.STRING,
      description: 'The due date in strict MM/DD/YYYY format.',
    },
    type: {
      type: Type.STRING,
      enum: ['Assignment', 'Exam', 'Miscellaneous'],
      description: "The category of the task. Use 'Exam' for midterms, finals, and major tests. Use 'Assignment' for homework, projects, and labs. Use 'Miscellaneous' for other items like important dates or reminders.",
    }
  },
  required: ['task', 'dueDate', 'type'],
};

const TODO_SCHEMA = {
  type: Type.ARRAY,
  items: TODO_ITEM_SCHEMA,
};

const SYLLABUS_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    className: {
      type: Type.STRING,
      description: 'The full name of the class, including course code and title (e.g., "CS 2337 - Computer Science II").',
    },
    professorName: {
      type: Type.STRING,
      description: "The name of the professor or instructor for the course. If not present, this can be an empty string.",
    },
    tasks: TODO_SCHEMA,
    topics: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of 5-15 main topics covered in the course, extracted from the syllabus schedule or topic list.'
    }
  },
  required: ['className', 'tasks', 'topics'],
};


const QUIZ_QUESTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['multiple-choice', 'fill-in-the-blank', 'select-dropdown'], description: "The type of question." },
      question: { type: Type.STRING, description: 'The question text. For "fill-in-the-blank", use "____" to indicate where the answer goes.' },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 4-5 strings for options. Required for 'multiple-choice' and 'select-dropdown'."
      },
      correctAnswer: {
        type: Type.STRING,
        description: "The correct answer. For choice-based questions, it MUST be one of the strings from the 'options' array. For fill-in-the-blank, it is the text that fills the blank."
      },
      explanation: { type: Type.STRING, description: 'A detailed explanation of why the correct answer is right.' },
      distractorExplanations: {
        type: Type.ARRAY,
        description: 'An array of objects, each containing an incorrect option and its corresponding explanation. Required for "multiple-choice" and "select-dropdown".',
        items: {
            type: Type.OBJECT,
            properties: {
                option: { type: Type.STRING, description: 'The text of the incorrect option from the "options" array.' },
                explanation: { type: Type.STRING, description: 'The explanation for why this option is incorrect.' }
            },
            required: ['option', 'explanation']
        }
      },
    },
    required: ['type', 'question', 'correctAnswer', 'explanation'],
};

const QUIZ_SCHEMA = {
    type: Type.ARRAY,
    items: QUIZ_QUESTION_SCHEMA
};

export const generateTodoListFromFile = async (
    file: { mimeType: string; data: string },
    existingTaskKeywords: string[]
): Promise<{ className: string; professorName: string; tasks: Omit<TodoItem, 'id' | 'completed' | 'syllabusId'>[]; topics: string[] }> => {
    try {
        // FIX: Use process.env.API_KEY per Gemini API guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        let prompt = `Please perform a detailed analysis of the following course syllabus document.

Your primary goal is to extract key information and structure it as a JSON object that strictly adheres to the provided schema.

You MUST extract the following:
1.  **Class Name**: Identify the official course name, including its code and title (e.g., "CS 2337 - Computer Science II").
2.  **Professor's Name**: Find the name of the instructor. If it's not present, this field should be an empty string.
3.  **Topics**: From the course schedule or topics list, extract a list of 5-15 main subjects covered in the class.
4.  **Tasks**: Identify and extract all tasks, assignments, quizzes, exams, and projects. For each item, provide:
    - A concise description of the task.
    - The exact due date in MM/DD/YYYY format.
    - The type of task, categorized as 'Assignment', 'Exam', or 'Miscellaneous'.
        - 'Exam': Midterms, finals, major tests.
        - 'Assignment': Homework, projects, labs, quizzes.
        - 'Miscellaneous': Important dates, reminders, office hours.

Important instructions for date extraction:
- If a due date is specified as a range, use the final day of that range.
- If a day of the week is mentioned (e.g., "due every Friday"), calculate the specific date based on a typical 15-week semester calendar. Assume Fall semesters start around the last week of August and Spring semesters start around the third week of January.
- Return all extracted information in a single JSON object.

Some more important clarifications:
- Do not consolidate a single due date for all repeated assignments (e.g. weekly Homeworks)
These should still have individual assignments for each week.
- Please try to keep the assignment names short. I do not want to have length names such as "Homework for Week 1"
Just shorten them to something like Week 1 Homework or Homework 1. 
`;

        if (existingTaskKeywords.length > 0) {
            const uniqueKeywords = [...new Set(existingTaskKeywords)]; // Ensure keywords are unique
            prompt += `\n\nTo improve task identification accuracy, pay special attention to items that resemble these known task types from other courses: ${uniqueKeywords.slice(0, 20).join(', ')}. Use these as a guide to identify similar tasks in this document.`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: file.mimeType,
                            data: file.data,
                        },
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: SYLLABUS_DATA_SCHEMA,
            },
        });

        const jsonText = response.text.trim();
        let cleanedJsonText = jsonText;
        if (cleanedJsonText.startsWith("```json")) {
            cleanedJsonText = cleanedJsonText.substring(7, cleanedJsonText.length - 3).trim();
        } else if (cleanedJsonText.startsWith("```")) {
            cleanedJsonText = cleanedJsonText.substring(3, cleanedJsonText.length - 3).trim();
        }
        
        const parsedJson = JSON.parse(cleanedJsonText);

        if (typeof parsedJson !== 'object' || parsedJson === null || !Array.isArray(parsedJson.tasks)) {
            throw new Error("API did not return a valid syllabus data object.");
        }

        return {
            className: parsedJson.className || 'Untitled Course',
            professorName: parsedJson.professorName || '',
            tasks: parsedJson.tasks,
            topics: parsedJson.topics || [],
        };

    } catch (error) {
        console.error("Error generating to-do list:", error);
        if (error instanceof Error) {
            // Re-throw the original error to preserve the stack trace and a more specific message.
            // This allows the UI component to display a more informative error.
            throw error;
        }
        // For non-Error objects that might be thrown
        throw new Error("An unexpected error occurred during syllabus analysis.");
    }
};

export const generateQuizQuestions = async (
    topics: string[],
    numberOfQuestions: number,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    files: { mimeType: string; data: string }[],
    questionTypes: QuestionType[]
): Promise<QuizQuestion[]> => {
    try {
        // FIX: Use process.env.API_KEY per Gemini API guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

        let prompt = `You are an expert quiz creator. Your task is to generate a quiz with exactly ${numberOfQuestions} questions of ${difficulty} difficulty.

The quiz must be based on the following topics:
- ${topics.join('\n- ')}
`;

        if (files.length > 0) {
            prompt += `\n\nCRITICAL INSTRUCTION: You MUST use the content from the provided document(s) as the primary source material for generating the questions. The topics list should be used to guide which parts of the document to focus on. The questions should test knowledge derived *directly* from the provided text.`;
        }

        prompt += `\n\nInstructions:
1.  You MUST ONLY generate questions of the following types: ${questionTypes.join(', ')}. Distribute the questions as evenly as possible among these selected types.
2.  For each question, you MUST provide all required fields as specified in the JSON schema.
3.  For 'fill-in-the-blank' questions, use "____" in the question text to indicate where the answer should go.
4.  For 'multiple-choice' and 'select-dropdown' questions:
    - Provide an array of 4 distinct string options.
    - The 'correctAnswer' field MUST be one of the strings from the 'options' array.
    - The 'distractorExplanations' field must be an array of objects. Each object should have an 'option' property (the incorrect option text) and an 'explanation' property (the reason it's wrong).
5.  Ensure all explanations (for both correct and incorrect answers) are clear, concise, and educational.
6.  Return the result as a single JSON array of question objects. Do not wrap it in markdown.`;

        const contentParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];
        if (files.length > 0) {
            files.forEach(file => {
                contentParts.push({
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.data,
                    },
                });
            });
        }


        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: QUIZ_SCHEMA,
            },
        });

        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
        const parsedJson = JSON.parse(cleanedJsonText);

        if (!Array.isArray(parsedJson)) {
            throw new Error("API did not return a valid array of quiz questions.");
        }

        return parsedJson as QuizQuestion[];

    } catch (error) {
        console.error("Error generating quiz:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to generate the quiz. Please try a different topic or file.");
    }
};