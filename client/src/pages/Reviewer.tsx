import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, XCircle, HelpCircle, Save } from 'lucide-react';
import { getAssessment, submitGrade } from '../services/assessmentApi';
import { AnswerSheetViewer } from '../components/reviewer/AnswerSheetViewer';

// Optional inner component for grading UI to keep state scoped
const GradeWidget: React.FC<{ 
  assessmentId: string, 
  questionId: string, 
  maxMarks: number | null, 
  existingGrade: any,
  onGradeSaved: () => void 
}> = ({ assessmentId, questionId, maxMarks, existingGrade, onGradeSaved }) => {
  const [marks, setMarks] = useState<string>(existingGrade?.marksObtained?.toString() || '');
  const [feedback, setFeedback] = useState<string>(existingGrade?.feedback || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    setMarks(existingGrade?.marksObtained?.toString() || '');
    setFeedback(existingGrade?.feedback || '');
    setError(null);
  }, [existingGrade, questionId]);

  const handleSave = async () => {
    if (marks.trim() === '') {
      setError('Please enter marks');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await submitGrade(assessmentId, questionId, {
        marksObtained: marks === '' ? null : Number(marks),
        feedback
      });
      onGradeSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">Grade Answer</div>
      <div className="flex gap-2 mb-2 items-center">
        <input 
          type="number" 
          value={marks} 
          onChange={e => setMarks(e.target.value)}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
          placeholder="Marks"
          min="0"
          step="0.5"
          max={maxMarks || undefined}
        />
        <span className="text-sm font-semibold text-gray-500">
          / {maxMarks !== null && maxMarks !== undefined ? maxMarks : '?'}
        </span>
      </div>
      <textarea 
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Optional feedback..."
        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-2 resize-none h-14"
      />
      {error && <div className="text-[10px] text-red-500 mb-2">{error}</div>}
      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded hover:bg-black transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? 'Saving...' : 'Save Grade'}
      </button>
    </div>
  );
};

