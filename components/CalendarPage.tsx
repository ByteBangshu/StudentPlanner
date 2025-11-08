import React, { useState, useMemo } from 'react';
import { TodoItem, Syllabus } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

// Date utility functions
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};
const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const getDayWithSuffix = (d: number) => {
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1: return `${d}st`;
    case 2: return `${d}nd`;
    case 3: return `${d}rd`;
    default: return `${d}th`;
  }
};
const parseDueDate = (dueDate: string): Date | null => {
    const parts = dueDate.split('/');
    if (parts.length === 3) {
        const [month, day, year] = parts.map(p => parseInt(p, 10));
        if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            // Month is 0-indexed in JS Date
            return new Date(year, month - 1, day);
        }
    }
    return null;
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

const getBorderColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
        teal: 'border-teal-500',
        blue: 'border-blue-500',
        purple: 'border-purple-500',
        pink: 'border-pink-500',
        red: 'border-red-500',
        orange: 'border-orange-500',
        yellow: 'border-yellow-500',
        green: 'border-green-500',
        indigo: 'border-indigo-500',
        cyan: 'border-cyan-500',
    };
    return colorMap[color] || 'border-gray-500';
};

const getBackgroundColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
        teal: 'bg-teal-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
        pink: 'bg-pink-500', red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
        green: 'bg-green-500', indigo: 'bg-indigo-500', cyan: 'bg-cyan-500',
    };
    return colorMap[color] || 'bg-gray-500';
};

type View = 'month' | 'week' | 'day';

