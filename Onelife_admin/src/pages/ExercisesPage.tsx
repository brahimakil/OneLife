import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch, MdAutoFixHigh, MdGridView, MdViewList, MdFilterList } from 'react-icons/md';
import './ExercisesPage.css';

interface Exercise {
  exerciseId: string;
  exerciseName: string;
  category: string;
  muscleGroup: string;
  difficulty: string;
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
  caloriesBurnedPerSet: number;
  proteinBurnedPerSet: number;
  carbsBurnedPerSet: number;
  fatsBurnedPerSet: number;
  waterLossPerSet: number;
  description: string;
  instructions: string[];
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExerciseFormData {
  exerciseName: string;
  category: string;
  muscleGroup: string;
  difficulty: string;
  defaultSets: number | string;
  defaultReps: number | string;
  defaultRestSeconds: number | string;
  caloriesBurnedPerSet: number | string;
  proteinBurnedPerSet: number | string;
  carbsBurnedPerSet: number | string;
  fatsBurnedPerSet: number | string;
  waterLossPerSet: number | string;
  description: string;
  instructions: string;
  videoUrl: string;
}

const ExercisesPage = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 9;
  const [aiGenerating, setAiGenerating] = useState(false);
  const [nameGenerating, setNameGenerating] = useState(false);
  const [formData, setFormData] = useState<ExerciseFormData>({
    exerciseName: '',
    category: 'strength',
    muscleGroup: 'chest',
    difficulty: 'intermediate',
    defaultSets: '',
    defaultReps: '',
    defaultRestSeconds: '',
    caloriesBurnedPerSet: '',
    proteinBurnedPerSet: '',
    carbsBurnedPerSet: '',
    fatsBurnedPerSet: '',
    waterLossPerSet: '',
    description: '',
    instructions: '',
    videoUrl: '',
  });
  const [error, setError] = useState('');

  // Filtered and paginated exercises
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = searchTerm === '' || 
      exercise.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || exercise.category === categoryFilter;
    const matchesMuscleGroup = muscleGroupFilter === '' || exercise.muscleGroup === muscleGroupFilter;
    const matchesDifficulty = difficultyFilter === '' || exercise.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesMuscleGroup && matchesDifficulty;
  });

  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setMuscleGroupFilter('');
    setDifficultyFilter('');
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exercises');
      }

      const data = await response.json();
      setExercises(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    setEditMode(false);
    setSelectedExercise(null);
    setFormData({
      exerciseName: '',
      category: 'strength',
      muscleGroup: 'chest',
      difficulty: 'intermediate',
      defaultSets: '',
      defaultReps: '',
      defaultRestSeconds: '',
      caloriesBurnedPerSet: '',
      proteinBurnedPerSet: '',
      carbsBurnedPerSet: '',
      fatsBurnedPerSet: '',
      waterLossPerSet: '',
      description: '',
      instructions: '',
      videoUrl: '',
    });
    setShowModal(true);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditMode(true);
    setSelectedExercise(exercise);
    setFormData({
      exerciseName: exercise.exerciseName,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      difficulty: exercise.difficulty,
      defaultSets: exercise.defaultSets,
      defaultReps: exercise.defaultReps,
      defaultRestSeconds: exercise.defaultRestSeconds,
      caloriesBurnedPerSet: exercise.caloriesBurnedPerSet,
      proteinBurnedPerSet: exercise.proteinBurnedPerSet,
      carbsBurnedPerSet: exercise.carbsBurnedPerSet,
      fatsBurnedPerSet: exercise.fatsBurnedPerSet,
      waterLossPerSet: exercise.waterLossPerSet,
      description: exercise.description,
      instructions: exercise.instructions.join('\n'),
      videoUrl: exercise.videoUrl || '',
    });
    setShowModal(true);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/exercises/${exerciseId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete exercise');
      }

      await fetchExercises();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerateExerciseName = async () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
      setError('Please configure your Gemini API key in Settings first');
      return;
    }

    setNameGenerating(true);
    setError('');

    try {
      // Get existing exercises with same category, muscle group, and difficulty
      const existingExercises = exercises.filter(ex => 
        ex.category === formData.category &&
        ex.muscleGroup === formData.muscleGroup &&
        ex.difficulty === formData.difficulty
      );

      const existingNames = existingExercises.map(ex => ex.exerciseName);

      const prompt = `Generate a unique exercise name for:
- Category: ${formData.category}
- Muscle Group: ${formData.muscleGroup}
- Difficulty: ${formData.difficulty}

EXISTING EXERCISES (do NOT suggest any of these):
${existingNames.length > 0 ? existingNames.join('\n') : 'None'}

REQUIREMENTS:
1. Must be a real, practical exercise appropriate for ${formData.muscleGroup}
2. Must match ${formData.difficulty} difficulty level
3. Must fit ${formData.category} category
4. Must NOT be in the existing exercises list above
5. Return ONLY the exercise name, nothing else

Examples of good exercise names:
- Bench Press
- Incline Dumbbell Press
- Cable Crossover
- Diamond Push-Ups
- Decline Barbell Press

Return ONLY the exercise name (2-5 words maximum):`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate exercise name');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const exerciseName = text.trim().replace(/['"]/g, '');

      setFormData({
        ...formData,
        exerciseName: exerciseName
      });

    } catch (err: any) {
      setError(err.message || 'Failed to generate exercise name');
    } finally {
      setNameGenerating(false);
    }
  };

  const handleAIGenerate = async () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
      setError('Please configure your Gemini API key in Settings first');
      return;
    }

    if (!formData.exerciseName) {
      setError('Please enter an exercise name first');
      return;
    }

    setAiGenerating(true);
    setError('');

    try {
      const prompt = `Analyze the exercise "${formData.exerciseName}" and provide complete details in JSON format.

IMPORTANT INSTRUCTIONS:
1. Based on the exercise name, automatically determine the correct muscle group from this EXACT list (lowercase only):
   - chest
   - back
   - legs
   - arms
   - shoulders
   - core
   - full-body

2. Based on the exercise name, determine the appropriate category from this EXACT list (lowercase only):
   - cardio
   - strength
   - flexibility
   - sports

3. Based on the exercise complexity, determine difficulty from this EXACT list (lowercase only):
   - beginner
   - intermediate
   - advanced

4. Respect the difficulty level selected by user: ${formData.difficulty || 'auto-detect'}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "exerciseName": "Professional name for the exercise",
  "category": "lowercase category from the list above",
  "muscleGroup": "lowercase muscle group from the list above",
  "difficulty": "${formData.difficulty || 'auto-detected difficulty'}",
  "defaultSets": number (appropriate for difficulty),
  "defaultReps": number (appropriate for difficulty),
  "defaultRestSeconds": number (appropriate for difficulty),
  "caloriesBurnedPerSet": number,
  "proteinBurnedPerSet": number (grams),
  "carbsBurnedPerSet": number (grams),
  "fatsBurnedPerSet": number (grams),
  "waterLossPerSet": number (liters),
  "description": "detailed description",
  "instructions": ["step1", "step2", "step3"]
}

CRITICAL: ALL category, muscleGroup, and difficulty values MUST be lowercase!

Examples for reference:
- "bench press" → muscleGroup: "chest", category: "strength"
- "pull ups" → muscleGroup: "back", category: "strength"
- "squats" → muscleGroup: "legs", category: "strength"
- "bicep curls" → muscleGroup: "arms", category: "strength"
- "plank" → muscleGroup: "core", category: "strength"
- "running" → muscleGroup: "full-body", category: "cardio"
- "yoga pose" → muscleGroup: "full-body", category: "flexibility"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate exercise data');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from the response (remove markdown if present)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const exerciseData = JSON.parse(jsonText);

      // Ask AI to suggest a YouTube search query
      const videoSearchQuery = `${formData.exerciseName} exercise tutorial proper form`;
      const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(videoSearchQuery)}`;

      // Update form with AI-generated data including auto-detected muscle group and category
      setFormData({
        ...formData,
        exerciseName: exerciseData.exerciseName || formData.exerciseName,
        category: exerciseData.category || formData.category,
        muscleGroup: exerciseData.muscleGroup || formData.muscleGroup,
        difficulty: formData.difficulty || exerciseData.difficulty, // Keep user selection if provided
        defaultSets: exerciseData.defaultSets || formData.defaultSets,
        defaultReps: exerciseData.defaultReps || formData.defaultReps,
        defaultRestSeconds: exerciseData.defaultRestSeconds || formData.defaultRestSeconds,
        caloriesBurnedPerSet: exerciseData.caloriesBurnedPerSet || formData.caloriesBurnedPerSet,
        proteinBurnedPerSet: exerciseData.proteinBurnedPerSet || formData.proteinBurnedPerSet,
        carbsBurnedPerSet: exerciseData.carbsBurnedPerSet || formData.carbsBurnedPerSet,
        fatsBurnedPerSet: exerciseData.fatsBurnedPerSet || formData.fatsBurnedPerSet,
        waterLossPerSet: exerciseData.waterLossPerSet || formData.waterLossPerSet,
        description: exerciseData.description || formData.description,
        instructions: exerciseData.instructions?.join('\n') || formData.instructions,
        videoUrl: videoUrl,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to generate exercise data');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const url = editMode
        ? `${import.meta.env.VITE_BACKEND_URL}/exercises/${selectedExercise?.exerciseId}`
        : `${import.meta.env.VITE_BACKEND_URL}/exercises`;

      const method = editMode ? 'PUT' : 'POST';

      const payload: any = {
        exerciseName: formData.exerciseName,
        category: formData.category,
        muscleGroup: formData.muscleGroup,
        difficulty: formData.difficulty,
        defaultSets: Number(formData.defaultSets),
        defaultReps: Number(formData.defaultReps),
        defaultRestSeconds: Number(formData.defaultRestSeconds),
        caloriesBurnedPerSet: Number(formData.caloriesBurnedPerSet),
        proteinBurnedPerSet: Number(formData.proteinBurnedPerSet),
        carbsBurnedPerSet: Number(formData.carbsBurnedPerSet),
        fatsBurnedPerSet: Number(formData.fatsBurnedPerSet),
        waterLossPerSet: Number(formData.waterLossPerSet),
        description: formData.description,
        instructions: formData.instructions.split('\n').filter(line => line.trim()),
      };

      // Only add videoUrl if it has a value
      if (formData.videoUrl && formData.videoUrl.trim()) {
        payload.videoUrl = formData.videoUrl;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save exercise');
      }

      setShowModal(false);
      await fetchExercises();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exercises-page">
      <div className="exercises-header">
        <div>
          <h1>Exercises Management</h1>
          <p>{filteredExercises.length} exercises • {totalPages} pages</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <MdGridView />
            </button>
            <button 
              className={`btn-toggle ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <MdViewList />
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleAddExercise}>
            <MdAdd /> Add Exercise
          </button>
        </div>
      </div>

      <div className="exercises-controls">
        <div className="search-box-enhanced">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search exercises by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-enhanced"
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <MdFilterList className="filter-icon" />
            <span className="filter-label">Filters:</span>
          </div>

          <select 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="cardio">Cardio</option>
            <option value="strength">Strength</option>
            <option value="flexibility">Flexibility</option>
            <option value="sports">Sports</option>
          </select>

          <select 
            value={muscleGroupFilter} 
            onChange={(e) => { setMuscleGroupFilter(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="">All Muscle Groups</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="legs">Legs</option>
            <option value="arms">Arms</option>
            <option value="shoulders">Shoulders</option>
            <option value="core">Core</option>
            <option value="full-body">Full Body</option>
          </select>

          <select 
            value={difficultyFilter} 
            onChange={(e) => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {(searchTerm || categoryFilter || muscleGroupFilter || difficultyFilter) && (
            <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>
              <MdClose /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && !showModal && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <MdClose />
          </button>
        </div>
      )}

      {loading && !showModal ? (
        <div className="loading">Loading exercises...</div>
      ) : (
        <>
          <div className={`exercises-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
            {paginatedExercises.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">📝</div>
                <h3>No exercises found</h3>
                <p>Try adjusting your filters or add a new exercise</p>
              </div>
            ) : (
              paginatedExercises.map((exercise) => (
                <div key={exercise.exerciseId} className="exercise-card-modern">
                  <div className="card-image-placeholder">
                    <span className="card-emoji">💪</span>
                  </div>
                  <div className="card-content">
                    <div className="card-header-modern">
                      <h3 className="card-title">{exercise.exerciseName}</h3>
                      <div className="card-badges">
                        <span className={`badge-modern badge-${exercise.difficulty}`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="card-meta">
                      <span className="meta-item">
                        <span className="meta-icon">🎯</span>
                        {exercise.category}
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">💪</span>
                        {exercise.muscleGroup}
                      </span>
                    </div>

                    <p className="card-description">{exercise.description}</p>

                    <div className="card-stats">
                      <div className="stat-item">
                        <div className="stat-value">{exercise.defaultSets}</div>
                        <div className="stat-label">Sets</div>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <div className="stat-value">{exercise.defaultReps}</div>
                        <div className="stat-label">Reps</div>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <div className="stat-value">{exercise.caloriesBurnedPerSet}</div>
                        <div className="stat-label">Cal/Set</div>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <div className="stat-value">{exercise.defaultRestSeconds}s</div>
                        <div className="stat-label">Rest</div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn-action btn-action-edit"
                        onClick={() => handleEditExercise(exercise)}
                      >
                        <MdEdit /> Edit
                      </button>
                      <button
                        className="btn-action btn-action-delete"
                        onClick={() => handleDeleteExercise(exercise.exerciseId)}
                      >
                        <MdDelete /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredExercises.length > 0 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Exercise' : 'Add New Exercise'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>

            {error && (
              <div className="modal-error-banner">
                <span>{error}</span>
                <button onClick={() => setError('')}>
                  <MdClose />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="exercise-form">
              <div className="ai-section">
                <div className="ai-section-header">
                  <h3>Basic Information</h3>
                  <p className="ai-hint">Select your preferences below, then use AI to auto-fill the rest</p>
                </div>
                
                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="exerciseName" className="input-label">Exercise Name *</label>
                    <input
                      id="exerciseName"
                      type="text"
                      className="input-field"
                      value={formData.exerciseName}
                      onChange={(e) => setFormData({ ...formData, exerciseName: e.target.value })}
                      required
                      placeholder="e.g., Bench Press"
                      style={{ width: '100%' }}
                    />
                    <button
                      type="button"
                      className="btn-generate-name"
                      onClick={handleGenerateExerciseName}
                      disabled={nameGenerating}
                      title="Generate unique exercise name based on category, muscle group, and difficulty"
                      style={{ marginTop: '0.75rem' }}
                    >
                      <MdAutoFixHigh /> {nameGenerating ? 'Generating...' : 'Generate'}
                    </button>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                      💡 Click "Generate" to get a unique exercise suggestion based on your selections below
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="category" className="input-label">Category *</label>
                    <select
                      id="category"
                      className="input-field"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="cardio">Cardio</option>
                      <option value="strength">Strength</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="muscleGroup" className="input-label">Muscle Group *</label>
                    <select
                      id="muscleGroup"
                      className="input-field"
                      value={formData.muscleGroup}
                      onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                      required
                    >
                      <option value="chest">Chest</option>
                      <option value="back">Back</option>
                      <option value="legs">Legs</option>
                      <option value="arms">Arms</option>
                      <option value="shoulders">Shoulders</option>
                      <option value="core">Core</option>
                      <option value="full-body">Full Body</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="difficulty" className="input-label">
                      Difficulty * 
                      <span className="label-hint">(AI will adapt to this)</span>
                    </label>
                    <select
                      id="difficulty"
                      className="input-field input-field-highlight"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      required
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="ai-button-row">
                  <button
                    type="button"
                    className="btn btn-ai btn-ai-large"
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !formData.exerciseName}
                    title="Auto-fill exercise data based on your selections"
                  >
                    <MdAutoFixHigh />
                    {aiGenerating ? 'AI is generating data...' : 'Generate Data with AI'}
                  </button>
                  <p className="ai-description">
                    AI will generate sets, reps, nutritional data, and instructions based on your difficulty selection
                  </p>
                </div>
              </div>

              <div className="form-divider"></div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="defaultSets" className="input-label">Default Sets</label>
                  <input
                    id="defaultSets"
                    type="number"
                    className="input-field"
                    value={formData.defaultSets}
                    onChange={(e) => setFormData({ ...formData, defaultSets: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="defaultReps" className="input-label">Default Reps</label>
                  <input
                    id="defaultReps"
                    type="number"
                    className="input-field"
                    value={formData.defaultReps}
                    onChange={(e) => setFormData({ ...formData, defaultReps: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="defaultRestSeconds" className="input-label">Rest (seconds)</label>
                  <input
                    id="defaultRestSeconds"
                    type="number"
                    className="input-field"
                    value={formData.defaultRestSeconds}
                    onChange={(e) => setFormData({ ...formData, defaultRestSeconds: e.target.value })}
                    required
                  />
                </div>
              </div>

              <h3 className="section-title">Nutritional Burn Data (Per Set)</h3>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="caloriesBurnedPerSet" className="input-label">Calories Burned</label>
                  <input
                    id="caloriesBurnedPerSet"
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={formData.caloriesBurnedPerSet}
                    onChange={(e) => setFormData({ ...formData, caloriesBurnedPerSet: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="proteinBurnedPerSet" className="input-label">Protein (g)</label>
                  <input
                    id="proteinBurnedPerSet"
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={formData.proteinBurnedPerSet}
                    onChange={(e) => setFormData({ ...formData, proteinBurnedPerSet: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="carbsBurnedPerSet" className="input-label">Carbs (g)</label>
                  <input
                    id="carbsBurnedPerSet"
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={formData.carbsBurnedPerSet}
                    onChange={(e) => setFormData({ ...formData, carbsBurnedPerSet: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="fatsBurnedPerSet" className="input-label">Fats (g)</label>
                  <input
                    id="fatsBurnedPerSet"
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={formData.fatsBurnedPerSet}
                    onChange={(e) => setFormData({ ...formData, fatsBurnedPerSet: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="waterLossPerSet" className="input-label">Water Loss (L)</label>
                  <input
                    id="waterLossPerSet"
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.waterLossPerSet}
                    onChange={(e) => setFormData({ ...formData, waterLossPerSet: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="description" className="input-label">Description</label>
                <textarea
                  id="description"
                  className="input-field textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="instructions" className="input-label">Instructions (one per line)</label>
                <textarea
                  id="instructions"
                  className="input-field textarea"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={5}
                  required
                  placeholder="Step 1&#10;Step 2&#10;Step 3..."
                />
              </div>

              <div className="input-group">
                <label htmlFor="videoUrl" className="input-label">
                  Video URL (optional)
                  {formData.exerciseName && (
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(formData.exerciseName + ' exercise tutorial proper form')}`, '_blank')}
                      style={{ marginLeft: '10px', fontSize: '0.85rem' }}
                    >
                      🔍 Search YouTube
                    </button>
                  )}
                </label>
                <input
                  id="videoUrl"
                  type="url"
                  className="input-field"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editMode ? 'Update Exercise' : 'Create Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisesPage;
