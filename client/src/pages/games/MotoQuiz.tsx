import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trophy, Timer, CheckCircle2, XCircle, RefreshCw, Trophy as TrophyIcon, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface MotoQuizProps {
  onBack: () => void;
}

interface Question {
  id: number;
  textKey: string;
  optionsKeys: string[];
  correctAnswerIndex: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    textKey: 'games.motoQuiz.questions.q1.text',
    optionsKeys: [
      'games.motoQuiz.questions.q1.o1',
      'games.motoQuiz.questions.q1.o2',
      'games.motoQuiz.questions.q1.o3',
      'games.motoQuiz.questions.q1.o4',
    ],
    correctAnswerIndex: 0,
  },
  {
    id: 2,
    textKey: 'games.motoQuiz.questions.q2.text',
    optionsKeys: [
      'games.motoQuiz.questions.q2.o1',
      'games.motoQuiz.questions.q2.o2',
      'games.motoQuiz.questions.q2.o3',
      'games.motoQuiz.questions.q2.o4',
    ],
    correctAnswerIndex: 1,
  },
  {
    id: 3,
    textKey: 'games.motoQuiz.questions.q3.text',
    optionsKeys: [
      'games.motoQuiz.questions.q3.o1',
      'games.motoQuiz.questions.q3.o2',
      'games.motoQuiz.questions.q3.o3',
      'games.motoQuiz.questions.q3.o4',
    ],
    correctAnswerIndex: 2,
  }
];

const TIMER_SECONDS = 10;
const POINTS_PER_CORRECT = 100;

