import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { personaApi } from '../services/api';
import type { Persona } from '../types';

export default function PersonasPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const response = await personaApi.getAll();
      setPersonas(response.data.personas);
    } catch (error) {
      console.error('Failed to load personas:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSelectPersona = (personaId: string) => {
    navigate('/', { state: { personaId } });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {t('personas.title')}
          </h1>
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search') + '...'}
              className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Persona Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPersonas.map(persona => (
              <button
                key={persona.id}
                onClick={() => handleSelectPersona(persona.id)}
                className="p-5 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition text-left group"
              >
                <div className="text-5xl mb-4">{persona.avatar}</div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {getPersonaName(persona)}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {getCategoryLabel(persona.category)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
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
