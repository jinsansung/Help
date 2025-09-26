import React from 'react';
import { FormDefinition } from '../../types';

interface UserPortalProps {
  forms: FormDefinition[];
  onSelectForm: (formId: string) => void;
}

const UserPortal: React.FC<UserPortalProps> = ({ forms, onSelectForm }) => {
  return (
    <div>
      {forms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              onClick={() => onSelectForm(form.id)}
              className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-[#FFCD00] transition-all duration-300 transform hover:-translate-y-1"
            >
              <h2 className="text-xl font-semibold text-gray-800">{form.name}</h2>
              <p className="mt-2 text-gray-500 line-clamp-2">{form.description}</p>
              <div className="mt-6">
                <span className="font-semibold text-gray-800">
                  요청 시작 &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white border border-gray-200 rounded-xl p-12">
            <h3 className="text-xl font-medium text-gray-800">사용 가능한 양식이 없습니다</h3>
        </div>
      )}
    </div>
  );
};

export default UserPortal;