export function MotoQuiz({ onBack }: MotoQuizProps) {
  const { t } = useTranslation();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'start' | 'playing' | 'results'>('start');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [globalRecord, setGlobalRecord] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isNewGlobalRecord, setIsNewGlobalRecord] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = QUESTIONS[currentIdx];

  const startQuiz = () => {
    setGameState('playing');
    setCurrentIdx(0);
    setScore(0);
    setIsNewRecord(false);
    setTimeLeft(TIMER_SECONDS);
    setSelectedIdx(null);
    setShowFeedback(false);
  };

  const handleAnswer = (idx: number) => {
    if (selectedIdx !== null || showFeedback) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedIdx(idx);
    const isCorrect = idx === currentQuestion.correctAnswerIndex;
    
    let currentTotalScore = score;
    if (isCorrect) {
      // Bonus points for speed: (timeLeft / 10) * base points
      const timeBonus = Math.floor((timeLeft / TIMER_SECONDS) * 50);
      currentTotalScore = score + POINTS_PER_CORRECT + timeBonus;
      setScore(currentTotalScore);
    }
    
    setShowFeedback(true);
    
    setTimeout(async () => {
      if (currentIdx < QUESTIONS.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setSelectedIdx(null);
        setShowFeedback(false);
        setTimeLeft(TIMER_SECONDS);
      } else {
        // Handle game over / results
        setGameState('results');
        
        try {
          const res = await fetch(`/api/games/moto-quiz/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: currentTotalScore })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (currentTotalScore > highScore) {
              setIsNewRecord(true);
              setHighScore(currentTotalScore);
              const localKey = `moto-quiz-highscore-${user?.id}`;
              localStorage.setItem(localKey, currentTotalScore.toString());
            }
            if (currentTotalScore > data.globalBest) {
              setIsNewGlobalRecord(true);
            }
            setGlobalRecord(data.globalBest);
          }
        } catch (err) {
          console.error("Failed to submit score", err);
        }
      }
    }, 1500);
  };

  useEffect(() => {
    const fetchScores = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/games/moto-quiz/scores`);
        if (res.ok) {
          const data = await res.json();
          setHighScore(data.personalBest);
          setGlobalRecord(data.globalBest);
          
          // Legacy/Cache sync
          const localKey = `moto-quiz-highscore-${user.id}`;
          const localBest = Number(localStorage.getItem(localKey) || 0);
          if (localBest > data.personalBest) {
             await fetch(`/api/games/moto-quiz/scores`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ score: localBest })
             });
             setHighScore(localBest);
          }
        }
      } catch (e) {
        console.error("Failed to fetch scores", e);
      }
    };
    fetchScores();
  }, [user]);

  useEffect(() => {
    if (gameState === 'playing' && !showFeedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAnswer(-1); // Force incorrect/timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIdx, showFeedback]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors uppercase font-black text-xs tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('games.neonRider.back')}
        </button>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('games.motoQuiz.title')}</p>
            <div className="flex items-center gap-2">
               <Trophy className="w-4 h-4 text-primary" />
               <p className="text-xl font-black font-display text-white leading-none tabular-nums">{score.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.05),transparent)]">
        
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-md space-y-8"
            >
              <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto glow-green mb-8">
                <TrophyIcon className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-5xl font-black font-display uppercase tracking-tighter leading-none italic">
                {t('games.motoQuiz.title')}
              </h2>
              <p className="text-muted-foreground text-sm uppercase tracking-widest leading-relaxed opacity-60">
                {t('games.motoQuiz.desc')}
              </p>

              <div className="flex flex-col gap-3 items-center mt-4">
                 {highScore > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full"
                   >
                     <Trophy className="w-3 h-3 text-primary" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                       {t('games.personalRecord')}: {highScore}
                     </span>
                   </motion.div>
                 )}

                 {globalRecord > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
                   >
                     <TrophyIcon className="w-3 h-3 text-white/40" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                       {t('games.globalRecord')}: {globalRecord}
                     </span>
                   </motion.div>
                 )}
              </div>

              <button 
                onClick={startQuiz}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)] mt-8"
              >
                {t('games.motoQuiz.playNow')}
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div 
              key={`q-${currentIdx}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-2xl space-y-8"
            >
              {/* Progress & Timer */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {t('games.motoQuiz.questions.total', { current: currentIdx + 1, total: QUESTIONS.length })}
                </span>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <Timer className={cn("w-3 h-3 transition-colors", timeLeft <= 3 ? "text-red-500 animate-pulse" : "text-primary")} />
                  <span className={cn("text-[10px] font-mono font-bold", timeLeft <= 3 ? "text-red-500" : "text-white")}>
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-12">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>

              {/* Question Card */}
              <div className="surface-premium rounded-[2.5rem] p-10 sm:p-14 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
                
                <h3 className="text-2xl sm:text-3xl font-black font-display text-white leading-tight mb-12 relative z-10">
                  {t(currentQuestion.textKey)}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  {currentQuestion.optionsKeys.map((optionKey, optIdx) => {
                    const isSelected = selectedIdx === optIdx;
                    const isCorrect = optIdx === currentQuestion.correctAnswerIndex;
                    const isWrong = isSelected && !isCorrect;
                    const showSuccess = showFeedback && isCorrect;
                    const showFailure = showFeedback && isWrong;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswer(optIdx)}
                        disabled={selectedIdx !== null}
                        className={cn(
                          "relative group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden",
                          isSelected ? (isCorrect ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]" : "bg-red-500/20 border-red-500/50") : 
                          showFeedback && isCorrect ? "bg-primary/10 border-primary/50" :
                          "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/[0.08]"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wide transition-colors",
                          isSelected || (showFeedback && isCorrect) ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {t(optionKey)}
                        </span>
                        
                        {isSelected && isCorrect && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                        {showFeedback && isCorrect && !isSelected && <CheckCircle2 className="w-5 h-5 text-primary/50" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-sm space-y-8"
            >
              <motion.div 
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(var(--primary),0.4)]"
              >
                <TrophyIcon className="w-12 h-12 text-black" />
              </motion.div>

              <div className="space-y-2">
                <AnimatePresence>
                  {isNewGlobalRecord && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-2 px-4 py-1 bg-gradient-to-r from-primary/40 to-primary/0 rounded-full border-l-2 border-primary"
                    >
                      👑 RECORD GLOBALE SUPERATO! 👑
                    </motion.p>
                  )}
                  {isNewRecord && !isNewGlobalRecord && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4"
                    >
                      ✨ NUOVO RECORD PERSONALE! ✨
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">{t('games.motoQuiz.gameOver')}</p>
                <h2 className="text-7xl font-black font-display text-white tabular-nums tracking-tighter italic">
                  {score.toLocaleString()}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-10">
                <button 
                  onClick={startQuiz}
                  className="flex items-center justify-center gap-3 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('games.motoQuiz.retry')}
                </button>
                <button 
                  onClick={onBack}
                  className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all font-mono text-[10px]"
                >
                  {t('games.neonRider.back')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
