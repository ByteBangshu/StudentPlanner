export enum Page {
  Login = 'LOGIN',
  Dashboard = 'DASHBOARD',
  Learning = 'LEARNING',
  Profile = 'PROFILE',
  Calendar = 'CALENDAR',
  Study = 'STUDY',
}

export interface Syllabus {
  id: string;
  name: string;
  color: string;
  topics: string[];
}

export type TaskType = 'Assignment' | 'Exam' | 'Miscellaneous';

export interface TodoItem {
  id: string;
  task: string;
  dueDate: string; // Format: MM/DD/YYYY
  completed: boolean;
  syllabusId: string;
  type: TaskType;
}

export type QuestionType = 'multiple-choice' | 'fill-in-the-blank' | 'select-dropdown';

export interface QuizQuestion {
  type: QuestionType;
  question: string; // For fill-in-the-blank, includes '____'
  options?: string[]; // For 'multiple-choice' and 'select-dropdown'
  correctAnswer: string; // The text of the correct answer
  explanation: string;
  distractorExplanations?: { option: string; explanation: string; }[];
}