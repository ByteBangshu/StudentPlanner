import React, { useState, useMemo } from 'react';
// FIX: Updated import for XCircleIconSolid to match the corrected export from icons.tsx.
import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserPlusIcon, EnvelopeIcon, LockClosedIcon, DevicePhoneMobileIcon, KeyIcon, XCircleIconSolid, EyeIcon, EyeSlashIcon, ChevronLeftIcon } from './icons';

interface LoginPageProps {
  onLogin: () => void;
  initialView?: 'login' | 'signup';
  onBack: () => void;
}
//All the functions to connect Auth to this stuff
const handleLogin = async (email: string, password: string) => {
    try {
        const response = await fetch(`http://localhost:3001/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if(!response.ok)
            {
                const data = await response.json();
                throw new Error(data.message || 'Could not log in');
            }
    
        return response.json();
    
    } catch (error) {
        console.error('Network error:', error);
        throw new Error(error.message || 'Network error');
    }
}

const handleSignUp = async (email: string, password: string) => {
    try {
        const response = await fetch(`http://localhost:3001/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if(!response.ok)
            {
                const data = await response.json();
                throw new Error(data.message || 'Could not log in');
            }
    
        return response.json();
    
    } catch (error) {
        console.error('Network error:', error);
        throw new Error(error.message || 'Network error');
    }
}

const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <li className={`flex items-center gap-2 text-sm ${met ? 'text-green-400' : 'text-slate-500'}`}>
        {met ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
        <span>{text}</span>
    </li>
);

const Message: React.FC<{ type: 'error' | 'success' | 'info', text: string, onDismiss: () => void }> = ({ type, text, onDismiss }) => {
    const baseClasses = 'p-4 rounded-md flex items-center justify-between';
    const typeClasses = {
        error: 'bg-red-900/50 text-red-300 border border-red-700',
        success: 'bg-green-900/50 text-green-300 border border-green-700',
        info: 'bg-blue-900/50 text-blue-300 border border-blue-700',
    };
    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            <p className="text-sm">{text}</p>
            <button onClick={onDismiss}><XCircleIconSolid className="h-5 w-5"/></button>
        </div>
    );
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, initialView = 'login', onBack }) => {
    const [view, setView] = useState<'login' | 'signup' | 'forgotPassword' | 'resetCode' | 'newPassword'>(initialView);
    const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');

    // State for user account simulation
    const [registeredUser, setRegisteredUser] = useState<{email: string; password: string; phone: string; failedLoginAttempts: number; isLocked: boolean;} | null>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [forgotIdentifier, setForgotIdentifier] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

    // Password visibility states
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const passwordCriteria = useMemo(() => ({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
    }), [password]);
    
    const newPasswordCriteria = useMemo(() => ({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /\d/.test(newPassword),
        specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword),
    }), [newPassword]);

    const isPasswordStrong = useMemo(() => Object.values(passwordCriteria).every(Boolean), [passwordCriteria]);
    const isNewPasswordStrong = useMemo(() => Object.values(newPasswordCriteria).every(Boolean), [newPasswordCriteria]);
    const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
    const isPhoneValid = useMemo(() => /^\d{10,}$/.test(phone.replace(/\D/g, '')), [phone]);

    const clearFormStates = () => {
        setEmail('');
        setPassword('');
        setPhone('');
        setMfaCode('');
        setForgotIdentifier('');
        setResetCode('');
        setNewPassword('');
        setMessage(null);
        setShowSignUpPassword(false);
        setShowLoginPassword(false);
        setShowNewPassword(false);
    }

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEmailValid || !isPasswordStrong || !isPhoneValid) return false;

        try{
            const data = await handleSignUp(email, password);
            clearFormStates();
            setView('login');
            setMessage({ type: 'success', text: 'Account created successfully! Please sign in.' });
        }
        catch(err: any)
        {
            setMessage({ type: 'error', text: err.message });
        }
    };
    
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (email === 'admin' && password === 'admin123') {
            onLogin();
            return;
        }
        try
        {
            await handleLogin(email, password);
            setStep('mfa');
            return;
        }
        catch(err)
        {
            setMessage({ type: 'error', text: err.message });
            return;
        }
        
        
        // if (email === registeredUser.email && password === registeredUser.password) {
        //     setRegisteredUser(prev => prev ? { ...prev, failedLoginAttempts: 0 } : null);
        //     setStep('mfa');
        // } else {
        //     const newAttempts = registeredUser.failedLoginAttempts + 1;
        //     const isNowLocked = newAttempts >= 5;
        //     setRegisteredUser(prev => prev ? { ...prev, failedLoginAttempts: newAttempts, isLocked: isNowLocked } : null);

        //     if (isNowLocked) {
        //         setMessage({ type: 'error', text: "Account locked due to too many failed attempts. Please reset your password."});
        //     } else {
        //         setMessage({ type: 'error', text: `Invalid credentials. You have ${5 - newAttempts} attempts remaining.`});
        //     }
        // }
    };

    const handleMfaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mfaCode === '123456') {
            onLogin();
        } else {
            setMessage({ type: 'error', text: "Invalid verification code." });
        }
    };
    
    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (registeredUser && forgotIdentifier === registeredUser.email) {
            setView('resetCode');
            setMessage({ type: 'info', text: 'A password reset code has been sent to your email.'})
        } else {
            setMessage({ type: 'error', text: 'If an account exists for this email, a reset code will be sent.' });
        }
    };

    const handleResetCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (resetCode === '123456') {
            setView('newPassword');
        } else {
            setMessage({ type: 'error', text: 'Invalid reset code.' });
        }
    };

    const handleNewPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (isNewPasswordStrong && registeredUser) {
            setRegisteredUser({
                ...registeredUser,
                password: newPassword,
                failedLoginAttempts: 0,
                isLocked: false,
            });
            clearFormStates();
            setView('login');
            setMessage({ type: 'success', text: 'Password reset successfully. You can now sign in.' });
        } else {
             setMessage({ type: 'error', text: 'Please ensure your new password meets all criteria.' });
        }
    }

    const resetToLogin = () => {
        setStep('credentials');
        clearFormStates();
    };

    const renderMessage = () => {
        if (!message) return null;
        return <Message type={message.type} text={message.text} onDismiss={() => setMessage(null)} />;
    };

    const renderSignUpForm = () => (
        <>
            <div className="text-center">
                <UserPlusIcon className="mx-auto h-12 w-12 text-teal-400" />
                <h1 className="mt-4 text-3xl font-bold text-teal-400">Create Account</h1>
                <p className="mt-2 text-slate-400">Set up your account to get started</p>
            </div>
            <form className="mt-8 space-y-4" onSubmit={handleSignUpSubmit}>
                {renderMessage()}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input id="email-address-signup" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Email address" />
                </div>
                <div className="relative">
                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input id="phone-number" name="phone" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Phone Number" />
                </div>
                 <div className="relative">
                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LockClosedIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input id="password-signup" name="password" type={showSignUpPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Password" />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onMouseDown={() => setShowSignUpPassword(true)}
                        onMouseUp={() => setShowSignUpPassword(false)}
                        onMouseLeave={() => setShowSignUpPassword(false)}
                        onTouchStart={() => setShowSignUpPassword(true)}
                        onTouchEnd={() => setShowSignUpPassword(false)}
                        aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                    >
                        {showSignUpPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400" /> : <EyeIcon className="h-5 w-5 text-slate-400" />}
                    </button>
                </div>
                
                <ul className="space-y-1 pt-2">
                    <PasswordRequirement met={passwordCriteria.length} text="At least 8 characters" />
                    <PasswordRequirement met={passwordCriteria.uppercase} text="Contains an uppercase letter" />
                    <PasswordRequirement met={passwordCriteria.lowercase} text="Contains a lowercase letter" />
                    <PasswordRequirement met={passwordCriteria.number} text="Contains a number" />
                    <PasswordRequirement met={passwordCriteria.specialChar} text="Contains a special character" />
                </ul>

                <div>
                    <button type="submit" disabled={!isPasswordStrong || !isEmailValid || !isPhoneValid} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed">
                        Create Account
                    </button>
                </div>
                <p className="text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setView('login'); clearFormStates(); }} className="font-medium text-teal-400 hover:text-teal-300">
                        Sign In
                    </button>
                </p>
            </form>
        </>
    );

    const renderLoginForm = () => (
        <>
            <div className="text-center">
                <h1 className="text-3xl font-bold text-teal-400">Welcome Back</h1>
                <p className="mt-2 text-slate-400">Sign in to generate your study plan</p>
            </div>
            <form className="mt-8 space-y-4" onSubmit={handleLoginSubmit}>
                {renderMessage()}
                <div className="space-y-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                        </div>
                        <input id="email-address" name="email" type="text" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Email address" disabled={registeredUser?.isLocked} />
                    </div>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LockClosedIcon className="h-5 w-5 text-slate-500" />
                        </div>
                        <input id="password" name="password" type={showLoginPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Password" disabled={registeredUser?.isLocked} />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onMouseDown={() => setShowLoginPassword(true)}
                            onMouseUp={() => setShowLoginPassword(false)}
                            onMouseLeave={() => setShowLoginPassword(false)}
                            onTouchStart={() => setShowLoginPassword(true)}
                            onTouchEnd={() => setShowLoginPassword(false)}
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                            {showLoginPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400" /> : <EyeIcon className="h-5 w-5 text-slate-400" />}
                        </button>
                    </div>
                </div>

                <div className="text-right text-sm">
                    <button type="button" onClick={() => { setView('forgotPassword'); clearFormStates(); }} className="font-medium text-teal-400 hover:text-teal-300">
                        Forgot password?
                    </button>
                </div>

                <div>
                    <button type="submit" disabled={(!isEmailValid && email !== 'admin') || !password || registeredUser?.isLocked} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed">
                        Sign In
                    </button>
                </div>
                 <p className="text-center text-sm text-slate-400">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setView('signup'); clearFormStates(); }} className="font-medium text-teal-400 hover:text-teal-300">
                        Sign Up
                    </button>
                </p>
            </form>
        </>
    );
    
    const renderMfaStep = () => (
        <>
            <div className="text-center">
                 <ShieldCheckIcon className="mx-auto h-12 w-12 text-teal-400" />
                <h1 className="mt-4 text-2xl font-bold text-teal-400">Two-Factor Authentication</h1>
                <p className="mt-2 text-slate-400">
                    A verification code has been sent to your phone number ending in <span className="font-semibold text-slate-200">••••{registeredUser?.phone.slice(-4)}</span>.
                </p>
                <p className="mt-1 text-xs text-slate-500">(For this demo, please enter '123456')</p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
                 {renderMessage()}
                 <div>
                    <label htmlFor="mfa-code" className="sr-only">Verification Code</label>
                    <input
                        id="mfa-code"
                        name="mfa-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="appearance-none block w-full px-3 py-3 text-center tracking-[1em] text-2xl font-mono border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-lg"
                        placeholder="------"
                        maxLength={6}
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        type="button" 
                        onClick={resetToLogin}
                        className="group relative w-full flex justify-center py-3 px-4 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-transparent hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-colors duration-200"
                        >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={mfaCode.length !== 6}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        Verify
                    </button>
                </div>
            </form>
        </>
    );

    const renderForgotPasswordForm = () => (
        <>
            <div className="text-center">
                <KeyIcon className="mx-auto h-12 w-12 text-teal-400" />
                <h1 className="mt-4 text-3xl font-bold text-teal-400">Forgot Password</h1>
                <p className="mt-2 text-slate-400">Enter your email to receive a reset code.</p>
            </div>
            <form className="mt-8 space-y-4" onSubmit={handleForgotPasswordSubmit}>
                {renderMessage()}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input id="forgot-identifier" name="email" type="email" autoComplete="email" required value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Email address" />
                </div>
                <div>
                    <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500">
                        Send Reset Code
                    </button>
                </div>
                <p className="text-center text-sm text-slate-400">
                    Remember your password?{' '}
                    <button type="button" onClick={() => { setView('login'); clearFormStates(); }} className="font-medium text-teal-400 hover:text-teal-300">
                        Sign In
                    </button>
                </p>
            </form>
        </>
    );
    
    const renderResetCodeForm = () => (
         <>
            <div className="text-center">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-teal-400" />
                <h1 className="mt-4 text-2xl font-bold text-teal-400">Enter Reset Code</h1>
                <p className="mt-2 text-slate-400">A verification code has been sent to <span className="font-semibold text-slate-200">{registeredUser?.email}</span>.</p>
                <p className="mt-1 text-xs text-slate-500">(For this demo, please enter '123456')</p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleResetCodeSubmit}>
                {renderMessage()}
                <input id="reset-code" name="reset-code" type="text" inputMode="numeric" required value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="appearance-none block w-full px-3 py-3 text-center tracking-[1em] text-2xl font-mono border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-lg" placeholder="------" maxLength={6}/>
                <div className="flex items-center gap-4">
                     <button type="button" onClick={() => { setView('login'); clearFormStates(); }} className="group relative w-full flex justify-center py-3 px-4 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-transparent hover:bg-slate-700">Back to Login</button>
                    <button type="submit" disabled={resetCode.length !== 6} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600">Verify Code</button>
                </div>
            </form>
        </>
    );
    
    const renderNewPasswordForm = () => (
        <>
            <div className="text-center">
                <LockClosedIcon className="mx-auto h-12 w-12 text-teal-400" />
                <h1 className="mt-4 text-3xl font-bold text-teal-400">Set New Password</h1>
                <p className="mt-2 text-slate-400">Please choose a new, strong password.</p>
            </div>
            <form className="mt-8 space-y-4" onSubmit={handleNewPasswordSubmit}>
                {renderMessage()}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LockClosedIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input id="new-password" name="password" type={showNewPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-slate-600 bg-slate-900 placeholder-slate-500 text-white rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="New Password" />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onMouseDown={() => setShowNewPassword(true)}
                        onMouseUp={() => setShowNewPassword(false)}
                        onMouseLeave={() => setShowNewPassword(false)}
                        onTouchStart={() => setShowNewPassword(true)}
                        onTouchEnd={() => setShowNewPassword(false)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                        {showNewPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400" /> : <EyeIcon className="h-5 w-5 text-slate-400" />}
                    </button>
                </div>
                <ul className="space-y-1 pt-2">
                    <PasswordRequirement met={newPasswordCriteria.length} text="At least 8 characters" />
                    <PasswordRequirement met={newPasswordCriteria.uppercase} text="Contains an uppercase letter" />
                    <PasswordRequirement met={newPasswordCriteria.lowercase} text="Contains a lowercase letter" />
                    <PasswordRequirement met={newPasswordCriteria.number} text="Contains a number" />
                    <PasswordRequirement met={newPasswordCriteria.specialChar} text="Contains a special character" />
                </ul>
                <div>
                    <button type="submit" disabled={!isNewPasswordStrong} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 disabled:bg-slate-600">
                        Set New Password
                    </button>
                </div>
            </form>
        </>
    );

    const renderCurrentView = () => {
        if (step === 'mfa') return renderMfaStep();
        switch(view) {
            case 'signup': return renderSignUpForm();
            case 'forgotPassword': return renderForgotPasswordForm();
            case 'resetCode': return renderResetCodeForm();
            case 'newPassword': return renderNewPasswordForm();
            case 'login':
            default:
                 return renderLoginForm();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 sm:top-8 sm:left-8 p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors z-20"
                aria-label="Go back to cover page"
            >
                <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
                {renderCurrentView()}
            </div>
        </div>
    );
};

export default LoginPage;