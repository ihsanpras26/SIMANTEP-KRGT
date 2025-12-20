import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const DRAFT_KEY_PREFIX = 'simantep_form_draft_';

/**
 * Custom hook for auto-saving form data to localStorage
 * @param {string} formId - Unique identifier for the form
 * @param {object} formData - Current form data state
 * @param {function} setFormData - Function to update form data
 * @param {boolean} isEditing - Whether the form is in edit mode
 * @param {number} debounceMs - Debounce delay in milliseconds
 */
export function useAutoSave(formId, formData, setFormData, isEditing = false, debounceMs = 3000) {
    const draftKey = DRAFT_KEY_PREFIX + formId;
    const timeoutRef = useRef(null);
    const initialLoadRef = useRef(false);

    // Load draft from localStorage on mount (only for new forms)
    useEffect(() => {
        if (isEditing || initialLoadRef.current) return;
        initialLoadRef.current = true;

        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed?.data) {
                    const hasData = Object.values(parsed.data).some(v => v && String(v).trim());
                    if (hasData) {
                        toast((t) => (
                            <div className="flex items-center gap-3">
                                <span className="text-sm">Draft sebelumnya ditemukan</span>
                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, ...parsed.data }));
                                        toast.success('Draft dipulihkan');
                                        toast.dismiss(t.id);
                                    }}
                                    className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium"
                                >
                                    Pulihkan
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem(draftKey);
                                        toast.dismiss(t.id);
                                    }}
                                    className="px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-xs"
                                >
                                    Hapus
                                </button>
                            </div>
                        ), { duration: 8000, icon: '💾' });
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load draft:', e);
        }
    }, [draftKey, isEditing, setFormData]);

    // Auto-save form data with debounce
    useEffect(() => {
        if (isEditing) return;

        const hasData = Object.values(formData || {}).some(v => v && String(v).trim());
        if (!hasData) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(draftKey, JSON.stringify({
                    data: formData,
                    savedAt: new Date().toISOString()
                }));
            } catch (e) {
                console.warn('Failed to save draft:', e);
            }
        }, debounceMs);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [formData, draftKey, isEditing, debounceMs]);

    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(draftKey);
        } catch (e) {
            console.warn('Failed to clear draft:', e);
        }
    }, [draftKey]);

    return { clearDraft };
}

export default useAutoSave;
