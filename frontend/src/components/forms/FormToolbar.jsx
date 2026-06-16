import React from 'react';
import { ArrowLeft, Save, ArrowRight, ChevronRight } from 'lucide-react';

export default function FormToolbar({
  currentStep,
  totalSteps,
  readOnly,
  onBack,
  onPrevious,
  onSaveDraft,
  onNext,
  isLastStep,
  lang = 'en'
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-6">
      {/* Left: Back to desk */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50
          text-slate-600 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>{lang === 'hi' ? 'डेस्क पर वापस' : 'Back to Desk'}</span>
      </button>

      {/* Right: Step controls */}
      <div className="flex items-center gap-3 flex-wrap justify-end">
        {/* Previous step */}
        {currentStep > 0 && (
          <button
            type="button"
            onClick={onPrevious}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50
              text-slate-600 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{lang === 'hi' ? 'पिछला' : 'Previous'}</span>
          </button>
        )}

        {/* Manual save draft (only in edit mode) */}
        {!readOnly && onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#cca43b] hover:bg-[#cca43b]/5
              text-[#cca43b] rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <Save size={16} />
            <span>{lang === 'hi' ? 'ड्राफ्ट सहेजें' : 'Save Draft'}</span>
          </button>
        )}

        {/* Next step OR Submit */}
        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 px-6 py-2 bg-[#0d2a4a] hover:bg-[#0f52ba] border border-[#0d2a4a]
              text-white rounded-lg text-sm font-bold transition-all shadow-md cursor-pointer"
          >
            <span>{lang === 'hi' ? 'अगला' : 'Next'}</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          !readOnly && (
            <button
              type="submit"
              className="flex items-center gap-1.5 px-8 py-2 bg-[#0f52ba] hover:bg-[#16406d] text-white
                font-bold rounded-lg text-sm shadow-md shadow-[#0f52ba]/30 transition-all cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#0f52ba]/50"
            >
              <ChevronRight size={18} />
              <span>{lang === 'hi' ? 'रिकॉर्ड सबमिट करें' : 'Submit Record'}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
