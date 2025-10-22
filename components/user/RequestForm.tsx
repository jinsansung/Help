import React, { useState, useMemo } from 'react';
import { FormDefinition, FormField, FieldType } from '../../types';
import { ArrowLeftIcon, ChevronDownIcon } from '../common/Icons';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface RequestFormProps {
  formId: string;
  forms: FormDefinition[];
  onBack: () => void;
}

/** 기존 아지트 웹훅 */
const WEBHOOK_URL = 'https://agit.in/webhook/fb2d4ac7-bda0-418f-9947-e5ce1dbe965a';

/** 구글시트 Web App 엔드포인트 (아래 “앱스 스크립트” 섹션 코드 배포 후 URL로 교체) */
const SHEETS_WEBHOOK_URL = process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyqsVqcqnzbyHcIEfwl-v_QMJzev-ZOSSjBW2UCjWX0ntS-yT0TQmK0GY4rfToA_gM_/exec';

const renderField = (
  field: FormField,
  value: any,
  handleChange: (fieldId: string, value: any) => void
) => {
  const commonClasses =
    'block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FFCD00] focus:border-[#FFCD00] sm:text-sm';

  switch (field.type) {
    case FieldType.TEXT:
      return (
        <input
          type="text"
          id={field.id}
          value={value || ''}
          onChange={(e) => handleChange(field.id, e.target.value)}
          className={commonClasses}
          placeholder={field.placeholder}
        />
      );
    case FieldType.TEXTAREA:
      return (
        <textarea
          id={field.id}
          value={value || ''}
          onChange={(e) => handleChange(field.id, e.target.value)}
          rows={4}
          className={commonClasses}
          placeholder={field.placeholder}
        />
      );
    case FieldType.DATE:
      return (
        <input
          type="date"
          id={field.id}
          value={value || ''}
          onChange={(e) => handleChange(field.id, e.target.value)}
          className={commonClasses}
        />
      );
    case FieldType.DATETIME:
      return (
        <input
          type="datetime-local"
          id={field.id}
          value={value || ''}
          onChange={(e) => handleChange(field.id, e.target.value)}
          className={commonClasses}
        />
      );
    case FieldType.DROPDOWN:
      return (
        <div className="relative">
          <select
            id={field.id}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={`${commonClasses} appearance-none pr-8`}
          >
            <option value="" disabled>
              {field.placeholder || '옵션을 선택하세요'}
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
        </div>
      );
    default:
      return null;
  }
};

const RequestForm: React.FC<RequestFormProps> = ({ formId, forms, onBack }) => {
  const form = useMemo(() => forms.find((f) => f.id === formId), [formId, forms]);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  if (!form) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">양식을 찾을 수 없습니다</h2>
        <button onClick={onBack} className="mt-4 text-gray-600 hover:underline">
          뒤로 가기
        </button>
      </div>
    );
  }

  /** 라벨로 값 찾기(라벨명이 정확히 들어온다는 전제; 공백 차이 등 대비해 trim/normalize) */
  const getByLabel = (label: string) => {
    const target = form.fields.find(
      (f) => f.label?.toString().trim() === label.trim()
    );
    return target ? (formData[target.id] ?? '') : '';
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    form.fields.forEach((field) => {
      const value = formData[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field.id] = '이 필드는 필수입니다.';
      }
    });
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** 아지트(Webhook) 본문 생성 */
  const buildAgitPayload = () => {
    let submissionText = '';
    form.fields.forEach((field) => {
      const value = formData[field.id] || '정보 없음';
      submissionText += `* ${field.label}: ${value}\n`;
    });
    const fullText = `# ${form.name}\n\n${submissionText.trim()}`;

    const assignees = form.handlerLdap
      ? form.handlerLdap.split(',').map((ldap) => ldap.trim()).filter((ldap) => ldap)
      : [];

    return {
      text: fullText,
      task: {
        template_name: '',
        assignees,
      },
      expire_type: null,
    };
  };

  /** 구글시트용 페이로드 생성 */
  const buildSheetsPayloadIfNeeded = () => {
    const title = form.name?.trim();
    if (title === '방문자 등록') {
      // 시트: 방문자 등록
      const row = [
        getByLabel('신청자 이름'),
        getByLabel('날짜 및 시간'),
        getByLabel('방문자 이름'),
        getByLabel('방문자 소속'),
        getByLabel('총 방문자 수'),
      ];
      return { sheet: 'visitors', // 시트 탭 이름
               title,               // 참고용
               values: row };
    } else if (title === '임시 사원증 신청') {
      // 시트: 임시 사원증 신청
      const row = [
        getByLabel('신청자 이름'),
        getByLabel('사원증이 필요한 날짜'),
      ];
      return { sheet: 'temp_badge', // 시트 탭 이름
               title,
               values: row };
    }
    return null;
  };

  const sendToAgitWebhook = async () => {
    const payload = buildAgitPayload();
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
    }
  };

  const sendToSheets = async () => {
    const sheetPayload = buildSheetsPayloadIfNeeded();
    if (!sheetPayload) return;

    const form = new URLSearchParams();
    form.set('payload', JSON.stringify(sheetPayload)); // JSON을 문자열로 싣기

    // Apps Script(Web App) 쪽에서 JSON 받도록 구현
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: form.toString(),
    });
    // 실패해도 UI는 막지 않기 때문에 여기서는 throw 안 함(네트워크 에러면 상위에서 잡힘)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionStatus === 'submitting' || submissionStatus === 'success') return;

    if (!validateForm()) return;

    setSubmissionStatus('submitting');

    try {
      // 두 전송을 병렬로 수행하되, UI 판단은 “아지트 웹훅” 성공 여부로만
      const [agitResult, sheetResult] = await Promise.allSettled([
        sendToAgitWebhook(),
        sendToSheets(),
      ]);

      if (agitResult.status === 'rejected') {
        throw agitResult.reason;
      }

      // 시트 전송 실패는 콘솔 경고만(요청 본연의 목적은 아지트 등록이므로)
      if (sheetResult.status === 'rejected') {
        console.warn('[Sheets Append Warning]', sheetResult.reason);
      }

      setSubmissionStatus('success');
      setFormData({});
    } catch (err) {
      console.error('Submission error:', err);
      setSubmissionStatus('error');
    }
  };

  const getButtonText = () => {
    switch (submissionStatus) {
      case 'submitting':
        return '제출 중...';
      case 'success':
        return '성공적으로 제출되었습니다!';
      case 'error':
        return '다시 시도';
      default:
        return '요청 보내기';
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium"
      >
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
            {form.fields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {field.label}
                </label>
                {renderField(field, formData[field.id], handleFieldChange)}
                {validationErrors[field.id] && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors[field.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={
                submissionStatus === 'submitting' || submissionStatus === 'success'
              }
              className="w-full bg-[#FFCD00] text-gray-900 font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCD00] disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#e6b800]"
            >
              {getButtonText()}
            </button>
            {submissionStatus === 'error' && (
              <p className="text-sm text-center text-red-600 mt-3">
                요청 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
            )}
            {submissionStatus === 'success' && (
              <p className="text-sm text-center text-green-600 mt-3">
                요청이 성공적으로 전송되었습니다.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
