
import React, { useState, useEffect, useCallback } from 'react';
import { FormDefinition } from './types';
import AdminPortal from './components/admin/AdminPortal';
import FormBuilder from './components/admin/FormBuilder';
import UserPortal from './components/user/UserPortal';
import RequestForm from './components/user/RequestForm';
import { db } from './firebase';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';

type View = 'USER_PORTAL' | 'ADMIN_PORTAL' | 'REQUEST_FORM' | 'FORM_BUILDER';

const Header: React.FC<{ 
    activeView: View; 
    setView: (view: View) => void;
    onAdminClick: () => void;
}> = ({ activeView, setView, onAdminClick }) => {
    const isUserView = activeView === 'USER_PORTAL' || activeView === 'REQUEST_FORM';
    const isAdminView = activeView === 'ADMIN_PORTAL' || activeView === 'FORM_BUILDER';

    return (
        <header className="py-4">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="text-gray-800 font-bold text-xl">
                    서울아레나 업무요청
                </div>
                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => setView('USER_PORTAL')}
                        className={`text-sm ${isUserView ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'} hover:text-gray-900 transition-colors`}
                    >
                        사용자 포털
                    </button>
                    <button
                        onClick={onAdminClick}
                        className={`text-sm ${isAdminView ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'} hover:text-gray-900 transition-colors`}
                    >
                        관리자
                    </button>
                </div>
            </div>
        </header>
    );
};

const PasswordModal: React.FC<{
    onClose: () => void;
    onSubmit: (password: string) => void;
    error: string;
}> = ({ onClose, onSubmit, error }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        onSubmit(password);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900">관리자 접근</h3>
                    <p className="mt-1 text-sm text-gray-600">계속하려면 비밀번호를 입력하세요.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        className="mt-4 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FFCD00] focus:border-[#FFCD00] sm:text-sm"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-semibold text-gray-900 bg-[#FFCD00] rounded-md hover:bg-[#e6b800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCD00]"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('USER_PORTAL');
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 1. 앱이 시작될 때 Firestore에서 양식 데이터를 불러옵니다.
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "forms"));
        const formsData = querySnapshot.docs.map(doc => doc.data() as FormDefinition);
        setForms(formsData);
      } catch (error) {
        console.error("Error fetching forms from Firestore:", error);
        // 여기에 사용자에게 데이터 로드 실패를 알리는 UI를 추가할 수 있습니다.
      } finally {
        setIsLoading(false);
      }
    };
    fetchForms();
  }, []);

  const handleSaveForm = async (formToSave: FormDefinition) => {
    try {
      // Firestore에 저장
      await setDoc(doc(db, "forms", formToSave.id), formToSave);
      
      // 로컬 상태 업데이트
      const otherForms = forms.filter(f => f.id !== formToSave.id);
      setForms([...otherForms, formToSave]);

      navigateToAdminPortal();
    } catch (error) {
        console.error("Error saving form to Firestore:", error);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('정말로 이 양식을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        try {
            // Firestore에서 삭제
            await deleteDoc(doc(db, "forms", formId));

            // 로컬 상태 업데이트
            const updatedForms = forms.filter(f => f.id !== formId);
            setForms(updatedForms);
        } catch (error) {
            console.error("Error deleting form from Firestore:", error);
        }
    }
  };
  
  const navigateToForm = useCallback((formId: string) => {
    setCurrentFormId(formId);
    setView('REQUEST_FORM');
  }, []);

  const navigateToBuilder = useCallback((formId: string) => {
    setCurrentFormId(formId);
    setView('FORM_BUILDER');
  }, []);

  const navigateToUserPortal = useCallback(() => {
    setCurrentFormId(null);
    setView('USER_PORTAL');
  }, []);
  
  const navigateToAdminPortal = useCallback(() => {
    setCurrentFormId(null);
    setView('ADMIN_PORTAL');
  }, []);
  
  const handleAdminAuth = (password: string) => {
    if (password === 'alexbella') {
        setView('ADMIN_PORTAL');
        setIsPasswordModalOpen(false);
        setPasswordError('');
    } else {
        setPasswordError('비밀번호가 올바르지 않습니다.');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-12">데이터를 불러오는 중...</div>;
    }

    switch (view) {
      case 'USER_PORTAL':
        return <UserPortal forms={forms} onSelectForm={navigateToForm} />;
      case 'REQUEST_FORM':
        return currentFormId && <RequestForm formId={currentFormId} forms={forms} onBack={navigateToUserPortal} />;
      case 'ADMIN_PORTAL':
        return <AdminPortal forms={forms} onDeleteForm={handleDeleteForm} onEditForm={navigateToBuilder} />;
      case 'FORM_BUILDER':
        return currentFormId && <FormBuilder formId={currentFormId} forms={forms} onSaveForm={handleSaveForm} onBack={navigateToAdminPortal} />;
      default:
        return <UserPortal forms={forms} onSelectForm={navigateToForm} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
        <Header activeView={view} setView={setView} onAdminClick={() => setIsPasswordModalOpen(true)} />
        {isPasswordModalOpen && (
            <PasswordModal
                onClose={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordError('');
                }}
                onSubmit={handleAdminAuth}
                error={passwordError}
            />
        )}
        <main>
            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {renderContent()}
            </div>
        </main>
    </div>
  );
};

export default App;
