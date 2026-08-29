import React, { useState, useRef } from 'react';
import { Upload, ArrowRight, Loader2, CheckCircle2, AlertCircle, X, Check, FileText } from 'lucide-react';
import { uploadAssessmentFiles, processAssessment, extractQuestions, extractAnswers, mapAnswers } from '../services/assessmentApi';
import type { UploadState } from '../types';

export const Dashboard: React.FC = () => {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState | 'processing' | 'extracting' | 'extracting_answers' | 'mapping_answers'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processResult, setProcessResult] = useState<any | null>(null);
  const [mapAnswersResult, setMapAnswersResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  const qpRef = useRef<HTMLInputElement>(null);
  const asRef = useRef<HTMLInputElement>(null);

  const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg'];
  const MAX_MB = 10;

  const validate = (file: File): string | null => {
    if (!ALLOWED.includes(file.type)) return 'Only PDF, PNG, or JPG files are supported.';
    if (file.size > MAX_MB * 1024 * 1024) return `File must be smaller than ${MAX_MB} MB.`;
    return null;
  };

  const onSelectQP = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const err = validate(file);
    if (err) { setUploadError(err); return; }
    setQuestionPaper(file);
    setUploadError(null);
    setUploadState('selected');
  };

  const onSelectAS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const err = validate(file);
    if (err) { setUploadError(err); return; }
    setAnswerSheet(file);
    setUploadError(null);
    setUploadState('selected');
  };

  const handleProcess = async () => {
    if (!questionPaper || !answerSheet) return;
    setUploadState('uploading');
    setIsLoading(true);
    setUploadProgress(0);
    setUploadError(null);
    try {
      // 1. Upload files
      const result = await uploadAssessmentFiles(
        questionPaper,
        answerSheet,
        (pct) => setUploadProgress(pct),
      );
      
      // 2. Process documents
      setUploadState('processing');
      setProcessingStage('Preparing documents...');
      const processData = await processAssessment(result.assessmentId);
      setProcessResult(processData);

      // 3. Extract questions
      setUploadState('extracting');
      setProcessingStage('Extracting printed questions...');
      await extractQuestions(result.assessmentId);

      // 4. Extract answers
      setUploadState('extracting_answers');
      setProcessingStage('Extracting handwritten answers...');
      await extractAnswers(result.assessmentId);

      // 5. Map answers
      setUploadState('mapping_answers');
      setProcessingStage('Mapping answers to questions...');
      const mapData = await mapAnswers(result.assessmentId);
      setMapAnswersResult(mapData);

      setUploadState('success');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
      setUploadState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setProcessResult(null);
    setMapAnswersResult(null);
    setUploadError(null);
    setQuestionPaper(null);
    setAnswerSheet(null);
    setIsLoading(false);
    if (qpRef.current) qpRef.current.value = '';
    if (asRef.current) asRef.current.value = '';
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };

  const bothSelected = questionPaper !== null && answerSheet !== null;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (uploadState === 'success' && processResult) {
    const summary = mapAnswersResult?.summary || {};
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-12 px-6 bg-[radial-gradient(circle_at_center_40%,_#FFFFFF_0%,_#F2F2F2_60%,_#DCDCDC_100%)]">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center text-center gap-5">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Answers Mapped</h2>
            <p className="text-sm text-gray-400 mt-1">Ready for grading and review.</p>
          </div>

          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-100 text-left">
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assessment ID</p>
              <code className="text-xs font-mono text-[#FF5A26] break-all">{processResult.assessmentId}</code>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Questions</p>
                <p className="text-xs font-semibold text-gray-700 truncate">{summary.totalQuestions || 0}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Answered</p>
                <p className="text-xs font-semibold text-gray-700 truncate">{summary.answered || 0}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Unanswered</p>
                <p className="text-xs font-semibold text-gray-700 truncate">{summary.unanswered || 0}</p>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Unmatched</p>
                  <p className="text-xs font-semibold text-gray-700 truncate">{summary.unmatchedAnswers || 0}</p>
                </div>
                {(summary.unmatchedAnswers > 0 || summary.conflicts > 0 || summary.needsReview > 0) && (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full transition-colors"
            >
              Upload Another
            </button>
            <button
              onClick={() => window.location.href = `/review/${processResult.assessmentId}`}
              className="px-6 py-2.5 bg-[#212121] hover:bg-black text-white text-sm font-semibold rounded-full transition-colors flex items-center gap-2"
            >
              Review Assessment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Processing screen ────────────────────────────────────────────────────────
  if (uploadState === 'processing' || uploadState === 'extracting' || uploadState === 'extracting_answers' || uploadState === 'mapping_answers') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-12 px-6 bg-[radial-gradient(circle_at_center_40%,_#FFFFFF_0%,_#F2F2F2_60%,_#DCDCDC_100%)]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center text-center gap-5">
          <Loader2 className="h-10 w-10 text-[#FF5A26] animate-spin" />
          <div>
            <h3 className="text-base font-bold text-gray-900">Processing Documents</h3>
            <p className="text-xs text-gray-400 mt-1">{processingStage}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Uploading screen ────────────────────────────────────────────────────────
  if (uploadState === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-12 px-6 bg-[radial-gradient(circle_at_center_40%,_#FFFFFF_0%,_#F2F2F2_60%,_#DCDCDC_100%)]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center text-center gap-5">
          <Loader2 className="h-10 w-10 text-[#FF5A26] animate-spin" />
          <div>
            <h3 className="text-base font-bold text-gray-900">Uploading files…</h3>
            <p className="text-xs text-gray-400 mt-1">Securely sending to server</p>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
              <span>Progress</span><span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF5A26] rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main upload screen (idle / selected / error) ─────────────────────────────
  return (
    <div className="flex flex-col items-center justify-start pt-14 pb-10 px-8 min-h-full bg-[radial-gradient(circle_at_center_30%,_#FFFFFF_0%,_#F0F0F0_55%,_#D2D2D2_100%)]">
      
      {/* Page title */}
      <h1 className="text-[28px] font-bold text-gray-900 text-center leading-tight flex items-center justify-center gap-2.5 flex-wrap">
        Upload
        <span className="bg-[#FFF2EA] text-[#FF5A26] px-4 py-1 rounded-[14px] shadow-[inset_0_1px_2px_rgba(255,90,38,0.1)] drop-shadow-sm">
          Question Paper & Answer Sheets
        </span>
      </h1>
      <p className="text-[14px] text-gray-500 mt-3 mb-8 text-center font-medium">
        Upload both files to get started
      </p>

      {/* Avatar / illustration badge */}
      <div className="relative flex items-center justify-center w-[160px] h-[160px] mb-10 mx-auto">
        {/* Concentric rings */}
        <div className="absolute w-[150px] h-[150px] rounded-full bg-[#FFEAE0]/70"></div>
        <div className="absolute w-[110px] h-[110px] rounded-full bg-[#FFD4C0]/70"></div>
        
        {/* Avatar Image */}
        <div className="absolute w-20 h-20 rounded-full bg-white shadow-md overflow-hidden z-10 flex items-center justify-center border-2 border-white">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn&backgroundColor=e2e8f0&style=circle&hair=long01&clothing=blazerAndShirt" alt="Teacher Avatar" className="w-full h-full object-cover scale-110 mt-2" />
        </div>

        {/* Floating icons */}
        <div className="absolute z-20 w-4 h-4 rounded-full bg-[#FF5A26] text-white flex items-center justify-center top-4 right-8 shadow-sm">
          <Check className="w-2.5 h-2.5" strokeWidth={3} />
        </div>
        <div className="absolute z-20 w-[14px] h-[14px] rounded-full bg-[#FF5A26] text-white flex items-center justify-center bottom-6 left-6 shadow-sm">
          <Upload className="w-2 h-2" strokeWidth={3} />
        </div>
        <div className="absolute z-20 w-[18px] h-[18px] rounded-full bg-[#FF5A26] text-white flex items-center justify-center bottom-5 right-9 shadow-sm">
          <FileText className="w-[10px] h-[10px]" strokeWidth={2.5} />
        </div>
        <div className="absolute z-20 w-3 h-3 rounded-full bg-[#FF5A26] text-white flex items-center justify-center top-6 left-9 shadow-sm"></div>
      </div>

      {/* Error banner */}
      {uploadState === 'error' && uploadError && (
        <div className="w-full max-w-[700px] mb-6 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload cards container */}
      <div className="w-full max-w-[700px] grid grid-cols-2 gap-6">

        {/* Question Paper card */}
        <div
          onClick={() => !questionPaper && qpRef.current?.click()}
          className={`group flex flex-col items-center justify-center h-[130px] border-[2.5px] border-dashed rounded-[20px] bg-white transition-all duration-150 text-center ${
            questionPaper ? 'border-gray-200 cursor-default' : 'border-gray-300 hover:border-[#FF5A26]/50 cursor-pointer'
          }`}
        >
          {questionPaper ? (
            <div className="relative bg-[#F4F4F5] rounded-xl flex items-center gap-3 p-3 w-[88%] shadow-sm">
              <button 
                onClick={(e) => { e.stopPropagation(); setQuestionPaper(null); if (asRef.current) asRef.current.value = ''; }} 
                className="absolute -top-2 -right-2 bg-gray-500 hover:bg-gray-700 text-white rounded-full p-0.5 shadow-md transition-colors z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="bg-[#EF4444] rounded text-white text-[10px] font-bold px-1.5 py-1 shrink-0">
                PDF
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[12px] font-bold text-gray-800 truncate block">{questionPaper.name}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 block">{formatBytes(questionPaper.size)} • 2 Pages</span>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-500 mb-2 group-hover:text-[#FF5A26] transition-colors" />
              <p className="text-[14px] font-bold text-gray-800 leading-snug">
                Upload <span className="text-[#FF5A26]">Question Paper</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Max 10MB</p>
            </>
          )}
        </div>

        {/* Answer Sheet card */}
        <div
          onClick={() => !answerSheet && asRef.current?.click()}
          className={`group flex flex-col items-center justify-center h-[130px] border-[2.5px] border-dashed rounded-[20px] bg-white transition-all duration-150 text-center ${
            answerSheet ? 'border-gray-200 cursor-default' : 'border-gray-300 hover:border-[#FF5A26]/50 cursor-pointer'
          }`}
        >
          {answerSheet ? (
            <div className="relative bg-[#F4F4F5] rounded-xl flex items-center gap-3 p-3 w-[88%] shadow-sm">
              <button 
                onClick={(e) => { e.stopPropagation(); setAnswerSheet(null); if (asRef.current) asRef.current.value = ''; }} 
                className="absolute -top-2 -right-2 bg-gray-500 hover:bg-gray-700 text-white rounded-full p-0.5 shadow-md transition-colors z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="bg-[#EF4444] rounded text-white text-[10px] font-bold px-1.5 py-1 shrink-0">
                PDF
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[12px] font-bold text-gray-800 truncate block">{answerSheet.name}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 block">{formatBytes(answerSheet.size)} • 6 Pages</span>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-500 mb-2 group-hover:text-[#FF5A26] transition-colors" />
              <p className="text-[14px] font-bold text-gray-800 leading-snug">
                Upload <span className="text-[#FF5A26]">Answer Sheet</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Max 10MB</p>
            </>
          )}
        </div>

      </div>

      {/* Hidden file inputs */}
      <input
        ref={qpRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={onSelectQP}
      />
      <input
        ref={asRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={onSelectAS}
      />

      {/* Process Assessment button */}
      <button
        type="button"
        disabled={!bothSelected || isLoading}
        onClick={handleProcess}
        className={`mt-10 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 ${
          bothSelected
            ? 'bg-[#212121] hover:bg-black text-white shadow-md active:scale-95 cursor-pointer'
            : 'bg-[#D4D4D4] text-gray-500 cursor-not-allowed'
        }`}
      >
        Process Assessment
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* Footer hint */}
      <p className="text-[11px] text-gray-500 mt-4 text-center">
        Once both files are selected, you can process the documents
      </p>
    </div>
  );
};
