 import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
 import { dsaQuestions } from "@/data/dsaQuestionsData";
 import { csQuestions } from "@/data/csSubjectsData";
 import { sqlQuestions } from "@/data/sqlQuestionsData";
 import { aptitudeQuestions } from "@/data/aptitudeQuestionsData";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { useQuizSpacedRepetition } from "@/hooks/useQuizSpacedRepetition";
import { useXPWithNotifications, XP_VALUES } from "@/hooks/useXPWithNotifications";
 
import { type QuizQuestion, type QuizState, type ReviewFilter, type ReviewItem, type SummaryData } from "./quiz/types";
import QuizSetup, { type QuizPreset } from "./quiz/QuizSetup";
import QuizPlaying from "./quiz/QuizPlaying";
import QuizPaused from "./quiz/QuizPaused";
import QuizSummary from "./quiz/QuizSummary";
import QuizResults from "./quiz/QuizResults";
import QuizReview from "./quiz/QuizReview";
import ReviewQuizMode from "./ReviewQuizMode";
 
 interface CombinedQuizModeProps {
   onClose: () => void;
 }
 
 const CombinedQuizMode = ({ onClose }: CombinedQuizModeProps) => {
   const { user } = useAuth();
   const { toast } = useToast();
  const { scheduleForReview, reviews } = useQuizSpacedRepetition();
  const { awardXP } = useXPWithNotifications();
   const [quizState, setQuizState] = useState<QuizState | "srs_review">("setup");
   const [showSRSReview, setShowSRSReview] = useState(false);
   const [questions, setQuestions] = useState<QuizQuestion[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
   const [answers, setAnswers] = useState<(number | null)[]>([]);
   const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
   const [questionStartTime, setQuestionStartTime] = useState(0);
   const [totalTime, setTotalTime] = useState(0);
   const [timeLimit, setTimeLimit] = useState(0);
   const timerRef = useRef<NodeJS.Timeout | null>(null);
   
   // Setup state
   const [questionCount, setQuestionCount] = useState(10);
   const [enabledCategories, setEnabledCategories] = useState({
     dsa: true,
     cs: true,
     sql: true,
     aptitude: true,
  } as Record<string, boolean>);
   const [timedMode, setTimedMode] = useState(false);
   const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);

  // Pause state
  const [pausedTime, setPausedTime] = useState(0);

  // Review state
  const [reviewIndex, setReviewIndex] = useState(0);
 const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("incorrect");
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());

  // Skip tracking
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
 
   // Prepare questions pool
   const allQuestions = useMemo(() => {
     const pool: QuizQuestion[] = [];
     
     if (enabledCategories.dsa) {
       dsaQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "dsa",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     if (enabledCategories.cs) {
       csQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "cs",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     if (enabledCategories.sql) {
       sqlQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "sql",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     if (enabledCategories.aptitude) {
       aptitudeQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "aptitude",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     return pool;
   }, [enabledCategories]);
 
   // Timer effect
   useEffect(() => {
     if (quizState === "playing") {
       timerRef.current = setInterval(() => {
         setTotalTime(prev => {
           const newTime = prev + 1;
           if (timeLimit > 0 && newTime >= timeLimit) {
             handleTimeUp();
             return prev;
           }
           return newTime;
         });
       }, 1000);
     } else {
       if (timerRef.current) clearInterval(timerRef.current);
     }
     return () => {
       if (timerRef.current) clearInterval(timerRef.current);
     };
   }, [quizState, timeLimit]);
 
   const handleTimeUp = () => {
     if (timerRef.current) clearInterval(timerRef.current);
     const remaining = questions.length - currentIndex;
     const newAnswers = [...answers];
     const newTimes = [...timePerQuestion];
     for (let i = 0; i < remaining; i++) {
       newAnswers.push(null);
       newTimes.push(0);
     }
     setAnswers(newAnswers);
     setQuizState("results");
      saveResults(newAnswers, newTimes);
   };
 
   const startQuiz = (preset?: QuizPreset) => {
     let count = questionCount;
     let cats = { ...enabledCategories };
     let limit = timedMode ? timeLimitMinutes * 60 : 0;
     
     if (preset) {
       count = preset.questions;
       cats = { dsa: false, cs: false, sql: false, aptitude: false };
       preset.categories.forEach(c => cats[c] = true);
       limit = preset.timeLimit;
     }
     
     const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
     const selected = shuffled.slice(0, Math.min(count, shuffled.length));
     
     setQuestions(selected);
     setAnswers([]);
     setTimePerQuestion([]);
     setCurrentIndex(0);
     setSelectedAnswer(null);
     setTotalTime(0);
     setTimeLimit(limit);
     setQuestionStartTime(Date.now());
      setMarkedForReview(new Set());
      setSkippedQuestions(new Set());
     setQuizState("playing");
   };
 
  const handlePause = () => {
    setPausedTime(Date.now());
    setQuizState("paused");
  };

  const handleResume = () => {
    const pauseDuration = Date.now() - pausedTime;
    setQuestionStartTime(prev => prev + pauseDuration);
    setQuizState("playing");
  };

  const toggleMarkForReview = (index: number) => {
    setMarkedForReview(prev => {
      const updated = new Set(prev);
      if (updated.has(index)) {
        updated.delete(index);
      } else {
        updated.add(index);
      }
      return updated;
    });
  };

  const handleSkip = () => {
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    setTimePerQuestion(prev => [...prev, timeTaken]);
   setAnswers(prev => [...prev, null]);
    setSkippedQuestions(prev => new Set(prev).add(currentIndex));
    
    const nextUnanswered = findNextUnanswered(currentIndex + 1);
    
    if (nextUnanswered !== -1) {
      setCurrentIndex(nextUnanswered);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    } else {
      const firstSkipped = findFirstSkipped();
      if (firstSkipped !== -1) {
        setCurrentIndex(firstSkipped);
        setSelectedAnswer(null);
        setQuestionStartTime(Date.now());
      } else {
        const finalAnswers = [...answers, null];
        const finalTimes = [...timePerQuestion, timeTaken];
        setQuizState("results");
        saveResults(finalAnswers, finalTimes);
      }
    }
  };

  const findNextUnanswered = (startFrom: number): number => {
    for (let i = startFrom; i < questions.length; i++) {
      if (answers[i] === undefined) {
        return i;
      }
    }
    return -1;
  };

  const findFirstSkipped = (): number => {
    for (let i = 0; i < questions.length; i++) {
      if (skippedQuestions.has(i) && answers[i] === null) {
        return i;
      }
    }
    return -1;
  };

  const handleReturnToSkipped = (index: number) => {
    if (selectedAnswer !== null && answers[currentIndex] === undefined) {
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      setTimePerQuestion(prev => {
        const updated = [...prev];
        updated[currentIndex] = timeTaken;
        return updated;
      });
      setAnswers(prev => {
        const updated = [...prev];
        updated[currentIndex] = selectedAnswer;
        return updated;
      });
    }
    
    setCurrentIndex(index);
    setSelectedAnswer(null);
    setQuestionStartTime(Date.now());
    setSkippedQuestions(prev => {
      const updated = new Set(prev);
      updated.delete(index);
      return updated;
    });
  };

   const handleAnswerSelect = (index: number) => {
     if (selectedAnswer !== null) return;
     setSelectedAnswer(index);
   };
 
   const handleNext = () => {
     const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
     setTimePerQuestion(prev => [...prev, timeTaken]);
     setAnswers(prev => [...prev, selectedAnswer]);
     
     if (currentIndex < questions.length - 1) {
       setCurrentIndex(prev => prev + 1);
       setSelectedAnswer(null);
       setQuestionStartTime(Date.now());
     } else {
       setQuizState("summary");
     }
   };

   const handleSubmitFromSummary = () => {
     const finalAnswers = [...answers];
     const finalTimes = [...timePerQuestion];
     while (finalAnswers.length < questions.length) {
       finalAnswers.push(null);
       finalTimes.push(0);
     }
     setAnswers(finalAnswers);
     setQuizState("results");
      saveResults(finalAnswers, finalTimes);
   };

   const handleGoToQuestion = (index: number) => {
     setCurrentIndex(index);
     setSelectedAnswer(answers[index] ?? null);
     setQuestionStartTime(Date.now());
     setQuizState("playing");
   };

   const getSummaryData = (): SummaryData => {
     const answered: number[] = [];
     const skipped: number[] = [];
     const flagged: number[] = [];
     const unanswered: number[] = [];
     
     questions.forEach((_, idx) => {
       const hasAnswer = answers[idx] !== undefined && answers[idx] !== null;
       const isSkipped = skippedQuestions.has(idx);
       const isFlagged = markedForReview.has(idx);
       
       if (isFlagged) flagged.push(idx);
       if (isSkipped || !hasAnswer) {
         skipped.push(idx);
       } else {
         answered.push(idx);
       }
       if (answers[idx] === undefined) {
         unanswered.push(idx);
       }
     });
     
     return { answered, skipped, flagged, unanswered };
   };
 
    const saveResults = async (finalAnswers: (number | null)[], questionTimes: number[]) => {
     if (!user) return;
     
     const score = finalAnswers.reduce((acc, ans, idx) => {
       if (ans === null) return acc;
       return questions[idx]?.options[ans]?.isCorrect ? acc + 1 : acc;
     }, 0);

      const accuracy = Math.round((score / questions.length) * 100);
     
     try {
        // Insert quiz result and get the ID
        const { data: quizResultData, error: quizError } = await supabase
          .from("quiz_results")
          .insert({
         user_id: user.id,
         quiz_type: "combined",
         score,
         total_questions: questions.length,
          accuracy,
         total_time_seconds: totalTime,
         avg_time_seconds: Math.round(totalTime / questions.length),
         category: "all",
         difficulty: "all",
          })
          .select("id")
          .single();

        if (quizError) throw quizError;

        // Save individual question responses for history detail view
        if (quizResultData?.id) {
          const questionResponses = questions.map((q, idx) => ({
            quiz_result_id: quizResultData.id,
            question_id: q.id,
            question_category: q.category,
            question_index: idx + 1,
            selected_answer_index: finalAnswers[idx],
            is_correct: finalAnswers[idx] !== null && q.options[finalAnswers[idx]!]?.isCorrect,
            time_taken_seconds: questionTimes[idx] || 0,
            was_flagged: markedForReview.has(idx),
          }));

          const { error: responsesError } = await supabase
            .from("quiz_question_responses")
            .insert(questionResponses);

          if (responsesError) {
            console.error("Error saving question responses:", responsesError);
          }
        }

        const quizXP = XP_VALUES.QUIZ_COMPLETE + (score * XP_VALUES.QUESTION_CORRECT);
        const isPerfect = score === questions.length;
        const totalXP = isPerfect ? quizXP + XP_VALUES.QUIZ_PERFECT : quizXP;
        
        await awardXP(
          totalXP, 
          "quiz_complete", 
          isPerfect 
            ? `🎯 Perfect score! ${score}/${questions.length}` 
            : `Quiz completed: ${score}/${questions.length} (${accuracy}%)`
        );

       const incorrectQuestions = questions
         .map((q, idx) => ({ question: q, answer: finalAnswers[idx], idx }))
         .filter(item => {
          if (item.answer === null) return true;
           return !item.question.options[item.answer]?.isCorrect;
         })
         .map(item => ({
           questionId: item.question.id,
           category: item.question.category,
           title: item.question.title,
         }));

       if (incorrectQuestions.length > 0) {
         await scheduleForReview(incorrectQuestions);
         toast({
           title: "Questions scheduled for review",
           description: `${incorrectQuestions.length} question(s) added to your spaced repetition queue`,
           duration: 4000,
         });
       }
     } catch (error) {
       console.error("Error saving quiz results:", error);
     }
   };
 
  const filteredReviewQuestions: ReviewItem[] = useMemo(() => {
    return questions.map((q, idx) => ({
      question: q,
      userAnswer: answers[idx],
      index: idx,
      isCorrect: answers[idx] !== null && q.options[answers[idx]!]?.isCorrect,
      isUnanswered: answers[idx] === null,
      isMarked: markedForReview.has(idx),
    })).filter(item => {
      if (reviewFilter === "all") return true;
      if (reviewFilter === "incorrect") return !item.isCorrect;
      if (reviewFilter === "unanswered") return item.isUnanswered;
      if (reviewFilter === "flagged") return item.isMarked;
      return true;
    });
  }, [questions, answers, reviewFilter, markedForReview]);

  const stateVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  };

  const transitionConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  };

   // Render based on quiz state
   if (showSRSReview) {
     return (
       <ReviewQuizMode
         reviews={reviews.filter(r => r.urgency === "critical" || r.urgency === "due" || r.urgency === "upcoming")}
         onClose={() => setShowSRSReview(false)}
       />
     );
   }

   if (quizState === "setup") {
     return (
       <AnimatePresence mode="wait">
         <motion.div
           key="setup"
           variants={stateVariants}
           initial="initial"
           animate="animate"
           exit="exit"
           transition={transitionConfig}
         >
           <QuizSetup
             onClose={onClose}
             onStartQuiz={startQuiz}
             onStartReviewMode={() => setShowSRSReview(true)}
             questionCount={questionCount}
             setQuestionCount={setQuestionCount}
             enabledCategories={enabledCategories}
             setEnabledCategories={setEnabledCategories}
             timedMode={timedMode}
             setTimedMode={setTimedMode}
             timeLimitMinutes={timeLimitMinutes}
             setTimeLimitMinutes={setTimeLimitMinutes}
             allQuestionsCount={allQuestions.length}
           />
         </motion.div>
       </AnimatePresence>
     );
   }
 
  if (quizState === "paused") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="paused"
          variants={stateVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitionConfig}
        >
          <QuizPaused
            currentIndex={currentIndex}
            questionsLength={questions.length}
            totalTime={totalTime}
            timeLimit={timeLimit}
            onResume={handleResume}
            onClose={onClose}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

   if (quizState === "summary") {
     return (
       <AnimatePresence mode="wait">
         <motion.div
           key="summary"
           variants={stateVariants}
           initial="initial"
           animate="animate"
           exit="exit"
           transition={transitionConfig}
         >
           <QuizSummary
             questions={questions}
             answers={answers}
             totalTime={totalTime}
             summaryData={getSummaryData()}
             skippedQuestions={skippedQuestions}
             markedForReview={markedForReview}
             onGoToQuestion={handleGoToQuestion}
             onBackToQuiz={() => {
               setCurrentIndex(questions.length - 1);
               setSelectedAnswer(answers[questions.length - 1] ?? null);
               setQuestionStartTime(Date.now());
               setQuizState("playing");
             }}
             onSubmit={handleSubmitFromSummary}
           />
         </motion.div>
       </AnimatePresence>
     );
   }
 
    if (quizState === "review") {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="review"
            variants={stateVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionConfig}
          >
            <QuizReview
              filteredReviewQuestions={filteredReviewQuestions}
              reviewIndex={reviewIndex}
              reviewFilter={reviewFilter}
              onSetReviewIndex={setReviewIndex}
              onSetReviewFilter={setReviewFilter}
              onBackToResults={() => setQuizState("results")}
            />
          </motion.div>
        </AnimatePresence>
      );
    }

   if (quizState === "results") {
     return (
       <AnimatePresence mode="wait">
         <motion.div
           key="results"
           variants={stateVariants}
           initial="initial"
           animate="animate"
           exit="exit"
           transition={transitionConfig}
         >
           <QuizResults
             questions={questions}
             answers={answers}
             totalTime={totalTime}
             markedForReview={markedForReview}
             onClose={onClose}
             onReview={() => {
               setReviewIndex(0);
               setReviewFilter(markedForReview.size > 0 ? "flagged" : "incorrect");
               setQuizState("review");
             }}
             onNewQuiz={() => setQuizState("setup")}
           />
         </motion.div>
       </AnimatePresence>
     );
   }
 
   // Playing state
   return (
     <AnimatePresence mode="wait">
       <motion.div
         key={`playing-${currentIndex}`}
         initial={{ opacity: 0, x: 20 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: -20 }}
         transition={{ type: "spring", stiffness: 400, damping: 35 }}
       >
         <QuizPlaying
           questions={questions}
           currentIndex={currentIndex}
           selectedAnswer={selectedAnswer}
           answers={answers}
           totalTime={totalTime}
           timeLimit={timeLimit}
           markedForReview={markedForReview}
           skippedQuestions={skippedQuestions}
           onAnswerSelect={handleAnswerSelect}
           onNext={handleNext}
           onSkip={handleSkip}
           onPause={handlePause}
           onClose={onClose}
           onToggleFlag={toggleMarkForReview}
           onReturnToSkipped={handleReturnToSkipped}
         />
       </motion.div>
     </AnimatePresence>
   );
 };
 
 export default CombinedQuizMode;