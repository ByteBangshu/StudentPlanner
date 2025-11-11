import React, { useState, useCallback } from 'react';
import { Page, TodoItem, Syllabus } from './types';
import AuthFlow from './components/AuthFlow';
import LearningPage from './components/LearningPage';
import ProfilePage from './components/ProfilePage';
import CalendarPage from './components/CalendarPage';
import StudyPage from './components/StudyPage';
import Navbar from './components/Navbar';
import DashboardPage from './components/DashboardPage';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [userName, setUserName] = useState<string>('John Doe');
  const [homeworkPoints, setHomeworkPoints] = useState<number>(0);
  const [selectedStudySyllabus, setSelectedStudySyllabus] = useState<Syllabus | null>(null);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
    if (syllabuses.length === 0) {
        setCurrentPage(Page.Learning);
    } else {
        setCurrentPage(Page.Dashboard);
    }
  }, [syllabuses]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentPage(Page.Dashboard);
    setTodoList([]);
    setSyllabuses([]);
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    if (page !== Page.Study) {
        setSelectedStudySyllabus(null);
    }
    setCurrentPage(page);
  }, []);

  const handleSyllabusUpload = useCallback((newSyllabuses: Syllabus[], newItems: TodoItem[]) => {
    setSyllabuses(prev => [...prev, ...newSyllabuses]);
    setTodoList(prev => [...prev, ...newItems]);
  }, []);

  const handleToggleTodo = useCallback((id: string) => {
    setTodoList(prevList =>
      prevList.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const handleUpdateSyllabusName = useCallback((syllabusId: string, newName: string) => {
    setSyllabuses(prevSyllabuses =>
      prevSyllabuses.map(s =>
        s.id === syllabusId ? { ...s, name: newName } : s
      )
    );
  }, []);

  const handleUpdateSyllabusColor = useCallback((syllabusId: string, newColor: string) => {
    setSyllabuses(prevSyllabuses =>
      prevSyllabuses.map(s =>
        s.id === syllabusId ? { ...s, color: newColor } : s
      )
    );
  }, []);

  const handleStartStudy = useCallback((syllabus: Syllabus | null = null) => {
    setSelectedStudySyllabus(syllabus);
    setCurrentPage(Page.Study);
  }, []);
  
  const handleUpdateUserName = useCallback((newName: string) => {
    setUserName(newName);
  }, []);

  const handleUpdatePoints = useCallback((points: number) => {
    setHomeworkPoints(prev => Math.max(0, prev + points));
  }, []);


  const renderPage = () => {
    switch (currentPage) {
      case Page.Dashboard:
        return <DashboardPage userName={userName} todos={todoList} syllabuses={syllabuses} onToggleTodo={handleToggleTodo} onNavigate={handleNavigate} onStartStudy={handleStartStudy} />;
      case Page.Learning:
        return <LearningPage onSyllabusUpload={handleSyllabusUpload} todos={todoList} syllabuses={syllabuses} onUpdateSyllabusName={handleUpdateSyllabusName} onUpdateSyllabusColor={handleUpdateSyllabusColor} />;
      case Page.Profile:
        return <ProfilePage userName={userName} homeworkPoints={homeworkPoints} onUpdateUserName={handleUpdateUserName} />;
      case Page.Calendar:
        return <CalendarPage todos={todoList} onToggleTodo={handleToggleTodo} syllabuses={syllabuses} onUpdateSyllabusName={handleUpdateSyllabusName} />;
      case Page.Study:
        return <StudyPage todos={todoList} syllabuses={syllabuses} onUpdatePoints={handleUpdatePoints} initialSyllabus={selectedStudySyllabus} />;
      default:
        return <DashboardPage userName={userName} todos={todoList} syllabuses={syllabuses} onToggleTodo={handleToggleTodo} onNavigate={handleNavigate} onStartStudy={handleStartStudy} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 font-sans">
      {!isLoggedIn ? (
        <AuthFlow onLogin={handleLogin} />
      ) : (
        <>
          <Navbar onNavigate={handleNavigate} onLogout={handleLogout} currentPage={currentPage} />
          <main className="p-4 sm:p-6 md:p-8">
            {renderPage()}
          </main>
        </>
      )}
    </div>
  );
};

export default App;