interface CalendarPageProps {
    todos: TodoItem[];
    onToggleTodo: (id: string) => void;
    syllabuses: Syllabus[];
    onUpdateSyllabusName: (syllabusId: string, newName: string) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ todos, onToggleTodo, syllabuses, onUpdateSyllabusName }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<View>('month');
    const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
    const [newName, setNewName] = useState('');
    const [nameError, setNameError] = useState('');

    const syllabusMap = useMemo(() => {
        return new Map(syllabuses.map(s => [s.id, s]));
    }, [syllabuses]);

    const todosByDate = useMemo(() => {
        return todos.reduce((acc, todo) => {
            const date = parseDueDate(todo.dueDate);
            if (date) {
                const dateKey = date.toDateString();
                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(todo);
            }
            return acc;
        }, {} as Record<string, TodoItem[]>);
    }, [todos]);

    const changeDate = (amount: number) => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
        else if (view === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
        else newDate.setDate(newDate.getDate() + amount);
        setCurrentDate(newDate);
    };

    const openEditModal = (syllabus: Syllabus) => {
        setEditingSyllabus(syllabus);
        setNewName(syllabus.name);
        setNameError('');
    };

    const closeEditModal = () => {
        setEditingSyllabus(null);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewName(value);
        if (value.length > 0 && (value.length < 2 || value.length > 10)) {
            setNameError('Name must be between 2 and 10 characters.');
        } else {
            setNameError('');
        }
    };

    const handleAccept = () => {
        if (newName.length >= 2 && newName.length <= 10 && editingSyllabus) {
            onUpdateSyllabusName(editingSyllabus.id, newName);
            closeEditModal();
        } else {
             setNameError('Name must be between 2 and 10 characters.');
        }
    };

    const renderHeader = () => {
        let title = '';
        if (view === 'month') title = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        else if (view === 'week') {
            const weekStart = startOfWeek(currentDate);
            const weekEnd = addDays(weekStart, 6);
            title = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
             const day = getDayWithSuffix(currentDate.getDate());
             const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
             const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
             title = `${weekday}, ${day} ${monthYear}`;
        }

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <h1 className="text-xl md:text-2xl font-bold text-teal-400 w-full sm:w-auto text-center">{title}</h1>
                    <div className="flex items-center">
                        <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><ChevronLeftIcon className="h-6 w-6" /></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors">Today</button>
                        <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><ChevronRightIcon className="h-6 w-6" /></button>
                    </div>
                </div>
                <div className="flex items-center bg-slate-700/50 rounded-lg p-1 space-x-1">
                    {(['day', 'week', 'month'] as View[]).map(v => (
                        <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors ${view === v ? 'bg-teal-600 text-white' : 'hover:bg-slate-600'}`}>
                            {v}
                        </button>
                    ))}
                </div>
            </div>
        );
    };
    
    const renderLegend = () => (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <h2 className="text-sm font-semibold text-slate-300 mr-2">Courses:</h2>
            {syllabuses.map(s => (
                <div key={s.id} onClick={() => openEditModal(s)} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md hover:bg-slate-700 transition-colors" title={`Edit '${s.name}'`}>
                    <span className={`h-4 w-4 rounded ${getBackgroundColorClass(s.color)}`}></span>
                    <span className="text-sm text-slate-200">{s.name}</span>
                </div>
            ))}
        </div>
    );

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart);
        
        const days = [];
        let day = startDate;
        while (days.length < 42) { // 6 weeks to be safe
            days.push(new Date(day));
            day = addDays(day, 1);
        }

        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
            <>
                <div className="grid grid-cols-7 gap-px bg-slate-700 border border-slate-700 rounded-t-lg">
                    {dayNames.map(d => <div key={d} className="text-center p-2 text-xs font-bold text-slate-300 uppercase">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 grid-rows-6 gap-px bg-slate-700 border border-t-0 border-slate-700 rounded-b-lg overflow-hidden">
                    {days.map((d, i) => {
                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                        const isToday = isSameDay(d, new Date());
                        const dayTasks = todosByDate[d.toDateString()] || [];
                        return (
                            <div key={i} className={`p-1.5 min-h-[120px] bg-slate-800 flex flex-col ${!isCurrentMonth ? 'bg-slate-800/60' : ''}`}>
                                <span className={`self-end text-sm font-semibold p-1.5 rounded-full h-7 w-7 flex items-center justify-center ${isToday ? 'bg-teal-500 text-white' : ''} ${!isCurrentMonth ? 'text-slate-500' : ''}`}>
                                    {d.getDate()}
                                </span>
                                <div className="flex-grow overflow-y-auto space-y-1 pr-1">
                                    {dayTasks.map(todo => {
                                        const syllabus = syllabusMap.get(todo.syllabusId);
                                        const color = syllabus ? syllabus.color : 'teal';
                                        return (
                                            <div key={todo.id} className={`text-xs p-1.5 rounded ${getColorClasses(color)}`}>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id)} className={`form-checkbox h-3.5 w-3.5 rounded bg-slate-700 border-slate-500 ${getCheckboxColorClasses(color)}`} />
                                                    <span className={`${todo.completed ? 'line-through text-opacity-60' : ''}`}>
                                                      <span className="font-bold">{syllabus?.name}:</span> {todo.task}
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };
    
    const WeekViewComponent: React.FC = () => {
        const weekStart = startOfWeek(currentDate);
        const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
    
        const todayIndex = useMemo(() => {
            const todayStr = new Date().toDateString();
            const index = weekDays.findIndex(day => day.toDateString() === todayStr);
            return index > -1 ? index : -1; // Return -1 if not this week
        }, [weekDays]);

        const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex !== -1 ? todayIndex : 0);

        const handlePrevDay = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedDayIndex(prev => (prev > 0 ? prev - 1 : 6));
        };
        const handleNextDay = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedDayIndex(prev => (prev < 6 ? prev + 1 : 0));
        };

        const selectedDay = weekDays[selectedDayIndex];
        const selectedDayTasks = todosByDate[selectedDay.toDateString()] || [];
        const isToday = isSameDay(selectedDay, new Date());

        return (
            <>
                {/* Desktop View */}
                <div className="hidden md:grid grid-cols-7 gap-px bg-slate-700 border border-slate-700 rounded-lg overflow-hidden">
                    {weekDays.map(d => {
                        const dayTasks = todosByDate[d.toDateString()] || [];
                        const isTodayDesktop = isSameDay(d, new Date());
                        return (
                            <div key={d.toString()} className="bg-slate-800 p-3 min-h-[200px] flex flex-col">
                                <div className="text-center mb-2">
                                    <p className="text-sm text-slate-400">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className={`text-xl font-bold ${isTodayDesktop ? 'text-teal-400' : ''}`}>{d.getDate()}</p>
                                </div>
                                <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                                    {dayTasks.map(todo => {
                                        const syllabus = syllabusMap.get(todo.syllabusId);
                                        const color = syllabus ? syllabus.color : 'teal';
                                        return (
                                            <div key={todo.id} className={`p-2 rounded ${getColorClasses(color)}`}>
                                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                    <input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id)} className={`form-checkbox h-4 w-4 rounded bg-slate-600 border-slate-500 ${getCheckboxColorClasses(color)}`} />
                                                    <span className={`${todo.completed ? 'line-through text-opacity-60' : ''}`}>
                                                       <span className="font-semibold">{syllabus?.name}:</span> {todo.task}
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
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
                            {selectedDayTasks.length > 0 ? selectedDayTasks.map(todo => {
                                const syllabus = syllabusMap.get(todo.syllabusId);
                                const color = syllabus?.color || 'gray';
                                return (
                                     <div key={todo.id} className={`p-2 rounded ${getColorClasses(color)}`}>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id)} className={`form-checkbox h-4 w-4 rounded bg-slate-600 border-slate-500 ${getCheckboxColorClasses(color)}`} />
                                            <span className={`${todo.completed ? 'line-through text-opacity-60' : ''}`}>
                                                <span className="font-semibold">{syllabus?.name}:</span> {todo.task}
                                            </span>
                                        </label>
                                    </div>
                                );
                            }) : (
                                <div className="h-full flex items-center justify-center text-center text-slate-500 py-10">
                                    <p>No tasks for this day.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const renderDayView = () => {
        const dayTasks = todosByDate[currentDate.toDateString()] || [];
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                {dayTasks.length > 0 ? (
                     <ul className="space-y-3">
                        {dayTasks.map(todo => {
                            const syllabus = syllabusMap.get(todo.syllabusId);
                            const color = syllabus ? syllabus.color : 'teal';
                            return (
                                <li key={todo.id} className={`p-4 bg-slate-800 rounded-lg border-l-4 ${getBorderColorClass(color)}`}>
                                    <label className="flex items-center gap-4 cursor-pointer text-base">
                                        <input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id)} className={`form-checkbox h-5 w-5 rounded bg-slate-600 border-slate-500 ${getCheckboxColorClasses(color)}`} />
                                        <span className={`flex-grow ${todo.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                           <span className="font-bold">{syllabus?.name}:</span> {todo.task}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center text-slate-400 py-8">No tasks scheduled for this day.</p>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            {renderHeader()}
            {syllabuses.length > 0 && renderLegend()}
            
            {editingSyllabus && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeEditModal}>
                    <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-teal-400 mb-4">Edit Course Name</h3>
                        <p className="text-sm text-slate-400 mb-2">Enter a new name for '{editingSyllabus.name}'.</p>
                        <input
                            type="text"
                            value={newName}
                            onChange={handleNameChange}
                            className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            maxLength={10}
                        />
                        {nameError && <p className="text-red-400 text-sm mt-2">{nameError}</p>}
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={closeEditModal} className="px-4 py-2 text-sm rounded-md hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleAccept} disabled={!!nameError || newName.length === 0} className="px-4 py-2 text-sm rounded-md bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">Accept</button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'month' && renderMonthView()}
            {view === 'week' && <WeekViewComponent />}
            {view === 'day' && renderDayView()}
        </div>
    );
};

export default CalendarPage;