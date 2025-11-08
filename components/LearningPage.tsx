import React, { useState, useCallback } from 'react';
import { generateTodoListFromFile } from '../services/geminiService';
import { TodoItem, Syllabus, TaskType } from '../types';
import { UploadIcon, SpinnerIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, DocumentIcon, XCircleIconSolid, CheckCircleIcon } from './icons';

const newTaskList = async(year: Number,month:Number,day:Number,task:string) =>{
    try {
        const response = await fetch(`http://localhost:3001/addEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year, month,day,task })
        });

        if(!response.ok)
            {
                const data = await response.json();
                throw new Error(data.message || 'Could not add event');
            }
    
        return response.json();
    
    } catch (error) {
        console.error('Network error:', error);
        throw new Error(error.message || 'Network error');
    }
}
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

const getBackgroundColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
        teal: 'bg-teal-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
        pink: 'bg-pink-500', red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
        green: 'bg-green-500', indigo: 'bg-indigo-500', cyan: 'bg-cyan-500'
    };
    return colorMap[color] || 'bg-gray-500';
};

interface LearningPageProps {
    onSyllabusUpload: (syllabuses: Syllabus[], items: TodoItem[]) => void;
    todos: TodoItem[];
    syllabuses: Syllabus[];
    onUpdateSyllabusName: (syllabusId: string, newName: string) => void;
    onUpdateSyllabusColor: (syllabusId: string, newColor: string) => void;
}

const syllabusColors = ['teal', 'blue', 'purple', 'pink', 'red', 'orange', 'yellow'];
const editableSyllabusColors = ['teal', 'blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'indigo', 'cyan'];

const LearningPage: React.FC<LearningPageProps> = ({ onSyllabusUpload, todos, syllabuses, onUpdateSyllabusName, onUpdateSyllabusColor }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [lastGeneratedList, setLastGeneratedList] = useState<TodoItem[]>([]);
    const [lastGeneratedSyllabuses, setLastGeneratedSyllabuses] = useState<Syllabus[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // State for editing existing syllabuses
    const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedColor, setEditedColor] = useState('');

    // State for editing newly generated items
    const [editingSyllabusId, setEditingSyllabusId] = useState<string | null>(null);
    const [editingSyllabusName, setEditingSyllabusName] = useState('');
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
    const [editingTodoTask, setEditingTodoTask] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
            setError(null);
            setSuccessMessage(null);
            setLastGeneratedList([]);
            setLastGeneratedSyllabuses([]);
        } else {
            setFiles([]);
        }
    };

    const handleRemoveFile = (fileIndex: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== fileIndex));
    };

    const handleGenerate = useCallback(async () => {
        if (files.length === 0) {
            setError("Please select one or more syllabus files.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setLastGeneratedList([]);
        setLastGeneratedSyllabuses([]);

        const newSyllabuses: Syllabus[] = [];
        const newTodos: TodoItem[] = [];
        const existingTaskKeywords = todos.map(t => t.task);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const base64Data = await fileToBase64(file);
                
                const result = await generateTodoListFromFile({
                    mimeType: file.type,
                    data: base64Data,
                }, existingTaskKeywords);

                const syllabusId = crypto.randomUUID();
                const newSyllabus: Syllabus = {
                    id: syllabusId,
                    name: result.className + (result.professorName ? ` - ${result.professorName}` : ''),
                    color: syllabusColors[(syllabuses.length + i) % syllabusColors.length],
                    topics: result.topics,
                };
                newSyllabuses.push(newSyllabus);

                const itemsWithDetails: TodoItem[] = result.tasks.map((item) => ({
                    ...item,
                    id: crypto.randomUUID(),
                    completed: false,
                    syllabusId: syllabusId,
                }));
                newTodos.push(...itemsWithDetails);
            }

            setLastGeneratedSyllabuses(newSyllabuses);
            setLastGeneratedList(newTodos);

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "An unknown error occurred.");
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [files, todos, syllabuses]);
    
    const handleAddToPlanner = async () => {
        // const courseNames = lastGeneratedSyllabuses.map(s => s.name).join(', ');
        // setSuccessMessage(`Successfully added tasks for: ${courseNames}.`);
        // const tasksAdded = lastGeneratedList.map(item => `${item.task} (${item.type}) for ${lastGeneratedSyllabuses.find(s => s.id === item.syllabusId)?.name}`).join('\n');
        // setSuccessMessage(`Successfully added tasks:\n${tasksAdded}`);
        // Map lastGeneratedList to [month, day, year, task] array
        const tasksArray = await Promise.all(
            lastGeneratedList.map(async item => {
                console.log(item);
                const [monthStr, dayStr, yearStr] = item.dueDate.split('/'); // MM/DD/YYYY
                const month = parseInt(monthStr, 10);
                const day = parseInt(dayStr, 10);
                const year = parseInt(yearStr, 10);
                console.log(year, month, day, item.task);
                await newTaskList(year, month, day, item.task);
                return [month, day, year, item.task] as [number, number, number, string];
            })
        );
        
        // Create a readable message for successMessage
        const tasksMessage = tasksArray
            .map(([month, day, year, task]) => `${month}/${day}/${year}: ${task}`)
            .join('\n');

        setSuccessMessage(`Successfully added tasks:\n${tasksMessage}`);
        onSyllabusUpload(lastGeneratedSyllabuses, lastGeneratedList);
        setLastGeneratedList([]);
        setLastGeneratedSyllabuses([]);
        setFiles([]);
    };

    // Helper to convert MM/DD/YYYY to YYYY-MM-DD for date input
    const convertToInputDate = (mmDdYyyy: string): string => {
        const parts = mmDdYyyy.split('/');
        if (parts.length !== 3) return '';
        let [month, day, year] = parts;
        if (year.length === 2) {
            year = '20' + year;
        }
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    // --- Syllabus Editing Handlers (newly generated) ---
    const handleStartEditSyllabus = (syllabus: Syllabus) => {
        setEditingSyllabusId(syllabus.id);
        setEditingSyllabusName(syllabus.name);
    };
    const handleSaveSyllabusName = () => {
        if (!editingSyllabusId) return;
        setLastGeneratedSyllabuses(prev => prev.map(s => 
            s.id === editingSyllabusId ? { ...s, name: editingSyllabusName } : s
        ));
        setEditingSyllabusId(null);
    };
    
    // --- Todo Editing Handlers (newly generated) ---
    const handleDeleteTodo = (id: string) => {
        setLastGeneratedList(prev => prev.filter(item => item.id !== id));
    };
    const handleStartEditTodo = (todo: TodoItem) => {
        setEditingTodoId(todo.id);
        setEditingTodoTask(todo.task);
    };
    const handleSaveTodoTask = () => {
        if (!editingTodoId) return;
        setLastGeneratedList(prev => prev.map(item =>
            item.id === editingTodoId ? { ...item, task: editingTodoTask } : item
        ));
        setEditingTodoId(null);
    };
    const handleTaskTypeChange = (id: string, type: TaskType) => {
        setLastGeneratedList(prev => prev.map(item =>
            item.id === id ? { ...item, type: type } : item
        ));
    };
    const handleTaskDateChange = (id: string, newDateValue: string) => {
        if (!newDateValue) return;
        const [year, month, day] = newDateValue.split('-');
        const newDueDate = `${month}/${day}/${year}`;
        setLastGeneratedList(prev => prev.map(item =>
            item.id === id ? { ...item, dueDate: newDueDate } : item
        ));
    };

    // --- Existing Syllabus Editing ---
    const openEditModal = (syllabus: Syllabus) => {
        setEditingSyllabus(syllabus);
        setEditedName(syllabus.name);
        setEditedColor(syllabus.color);
    };
    const closeEditModal = () => {
        setEditingSyllabus(null);
    };
    const handleSaveSyllabusChanges = () => {
        if (editingSyllabus && editedName.trim()) {
            if (editedName.trim() !== editingSyllabus.name) {
                onUpdateSyllabusName(editingSyllabus.id, editedName.trim());
            }
            if (editedColor !== editingSyllabus.color) {
                onUpdateSyllabusColor(editingSyllabus.id, editedColor);
            }
            closeEditModal();
        }
    };


    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-teal-400 mb-2">Create To-Do List</h1>
                <p className="text-slate-400 mb-6">Upload your class syllabuses to automatically generate a list of tasks and deadlines.</p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="flex-grow w-full cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                        <UploadIcon className="h-5 w-5"/>
                        <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Choose Syllabus File(s)'}</span>
                        <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf"/>
                    </label>
                    <button onClick={handleGenerate} disabled={isLoading || files.length === 0} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                        {isLoading ? <><SpinnerIcon className="h-5 w-5"/><span>Analyzing...</span></> : 'Extract Tasks'}
                    </button>
                </div>
                 <p className="text-xs text-slate-500 text-center mt-2">Supported formats: .txt, .md, .pdf</p>
            </div>

            {syllabuses.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8 mb-8">
                    <h2 className="text-xl font-bold text-slate-200 mb-2">Added Courses</h2>
                    <p className="text-sm text-slate-400 mb-4">You can edit the name and color for each course below.</p>
                    <ul className="space-y-3">
                        {syllabuses.map((syllabus) => (
                            <li key={syllabus.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <span className={`flex-shrink-0 h-3 w-3 rounded-full ${getBackgroundColorClass(syllabus.color)}`}></span>
                                    <span className="text-slate-300 font-medium">{syllabus.name}</span>
                                </div>
                                <button onClick={() => openEditModal(syllabus)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" aria-label={`Edit ${syllabus.name}`}>
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {files.length > 0 && !isLoading && lastGeneratedList.length === 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8 mb-8">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Selected Files</h3>
                    <ul className="space-y-3">
                        {files.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <DocumentIcon className="h-6 w-6 text-slate-400 flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-slate-100 truncate" title={file.name}>{file.name}</p>
                                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveFile(index)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors flex-shrink-0 ml-2">
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {successMessage && (
                <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg relative mb-6 flex items-center justify-between" role="alert">
                    <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        <span className="block sm:inline">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)}><XCircleIconSolid className="h-5 w-5"/></button>
                </div>
            )}

            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 flex items-center justify-between" role="alert">
                    <span className="block sm:inline"><strong className="font-bold">Error: </strong>{error}</span>
                    <button onClick={() => setError(null)}><XCircleIconSolid className="h-5 w-5"/></button>
                </div>
            )}
            
            {lastGeneratedList.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-200">Review Extracted Tasks</h2>
                            <p className="text-sm text-slate-400 mt-1">You can edit course names, task details, or due dates before adding them.</p>
                        </div>
                        <button onClick={handleAddToPlanner} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full sm:w-auto flex-shrink-0">
                            Add to Planner
                        </button>
                    </div>
                     <ul className="space-y-4">
                        {lastGeneratedSyllabuses.map(syllabus => {
                            const colorMap: Record<string, string> = {
                                teal: 'border-teal-500', blue: 'border-blue-500', purple: 'border-purple-500',
                                pink: 'border-pink-500', red: 'border-red-500', orange: 'border-orange-500', yellow: 'border-yellow-500'
                            };
                            const syllabusTasks = lastGeneratedList.filter(item => item.syllabusId === syllabus.id);
                            if (syllabusTasks.length === 0) return null;
                            return (
                                <li key={syllabus.id} className={`bg-slate-800 rounded-lg p-4 border-l-4 ${colorMap[syllabus.color] || 'border-slate-500'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {editingSyllabusId === syllabus.id ? (
                                            <input type="text" value={editingSyllabusName} onChange={(e) => setEditingSyllabusName(e.target.value)} className="flex-grow bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-slate-100 font-bold focus:ring-teal-500 focus:border-teal-500" />
                                        ) : (
                                            <h3 className="font-bold text-slate-200 flex-grow">{syllabus.name}</h3>
                                        )}
                                        {editingSyllabusId === syllabus.id ? (
                                            <>
                                                <button onClick={handleSaveSyllabusName} className="p-1 text-green-400 hover:bg-slate-700 rounded"><CheckIcon className="h-5 w-5" /></button>
                                                <button onClick={() => setEditingSyllabusId(null)} className="p-1 text-red-400 hover:bg-slate-700 rounded"><XMarkIcon className="h-5 w-5" /></button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleStartEditSyllabus(syllabus)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><PencilIcon className="h-4 w-4" /></button>
                                        )}
                                    </div>

                                    <ul className="space-y-2">
                                        {syllabusTasks.map(item => (
                                            <li key={item.id} className="p-3 bg-slate-900/50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                                                {editingTodoId === item.id ? (
                                                    <input type="text" value={editingTodoTask} onChange={(e) => setEditingTodoTask(e.target.value)} className="flex-grow bg-slate-700 border border-slate-500 rounded-md px-2 py-1 text-slate-100 focus:ring-teal-500 focus:border-teal-500" />
                                                ) : (
                                                    <span className="text-slate-100 flex-grow">{item.task}</span>
                                                )}
                                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                                    <select
                                                        value={item.type}
                                                        onChange={(e) => handleTaskTypeChange(item.id, e.target.value as TaskType)}
                                                        className="bg-slate-700 border-slate-600 rounded-md text-xs py-1 pl-2 pr-7 text-slate-200 focus:ring-teal-500 focus:border-teal-500"
                                                    >
                                                        <option value="Assignment">Assignment</option>
                                                        <option value="Exam">Exam</option>
                                                        <option value="Miscellaneous">Miscellaneous</option>
                                                    </select>
                                                    <div className="flex items-center gap-1 bg-slate-700/80 px-2 py-1 rounded-md">
                                                        <label htmlFor={`due-date-${item.id}`} className="text-teal-400 font-mono text-sm">Due:</label>
                                                        <input
                                                            type="date"
                                                            id={`due-date-${item.id}`}
                                                            value={convertToInputDate(item.dueDate)}
                                                            onChange={(e) => handleTaskDateChange(item.id, e.target.value)}
                                                            className="bg-transparent text-sm text-slate-200 focus:outline-none p-0 border-none"
                                                            style={{ colorScheme: 'dark', width: '125px' }}
                                                        />
                                                    </div>
                                                    {editingTodoId === item.id ? (
                                                        <>
                                                            <button onClick={handleSaveTodoTask} className="p-1 text-green-400 hover:bg-slate-700 rounded"><CheckIcon className="h-5 w-5" /></button>
                                                            <button onClick={() => setEditingTodoId(null)} className="p-1 text-red-400 hover:bg-slate-700 rounded"><XMarkIcon className="h-5 w-5" /></button>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleStartEditTodo(item)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><PencilIcon className="h-4 w-4" /></button>
                                                            <button onClick={() => handleDeleteTodo(item.id)} className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><TrashIcon className="h-4 w-4" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {editingSyllabus && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeEditModal}>
                    <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-teal-400 mb-4">Edit Course</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="courseName" className="block text-sm font-medium text-slate-300 mb-2">Course Name</label>
                                <input
                                    type="text"
                                    id="courseName"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Course Color</label>
                                <div className="grid grid-cols-5 gap-3">
                                    {editableSyllabusColors.map(color => (
                                        <button 
                                            key={color} 
                                            onClick={() => setEditedColor(color)} 
                                            className={`h-10 w-full rounded-md transition-all transform hover:scale-110 ${getBackgroundColorClass(color)} ${editedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : '' }`}
                                            aria-label={`Select ${color} color`}
                                        >
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={closeEditModal} className="px-4 py-2 text-sm rounded-md hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleSaveSyllabusChanges} disabled={!editedName.trim()} className="px-4 py-2 text-sm rounded-md bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningPage;