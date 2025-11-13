import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdFitnessCenter, MdCalendarToday, MdSearch, MdFilterList, MdAutoFixHigh } from 'react-icons/md';
import './GymRoutinesPage.css';

interface ExerciseInRoutine {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  restSeconds: number;
  caloriesBurned: number;
  proteinBurned: number;
  carbsBurned: number;
  fatsBurned: number;
  waterLoss: number;
}

interface GymRoutine {
  routineId: string;
  routineName: string;
  routineDescription: string;
  selectedDays: string[];
  dailyExercises: Record<string, ExerciseInRoutine[]>;
  createdAt: string;
  updatedAt: string;
}

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
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const GymRoutinesPage = () => {
  const [routines, setRoutines] = useState<GymRoutine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<GymRoutine | null>(null);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dailyExercises, setDailyExercises] = useState<Record<string, ExerciseInRoutine[]>>({});
  const [aiGenerating, setAiGenerating] = useState(false);

  // Filtered and paginated routines
  const filteredRoutines = routines.filter(routine => {
    const matchesSearch = searchTerm === '' || 
      routine.routineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.routineDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = dayFilter === '' || routine.selectedDays.includes(dayFilter);

    return matchesSearch && matchesDay;
  });

  const totalPages = Math.ceil(filteredRoutines.length / itemsPerPage);
  const paginatedRoutines = filteredRoutines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setDayFilter('');
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchRoutines();
    fetchExercises();
  }, []);

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/gym-routines`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch routines');
      const data = await response.json();
      setRoutines(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch exercises');
      const data = await response.json();
      setExercises(data);
    } catch (err: any) {
      console.error('Failed to fetch exercises:', err);
    }
  };

  const handleAddRoutine = () => {
    setEditMode(false);
    setSelectedRoutine(null);
    setRoutineName('');
    setRoutineDescription('');
    setSelectedDays([]);
    setDailyExercises({});
    setError('');
    setShowModal(true);
  };

  const handleEditRoutine = (routine: GymRoutine) => {
    setEditMode(true);
    setSelectedRoutine(routine);
    setRoutineName(routine.routineName);
    setRoutineDescription(routine.routineDescription);
    setSelectedDays(routine.selectedDays);
    setDailyExercises(routine.dailyExercises);
    setError('');
    setShowModal(true);
  };

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      const newDailyExercises = { ...dailyExercises };
      delete newDailyExercises[day];
      setDailyExercises(newDailyExercises);
    } else {
      setSelectedDays([...selectedDays, day]);
      setDailyExercises({ ...dailyExercises, [day]: [] });
    }
  };

  const handleAddExerciseToDay = (day: string, exerciseId: string) => {
    const exercise = exercises.find(ex => ex.exerciseId === exerciseId);
    if (!exercise) return;

    const newExercise: ExerciseInRoutine = {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      restSeconds: exercise.defaultRestSeconds,
      caloriesBurned: exercise.caloriesBurnedPerSet,
      proteinBurned: exercise.proteinBurnedPerSet,
      carbsBurned: exercise.carbsBurnedPerSet,
      fatsBurned: exercise.fatsBurnedPerSet,
      waterLoss: exercise.waterLossPerSet,
    };

    setDailyExercises({
      ...dailyExercises,
      [day]: [...(dailyExercises[day] || []), newExercise],
    });
  };

  const handleRemoveExerciseFromDay = (day: string, index: number) => {
    const newDayExercises = [...(dailyExercises[day] || [])];
    newDayExercises.splice(index, 1);
    setDailyExercises({
      ...dailyExercises,
      [day]: newDayExercises,
    });
  };

  const handleUpdateExerciseInDay = (day: string, index: number, field: string, value: number) => {
    const newDayExercises = [...(dailyExercises[day] || [])];
    newDayExercises[index] = { ...newDayExercises[index], [field]: value };
    setDailyExercises({
      ...dailyExercises,
      [day]: newDayExercises,
    });
  };

  const handleAIGenerate = async () => {
    if (!routineName.trim()) {
      setError('Please enter a routine name first');
      return;
    }

    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
      setError('Please configure Gemini API Key in Settings first');
      return;
    }

    setAiGenerating(true);
    setError('');

    try {
      // Prepare exercise database for AI
      const exerciseDatabase = exercises.map(ex => ({
        id: ex.exerciseId,
        name: ex.exerciseName,
        category: ex.category,
        muscleGroup: ex.muscleGroup,
        difficulty: ex.difficulty,
      }));

      const prompt = `You are a professional fitness trainer creating a gym routine. Based on the routine name "${routineName}", create a comprehensive workout plan.

AVAILABLE EXERCISES:
${JSON.stringify(exerciseDatabase, null, 2)}

RULES:
1. Choose 2-4 exercises per day that target different muscle groups for a balanced routine
2. Distribute exercises across 3-6 training days based on the routine type
3. Consider muscle group balance - don't overwork the same muscles on consecutive days
4. Match exercise difficulty and intensity to the routine name
5. Professional routine names should be clear (e.g., "Upper Body Strength", "Full Body Beginner", "Leg Day Advanced")
6. Select exercises that complement each other (e.g., compound movements first, then isolation)
7. Ensure proper recovery by alternating muscle groups

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "routineName": "Professional routine name based on the goal",
  "routineDescription": "Clear 1-2 sentence description of the routine goals and target audience",
  "selectedDays": ["Monday", "Wednesday", "Friday"],
  "dailyExercises": {
    "Monday": [
      {"exerciseId": "id1", "exerciseName": "name1"},
      {"exerciseId": "id2", "exerciseName": "name2"}
    ],
    "Wednesday": [
      {"exerciseId": "id3", "exerciseName": "name3"}
    ]
  }
}

Important: Only use exerciseId values from the AVAILABLE EXERCISES list above. Choose exercises that make sense together.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error('API rate limit reached. Please wait a moment and try again.');
        }
        throw new Error(errorData.error?.message || 'Failed to generate routine with AI');
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response (remove markdown if present)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      const aiRoutine = JSON.parse(jsonText);

      // Set the basic info
      setRoutineName(aiRoutine.routineName);
      setRoutineDescription(aiRoutine.routineDescription);
      setSelectedDays(aiRoutine.selectedDays);

      // Build dailyExercises with full exercise data
      const fullDailyExercises: Record<string, ExerciseInRoutine[]> = {};
      
      for (const day of aiRoutine.selectedDays) {
        const dayExercises = aiRoutine.dailyExercises[day] || [];
        fullDailyExercises[day] = dayExercises.map((aiEx: any) => {
          const fullExercise = exercises.find(ex => ex.exerciseId === aiEx.exerciseId);
          if (!fullExercise) {
            console.warn(`Exercise ${aiEx.exerciseId} not found`);
            return null;
          }
          
          return {
            exerciseId: fullExercise.exerciseId,
            exerciseName: fullExercise.exerciseName,
            sets: fullExercise.defaultSets,
            reps: fullExercise.defaultReps,
            restSeconds: fullExercise.defaultRestSeconds,
            caloriesBurned: fullExercise.caloriesBurnedPerSet,
            proteinBurned: fullExercise.proteinBurnedPerSet,
            carbsBurned: fullExercise.carbsBurnedPerSet,
            fatsBurned: fullExercise.fatsBurnedPerSet,
            waterLoss: fullExercise.waterLossPerSet,
          };
        }).filter(Boolean) as ExerciseInRoutine[];
      }

      setDailyExercises(fullDailyExercises);

    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setError(err.message || 'Failed to generate routine with AI');
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
        ? `${import.meta.env.VITE_BACKEND_URL}/gym-routines/${selectedRoutine?.routineId}`
        : `${import.meta.env.VITE_BACKEND_URL}/gym-routines`;

      const method = editMode ? 'PUT' : 'POST';

      const payload = {
        routineName,
        routineDescription,
        selectedDays,
        dailyExercises,
      };

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
        throw new Error(data.message || 'Failed to save routine');
      }

      const savedRoutine = await response.json();

      console.log('=== ROUTINE SAVED ===');
      console.log('Edit Mode:', editMode);
      console.log('Response:', savedRoutine);
      console.log('Saved Routine ID:', savedRoutine.routine?.routineId || savedRoutine.routineId);
      console.log('Daily Exercises:', dailyExercises);

      // Extract routineId from response (might be nested in .routine)
      const routineId = savedRoutine.routine?.routineId || savedRoutine.routineId;

      // If editing, sync changes to existing workout progress documents
      if (editMode && routineId) {
        console.log('Starting sync process...');
        try {
          // Sync each day's exercises to existing progress
          for (const day of Object.keys(dailyExercises)) {
            if (dailyExercises[day].length > 0) {
              console.log(`Syncing ${day} with ${dailyExercises[day].length} exercises...`);
              
              const syncResponse = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/workout-progress/sync-routine/${routineId}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    dayOfWeek: day,
                    exercises: dailyExercises[day],
                  }),
                }
              );

              if (syncResponse.ok) {
                const syncResult = await syncResponse.json();
                console.log(`Sync result for ${day}:`, syncResult);
              } else {
                console.error(`Failed to sync ${day}:`, await syncResponse.text());
              }
            }
          }
          console.log('✅ Synced routine changes to existing workout progress');
        } catch (syncErr) {
          console.error('❌ Failed to sync routine to progress:', syncErr);
          // Don't fail the whole operation if sync fails
        }
      } else {
        console.log('Skipping sync - editMode:', editMode, 'routineId:', routineId);
      }

      setShowModal(false);
      await fetchRoutines();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this routine?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/gym-routines/${routineId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete routine');
      await fetchRoutines();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="gym-routines-page">
      <div className="routines-header">
        <div>
          <h1>Gym Routines</h1>
          <p>{filteredRoutines.length} routines • {totalPages} pages</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddRoutine}>
          <MdAdd /> Add Routine
        </button>
      </div>

      <div className="routines-controls">
        <div className="search-box-enhanced">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search routines by name or description..."
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
            value={dayFilter} 
            onChange={(e) => { setDayFilter(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="">All Days</option>
            {DAYS_OF_WEEK.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>

          {(searchTerm || dayFilter) && (
            <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>
              <MdClose /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && !showModal && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}><MdClose /></button>
        </div>
      )}

      {loading && !showModal ? (
        <div className="loading">Loading routines...</div>
      ) : (
        <>
          <div className="routines-container">
            <div className="routines-grid">
              {paginatedRoutines.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">🏋️</div>
                  <h3>No routines found</h3>
                  <p>Try adjusting your filters or create a new routine</p>
                </div>
              ) : (
                paginatedRoutines.map((routine) => (
                  <div key={routine.routineId} className="routine-card">
                    <div className="routine-card-header">
                      <h3><MdFitnessCenter /> {routine.routineName}</h3>
                      <p>{routine.routineDescription}</p>
                    </div>

                    <div className="routine-card-body">
                      <div className="routine-days">
                        <MdCalendarToday />
                        <span>{routine.selectedDays.join(', ')}</span>
                      </div>

                      <div className="routine-summary">
                        {routine.selectedDays.map(day => (
                          <div key={day} className="day-summary">
                            <strong>{day}</strong>
                            <span>{(routine.dailyExercises[day] || []).length} exercises</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="routine-actions">
                      <button className="btn-action btn-action-edit" onClick={() => handleEditRoutine(routine)}>
                        <MdEdit /> Edit
                      </button>
                      <button className="btn-action btn-action-delete" onClick={() => handleDeleteRoutine(routine.routineId)}>
                        <MdDelete /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {filteredRoutines.length > 0 && (
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
          <div className="modal-content-routine" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Routine' : 'Add New Routine'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>

            {error && (
              <div className="modal-error-banner">
                <span>{error}</span>
                <button onClick={() => setError('')}><MdClose /></button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="routine-form">
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Basic Information</h3>
                  <button
                    type="button"
                    className="btn-ai"
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !routineName.trim()}
                    title="AI will auto-fill routine details and select exercises based on the routine name"
                  >
                    <MdAutoFixHigh /> {aiGenerating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <div className="input-group">
                  <label className="input-label">Routine Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    required
                    placeholder="e.g., Full Body Strength, Upper Body Power, Beginner Program"
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    💡 Enter a routine name, then click AI Generate to auto-fill everything
                  </small>
                </div>

                <div className="input-group">
                  <label className="input-label">Description *</label>
                  <textarea
                    className="input-field textarea"
                    value={routineDescription}
                    onChange={(e) => setRoutineDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe this routine..."
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Select Training Days</h3>
                <div className="days-grid">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`day-btn ${selectedDays.includes(day) ? 'active' : ''}`}
                      onClick={() => handleDayToggle(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Daily Exercises</h3>
                {selectedDays.length === 0 ? (
                  <p className="hint-text">Select training days above to add exercises</p>
                ) : (
                  selectedDays.map(day => (
                    <div key={day} className="day-exercises-section">
                      <h4>{day}</h4>
                      
                      <div className="add-exercise-row">
                        <select
                          className="input-field"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddExerciseToDay(day, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">+ Add Exercise</option>
                          {exercises.map(ex => (
                            <option key={ex.exerciseId} value={ex.exerciseId}>
                              {ex.exerciseName} ({ex.muscleGroup})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="exercises-list">
                        {(dailyExercises[day] || []).map((exercise, index) => (
                          <div key={index} className="exercise-item">
                            <div className="exercise-item-header">
                              <strong>{exercise.exerciseName}</strong>
                              <button
                                type="button"
                                className="btn-remove"
                                onClick={() => handleRemoveExerciseFromDay(day, index)}
                              >
                                <MdClose />
                              </button>
                            </div>
                            <div className="exercise-item-fields">
                              <div className="field-group">
                                <label>Sets</label>
                                <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'sets', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                              <div className="field-group">
                                <label>Reps</label>
                                <input
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'reps', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                              <div className="field-group">
                                <label>Rest (s)</label>
                                <input
                                  type="number"
                                  value={exercise.restSeconds}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'restSeconds', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                              <div className="field-group">
                                <label>Calories</label>
                                <input
                                  type="number"
                                  value={exercise.caloriesBurned}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'caloriesBurned', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                              <div className="field-group">
                                <label>Protein (g)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={exercise.proteinBurned}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'proteinBurned', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                              <div className="field-group">
                                <label>Carbs (g)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={exercise.carbsBurned}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'carbsBurned', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                              <div className="field-group">
                                <label>Fats (g)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={exercise.fatsBurned}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'fatsBurned', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                              <div className="field-group">
                                <label>Water (L)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={exercise.waterLoss}
                                  onChange={(e) => handleUpdateExerciseInDay(day, index, 'waterLoss', Number(e.target.value))}
                                  className="input-field-small"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editMode ? 'Update Routine' : 'Create Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymRoutinesPage;
