import React, { useState, useMemo } from 'react';
import { FormDefinition, FormField, FieldType } from '../../types';
import { ArrowLeftIcon, ChevronDownIcon } from '../common/Icons';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface RequestFormProps {
  formId: string;
  forms: FormDefinition[];
  onBack: () => void;
}

const WEBHOOK_URL = 'https://agit.in/webhook/fb2d4ac7-bda0-418f-9947-e5ce1dbe965a';

const renderField = (field: FormField, value: any, handleChange: (fieldId: string, value: any) => void) => {
  const commonClasses = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FFCD00] focus:border-[#FFCD00] sm:text-sm";
  
  switch (field.type) {
    case FieldType.TEXT:
      return <input type="text" id={field.id} value={value || ''} onChange={(e) => handleChange(field.id, e.target.value)} className={commonClasses} placeholder={field.placeholder}/>;
    case FieldType.TEXTAREA:
      return <textarea id={field.id} value={value || ''} onChange={(e) => handleChange(field.id, e.target.value)} rows={4} className={commonClasses} placeholder={field.placeholder}/>;
    case FieldType.DATE:
      return <input type="date" id={field.id} value={value || ''} onChange={(e) => handleChange(field.id, e.target.value)} className={commonClasses} />;
    case FieldType.DATETIME:
      return <input type="datetime-local" id={field.id} value={value || ''} onChange={(e) => handleChange(field.id, e.target.value)} className={commonClasses} />;
    case FieldType.DROPDOWN:
      return (
        <div className="relative">
          <select id={field.id} value={value || ''} onChange={(e) => handleChange(field.id, e.target.value)} className={`${commonClasses} appearance-none pr-8`}>
            <option value="" disabled>{field.placeholder || '옵션을 선택하세요'}</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none"/>
        </div>
      );
    default:
      return null;
  }
};

const RequestForm: React.FC<RequestFormProps> = ({ formId, forms, onBack }) => {
  const form = useMemo(() => forms.find(f => f.id === formId), [formId, forms]);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  if (!form) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">양식을 찾을 수 없습니다</h2>
            <button onClick={onBack} className="mt-4 text-gray-600 hover:underline">뒤로 가기</button>
        </div>
    );
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    form.fields.forEach(field => {
      const value = formData[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field.id] = '이 필드는 필수입니다.';
      }
    });
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionStatus === 'submitting' || submissionStatus === 'success') return;

    if (!validateForm()) {
        return;
    }

    setSubmissionStatus('submitting');
    
    let submissionText = '';
    form.fields.forEach(field => {
      const value = formData[field.id] || '정보 없음';
      submissionText += `* ${field.label}: ${value}\n`;
    });
    
    const fullText = `# ${form.name}\n\n${submissionText.trim()}`;

    const assignees = form.handlerLdap 
      ? form.handlerLdap.split(',').map(ldap => ldap.trim()).filter(ldap => ldap) 
      : [];

    const payload = {
      text: fullText,
      task: {
        template_name: "",
        assignees: assignees,
      },
      expire_type: null
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'Application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
      }
      
      setSubmissionStatus('success');
      setFormData({});

    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
    }
  };

  const getButtonText = () => {
    switch (submissionStatus) {
        case 'submitting': return '제출 중...';
        case 'success': return '성공적으로 제출되었습니다!';
        case 'error': return '다시 시도';
        default: return '요청 보내기';
    }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        모든 양식 보기
      </button>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
            <p className="mt-1 text-gray-600">{form.description}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {form.fields.map(field => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {renderField(field, formData[field.id], handleFieldChange)}
                {validationErrors[field.id] && <p className="mt-1 text-sm text-red-600">{validationErrors[field.id]}</p>}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
              className="w-full bg-[#FFCD00] text-gray-900 font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCD00] disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#e6b800]"
            >
              {getButtonText()}
            </button>
            {submissionStatus === 'error' && (
                 <p className="text-sm text-center text-red-600 mt-3">요청 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            )}
            {submissionStatus === 'success' && (
                 <p className="text-sm text-center text-green-600 mt-3">요청이 성공적으로 전송되었습니다.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;