import React, { useMemo, useState } from 'react';
import { Page, TodoItem, Syllabus } from '../types';
import { ClipboardDocumentCheckIcon, CalendarDaysIcon, LightBulbIcon, ChevronRightIcon, ChevronLeftIcon } from './icons';

// --- Helper Functions ---
const parseDueDate = (dueDate: string): Date | null => {
    const parts = dueDate.split('/');
    if (parts.length === 3) {
        const [month, day, year] = parts.map(p => parseInt(p, 10));
        if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month - 1, day);
        }
    }
    return null;
};

const getCheckboxColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
        teal: 'text-teal-500 focus:ring-teal-500',
        blue: 'text-blue-500 focus:ring-blue-500',
        purple: 'text-purple-500 focus:ring-purple-500',
        pink: 'text-pink-500 focus:ring-pink-500',
        red: 'text-red-500 focus:ring-red-500',
        orange: 'text-orange-500 focus:ring-orange-500',
        yellow: 'text-yellow-500 focus:ring-yellow-500',
        green: 'text-green-500 focus:ring-green-500',
        indigo: 'text-indigo-500 focus:ring-indigo-500',
        cyan: 'text-cyan-500 focus:ring-cyan-500',
    };
    return colorMap[color] || 'text-gray-500 focus:ring-gray-500';
};

const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
        teal: 'bg-teal-900/50 text-teal-200',
        blue: 'bg-blue-900/50 text-blue-200',
        purple: 'bg-purple-900/50 text-purple-200',
        pink: 'bg-pink-900/50 text-pink-200',
        red: 'bg-red-900/50 text-red-200',
        orange: 'bg-orange-900/50 text-orange-200',
        yellow: 'bg-yellow-900/50 text-yellow-200',
        green: 'bg-green-900/50 text-green-200',
        indigo: 'bg-indigo-900/50 text-indigo-200',
        cyan: 'bg-cyan-900/50 text-cyan-200',
    };
    return colorMap[color] || 'bg-gray-900/50 text-gray-200';
};

// --- Child Components ---

