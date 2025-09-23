import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  X, 
  ChevronDown, 
  CheckCircle, 
  BookOpen 
} from 'lucide-react';
import { Button } from '../shared';
import { TrashIcon } from './icons';
import RatingComponent from './RatingComponent';
import { 
  Tutor, 
  TutorSession as TutorSessionType, 
  TutorCourse, 
  CourseModule, 
  LearningProgress 
} from '../../services/tutorService';

interface CourseSidebarProps {
  tutor: Tutor;
  tutorId: string;
  session: TutorSessionType;
  course: TutorCourse;
  modules: CourseModule[];
  progress: LearningProgress;
  expandedModule: number | null;
  isCourseSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleModule: (moduleId: number) => void;
  onCompleteModule: (moduleId: number) => void;
  onCompleteSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  formatTime: (timestamp: string) => string;
  getModuleStatusIcon: (moduleStatus: string, isCurrent: boolean) => React.ReactNode;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  tutor,
  tutorId,
  session,
  course,
  modules,
  progress,
  expandedModule,
  isCourseSidebarOpen,
  onToggleSidebar,
  onToggleModule,
  onCompleteModule,
  onCompleteSession,
  onDeleteSession,
  formatTime,
  getModuleStatusIcon
}) => {
  const navigate = useNavigate();

  return (
    <aside className={`fixed inset-y-0 left-0 z-[220] w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex ${isCourseSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        {/* Close button for mobile view of course sidebar */}
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="lg:hidden mr-2 p-2 text-gray-600 dark:text-gray-400">
          <X className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/tutors')} className="mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full hidden sm:inline-flex">
          <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Button>
        <img 
          src={tutor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`}
          alt={`${tutor.name} avatar`}
          className="w-10 h-10 rounded-full mr-2"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`;
          }}
        />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tutor.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{tutor.teaching_style} Tutor</p>
        </div>
      </div>

      {/* Add the Rating Component */}
      {tutorId && <RatingComponent tutorId={tutorId} />}

      {/* Course Information */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{course.topic}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{course.difficulty_level} · {course.estimated_duration}</p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-primary-600 dark:bg-primary-500 h-2.5 rounded-full" 
            style={{ width: `${progress.progress_percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{progress.progress_percentage}% complete</span>
          <span>Updated: {formatTime(progress.last_activity)}</span>
        </div>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-3 flex items-center">
          <BookOpen className="w-4 h-4 mr-1 text-primary-500" />
          Course Modules
        </h3>
        <div className="space-y-3">
          {modules.map((module) => (
            <div key={module.id} className="space-y-1">
              <div
                onClick={() => onToggleModule(module.id)}
                className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                  expandedModule === module.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {getModuleStatusIcon(module.status, progress.current_module_id === module.id)}
                
                <span className="ml-2 text-sm font-medium flex-1">{module.title}</span>
                
                <ChevronDown className={`w-5 h-5 transition-transform ${
                  expandedModule === module.id ? 'transform rotate-180' : ''
                }`} />
              </div>
              
              {expandedModule === module.id && (
                <div className="pl-8 pr-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>{typeof module.description === 'string' ? module.description : JSON.stringify(module.description)}</p>
                  {progress.current_module_id === module.id && module.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs"
                      onClick={() => onCompleteModule(module.id)} 
                    >
                      Mark as Completed
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Session Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {session.status === 'active' ? (
          <Button
            variant="outline" 
            onClick={onCompleteSession}
            className="w-full text-sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Session
          </Button>
        ) : (
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            Session completed on {formatTime(session.updated_at)}
          </div>
        )}
        
        <Button
          variant="outline" 
          size="sm"
          onClick={() => onDeleteSession(session.public_id)}
          className="mt-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30 hover:text-red-700 border border-red-200 dark:border-red-800 w-full text-sm"
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          Delete Session
        </Button>
      </div>
    </aside>
  );
};

export default CourseSidebar; 