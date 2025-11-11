import React from 'react';
import { DocumentArrowUpIcon, ClipboardDocumentListIcon, CalendarDaysIcon, SparklesIcon } from './icons';

interface CoverPageProps {
    onShowLogin: () => void;
    onShowSignup: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300">
        <div className="mb-4 text-teal-400">{icon}</div>
        <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
    </div>
);

const CoverPage: React.FC<CoverPageProps> = ({ onShowLogin, onShowSignup }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-slate-700/20 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>

            <main className="flex flex-col items-center justify-center text-center z-10 w-full">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4">
                        <span className="bg-gradient-to-r from-teal-400 to-blue-500 text-transparent bg-clip-text">StudyGenius</span>
                    </h1>
                    <p className="text-lg md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        Transform your course syllabus into a smart, actionable study plan instantly.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onShowSignup}
                            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg shadow-teal-900/50"
                        >
                            Get Started Here
                        </button>
                        <button
                            onClick={onShowLogin}
                            className="w-full sm:w-auto bg-transparent hover:bg-slate-700/50 text-slate-200 font-semibold py-3 px-8 rounded-lg transition-colors duration-300 border border-slate-600"
                        >
                            Sign In
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto mt-24 md:mt-32 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<DocumentArrowUpIcon className="h-10 w-10" />}
                            title="Effortless Planning"
                            description="Simply upload your syllabus. Our AI analyzes the document to extract every assignment, exam, and key date."
                        />
                         <FeatureCard
                            icon={<ClipboardDocumentListIcon className="h-10 w-10" />}
                            title="Stay Organized"
                            description="Get a structured to-do list automatically. Never miss a deadline again with everything in one place."
                        />
                        <FeatureCard
                            icon={<CalendarDaysIcon className="h-10 w-10" />}
                            title="Visualize Your Semester"
                            description="See your entire schedule at a glance. Our interactive calendar helps you manage your time effectively."
                        />
                         <FeatureCard
                            icon={<SparklesIcon className="h-10 w-10" />}
                            title="Study Smarter"
                            description="Generate custom practice quizzes from your course topics. Master the material and ace your exams."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoverPage;
