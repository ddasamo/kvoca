import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VOCABULARY } from './constants';
import { ResultState, QuizMode } from './types';
import type { VocabWord } from './types';

// Helper function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Helper function to get random quiz mode
const getRandomQuizMode = (): QuizMode => {
    return Math.random() < 0.5 ? QuizMode.PRESENT_TO_PAST : QuizMode.PAST_TO_PRESENT;
};

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const App: React.FC = () => {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<ResultState>(ResultState.IDLE);
  const [showHint, setShowHint] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>(getRandomQuizMode());

  useEffect(() => {
    setWords(shuffleArray(VOCABULARY));
    setQuizMode(getRandomQuizMode());
  }, []);

  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);

  const generateHint = useCallback((word: string) => {
    const length = word.length;

    if (length === 0) return "";

    if (length <= 2) {
      // For 1-2 letter words, show only the first letter.
      const hint = [word[0]];
      if (length === 2) hint.push('_');
      return hint.join(' ');
    }

    if (length === 3) {
      // For 3-letter words, show first and last.
      return `${word[0]} _ ${word[2]}`;
    }

    // For words with 4 or more letters, show first and last two.
    const hintChars = word.split('').map((char, index) => {
      if (index === 0 || index >= length - 2) {
        return char;
      }
      return '_';
    });

    return hintChars.join(' ');
  }, []);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const toSpeak = text.split(' / ');
      toSpeak.forEach(wordPart => {
          const utterance = new SpeechSynthesisUtterance(wordPart.trim());
          utterance.lang = 'en-US';
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
      });
    } else {
      alert("Sorry, your browser doesn't support text-to-speech.");
    }
  };

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const correctAnswer = quizMode === QuizMode.PRESENT_TO_PAST ? currentWord.past : currentWord.present;
    const possibleAnswers = correctAnswer.toLowerCase().split(' / ');
    const isCorrect = possibleAnswers.includes(userInput.trim().toLowerCase());

    if (isCorrect) {
      setResult(ResultState.CORRECT);
    } else {
      setResult(ResultState.INCORRECT);
      setShowHint(false);
    }
  };

  const handleNextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setResult(ResultState.IDLE);
      setShowHint(false);
      setQuizMode(getRandomQuizMode());
    } else {
      setIsFinished(true);
    }
  };
  
  const handleRestart = () => {
    setWords(shuffleArray(VOCABULARY));
    setCurrentIndex(0);
    setUserInput('');
    setResult(ResultState.IDLE);
    setShowHint(false);
    setIsFinished(false);
    setQuizMode(getRandomQuizMode());
  }

  if (words.length === 0 || !currentWord) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p className="text-xl text-gray-700">Loading...</p>
        </div>
    );
  }

  if (isFinished) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans text-white p-4">
        <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-2xl shadow-2xl">
            <h1 className="text-5xl font-bold mb-4">Congratulations!</h1>
            <p className="text-2xl mb-8">You have completed all the words.</p>
            <button
                onClick={handleRestart}
                className="px-8 py-4 bg-yellow-400 text-indigo-800 font-bold text-lg rounded-xl shadow-lg hover:bg-yellow-300 transition-transform transform hover:scale-105"
            >
                Start Over
            </button>
        </div>
      </div>
    );
  }
  
  const isPresentToPast = quizMode === QuizMode.PRESENT_TO_PAST;
  const questionWord = isPresentToPast ? currentWord.present : currentWord.past;
  const answerWord = isPresentToPast ? currentWord.past : currentWord.present;
  const questionLabel = isPresentToPast ? 'Present Tense (현재형)' : 'Past Tense (과거형)';
  const answerLabel = isPresentToPast ? 'Past Tense (과거형)' : 'Present Tense (현재형)';
  const inputPlaceholder = isPresentToPast ? 'Type the past tense...' : 'Type the present tense...';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800">English Vocabulary Quiz</h1>
          <p className="text-slate-600 mt-2">6학년 영어 단어 (과거형) 연습</p>
        </header>

        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 relative">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2 text-slate-600">
              <span className="font-semibold">Progress</span>
              <span>Word {currentIndex + 1} / {words.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div
                className="bg-indigo-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Quiz Card */}
          <div className="text-center">
            <p className="text-lg text-slate-500 mb-2">{questionLabel}</p>
            <div className="bg-slate-100 rounded-lg p-4 mb-4">
                <p className="text-5xl font-bold text-indigo-700">{questionWord}</p>
                <p className="text-2xl text-slate-600 mt-1">{currentWord.korean}</p>
            </div>
            
            <p className="text-lg text-slate-500 mb-2">{answerLabel}</p>
            
            <form onSubmit={handleCheckAnswer}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={inputPlaceholder}
                disabled={result === ResultState.CORRECT}
                className="w-full p-4 text-2xl text-center border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                autoFocus
              />
              
              {result !== ResultState.CORRECT && (
                <button
                  type="submit"
                  className="w-full mt-4 py-4 px-6 bg-indigo-600 text-white font-bold text-xl rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                >
                  Check Answer
                </button>
              )}
            </form>
            
            {/* Feedback and Actions */}
            <div className="mt-6 min-h-[150px]">
              {result === ResultState.CORRECT && (
                <div className="flex flex-col items-center justify-center text-green-600 bg-green-100 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckIcon />
                    <p className="font-bold text-2xl ml-2">Correct!</p>
                  </div>
              
                  <div className="w-full text-left mt-4 text-slate-800 space-y-2">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                      <div>
                        <p className="text-sm text-slate-500">Present Tense (현재형)</p>
                        <p className="text-2xl font-bold">{currentWord.present}</p>
                      </div>
                      <button onClick={() => handleSpeak(currentWord.present)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors" aria-label={`Listen to ${currentWord.present}`}>
                        <SpeakerIcon />
                      </button>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                      <div>
                        <p className="text-sm text-slate-500">Past Tense (과거형)</p>
                        <p className="text-2xl font-bold">{currentWord.past}</p>
                      </div>
                      <button onClick={() => handleSpeak(currentWord.past)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors" aria-label={`Listen to ${currentWord.past}`}>
                        <SpeakerIcon />
                      </button>
                    </div>
                  </div>
                  
                  <button onClick={handleNextWord} className="w-full mt-4 py-4 px-6 bg-green-600 text-white font-bold text-xl rounded-lg shadow-md hover:bg-green-700 transition-transform transform hover:scale-105">
                    Next Word
                  </button>
                </div>
              )}
              {result === ResultState.INCORRECT && (
                <div className="flex flex-col items-center justify-center text-red-600 bg-red-100 p-4 rounded-lg">
                  <CrossIcon />
                  <p className="font-bold text-xl mt-1">Try again!</p>
                  {!showHint && (
                      <button onClick={() => setShowHint(true)} className="mt-2 text-sm text-indigo-600 hover:underline">Show Hint</button>
                  )}
                  {showHint && (
                    <div className="mt-2 text-lg font-mono tracking-widest bg-yellow-100 text-yellow-800 p-2 rounded">
                      {generateHint(answerWord)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
