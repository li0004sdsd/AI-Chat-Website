import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Persona } from '../types';

interface PersonaSelectorProps {
  personas: Persona[];
  onSelect: (personaId: string) => void;
  onClose: () => void;
}

export default function PersonaSelector({ personas, onSelect, onClose }: PersonaSelectorProps) {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(personas.map(p => p.category)))];

  const filteredPersonas = personas.filter(persona => {
    const matchesCategory = selectedCategory === 'all' || persona.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      persona.name.toLowerCase().includes(searchLower) ||
      persona.nameEn.toLowerCase().includes(searchLower) ||
      persona.description.toLowerCase().includes(searchLower) ||
      persona.descriptionEn.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return t('personas.all');
    const persona = personas.find(p => p.category === cat);
    if (!persona) return cat;
    return i18n.language === 'zh' ? persona.category : persona.categoryEn;
  };

  const getPersonaName = (persona: Persona) => {
    return i18n.language === 'zh' ? persona.name : persona.nameEn;
  };

  const getPersonaDesc = (persona: Persona) => {
    return i18n.language === 'zh' ? persona.description : persona.descriptionEn;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('chat.choosePersona')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
            >
              ✕
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search') + '...'}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Categories */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Persona Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPersonas.map(persona => (
              <button
                key={persona.id}
                onClick={() => onSelect(persona.id)}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition text-left"
              >
                <div className="text-4xl mb-3">{persona.avatar}</div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-1 truncate">
                  {getPersonaName(persona)}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {getPersonaDesc(persona)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
