import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, ChevronDown, Trash, Clock } from 'lucide-react';
import { Button, Card } from '../shared';
import studySetService, { StudySet, StudyNote } from '../../services/studySetService';

interface NotesListProps {
  studySet: StudySet;
  onUpdate: () => void;
}

const NotesList: React.FC<NotesListProps> = ({ studySet, onUpdate }) => {
  const notes = studySet.notes || [];

  // Handler functions
  const handleCreateNote = async () => {
    try {
      console.log('Creating note for study set:', studySet.title);

      // Get note details from user
      const title = prompt('Enter note title:');
      if (!title) return;

      const content = prompt('Enter note content (or leave empty to create a template):') ||
        `# ${title}\n\n## Key Points\n\n- \n\n## Summary\n\n\n\n## Questions\n\n- `;

      // Call the API to create note
      await studySetService.createNote(studySet.public_id, {
        title,
        content
      });

      // Show success message
      alert(`✅ Note created successfully!\n\n"${title}" has been added to your notes.`);

      // Refresh the study set data
      onUpdate();
    } catch (error) {
      console.error('Error creating note:', error);
      alert(`❌ Failed to create note\n\nThere was an error creating the note. Please try again.`);
    }
  };

  const handleEditNote = (note: StudyNote) => {
    console.log('Editing note:', note.title);
    // TODO: Implement note editing UI
  };

  const handleShareNote = (note: StudyNote) => {
    console.log('Sharing note:', note.title);
    // TODO: Implement note sharing
  };

  const handleDeleteNote = async (note: StudyNote) => {
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      try {
        console.log('Deleting note:', note.title);
        alert(`Deleting Note: ${note.title}\n\nThis will permanently remove the note.`);
        // TODO: Implement note deletion
        // await studySetService.deleteNote(studySet.public_id, note.public_id);
        // onUpdate();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No notes yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Generate notes from your recordings or create them manually
        </p>
        <Button
          className="flex items-center gap-2"
          onClick={handleCreateNote}
        >
          <BookOpen className="h-4 w-4" />
          Create Note
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note, index) => (
        <motion.div
          key={note.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {note.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    note.note_type === 'ai_generated'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {note.note_type === 'ai_generated' ? 'AI Generated' : 'Manual'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                  <span>{note.format_type}</span>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">#</span>
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key points */}
                {note.key_points && note.key_points.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Key Points:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {note.key_points.slice(0, 3).map((point, pointIndex) => (
                        <li key={pointIndex} className="text-sm text-gray-600 dark:text-gray-400">
                          {point}
                        </li>
                      ))}
                      {note.key_points.length > 3 && (
                        <li className="text-sm text-gray-500 dark:text-gray-500">
                          +{note.key_points.length - 3} more points...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleEditNote(note)}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleShareNote(note)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteNote(note)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div 
                className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4"
                dangerouslySetInnerHTML={{ 
                  __html: note.content.length > 200 
                    ? note.content.substring(0, 200) + '...' 
                    : note.content 
                }}
              />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default NotesList;
