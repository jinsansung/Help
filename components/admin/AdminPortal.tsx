
import React from 'react';
import { FormDefinition } from '../../types';
import { PlusIcon, TrashIcon } from '../common/Icons';

interface AdminPortalProps {
  forms: FormDefinition[];
  onDeleteForm: (formId: string) => void;
  onEditForm: (formId: string) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ forms, onDeleteForm, onEditForm }) => {
  const createNewForm = () => {
    const newFormId = `form_${Date.now()}`;
    onEditForm(newFormId);
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-8">
        <button
          onClick={createNewForm}
          aria-label="새 양식 만들기"
          className="inline-flex items-center justify-center bg-[#FFCD00] text-gray-900 font-semibold p-2 rounded-lg hover:bg-[#e6b800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCD00]"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <ul role="list" className="divide-y divide-gray-200">
          {forms.length > 0 ? (
            forms.map((form) => (
              <li key={form.id} className="p-4 sm:p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-800 truncate">{form.name}</p>
                    <p className="text-sm text-gray-500 mt-1 truncate">{form.description}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                    <button
                        onClick={() => onEditForm(form.id)}
                        className="font-medium text-gray-700 hover:text-black"
                    >
                        수정
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={() => onDeleteForm(form.id)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-800">아직 생성된 양식이 없습니다.</h3>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AdminPortal;
