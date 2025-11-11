import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TodoItem, QuizQuestion, Syllabus, QuestionType } from '../types';
import { generateQuizQuestions } from '../services/geminiService';
import { SpinnerIcon, BookOpenIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, CheckCircleIcon, XCircleIconSolid, XCircleIcon, UploadIcon, DocumentIcon, XMarkIcon } from './icons';

const getBorderColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
        teal: 'border-teal-500',
        blue: 'border-blue-500',
        purple: 'border-purple-500',
        pink: 'border-pink-500',
        red: 'border-red-500',
        orange: 'border-orange-500',
        yellow: 'border-yellow-500',
    };
    return colorMap[color] || 'border-gray-500';
};

type View = 'classSelection' | 'topicSelection' | 'quiz' | 'results';

interface StudyPageProps {
    todos: TodoItem[];
    syllabuses: Syllabus[];
    onUpdatePoints: (points: number) => void;
    initialSyllabus: Syllabus | null;
}

const SKIPPED_ANSWER = '__SKIPPED__';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};


const StudyPage: React.FC<StudyPageProps> = ({ todos, syllabuses, onUpdatePoints, initialSyllabus }) => {
    const [view, setView] = useState<View>('classSelection');
    const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentUserAnswer, setCurrentUserAnswer] = useState('');
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // Topic and settings state
    const [allTopics, setAllTopics] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [newTopic, setNewTopic] = useState('');
    const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);
    const [studyFiles, setStudyFiles] = useState<File[]>([]);
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [isQuestionTypeModalOpen, setIsQuestionTypeModalOpen] = useState(false);
    const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(['multiple-choice', 'fill-in-the-blank', 'select-dropdown']);


    // Results view state
    const [resultsView, setResultsView] = useState<'summary' | 'review'>('summary');
    const [reviewIndex, setReviewIndex] = useState(0);

    const studyableSyllabuses = useMemo(() => {
        const syllabusIdsWithExams = new Set(
            todos.filter(t => t.type === 'Exam').map(t => t.syllabusId)
        );
        return syllabuses.filter(s => syllabusIdsWithExams.has(s.id));
    }, [todos, syllabuses]);
    
    const handleSelectSyllabus = useCallback((syllabus: Syllabus) => {
        setSelectedSyllabus(syllabus);
        setAllTopics(syllabus.topics); // Set all available topics
        setSelectedTopics(syllabus.topics); // Pre-select all topics
        setView('topicSelection');
    }, []);

    useEffect(() => {
        if (initialSyllabus) {
            // Find the full syllabus object from the studyable list to ensure consistency
            const studyableVersion = studyableSyllabuses.find(s => s.id === initialSyllabus.id);
            if (studyableVersion) {
                handleSelectSyllabus(studyableVersion);
            }
        }
    }, [initialSyllabus, handleSelectSyllabus, studyableSyllabuses]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setStudyFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            setError(null);
        }
    };
    
    const handleRemoveFile = (indexToRemove: number) => {
        setStudyFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleAddTopic = () => {
        const trimmedTopic = newTopic.trim();
        if (trimmedTopic && !allTopics.includes(trimmedTopic)) {
            setAllTopics(prev => [...prev, trimmedTopic]); // Add to the list of available topics
            setSelectedTopics(prev => [...prev, trimmedTopic]); // And select it by default
            setNewTopic('');
        }
    };

    const handleToggleTopic = (topicToToggle: string) => {
        setSelectedTopics(prev => 
            prev.includes(topicToToggle)
                ? prev.filter(t => t !== topicToToggle)
                : [...prev, topicToToggle]
        );
    };

    const handleGenerateQuiz = useCallback(async () => {
        if (selectedTopics.length === 0) {
            setError("Please select at least one topic for the quiz.");
            return;
        }
        if (selectedQuestionTypes.length === 0) {
            setError("Please select at least one question type.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Generating your custom quiz...');
        setError(null);

        try {
            const fileData = await Promise.all(
                studyFiles.map(async (file) => ({
                    mimeType: file.type,
                    data: await fileToBase64(file),
                }))
            );

            const questions = await generateQuizQuestions(selectedTopics, numberOfQuestions, difficulty, fileData, selectedQuestionTypes);
            if (questions.length === 0) {
                throw new Error("Could not generate any questions. Try adjusting your topics.");
            }
            setQuizQuestions(questions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setUserAnswers([]);
            setCurrentUserAnswer('');
            setIsAnswerSubmitted(false);
            setView('quiz');
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during quiz generation.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedTopics, numberOfQuestions, difficulty, studyFiles, selectedQuestionTypes]);
    
    const handleSubmitAnswer = () => {
        if (isAnswerSubmitted) return;
        
        const question = quizQuestions[currentQuestionIndex];
        const answer = currentUserAnswer.trim();
        let isCorrect = false;

        if (question.type === 'fill-in-the-blank') {
            const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
            isCorrect = correctAnswers.some(correct => correct.toLowerCase() === answer.toLowerCase());
        } else {
            isCorrect = answer === question.correctAnswer;
        }

        if (isCorrect) {
            setScore(s => s + 1);
            onUpdatePoints(5);
        } else {
            onUpdatePoints(-2);
        }
        
        setUserAnswers(prev => [...prev, answer]);
        setIsAnswerSubmitted(true);
    };
    
    const handleSkipQuestion = () => {
        if (isAnswerSubmitted) return;
        setUserAnswers(prev => [...prev, SKIPPED_ANSWER]);
        setCurrentUserAnswer(SKIPPED_ANSWER);
        setIsAnswerSubmitted(true);
        // No points change for skipping
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setCurrentUserAnswer('');
            setIsAnswerSubmitted(false);
        } else {
            setView('results');
        }
    };
    
    const resetStudySession = () => {
        setView('classSelection');
        setSelectedSyllabus(null);
        setQuizQuestions([]);
        setAllTopics([]);
        setSelectedTopics([]);
        setError(null);
        setNumberOfQuestions(10);
        setResultsView('summary');
        setReviewIndex(0);
        setStudyFiles([]);
        setDifficulty('Medium');
        setSelectedQuestionTypes(['multiple-choice', 'fill-in-the-blank', 'select-dropdown']);
    };

    const getButtonClass = (option: string) => {
        if (!isAnswerSubmitted) {
            return 'bg-slate-700 hover:bg-slate-600';
        }
        const currentQ = quizQuestions[currentQuestionIndex];
        if (option === currentQ.correctAnswer) {
            return 'bg-green-500/50 border-green-500';
        }
        if (option === currentUserAnswer) {
            return 'bg-red-500/50 border-red-500';
        }
        return 'bg-slate-700 opacity-60';
    };
    
    const renderClassSelection = () => (
        <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                    <BookOpenIcon className="h-8 w-8 text-teal-400" />
                    <h1 className="text-2xl font-bold text-teal-400">Start a Study Session</h1>
                </div>
                <p className="text-slate-400 mb-6">Choose a course to generate a practice quiz.</p>
                {studyableSyllabuses.length > 0 ? (
                    <ul className="space-y-3">
                        {studyableSyllabuses.map(syllabus => {
                            const borderColorClass = getBorderColorClass(syllabus.color);
                            return (
                                <li key={syllabus.id}>
                                    <button onClick={() => handleSelectSyllabus(syllabus)} className={`w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors duration-200 flex justify-between items-center border-l-4 ${borderColorClass}`}>
                                        <div>
                                            <p className="font-semibold text-slate-100">{syllabus.name}</p>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-slate-500" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center text-slate-400 py-8">No courses with exams found. Add a syllabus and categorize tasks as 'Exam' to begin.</p>
                )}
            </div>
        </div>
    );
    
    const renderTopicSelection = () => {
        const questionTypes: QuestionType[] = ['multiple-choice', 'fill-in-the-blank', 'select-dropdown'];
        const handleQuestionTypeChange = (type: QuestionType) => {
            setSelectedQuestionTypes(prev =>
                prev.includes(type)
                    ? prev.filter(t => t !== type)
                    : [...prev, type]
            );
        };

        return (
            <div className="max-w-2xl mx-auto">
                <button onClick={() => setView('classSelection')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 mb-4">
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Course Selection
                </button>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-slate-200 mb-2">Customize Your Quiz</h2>
                    <p className="text-slate-400 mb-6">Select topics and adjust the number of questions for your <span className="text-teal-400 font-semibold">{selectedSyllabus?.name}</span> quiz.</p>
                    {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center justify-between"><p>{error}</p><button onClick={() => setError(null)}><XCircleIconSolid className="h-5 w-5"/></button></div>}
                    
                    {isLoading ? (
                         <div className="flex flex-col items-center justify-center py-12">
                            <SpinnerIcon className="h-8 w-8 text-teal-400" />
                            <p className="mt-4 text-slate-300">{loadingMessage}</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h3 className="text-md font-semibold text-slate-300 mb-3">Study Materials (Optional)</h3>
                                <p className="text-sm text-slate-400 mb-3">Upload notes or study guides to generate questions based on your specific materials.</p>
                                <label className="w-full cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                                    <UploadIcon className="h-5 w-5"/>
                                    <span>{studyFiles.length > 0 ? `${studyFiles.length} file(s) selected` : 'Choose Files'}</span>
                                    <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf"/>
                                </label>
                                {studyFiles.length > 0 && (
                                    <ul className="space-y-2 mt-3">
                                        {studyFiles.map((file, index) => (
                                            <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <DocumentIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-medium text-slate-200 truncate" title={file.name}>{file.name}</p>
                                                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveFile(index)} className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors flex-shrink-0 ml-2">
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div className="mb-6">
                                <h3 className="text-md font-semibold text-slate-300 mb-3">Quiz Difficulty</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${difficulty === d ? 'bg-teal-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-md font-semibold text-slate-300 mb-3">Question Types</h3>
                                <div className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                                    <p className="text-sm text-slate-300 capitalize flex-grow truncate pr-4">
                                        {selectedQuestionTypes.length === 3 ? 'All Types' : selectedQuestionTypes.map(t => t.replace('-', ' ')).join(', ') || 'None selected'}
                                    </p>
                                    <button
                                        onClick={() => setIsQuestionTypeModalOpen(true)}
                                        className="text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors flex-shrink-0"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
    
                            <div className="mb-6">
                                <label htmlFor="question-count" className="block text-sm font-medium text-slate-300 mb-2">Number of Questions: <span className="font-bold text-teal-400">{numberOfQuestions}</span></label>
                                <input id="question-count" type="range" min="5" max="25" step="1" value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                            </div>
    
                            <div className="mb-6">
                                <h3 className="text-md font-semibold text-slate-300 mb-3">Quiz Topics:</h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {allTopics.map(topic => {
                                        const isSelected = selectedTopics.includes(topic);
                                        return (
                                            <button
                                                key={topic}
                                                onClick={() => handleToggleTopic(topic)}
                                                className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                                            >
                                                {isSelected && <CheckCircleIcon className="h-4 w-4" />}
                                                {topic}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="text" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()} placeholder="Add a custom topic..." className="flex-grow appearance-none w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md placeholder-slate-500 text-white focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                    <button onClick={handleAddTopic} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 transition-colors">Add</button>
                                </div>
                            </div>
    
                            <button onClick={handleGenerateQuiz} disabled={isLoading || selectedTopics.length === 0} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                                {isLoading ? <><SpinnerIcon className="h-5 w-5"/><span>{loadingMessage}</span></> : 'Generate Quiz'}
                            </button>
                        </>
                    )}
                </div>
                {isQuestionTypeModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsQuestionTypeModalOpen(false)}>
                        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-teal-400 mb-4">Edit Question Types</h3>
                            <p className="text-sm text-slate-400 mb-4">Select the types of questions you want in your quiz.</p>
                            <div className="space-y-3">
                                {questionTypes.map(type => (
                                    <label key={type} className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedQuestionTypes.includes(type)}
                                            onChange={() => handleQuestionTypeChange(type)}
                                            className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-teal-500 focus:ring-teal-500"
                                        />
                                        <span className="text-slate-200 capitalize">{type.replace('-', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-end mt-6">
                                <button onClick={() => setIsQuestionTypeModalOpen(false)} className="px-4 py-2 text-sm rounded-md bg-teal-600 hover:bg-teal-700 transition-colors">Done</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    };

    const renderQuizQuestion = () => {
        const question = quizQuestions[currentQuestionIndex];
        
        const renderAnswerOptions = () => {
            switch (question.type) {
                case 'multiple-choice':
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options?.map((option, index) => (
                                <button key={option} onClick={() => setCurrentUserAnswer(option)} disabled={isAnswerSubmitted} className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 ${currentUserAnswer === option ? 'border-teal-500' : 'border-transparent'} ${getButtonClass(option)}`}>
                                    <span className="font-bold mr-2 text-teal-400">{String.fromCharCode(65 + index)}.</span>
                                    <span>{option}</span>
                                </button>
                            ))}
                        </div>
                    );
                case 'select-dropdown':
                    return (
                        <select
                            value={currentUserAnswer}
                            onChange={(e) => setCurrentUserAnswer(e.target.value)}
                            disabled={isAnswerSubmitted}
                            className="w-full p-4 rounded-lg bg-slate-700 border-2 border-slate-600 focus:border-teal-500 focus:ring-teal-500 transition-colors disabled:opacity-70"
                        >
                            <option value="" disabled>Select an answer...</option>
                            {question.options?.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    );
                case 'fill-in-the-blank':
                    const parts = question.question.split('____');
                    return (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{parts[0]}</span>
                            <input
                                type="text"
                                value={currentUserAnswer}
                                onChange={(e) => setCurrentUserAnswer(e.target.value)}
                                disabled={isAnswerSubmitted}
                                className="inline-block flex-grow min-w-[150px] text-center text-lg font-semibold px-2 py-1 bg-slate-700 border-b-2 border-slate-500 focus:border-teal-400 outline-none transition-colors"
                            />
                            <span className="text-lg">{parts[1]}</span>
                        </div>
                    );
                default: return null;
            }
        };

        const renderExplanation = () => {
            const isCorrect = currentUserAnswer.trim().toLowerCase() === (Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer).toLowerCase();
            const isSkipped = currentUserAnswer === SKIPPED_ANSWER;
            
            return (
                 <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    {isCorrect ? (
                        <h3 className="text-lg font-bold text-green-400 mb-2">Correct!</h3>
                    ) : (
                        <div>
                            <h3 className="text-lg font-bold text-red-400 mb-2">{isSkipped ? 'Skipped' : 'Incorrect.'}</h3>
                            <p className="text-sm text-slate-400 mb-2">Correct answer: <strong className="text-teal-300">{Array.isArray(question.correctAnswer) ? question.correctAnswer.join(' / ') : question.correctAnswer}</strong></p>
                        </div>
                    )}
                    <p className="text-sm text-slate-300 mb-4"><strong className="text-slate-100">Explanation:</strong> {question.explanation}</p>
                    
                    {question.distractorExplanations && !isCorrect && (
                         <div className="space-y-3 mt-4 text-sm">
                            <h4 className="font-semibold text-slate-200">Why the other options were wrong:</h4>
                            {question.distractorExplanations.map(({ option, explanation }) => (
                                <p key={option} className="text-slate-400"><strong className="text-slate-300">{option}:</strong> {explanation}</p>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 text-right">
                        <button onClick={handleNextQuestion} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </button>
                    </div>
                 </div>
            );
        }

        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                <p className="text-lg font-semibold text-slate-100 mb-6">{question.type !== 'fill-in-the-blank' ? question.question : ''}</p>
                <div className="mb-6">{renderAnswerOptions()}</div>
                
                {!isAnswerSubmitted ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={handleSkipQuestion} className="w-full sm:w-auto px-6 py-2 text-sm font-medium rounded-md text-slate-300 bg-transparent hover:bg-slate-700 border border-slate-600 transition-colors">
                            Skip Question
                        </button>
                        <button onClick={handleSubmitAnswer} disabled={!currentUserAnswer} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Submit Answer
                        </button>
                    </div>
                ) : renderExplanation()}
            </div>
        );
    };
    
    const renderQuiz = () => {
        const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-teal-400">Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
                        <p className="text-sm font-semibold text-slate-300">Score: {score}/{currentQuestionIndex}</p>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                {renderQuizQuestion()}
            </div>
        );
    };

    const renderReview = () => {
        const question = quizQuestions[reviewIndex];
        const userAnswer = userAnswers[reviewIndex];
        const isCorrect = userAnswer.toLowerCase() === (Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer).toLowerCase();
        const isSkipped = userAnswer === SKIPPED_ANSWER;

        const getReviewOptionClass = (option: string) => {
            if (option === question.correctAnswer) {
                return 'bg-green-600/50 border-green-500';
            }
            if (option === userAnswer && !isCorrect) {
                return 'bg-red-600/50 border-red-500';
            }
            return 'bg-slate-700 border-transparent opacity-70';
        };

        const renderAnswerOptions = () => {
             switch (question.type) {
                case 'multiple-choice':
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options?.map((option, index) => (
                                <div key={option} className={`p-4 rounded-lg border-2 transition-colors ${getReviewOptionClass(option)}`}>
                                    <span className="font-bold mr-2 text-teal-400">{String.fromCharCode(65 + index)}.</span>
                                    <span>{option}</span>
                                </div>
                            ))}
                        </div>
                    );
                case 'select-dropdown':
                     return (
                        <div>
                             <p className="text-sm text-slate-400 mb-2">Your answer:</p>
                             <div className={`p-4 rounded-lg border-2 ${getReviewOptionClass(userAnswer)}`}>
                                {isSkipped ? <em className="text-slate-500">You skipped this question</em> : userAnswer || <em className="text-slate-500">No answer selected</em>}
                            </div>
                        </div>
                    );
                case 'fill-in-the-blank':
                    const parts = question.question.split('____');
                    return (
                        <div className="flex items-center gap-2 flex-wrap text-lg bg-slate-900/50 p-4 rounded-lg">
                            <span>{parts[0]}</span>
                            <span className={`inline-block min-w-[150px] text-center font-semibold px-2 py-1 rounded-md ${isCorrect ? 'bg-green-600/50' : 'bg-red-600/50'}`}>
                                {isSkipped ? <em className="text-sm text-slate-300">Skipped</em> : userAnswer}
                            </span>
                            <span>{parts[1]}</span>
                        </div>
                    );
                default: return null;
            }
        }

        return (
             <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-teal-400 mb-4 text-center">Reviewing Answers</h2>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8 mb-4">
                    <p className="text-sm text-slate-400 mb-2">Question {reviewIndex + 1} of {quizQuestions.length}</p>
                    <p className="text-lg font-semibold text-slate-100 mb-6">{question.question}</p>
                    
                    <div className="mb-6">{renderAnswerOptions()}</div>
                    
                    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                        {isCorrect ? (
                             <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/> You got it right!</h3>
                        ) : (
                            <div>
                                <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2"><XCircleIcon className="h-5 w-5" /> {isSkipped ? 'Skipped' : 'Incorrect'}</h3>
                                <p className="text-sm text-slate-400 mb-2">Correct answer: <strong className="text-teal-300">{Array.isArray(question.correctAnswer) ? question.correctAnswer.join(' / ') : question.correctAnswer}</strong></p>
                            </div>
                        )}
                        <p className="text-sm text-slate-300"><strong className="text-slate-100">Explanation:</strong> {question.explanation}</p>
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <button onClick={() => setReviewIndex(i => i - 1)} disabled={reviewIndex === 0} className="px-6 py-2 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <button onClick={() => setResultsView('summary')} className="px-6 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">Back to Summary</button>
                    <button onClick={() => setReviewIndex(i => i + 1)} disabled={reviewIndex === quizQuestions.length - 1} className="px-6 py-2 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
            </div>
        );
    }

    const renderResults = () => {
        if (resultsView === 'review') {
            return renderReview();
        }

        return (
            <div className="max-w-2xl mx-auto text-center">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Quiz Complete!</h1>
                    <p className="text-slate-300 text-lg mb-6">Your final score is:</p>
                    <p className="text-6xl font-bold text-white mb-8">{score} <span className="text-4xl text-slate-400">/ {quizQuestions.length}</span></p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                         <button onClick={() => setResultsView('review')} className="w-full sm:w-auto bg-transparent hover:bg-slate-700/50 text-slate-200 font-semibold py-3 px-8 rounded-lg transition-colors duration-300 border border-slate-600">
                            Review Answers
                        </button>
                        <button onClick={resetStudySession} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                            Study Another Topic
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    switch (view) {
        case 'classSelection': return renderClassSelection();
        case 'topicSelection': return renderTopicSelection();
        case 'quiz': return renderQuiz();
        case 'results': return renderResults();
        default: return renderClassSelection();
    }
};

export default StudyPage;