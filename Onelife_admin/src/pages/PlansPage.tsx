import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch, MdFitnessCenter, MdAutoAwesome, MdViewModule, MdViewAgenda } from 'react-icons/md';
import './PlansPage.css';

interface Plan {
  planId: string;
  planName: string;
  description: string;
  dailyHydration: number;
  dailyCalories: number;
  dailyProteins: number;
  dailyCarbohydrates: number;
  dailyFats: number;
  hoursOfSleep: number;
  gymRoutineId: string;
  durationDays: number;
  createdAt: string;
  updatedAt: string;
}

interface GymRoutine {
  routineId: string;
  routineName: string;
}

const PlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [routines, setRoutines] = useState<GymRoutine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [filterRoutine, setFilterRoutine] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [filterCalories, setFilterCalories] = useState('');
  const [filterProtein, setFilterProtein] = useState('');
  const [filterCarbs, setFilterCarbs] = useState('');
  const [filterFats, setFilterFats] = useState('');
  const [filterHydration, setFilterHydration] = useState('');
  const [filterSleep, setFilterSleep] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');

  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [dailyHydration, setDailyHydration] = useState<number | string>('');
  const [dailyCalories, setDailyCalories] = useState<number | string>('');
  const [dailyProteins, setDailyProteins] = useState<number | string>('');
  const [dailyCarbohydrates, setDailyCarbohydrates] = useState<number | string>('');
  const [dailyFats, setDailyFats] = useState<number | string>('');
  const [hoursOfSleep, setHoursOfSleep] = useState<number | string>('');
  const [gymRoutineId, setGymRoutineId] = useState('');
  const [durationDays, setDurationDays] = useState<number | string>(30);
  const [aiGenerating, setAiGenerating] = useState(false);

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = searchTerm === '' ||
      plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoutine = filterRoutine === '' || plan.gymRoutineId === filterRoutine;
    
    const matchesDuration = filterDuration === '' || 
      (filterDuration === 'short' && plan.durationDays <= 30) ||
      (filterDuration === 'medium' && plan.durationDays > 30 && plan.durationDays <= 60) ||
      (filterDuration === 'long' && plan.durationDays > 60);
    
    const matchesCalories = filterCalories === '' ||
      (filterCalories === 'low' && plan.dailyCalories < 1800) ||
      (filterCalories === 'medium' && plan.dailyCalories >= 1800 && plan.dailyCalories <= 2500) ||
      (filterCalories === 'high' && plan.dailyCalories > 2500);
    
    const matchesProtein = filterProtein === '' ||
      (filterProtein === 'low' && plan.dailyProteins < 120) ||
      (filterProtein === 'medium' && plan.dailyProteins >= 120 && plan.dailyProteins <= 180) ||
      (filterProtein === 'high' && plan.dailyProteins > 180);
    
    const matchesCarbs = filterCarbs === '' ||
      (filterCarbs === 'low' && plan.dailyCarbohydrates < 150) ||
      (filterCarbs === 'medium' && plan.dailyCarbohydrates >= 150 && plan.dailyCarbohydrates <= 250) ||
      (filterCarbs === 'high' && plan.dailyCarbohydrates > 250);
    
    const matchesFats = filterFats === '' ||
      (filterFats === 'low' && plan.dailyFats < 50) ||
      (filterFats === 'medium' && plan.dailyFats >= 50 && plan.dailyFats <= 80) ||
      (filterFats === 'high' && plan.dailyFats > 80);
    
    const matchesHydration = filterHydration === '' ||
      (filterHydration === 'low' && plan.dailyHydration < 2.5) ||
      (filterHydration === 'medium' && plan.dailyHydration >= 2.5 && plan.dailyHydration <= 3.5) ||
      (filterHydration === 'high' && plan.dailyHydration > 3.5);
    
    const matchesSleep = filterSleep === '' ||
      (filterSleep === 'low' && plan.hoursOfSleep < 7) ||
      (filterSleep === 'optimal' && plan.hoursOfSleep >= 7 && plan.hoursOfSleep <= 9) ||
      (filterSleep === 'high' && plan.hoursOfSleep > 9);
    
    return matchesSearch && matchesRoutine && matchesDuration && matchesCalories && 
           matchesProtein && matchesCarbs && matchesFats && matchesHydration && matchesSleep;
  });

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchPlans();
    fetchRoutines();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/plans`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutines = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/gym-routines`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch routines');
      const data = await response.json();
      setRoutines(data);
    } catch (err: any) {
      console.error('Error fetching routines:', err);
    }
  };

  const handleGeneratePlanWithAI = async () => {
    if (!planName.trim()) {
      setError('Please enter a plan name first');
      return;
    }

    setAiGenerating(true);
    setError('');

    try {
      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) {
        setError('Please set your Gemini API key in settings');
        setAiGenerating(false);
        return;
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const routinesList = routines.map(r => `- ${r.routineName} (ID: ${r.routineId})`).join('\n');

      const prompt = `You are a fitness plan expert. Given a plan name, you need to:
1. Refine the plan name to make it professional, simple, and understandable
2. Create a brief description (2-3 sentences)
3. Suggest optimal daily nutrition targets based on the plan goal
4. Recommend lifestyle parameters (hydration, sleep, duration)
5. Select the most suitable gym routine from the available options

Plan Name Input: "${planName}"

Available Gym Routines:
${routinesList}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "planName": "refined professional name",
  "description": "clear description of the plan",
  "dailyCalories": 2000,
  "dailyProteins": 150,
  "dailyCarbohydrates": 200,
  "dailyFats": 60,
  "dailyHydration": 3.5,
  "hoursOfSleep": 8,
  "durationDays": 30,
  "gymRoutineId": "exact routine ID from the list above"
}

Guidelines:
- For weight loss: lower calories (1500-1800), higher protein, moderate carbs
- For muscle gain: higher calories (2500-3000), high protein (180-200g), higher carbs
- For maintenance: moderate calories (2000-2200), balanced macros
- Hydration: 2.5-4L depending on intensity
- Sleep: 7-9 hours
- Duration: 30-90 days depending on goal complexity
- Choose routine based on plan focus (strength, endurance, weight loss, etc.)`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      let aiData;
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        throw new Error('AI returned invalid format');
      }

      // Apply AI suggestions
      setPlanName(aiData.planName);
      setDescription(aiData.description);
      setDailyCalories(aiData.dailyCalories);
      setDailyProteins(aiData.dailyProteins);
      setDailyCarbohydrates(aiData.dailyCarbohydrates);
      setDailyFats(aiData.dailyFats);
      setDailyHydration(aiData.dailyHydration);
      setHoursOfSleep(aiData.hoursOfSleep);
      setDurationDays(aiData.durationDays);
      setGymRoutineId(aiData.gymRoutineId);

    } catch (err: any) {
      console.error('AI generation error:', err);
      if (err.message?.includes('429')) {
        setError('AI service rate limit reached. Please try again in a moment.');
      } else {
        setError(`AI generation failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const resetForm = () => {
    setPlanName('');
    setDescription('');
    setDailyHydration('');
    setDailyCalories('');
    setDailyProteins('');
    setDailyCarbohydrates('');
    setDailyFats('');
    setHoursOfSleep('');
    setGymRoutineId('');
    setDurationDays(30);
    setError('');
  };

  const handleAddPlan = () => {
    resetForm();
    setEditMode(false);
    setSelectedPlan(null);
    setShowModal(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditMode(true);
    setSelectedPlan(plan);
    setPlanName(plan.planName);
    setDescription(plan.description);
    setDailyHydration(plan.dailyHydration);
    setDailyCalories(plan.dailyCalories);
    setDailyProteins(plan.dailyProteins);
    setDailyCarbohydrates(plan.dailyCarbohydrates);
    setDailyFats(plan.dailyFats);
    setHoursOfSleep(plan.hoursOfSleep);
    setGymRoutineId(plan.gymRoutineId);
    setDurationDays(plan.durationDays);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const url = editMode
        ? `${import.meta.env.VITE_BACKEND_URL}/plans/${selectedPlan?.planId}`
        : `${import.meta.env.VITE_BACKEND_URL}/plans`;

      const method = editMode ? 'PUT' : 'POST';

      const payload = {
        planName,
        description,
        dailyHydration: Number(dailyHydration),
        dailyCalories: Number(dailyCalories),
        dailyProteins: Number(dailyProteins),
        dailyCarbohydrates: Number(dailyCarbohydrates),
        dailyFats: Number(dailyFats),
        hoursOfSleep: Number(hoursOfSleep),
        gymRoutineId,
        durationDays: Number(durationDays),
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
        throw new Error(data.message || 'Failed to save plan');
      }

      setShowModal(false);
      await fetchPlans();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/plans/${planId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete plan');
      await fetchPlans();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoutineName = (routineId: string) => {
    const routine = routines.find(r => r.routineId === routineId);
    return routine?.routineName || 'Unknown Routine';
  };

  return (
    <div className="plans-page">
      <div className="plans-header">
        <div>
          <h1>Plans</h1>
          <p>{filteredPlans.length} plans • {totalPages} pages</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <MdViewAgenda />
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <MdViewModule />
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleAddPlan}>
            <MdAdd /> Add Plan
          </button>
        </div>
      </div>

      <div className="plans-controls">
        <div className="search-box-enhanced">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search plans by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-enhanced"
          />
        </div>
      </div>

      <div className="filters-section">
        <select
          className="filter-select"
          value={filterRoutine}
          onChange={(e) => setFilterRoutine(e.target.value)}
        >
          <option value="">All Routines</option>
          {routines.map(routine => (
            <option key={routine.routineId} value={routine.routineId}>
              {routine.routineName}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterDuration}
          onChange={(e) => setFilterDuration(e.target.value)}
        >
          <option value="">All Durations</option>
          <option value="short">Short (≤ 30 days)</option>
          <option value="medium">Medium (31-60 days)</option>
          <option value="long">Long (&gt; 60 days)</option>
        </select>

        <select
          className="filter-select"
          value={filterCalories}
          onChange={(e) => setFilterCalories(e.target.value)}
        >
          <option value="">All Calories</option>
          <option value="low">Low (&lt; 1800 kcal)</option>
          <option value="medium">Medium (1800-2500 kcal)</option>
          <option value="high">High (&gt; 2500 kcal)</option>
        </select>

        <select
          className="filter-select"
          value={filterProtein}
          onChange={(e) => setFilterProtein(e.target.value)}
        >
          <option value="">All Protein</option>
          <option value="low">Low (&lt; 120g)</option>
          <option value="medium">Medium (120-180g)</option>
          <option value="high">High (&gt; 180g)</option>
        </select>

        <select
          className="filter-select"
          value={filterCarbs}
          onChange={(e) => setFilterCarbs(e.target.value)}
        >
          <option value="">All Carbs</option>
          <option value="low">Low (&lt; 150g)</option>
          <option value="medium">Medium (150-250g)</option>
          <option value="high">High (&gt; 250g)</option>
        </select>

        <select
          className="filter-select"
          value={filterFats}
          onChange={(e) => setFilterFats(e.target.value)}
        >
          <option value="">All Fats</option>
          <option value="low">Low (&lt; 50g)</option>
          <option value="medium">Medium (50-80g)</option>
          <option value="high">High (&gt; 80g)</option>
        </select>

        <select
          className="filter-select"
          value={filterHydration}
          onChange={(e) => setFilterHydration(e.target.value)}
        >
          <option value="">All Hydration</option>
          <option value="low">Low (&lt; 2.5L)</option>
          <option value="medium">Medium (2.5-3.5L)</option>
          <option value="high">High (&gt; 3.5L)</option>
        </select>

        <select
          className="filter-select"
          value={filterSleep}
          onChange={(e) => setFilterSleep(e.target.value)}
        >
          <option value="">All Sleep</option>
          <option value="low">Low (&lt; 7h)</option>
          <option value="optimal">Optimal (7-9h)</option>
          <option value="high">High (&gt; 9h)</option>
        </select>

        {(filterRoutine || filterDuration || filterCalories || filterProtein || 
          filterCarbs || filterFats || filterHydration || filterSleep) && (
          <button
            className="btn-clear-filters"
            onClick={() => {
              setFilterRoutine('');
              setFilterDuration('');
              setFilterCalories('');
              setFilterProtein('');
              setFilterCarbs('');
              setFilterFats('');
              setFilterHydration('');
              setFilterSleep('');
            }}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {error && !showModal && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}><MdClose /></button>
        </div>
      )}

      {loading && !showModal ? (
        <div className="loading">Loading plans...</div>
      ) : (
        <>
          <div className="plans-container">
            <div className={`plans-${viewMode}`}>
              {paginatedPlans.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">📋</div>
                  <h3>No plans found</h3>
                  <p>Create your first plan to get started</p>
                </div>
              ) : viewMode === 'grid' ? (
                paginatedPlans.map((plan) => (
                  <div key={plan.planId} className="plan-grid-item">
                    <div className="plan-grid-header">
                      <h4>{plan.planName}</h4>
                      <div className="plan-grid-actions">
                        <button className="btn-icon btn-edit" onClick={() => handleEditPlan(plan)} title="Edit">
                          <MdEdit />
                        </button>
                        <button className="btn-icon btn-delete" onClick={() => handleDeletePlan(plan.planId)} title="Delete">
                          <MdDelete />
                        </button>
                      </div>
                    </div>
                    <div className="plan-grid-body">
                      <div className="plan-grid-row">
                        <span className="label">Routine:</span>
                        <span className="value">{getRoutineName(plan.gymRoutineId)}</span>
                      </div>
                      <div className="plan-grid-row">
                        <span className="label">Duration:</span>
                        <span className="value">{plan.durationDays} days</span>
                      </div>
                      <div className="plan-grid-row">
                        <span className="label">Calories:</span>
                        <span className="value">{plan.dailyCalories} kcal</span>
                      </div>
                      <div className="plan-grid-row">
                        <span className="label">Protein:</span>
                        <span className="value">{plan.dailyProteins}g</span>
                      </div>
                      <div className="plan-grid-row">
                        <span className="label">Carbs:</span>
                        <span className="value">{plan.dailyCarbohydrates}g</span>
                      </div>
                      <div className="plan-grid-row">
                        <span className="label">Fats:</span>
                        <span className="value">{plan.dailyFats}g</span>
                      </div>
                      <div className="plan-grid-row">
                        <span className="label">Hydration:</span>
                        <span className="value">{plan.dailyHydration}L</span>
                      </div>
                      <div className="plan-grid-row">
                        <span className="label">Sleep:</span>
                        <span className="value">{plan.hoursOfSleep}h</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                paginatedPlans.map((plan) => (
                  <div key={plan.planId} className="plan-card">
                    <div className="plan-card-header">
                      <h3>{plan.planName}</h3>
                      <p>{plan.description}</p>
                    </div>

                    <div className="plan-card-body">
                      <div className="plan-detail">
                        <MdFitnessCenter />
                        <span>{getRoutineName(plan.gymRoutineId)}</span>
                      </div>
                      <div className="plan-stats">
                        <div className="stat">
                          <label>Duration</label>
                          <span>{plan.durationDays} days</span>
                        </div>
                        <div className="stat">
                          <label>Calories</label>
                          <span>{plan.dailyCalories} kcal</span>
                        </div>
                        <div className="stat">
                          <label>Protein</label>
                          <span>{plan.dailyProteins}g</span>
                        </div>
                        <div className="stat">
                          <label>Carbs</label>
                          <span>{plan.dailyCarbohydrates}g</span>
                        </div>
                        <div className="stat">
                          <label>Fats</label>
                          <span>{plan.dailyFats}g</span>
                        </div>
                        <div className="stat">
                          <label>Hydration</label>
                          <span>{plan.dailyHydration}L</span>
                        </div>
                        <div className="stat">
                          <label>Sleep</label>
                          <span>{plan.hoursOfSleep}h</span>
                        </div>
                      </div>
                    </div>

                    <div className="plan-actions">
                      <button className="btn-action btn-action-edit" onClick={() => handleEditPlan(plan)}>
                        <MdEdit /> Edit
                      </button>
                      <button className="btn-action btn-action-delete" onClick={() => handleDeletePlan(plan.planId)}>
                        <MdDelete /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {filteredPlans.length > 0 && (
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
          <div className="modal-content-plan" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Plan' : 'Add New Plan'}</h2>
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

            <form onSubmit={handleSubmit} className="plan-form">
              {/* AI Generation Section */}
              <div className="ai-section">
                <div className="input-group">
                  <label className="input-label">Plan Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    required
                    placeholder="e.g., Weight Loss Pro, Muscle Gain Advanced"
                  />
                </div>
                <button
                  type="button"
                  className="btn-generate-ai-full"
                  onClick={handleGeneratePlanWithAI}
                  disabled={aiGenerating || !planName.trim()}
                  title="Let AI generate all plan details automatically"
                >
                  <MdAutoAwesome />
                  {aiGenerating ? 'Generating with AI...' : 'Generate Plan with AI'}
                </button>
                <p className="ai-hint">AI will refine the name and fill all fields below automatically</p>
              </div>

              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="input-group">
                  <label className="input-label">Description *</label>
                  <textarea
                    className="input-field textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Brief description of the plan..."
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Gym Routine *</label>
                  <select
                    className="input-field"
                    value={gymRoutineId}
                    onChange={(e) => setGymRoutineId(e.target.value)}
                    required
                  >
                    <option value="">Select a routine</option>
                    {routines.map(routine => (
                      <option key={routine.routineId} value={routine.routineId}>
                        {routine.routineName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Duration (days) *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    required
                    min="1"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Nutrition Targets */}
              <div className="form-section">
                <h3>Daily Nutrition Targets</h3>
                <div className="form-grid-3">
                  <div className="input-group">
                    <label className="input-label">Calories (kcal) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={dailyCalories}
                      onChange={(e) => setDailyCalories(e.target.value)}
                      required
                      min="0"
                      placeholder="2000"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Proteins (g) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={dailyProteins}
                      onChange={(e) => setDailyProteins(e.target.value)}
                      required
                      min="0"
                      placeholder="150"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Carbs (g) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={dailyCarbohydrates}
                      onChange={(e) => setDailyCarbohydrates(e.target.value)}
                      required
                      min="0"
                      placeholder="200"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Fats (g) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={dailyFats}
                      onChange={(e) => setDailyFats(e.target.value)}
                      required
                      min="0"
                      placeholder="60"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Hydration (L) *</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={dailyHydration}
                      onChange={(e) => setDailyHydration(e.target.value)}
                      required
                      min="0"
                      placeholder="3.5"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Sleep (hours) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={hoursOfSleep}
                      onChange={(e) => setHoursOfSleep(e.target.value)}
                      required
                      min="0"
                      max="24"
                      placeholder="8"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editMode ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansPage;
