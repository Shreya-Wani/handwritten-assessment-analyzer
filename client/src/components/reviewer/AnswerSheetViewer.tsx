import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { AnswerPage } from './AnswerPage';
import { getPageImageUrl } from '../../services/assessmentApi';

interface Region {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProcessedPageMeta {
  pageNumber: number;
  width: number;
  height: number;
  imageId: string;
}

interface AnswerSheetViewerProps {
  assessmentId: string;
  pages: ProcessedPageMeta[];
  selectedRegions: Region[];
}

export const AnswerSheetViewer: React.FC<AnswerSheetViewerProps> = ({
  assessmentId,
  pages,
  selectedRegions,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // When selected regions change, automatically jump to the first page of the answer
  useEffect(() => {
    if (selectedRegions.length > 0) {
      // Find the lowest page number in the regions
      const firstPage = Math.min(...selectedRegions.map((r) => r.page));
      setCurrentPage(firstPage);
    }
  }, [selectedRegions]);

  if (!pages || pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        No pages available.
      </div>
    );
  }

  // Filter regions to only those on the current page
  const currentRegions = selectedRegions.filter((r) => r.page === currentPage);
  
  // Identify if answer spans multiple pages
  const uniquePagesForAnswer = Array.from(new Set(selectedRegions.map(r => r.page))).sort((a,b) => a - b);
  const isMultiPageAnswer = uniquePagesForAnswer.length > 1;

  const pageMeta = pages.find((p) => p.pageNumber === currentPage);
  
  if (!pageMeta) {
    return <div className="p-4 text-red-500">Page {currentPage} metadata not found.</div>;
  }

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(pages.length, p + 1));

  return (
    <div className="flex flex-col h-full bg-gray-100 relative">
      {/* Viewer Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="text-sm font-semibold text-gray-700">Answer Sheet Viewer</div>
        
        <div className="flex items-center gap-4">
          {/* Multi-page answer indicator */}
          {isMultiPageAnswer && selectedRegions.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Answer continues (Pages {uniquePagesForAnswer.join(', ')})
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="min-w-[4rem] text-center">
              Page {currentPage} / {pages.length}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === pages.length}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Scroll Container */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-gray-100/80">
        <div className="max-w-4xl w-full">
          <AnswerPage
            imageUrl={getPageImageUrl(assessmentId, 'answerSheet', currentPage)}
            canonicalWidth={pageMeta.width}
            canonicalHeight={pageMeta.height}
            regions={currentRegions}
          />
        </div>
      </div>
    </div>
  );
};
