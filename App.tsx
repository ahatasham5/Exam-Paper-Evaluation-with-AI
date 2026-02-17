
import React, { useState } from 'react';
import { AppStep, EvaluationReport } from './types';
import ProgressBar from './components/ProgressBar';
import VisualizationBoard from './components/VisualizationBoard';
import { extractHandwrittenText, evaluateStudentWork } from './services/geminiService';

// PDF.js worker setup
// @ts-ignore
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD_STUDENT_SCRIPT);
  const [studentText, setStudentText] = useState<string>('');
  const [masterText, setMasterText] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [liveContent, setLiveContent] = useState<string>('');

  const processFile = async (file: File, onComplete: (text: string) => void) => {
    setIsLoading(true);
    setLiveContent('');
    try {
      let combinedText = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
          setProgressMsg(`Processing Page ${i} of ${totalPages}`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context!, viewport }).promise;
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          const pageText = await extractHandwrittenText(base64);
          
          const formattedText = `\n--- PAGE ${i} ---\n${pageText}\n`;
          combinedText += formattedText;
          setLiveContent(prev => prev + pageText.substring(0, 200) + '...');
        }
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const extracted = await extractHandwrittenText(base64);
        combinedText = extracted;
        setLiveContent(extracted);
      }
      onComplete(combinedText);
    } catch (err) {
      console.error(err);
      alert("Error during file processing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep(AppStep.EXTRACTING_STUDENT);
    await processFile(file, (text) => {
      setStudentText(text);
      setStep(AppStep.REVIEW_STUDENT_TEXT);
    });
  };

  const handleMasterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep(AppStep.EXTRACTING_MASTER);
    await processFile(file, (text) => {
      setMasterText(text);
      setStep(AppStep.REVIEW_MASTER_TEXT);
    });
  };

  const startEvaluation = async () => {
    setStep(AppStep.EVALUATING);
    setIsLoading(true);
    setProgressMsg('AI is performing comparative evaluation');
    setLiveContent('Cross-referencing student handwriting against master answer script...');

    try {
      const result = await evaluateStudentWork(studentText, masterText);
      setEvaluation(result);
      setStep(AppStep.FINAL_REPORT);
    } catch (err) {
      console.error(err);
      alert("Error during evaluation.");
      setStep(AppStep.REVIEW_MASTER_TEXT);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case AppStep.UPLOAD_STUDENT_SCRIPT:
        return (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-indigo-200 rounded-2xl bg-white shadow-sm hover:border-indigo-400 transition-colors">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Upload Student Answer Script</h3>
            <p className="text-gray-500 mb-6 text-center max-w-sm">Upload the student's handwritten response (PDF or Image).</p>
            <label className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all active:scale-95 shadow-lg">
              Select Student Script
              <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleStudentFileUpload} />
            </label>
          </div>
        );

      case AppStep.EXTRACTING_STUDENT:
      case AppStep.EXTRACTING_MASTER:
      case AppStep.EVALUATING:
        return (
          <div className="space-y-6">
            <VisualizationBoard 
              status={progressMsg} 
              contentSnippet={liveContent} 
              isProcessing={isLoading} 
              type={step === AppStep.EVALUATING ? 'evaluation' : 'extraction'}
            />
            <div className="text-center">
              <p className="text-sm text-gray-400 animate-pulse">Syncing with neural processing core...</p>
            </div>
          </div>
        );

      case AppStep.REVIEW_STUDENT_TEXT:
        return (
          <div className="flex flex-col space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold">Review Extracted Student Text</h3>
            <textarea
              className="w-full h-80 p-4 border border-gray-200 rounded-xl font-mono text-sm"
              value={studentText}
              onChange={(e) => setStudentText(e.target.value)}
            />
            <button
              onClick={() => setStep(AppStep.UPLOAD_MASTER_SCRIPT)}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Next: Upload Master Answer Script
            </button>
          </div>
        );

      case AppStep.UPLOAD_MASTER_SCRIPT:
        return (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-green-200 rounded-2xl bg-white shadow-sm hover:border-green-400 transition-colors">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Upload Master Answer Script</h3>
            <p className="text-gray-500 mb-6 text-center max-w-sm">Upload the actual question-answer script for AI reference.</p>
            <label className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-green-700 transition-all active:scale-95 shadow-lg">
              Select Master Script
              <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleMasterFileUpload} />
            </label>
            <button onClick={() => setStep(AppStep.REVIEW_STUDENT_TEXT)} className="mt-4 text-gray-400 hover:text-gray-600 text-sm">Go Back</button>
          </div>
        );

      case AppStep.REVIEW_MASTER_TEXT:
        return (
          <div className="flex flex-col space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold">Review Extracted Master Text</h3>
            <textarea
              className="w-full h-80 p-4 border border-gray-200 rounded-xl font-mono text-sm"
              value={masterText}
              onChange={(e) => setMasterText(e.target.value)}
            />
            <button
              onClick={startEvaluation}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Begin Final AI Evaluation
            </button>
          </div>
        );

      case AppStep.FINAL_REPORT:
        if (!evaluation) return null;
        return (
          <div className="flex flex-col space-y-8 pb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Report Summary</h2>
                <p className="text-gray-500 max-w-xl text-lg leading-relaxed">{evaluation.overallFeedback}</p>
              </div>
              <div className="mt-6 md:mt-0 flex flex-col items-center px-8 py-6 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner">
                <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs mb-1">Performance Index</span>
                <span className="text-5xl font-black text-indigo-700">{evaluation.totalObtained} <span className="text-2xl text-indigo-400">/ {evaluation.totalMarks}</span></span>
              </div>
            </div>

            <div className="grid gap-6">
              {evaluation.questions.map((q, idx) => (
                <div key={idx} className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
                  q.status === 'skipped' ? 'border-red-200' : 'border-gray-100'
                }`}>
                  <div className={`px-6 py-4 flex justify-between items-center border-b ${
                    q.status === 'skipped' ? 'bg-red-50/50' : 'bg-gray-50/50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-800 text-lg">{q.questionNumber}</span>
                      {q.status === 'skipped' && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Skipped</span>
                      )}
                    </div>
                    <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                      q.status === 'skipped' ? 'bg-red-100 text-red-700' :
                      q.obtainedMarks >= q.maxMarks * 0.8 ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {q.obtainedMarks} / {q.maxMarks} Marks
                    </span>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Expected Solution</h4>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 leading-relaxed italic">{q.actualAnswer}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Student Response</h4>
                      <p className={`p-4 rounded-xl text-sm border leading-relaxed ${
                        q.status === 'skipped' ? 'bg-red-50 border-red-100 text-red-400 italic' : 'bg-indigo-50/50 border-indigo-100 text-gray-800'
                      }`}>
                        {q.studentAnswer || "No content detected in handwriting."}
                      </p>
                    </div>
                    <div className="md:col-span-2 bg-indigo-900 text-indigo-100 p-6 rounded-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                       </div>
                      <h4 className="text-[10px] font-black text-indigo-300 uppercase mb-2 tracking-widest">Examiner Feedback</h4>
                      <p className="text-lg font-medium">"{q.feedback}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setStep(AppStep.UPLOAD_STUDENT_SCRIPT);
                setStudentText('');
                setMasterText('');
                setEvaluation(null);
              }}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-95"
            >
              Evaluate New Paper
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform cursor-pointer">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-5xl font-black text-gray-900 ml-5 tracking-tighter">Exam<span className="text-indigo-600 italic">AI</span></h1>
        </div>
        <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Deep Neural Examiner v2.0</p>
      </header>

      <ProgressBar currentStep={step} />

      <main className="mt-12 min-h-[400px]">
        {renderStepContent()}
      </main>

      <footer className="mt-20 text-center pb-12 border-t border-gray-100 pt-10">
        <p className="text-gray-300 text-xs font-mono uppercase tracking-widest">Encrypted Pipeline • Gemini Flash • Multi-Language Support</p>
      </footer>
    </div>
  );
};

export default App;
