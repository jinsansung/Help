
import React, { useState, useEffect } from 'react';
import { FormDefinition, FormField, FieldType } from '../../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, ChevronDownIcon } from '../common/Icons';

interface FormBuilderProps {
  formId: string;
  forms: FormDefinition[];
  onSaveForm: (form: FormDefinition) => void;
  onBack: () => void;
}

const applicantField: FormField = {
  id: 'field_applicant_fixed',
  label: '신청자',
  type: FieldType.TEXT,
  placeholder: 'LDAP을 입력하세요(bella.arena)',
  isFixed: true,
};

const defaultForm: Partial<FormDefinition> = {
  name: '',
  description: '',
  handlerLdap: '',
  fields: [applicantField],
};

const fieldTypeDisplay: { [key in FieldType]: string } = {
    [FieldType.TEXT]: '텍스트',
    [FieldType.TEXTAREA]: '여러 줄 텍스트',
    [FieldType.DATE]: '날짜',
    [FieldType.DATETIME]: '날짜 및 시간',
    [FieldType.DROPDOWN]: '드롭다운',
};


const FormBuilder: React.FC<FormBuilderProps> = ({ formId, forms, onSaveForm, onBack }) => {
  const [form, setForm] = useState<FormDefinition>({ ...defaultForm, id: formId } as FormDefinition);
  
  useEffect(() => {
    const existingForm = forms.find(f => f.id === formId);
    if (existingForm) {
      const hasApplicantField = existingForm.fields.some(f => f.id === applicantField.id);
      if (!hasApplicantField) {
        setForm({ ...existingForm, fields: [applicantField, ...existingForm.fields] });
      } else {
        setForm(existingForm);
      }
    } else {
      setForm({ ...defaultForm, id: formId } as FormDefinition);
    }
  }, [formId, forms]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.name === 'handlerLdap') {
      value = value.replace(/\s/g, '');
    }
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const addField = () => {
    const newField: FormField = { id: `field_${Date.now()}`, label: '', type: FieldType.TEXT, placeholder: '' };
    setForm(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };
  
  const updateField = (fieldId: string, updatedProp: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updatedProp } : f)
    }));
  };
  
  const removeField = (fieldId: string) => {
    const fieldToRemove = form.fields.find(f => f.id === fieldId);
    if (fieldToRemove?.isFixed) return;
    setForm(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== fieldId) }));
  };

  const handleSave = () => {
    // 간단한 유효성 검사
    if (!form.name.trim()) {
      alert('양식 이름을 입력해주세요.');
      return;
    }
    onSaveForm(form);
  };

  const commonInputClasses = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FFCD00] focus:border-[#FFCD00] sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium">
            <ArrowLeftIcon className="w-4 h-4" />
            관리자 패널로 돌아가기
        </button>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6 border-t border-gray-200 space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">양식 이름</label>
                    <input type="text" name="name" id="name" value={form.name} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FFCD00] focus:border-[#FFCD00] sm:text-sm" placeholder="예: 방문자 등록"/>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
                    <textarea name="description" id="description" value={form.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FFCD00] focus:border-[#FFCD00] sm:text-sm" placeholder="이 양식의 용도에 대한 간략한 설명입니다."/>
                </div>
                <div>
                    <label htmlFor="handlerLdap" className="block text-sm font-medium text-gray-700">담당자 LDAP (쉼표로 구분)</label>
                    <input type="text" name="handlerLdap" id="handlerLdap" value={form.handlerLdap || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FFCD00] focus:border-[#FFCD00] sm:text-sm" placeholder="bella.arena,jaye.sung"/>
                    <p className="mt-2 text-xs text-gray-500">요청이 생성될 담당자들의 LDAP 계정을 쉼표(,)로 구분하여 입력하세요.</p>
                </div>
            </div>

            <div className="p-6 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">양식 필드</h2>
                <div className="mt-4 space-y-4">
                    {form.fields.map((field) => (
                        <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                {/* Field Type */}
                                <div className="relative md:col-span-3">
                                    <select id={`type-${field.id}`} value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as FieldType, options: field.type === FieldType.DROPDOWN ? field.options : undefined })} className={`${commonInputClasses} appearance-none pr-8`} disabled={field.isFixed}>
                                        {Object.entries(fieldTypeDisplay).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                    </select>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute top-1/2 right-2.5 -translate-y-1/2 pointer-events-none"/>
                                </div>

                                {/* Field Label */}
                                <div className="md:col-span-4">
                                    <input type="text" id={`label-${field.id}`} value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} placeholder="제목" className={commonInputClasses} disabled={field.isFixed}/>
                                </div>
                                
                                {/* Placeholder */}
                                <div className="md:col-span-4">
                                    {(field.type === FieldType.TEXT || field.type === FieldType.TEXTAREA) && (
                                        <input type="text" id={`placeholder-${field.id}`} value={field.placeholder || ''} onChange={(e) => updateField(field.id, { placeholder: e.target.value })} placeholder="예시를 입력해주세요" className={commonInputClasses} disabled={field.isFixed}/>
                                    )}
                                </div>
                                
                                {/* Trash Button */}
                                <div className="md:col-span-1 flex items-center justify-end h-full">
                                    {!field.isFixed && (
                                    <button onClick={() => removeField(field.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                    )}
                                </div>

                                {/* Dropdown options */}
                                {(field.type === FieldType.DROPDOWN) && (
                                    <div className="md:col-span-12 mt-2">
                                        <label htmlFor={`options-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">드롭다운 옵션 (한 줄에 하나씩)</label>
                                        <textarea id={`options-${field.id}`} value={field.options?.join('\n') || ''} onChange={(e) => updateField(field.id, { options: e.target.value.split('\n') })} rows={3} className={commonInputClasses} placeholder="Option 1&#10;Option 2&#10;Option 3"/>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                 <button onClick={addField} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
                    <PlusIcon className="w-5 h-5"/>
                    필드 추가
                </button>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-[#FFCD00] text-gray-900 font-semibold py-2 px-6 rounded-lg hover:bg-[#e6b800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCD00] transition-colors"
                >
                    양식 저장
                </button>
            </div>
        </div>
    </div>
  );
};

export default FormBuilder;