const TodaysTasks: React.FC<{ tasks: TodoItem[]; syllabusMap: Map<string, Syllabus>; onToggleTodo: (id: string) => void }> = ({ tasks, syllabusMap, onToggleTodo }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
            <ClipboardDocumentCheckIcon className="h-7 w-7 text-teal-400" />
            <h2 className="text-xl font-bold text-teal-400">Today's Tasks</h2>
        </div>
        {tasks.length > 0 ? (
            <ul className="space-y-3">
                {tasks.map(task => {
                    const syllabus = syllabusMap.get(task.syllabusId);
                    const color = syllabus?.color || 'gray';
                    return (
                        <li key={task.id}>
                             <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                                <input type="checkbox" checked={task.completed} onChange={() => onToggleTodo(task.id)} className={`form-checkbox h-5 w-5 rounded bg-slate-900 border-slate-600 ${getCheckboxColorClasses(color)}`} />
                                <span className={`flex-grow ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                    <span className="font-semibold">{syllabus?.name}:</span> {task.task}
                                </span>
                            </label>
                        </li>
                    )
                })}
            </ul>
        ) : (
            <p className="text-slate-400 text-center py-8">No tasks due today. Great job!</p>
        )}
    </div>
);

const ThisWeek: React.FC<{ tasks: TodoItem[]; syllabusMap: Map<string, Syllabus>; onNavigate: (page: Page) => void }> = ({ tasks, syllabusMap, onNavigate }) => {
    const weekDays = useMemo(() => {
        const start = new Date();
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday as start
        const weekStart = new Date(start.setDate(diff));
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, []);

    const todayIndex = useMemo(() => {
        const todayStr = new Date().toDateString();
        const index = weekDays.findIndex(day => day.toDateString() === todayStr);
        return index > -1 ? index : 0;
    }, [weekDays]);

    const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

    const handlePrevDay = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDayIndex(prev => (prev > 0 ? prev - 1 : 6));
    };
    const handleNextDay = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDayIndex(prev => (prev < 6 ? prev + 1 : 0));
    };
    
    const selectedDay = weekDays[selectedDayIndex];
    const selectedDayTasks = useMemo(() => {
        return tasks.filter(task => {
            const dueDate = parseDueDate(task.dueDate);
            return dueDate?.toDateString() === selectedDay.toDateString();
        });
    }, [tasks, selectedDay]);
    
    const isToday = selectedDay.toDateString() === new Date().toDateString();


    const tasksByDay = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const dueDate = parseDueDate(task.dueDate);
            if (dueDate) {
                const dayKey = dueDate.toDateString();
                if (!acc[dayKey]) acc[dayKey] = [];
                acc[dayKey].push(task);
            }
            return acc;
        }, {} as Record<string, TodoItem[]>);
    }, [tasks]);

    return (
        <div 
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6"
        >
            <div 
                className="flex items-center justify-between mb-4 cursor-pointer group"
                onClick={() => onNavigate(Page.Calendar)}
                role="button"
                tabIndex={0}
                aria-label="View this week's schedule in the calendar"
            >
                <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="h-7 w-7 text-teal-400" />
                    <h2 className="text-xl font-bold text-teal-400">This Week's Schedule</h2>
                </div>
                <p className="text-sm text-slate-400 group-hover:text-teal-300 transition-colors hidden sm:block">
                    Click to view full calendar &rarr;
                </p>
            </div>
            
            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-7 gap-px bg-slate-700 border border-slate-700 rounded-lg overflow-hidden">
                {weekDays.map(day => {
                    const dayTasks = tasksByDay[day.toDateString()] || [];
                    const isTodayDesktop = day.toDateString() === new Date().toDateString();
                    return (
                        <div key={day.toISOString()} className="bg-slate-800 p-3 min-h-[200px] flex flex-col">
                            <div className="text-center mb-2">
                                <p className="text-sm text-slate-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                <p className={`text-xl font-bold ${isTodayDesktop ? 'text-teal-400' : ''}`}>{day.getDate()}</p>
                            </div>
                            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                                {dayTasks.length > 0 ? dayTasks.map(task => {
                                    const syllabus = syllabusMap.get(task.syllabusId);
                                    const color = syllabus?.color || 'gray';
                                    return (
                                        <div key={task.id} className={`p-2 rounded ${getColorClasses(color)}`}>
                                            <div className="text-sm">
                                                <p className={`${task.completed ? 'line-through text-opacity-60' : ''}`}>
                                                   <span className="font-semibold">{syllabus?.name}:</span> {task.task}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                  <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                                  </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
                 <div className="flex items-center justify-between mb-3 bg-slate-800 p-2 rounded-lg">
                    <button onClick={handlePrevDay} className="p-2 rounded-full hover:bg-slate-700"><ChevronLeftIcon className="h-5 w-5"/></button>
                    <div className="text-center">
                        <p className="font-semibold">{selectedDay.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className={`text-sm ${isToday ? 'text-teal-400' : 'text-slate-400'}`}>{selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-slate-700"><ChevronRightIcon className="h-5 w-5"/></button>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg min-h-[200px] flex flex-col">
                    <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                        {selectedDayTasks.length > 0 ? selectedDayTasks.map(task => {
                            const syllabus = syllabusMap.get(task.syllabusId);
                            const color = syllabus?.color || 'gray';
                            return (
                                <div key={task.id} className={`p-2 rounded ${getColorClasses(color)}`}>
                                    <div className="text-sm">
                                        <p className={`${task.completed ? 'line-through text-opacity-60' : ''}`}>
                                            <span className="font-semibold">{syllabus?.name}:</span> {task.task}
                                        </p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="h-full flex items-center justify-center text-center text-slate-500">
                                <p>No tasks for this day.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudySession: React.FC<{
    syllabuses: Syllabus[];
    onStartStudy: (syllabus?: Syllabus | null) => void;
}> = ({ syllabuses, onStartStudy }) => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
                <LightBulbIcon className="h-7 w-7 text-teal-400" />
                <h2 className="text-xl font-bold text-teal-400">Study Session</h2>
            </div>
            {syllabuses.length > 0 ? (
                <>
                    <p className="text-slate-400 mb-4">Select a course to generate a practice quiz for an upcoming exam.</p>
                    <ul className="space-y-2">
                        {syllabuses.map(syllabus => (
                             <li key={syllabus.id}>
                                <button
                                    onClick={() => onStartStudy(syllabus)}
                                    className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex justify-between items-center"
                                >
                                    <span className="font-semibold text-slate-100">{syllabus.name}</span>
                                    <ChevronRightIcon className="h-5 w-5 text-slate-500" />
                                </button>
                             </li>
                        ))}
                    </ul>
                </>
            ) : (
                <>
                     <p className="text-slate-400 mb-4">Ready to prepare for an exam? Add a syllabus with an 'Exam' task to generate a custom quiz.</p>
                     <button
                        onClick={() => onStartStudy()}
                        className={`w-full text-center p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 flex justify-center items-center`}
                    >
                        <span className="font-semibold text-slate-300">Browse All Study Topics</span>
                        <ChevronRightIcon className="h-5 w-5 text-slate-400 ml-1" />
                    </button>
                </>
            )}
        </div>
    );
};


// --- Main Dashboard Page ---

interface DashboardPageProps {
    userName: string;
    todos: TodoItem[];
    syllabuses: Syllabus[];
    onToggleTodo: (id: string) => void;
    onNavigate: (page: Page) => void;
    onStartStudy: (syllabus?: Syllabus | null) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ userName, todos, syllabuses, onToggleTodo, onNavigate, onStartStudy }) => {
    const syllabusMap = useMemo(() => new Map(syllabuses.map(s => [s.id, s])), [syllabuses]);
    
    const today = new Date().toDateString();
    const todaysTasks = useMemo(() => todos.filter(t => {
        const dueDate = parseDueDate(t.dueDate);
        return dueDate && dueDate.toDateString() === today;
    }), [todos, today]);

    const weekStart = useMemo(() => {
        const start = new Date();
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(start.setDate(diff));
    }, []);
    const weekEnd = useMemo(() => new Date(new Date(weekStart).setDate(weekStart.getDate() + 6)), [weekStart]);

    const thisWeeksTasks = useMemo(() => todos.filter(t => {
        const dueDate = parseDueDate(t.dueDate);
        return dueDate && dueDate >= weekStart && dueDate <= weekEnd;
    }), [todos, weekStart, weekEnd]);

    const studyableSyllabuses = useMemo(() => {
        const syllabusIdsWithExams = new Set(
            todos.filter(t => t.type === 'Exam').map(t => t.syllabusId)
        );
        return syllabuses.filter(s => syllabusIdsWithExams.has(s.id));
    }, [todos, syllabuses]);


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-100">Welcome back, {userName}!</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <TodaysTasks tasks={todaysTasks} syllabusMap={syllabusMap} onToggleTodo={onToggleTodo} />
                    <StudySession syllabuses={studyableSyllabuses} onStartStudy={onStartStudy} />
                </div>
                <div className="lg:col-span-2">
                    <ThisWeek tasks={thisWeeksTasks} syllabusMap={syllabusMap} onNavigate={onNavigate} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;