export const Reviewer: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  
  const [assessment, setAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemType, setItemType] = useState<'question' | 'unmatched'>('question');

  const reloadAssessment = async () => {
    if (!assessmentId) return;
    try {
      const data = await getAssessment(assessmentId);
      setAssessment(data);
    } catch (err: any) {
      // Background reload failure, ignore
    }
  };

  useEffect(() => {
    async function load() {
      if (!assessmentId) return;
      try {
        const data = await getAssessment(assessmentId);
        setAssessment(data);
        if (data.questions && data.questions.length > 0) {
          setSelectedItemId(data.questions[0].id);
          setItemType('question');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 text-sm">Loading assessment...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Error Loading Assessment</h2>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-gray-900 text-white text-sm rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (assessment.status !== 'answers_mapped') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Assessment Not Ready</h2>
          <p className="text-gray-500 text-sm mt-1">
            This assessment has not finished processing yet (Status: {assessment.status}).
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-gray-900 text-white text-sm rounded-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { questions = [], answers = [], mappings = [], grades = {} } = assessment;
  const answerSheetPages = assessment.processedData?.answerSheet?.pages || [];

  // Calculate grading summary
  let totalMarks = 0;
  let obtainedMarks = 0;
  let gradedCount = 0;
  let missingMaxMarks = false;

  Object.values(grades).forEach((g: any) => {
    if (g.graded) {
      gradedCount++;
      if (g.marksObtained !== null) obtainedMarks += g.marksObtained;
      if (g.maxMarks !== null) {
        totalMarks += g.maxMarks;
      } else {
        missingMaxMarks = true;
      }
    }
  });

  // Identify unmatched answers
  const unmatchedAnswers = answers.filter((a: any) => 
    mappings.some((m: any) => m.answerId === a.id && m.status === 'unmatched')
  );

  // Determine regions to highlight based on selected item
  let selectedRegions: any[] = [];
  let answerText: string | null = null;
  let currentMapping: any = null;
  let candidateAnswers: any[] = [];
  let selectedQuestion: any = null;

  if (selectedItemId && itemType === 'question') {
    selectedQuestion = questions.find((q: any) => q.id === selectedItemId);
    currentMapping = mappings.find((m: any) => m.questionId === selectedItemId);
    if (currentMapping) {
      if (currentMapping.status === 'conflict' && currentMapping.candidateAnswerIds) {
        // Collect candidate regions
        candidateAnswers = answers.filter((a: any) => currentMapping.candidateAnswerIds.includes(a.id));
        selectedRegions = candidateAnswers.flatMap((a: any) => a.regions || []);
      } else if (currentMapping.answerId) {
        const studentAns = answers.find((a: any) => a.id === currentMapping.answerId);
        if (studentAns) {
          selectedRegions = studentAns.regions || [];
          answerText = studentAns.text;
        }
      }
    }
  } else if (selectedItemId && itemType === 'unmatched') {
    const studentAns = answers.find((a: any) => a.id === selectedItemId);
    if (studentAns) {
      selectedRegions = studentAns.regions || [];
      answerText = studentAns.text;
      currentMapping = mappings.find((m: any) => m.answerId === selectedItemId);
    }
  }

  // Sidebar item rendering helper
  const renderQuestionItem = (q: any) => {
    const isSelected = q.id === selectedItemId && itemType === 'question';
    const mapping = mappings.find((m: any) => m.questionId === q.id);
    const status = mapping ? mapping.status : 'unanswered';
    const grade = grades[q.id];
    
    let StatusIcon = XCircle;
    let iconClass = 'text-gray-300';
    if (status === 'matched') { StatusIcon = CheckCircle2; iconClass = 'text-green-500'; }
    if (status === 'needs_review' || status === 'conflict') { StatusIcon = AlertCircle; iconClass = 'text-orange-500'; }

    return (
      <button
        key={q.id}
        onClick={() => { setSelectedItemId(q.id); setItemType('question'); }}
        className={`w-full flex flex-col text-left px-4 py-3 border-b border-gray-100 transition-colors ${
          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-gray-800">Question {q.number}</span>
          <div className="flex items-center gap-2">
            {grade?.graded && (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {grade.marksObtained}/{grade.maxMarks ?? '?'}
              </span>
            )}
            <StatusIcon className={`w-4 h-4 ${iconClass}`} />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate pr-4">{q.text || 'No text extracted'}</p>
        {status === 'conflict' && (
          <p className="text-[10px] text-orange-600 font-semibold mt-1">Multiple answers detected</p>
        )}
      </button>
    );
  };

  const renderUnmatchedItem = (ans: any, index: number) => {
    const isSelected = ans.id === selectedItemId && itemType === 'unmatched';
    
    return (
      <button
        key={ans.id}
        onClick={() => { setSelectedItemId(ans.id); setItemType('unmatched'); }}
        className={`w-full flex flex-col text-left px-4 py-3 border-b border-gray-100 transition-colors ${
          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-gray-800">Unmatched Answer {index + 1}</span>
          <HelpCircle className="w-4 h-4 text-orange-400" />
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate pr-4">Ref: {ans.questionNumber || 'Anonymous'}</p>
      </button>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white">
      {/* Sidebar: Item List */}
      <div className="w-80 shrink-0 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50">
          <button onClick={() => window.location.href = '/'} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col text-right">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Review</h2>
            {gradedCount > 0 && (
              <span className="text-[10px] font-bold text-gray-500">
                Score: {obtainedMarks}{!missingMaxMarks && ` / ${totalMarks}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          {questions.map(renderQuestionItem)}
          
          {unmatchedAnswers.length > 0 && (
            <>
              <div className="px-4 py-2 mt-2 bg-gray-100 border-y border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Unmatched Answers ({unmatchedAnswers.length})
              </div>
              {unmatchedAnswers.map((ans: any, idx: number) => renderUnmatchedItem(ans, idx))}
            </>
          )}
        </div>
        
        {/* Info panel for selected item */}
        {selectedItemId && currentMapping && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">Mapping Status</div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 bg-white border border-gray-200 rounded text-xs font-medium capitalize ${
                currentMapping.status === 'conflict' ? 'text-orange-600 border-orange-200' : 'text-gray-700'
              }`}>
                {currentMapping.status.replace('_', ' ')}
              </span>
              {currentMapping.confidence > 0 && (
                <span className="text-xs text-gray-500">{(currentMapping.confidence * 100).toFixed(0)}% Match</span>
              )}
            </div>
            
            {currentMapping.status === 'conflict' && (
              <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-100 mb-2">
                This question has multiple candidate answers.
              </div>
            )}
            
            {answerText && (
              <div className="mb-2">
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Extracted Text</div>
                <div className="text-xs text-gray-600 line-clamp-2 bg-white p-2 rounded border border-gray-100">
                  {answerText}
                </div>
              </div>
            )}

            {/* Manual Grading Interface (Only for valid mapped questions) */}
            {itemType === 'question' && currentMapping.status !== 'conflict' && selectedQuestion && (
              <GradeWidget 
                assessmentId={assessmentId!}
                questionId={selectedQuestion.id}
                maxMarks={selectedQuestion.maxMarks ?? null}
                existingGrade={grades[selectedQuestion.id]}
                onGradeSaved={reloadAssessment}
              />
            )}
          </div>
        )}
      </div>

      {/* Main Content: Viewer */}
      <div className="flex-1 relative">
        <AnswerSheetViewer 
          assessmentId={assessmentId!}
          pages={answerSheetPages}
          selectedRegions={selectedRegions}
        />
      </div>
    </div>
  );
};
