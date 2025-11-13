import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch, MdCheckCircle, MdCancel, MdCalendarToday, MdViewList } from 'react-icons/md';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './WorkoutProgressPage.css';

interface ExerciseCompletion {
  exerciseId: string;
  exerciseName: string;
  isCompleted: boolean;
  completedAt?: string;
  setsCompleted: number;
  repsPerSet: number[];
  caloriesBurned: number;
  proteinBurned: number;
  carbsBurned: number;
  fatsBurned: number;
  waterLoss: number;
  notes?: string;
}

interface WorkoutProgress {
  progressId: string;
  userId: string;
  planId: string;
  routineId: string;
  date: string;
  dayOfWeek: string;
  exercises: ExerciseCompletion[];
  totalCaloriesBurned: number;
  totalProteinBurned: number;
  totalCarbsBurned: number;
  totalFatsBurned: number;
  totalWaterLoss: number;
  completedExercises: number;
  totalExercises: number;
  completionPercentage: number;
  isCompleted: boolean;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
}

interface Plan {
  planId: string;
  planName: string;
}

interface Routine {
  routineId: string;
  routineName: string;
  dailyExercises: any;
}

interface Exercise {
  exerciseId: string;
  exerciseName: string;
  defaultSets: number;
  defaultReps: number;
  caloriesBurnedPerSet: number;
  proteinBurnedPerSet: number;
  carbsBurnedPerSet: number;
  fatsBurnedPerSet: number;
  waterLossPerSet: number;
}

const WorkoutProgressPage = () => {
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgress, setSelectedProgress] = useState<WorkoutProgress | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [usersWithProgress, setUsersWithProgress] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    planId: '',
    routineId: '',
    date: '',
    dayOfWeek: '',
    exercises: [] as ExerciseCompletion[],
    isCompleted: false,
    markedBy: '',
  });

  useEffect(() => {
    fetchWorkoutProgress();
    fetchUsers();
    fetchPlans();
    fetchRoutines();
    fetchExercises();
    fetchSubscriptions();
  }, []);

  const fetchWorkoutProgress = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/workout-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workout progress');
      }

      const data = await response.json();
      setWorkoutProgress(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/plans`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
    }
  };

  const fetchRoutines = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/gym-routines`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRoutines(data);
      }
    } catch (err) {
      console.error('Failed to fetch routines', err);
    }
  };

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (err) {
      console.error('Failed to fetch exercises', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    }
  };

  const handleAddProgress = async (prefilledDate?: Date) => {
    setEditMode(false);
    setSelectedProgress(null);
    const dateToUse = prefilledDate || new Date();
    
    // Format date in local timezone to avoid UTC conversion issues
    const year = dateToUse.getFullYear();
    const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const dayOfWeek = dateToUse.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get admin email from token
    const adminEmail = localStorage.getItem('adminEmail') || 'admin@system.com';
    
    setFormData({
      userId: '',
      planId: '',
      routineId: '',
      date: today,
      dayOfWeek: dayOfWeek,
      exercises: [],
      isCompleted: false,
      markedBy: adminEmail,
    });
    setAvailableExercises([]);
    setSelectedRoutine(null);
    
    // Check which users already have progress for today
    await checkUsersWithProgress(today);
    
    setShowFormModal(true);
  };

  const checkUsersWithProgress = async (date: string) => {
    // Check the workoutProgress array and map userId (could be email or UID)
    const usersSet = new Set<string>();
    const dateOnly = date.split('T')[0]; // Get date part only (YYYY-MM-DD)
    
    workoutProgress.forEach(progress => {
      const progressDateOnly = progress.date.split('T')[0];
      if (progressDateOnly === dateOnly) {
        // Handle both old records (email) and new records (UID)
        const user = users.find(u => u.uid === progress.userId || u.email === progress.userId);
        if (user) {
          usersSet.add(user.uid); // Always store UID in the set
        }
      }
    });

    setUsersWithProgress(usersSet);
  };

  const handleUserSelect = async (userUid: string) => {
    // Store UID as userId, not email
    setFormData({ ...formData, userId: userUid, planId: '', routineId: '', exercises: [] });
    setAvailableExercises([]);
    setSelectedRoutine(null);

    if (!userUid) return;

    try {
      const token = localStorage.getItem('adminToken');
      
      // Find the user by uid
      const selectedUser = users.find(u => u.uid === userUid);
      if (!selectedUser) return;
      
      // Fetch active subscription for the user using uid
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/subscriptions/user/${selectedUser.uid}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const subscriptions = await response.json();
        const activeSubscription = subscriptions.find((sub: any) => sub.isActive);

        if (activeSubscription) {
          // Auto-select the plan from active subscription
          await handlePlanSelect(activeSubscription.planId, userUid);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user subscription', err);
    }
  };

  const handlePlanSelect = async (planId: string, userId?: string) => {
    const currentUserId = userId || formData.userId;
    const currentDayOfWeek = formData.dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    setFormData({ ...formData, planId, routineId: '', exercises: [], userId: currentUserId, dayOfWeek: currentDayOfWeek });
    setAvailableExercises([]);
    setSelectedRoutine(null);

    if (!planId) return;

    try {
      const token = localStorage.getItem('adminToken');
      // Fetch plan to get routineId
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/plans/${planId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const plan = await response.json();
        if (plan.gymRoutineId) {
          // Auto-select the routine from plan
          await handleRoutineSelect(plan.gymRoutineId, currentUserId, planId, currentDayOfWeek);
        }
      }
    } catch (err) {
      console.error('Failed to fetch plan details', err);
    }
  };

  const handleRoutineSelect = async (routineId: string, userId?: string, planId?: string, dayOfWeek?: string) => {
    const currentUserId = userId || formData.userId;
    const currentPlanId = planId || formData.planId;
    const currentDayOfWeek = dayOfWeek || formData.dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = formData.date;

    if (!routineId) {
      setAvailableExercises([]);
      setSelectedRoutine(null);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      // Fetch routine to get exercises for the selected day
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/gym-routines/${routineId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const routine = await response.json();
        setSelectedRoutine(routine);

        // Get exercises for the current day from dailyExercises
        const dayExercises = routine.dailyExercises?.[currentDayOfWeek] || [];

        // Filter exercises list to only show exercises in this routine
        const routineExerciseIds = dayExercises.map((ex: any) => ex.exerciseId);
        const filtered = exercises.filter(ex => routineExerciseIds.includes(ex.exerciseId));
        setAvailableExercises(filtered);

        // Check if there's existing progress for this user on this date
        let existingProgress = null;
        if (currentUserId && currentDate) {
          try {
            const progressResponse = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/workout-progress/user/${currentUserId}/date/${currentDate}`,
              {
                headers: { 'Authorization': `Bearer ${token}` },
              }
            );
            if (progressResponse.ok) {
              existingProgress = await progressResponse.json();
            }
          } catch (err) {
            console.log('No existing progress found for this date');
          }
        }

        let initializedExercises: ExerciseCompletion[];

        if (existingProgress) {
          // If progress exists, switch to edit mode
          setEditMode(true);
          setSelectedProgress(existingProgress);
          
          // Merge with required exercises
          initializedExercises = filtered.map(exercise => {
            const existingExercise = existingProgress.exercises.find(
              (ex: any) => ex.exerciseId === exercise.exerciseId
            );
            
            if (existingExercise) {
              // Use existing completion data
              return existingExercise;
            } else {
              // New exercise not in previous progress
              return {
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                isCompleted: false,
                setsCompleted: 0,
                repsPerSet: [],
                caloriesBurned: 0,
                proteinBurned: 0,
                carbsBurned: 0,
                fatsBurned: 0,
                waterLoss: 0,
                notes: '',
              };
            }
          });
        } else {
          // No existing progress, initialize empty
          initializedExercises = filtered.map(exercise => ({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            isCompleted: false,
            setsCompleted: 0,
            repsPerSet: [],
            caloriesBurned: 0,
            proteinBurned: 0,
            carbsBurned: 0,
            fatsBurned: 0,
            waterLoss: 0,
            notes: '',
          }));
        }
        
        setFormData({ 
          ...formData, 
          routineId, 
          exercises: initializedExercises, 
          userId: currentUserId, 
          planId: currentPlanId,
          dayOfWeek: currentDayOfWeek,
          isCompleted: existingProgress?.isCompleted || false,
        });
        
        console.log('Auto-populated exercises:', initializedExercises.length, 'for day:', currentDayOfWeek, 'with existing data:', !!existingProgress);
      }
    } catch (err) {
      console.error('Failed to fetch routine details', err);
    }
  };

  const handleEditProgress = async (progress: WorkoutProgress) => {
    setEditMode(true);
    setSelectedProgress(progress);
    
    // Fetch the routine to get current required exercises
    try {
      const token = localStorage.getItem('adminToken');
      const routineResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/gym-routines/${progress.routineId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (routineResponse.ok) {
        const routine = await routineResponse.json();
        setSelectedRoutine(routine);

        // Get required exercises for this day
        const dayExercises = routine.dailyExercises?.[progress.dayOfWeek] || [];
        const routineExerciseIds = dayExercises.map((ex: any) => ex.exerciseId);
        const filtered = exercises.filter(ex => routineExerciseIds.includes(ex.exerciseId));
        setAvailableExercises(filtered);

        // Merge existing progress with current routine requirements
        const mergedExercises: ExerciseCompletion[] = filtered.map(exercise => {
          const existingExercise = progress.exercises.find(
            (ex: any) => ex.exerciseId === exercise.exerciseId
          );
          
          if (existingExercise) {
            // Use existing completion data
            return existingExercise;
          } else {
            // New exercise added to routine after progress was created
            return {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              isCompleted: false,
              setsCompleted: 0,
              repsPerSet: [],
              caloriesBurned: 0,
              proteinBurned: 0,
              carbsBurned: 0,
              fatsBurned: 0,
              waterLoss: 0,
              notes: '',
            };
          }
        });

        // Check if there are new exercises that need to be added to the progress document
        const newExercises = mergedExercises.filter(
          ex => !progress.exercises.find((pEx: any) => pEx.exerciseId === ex.exerciseId)
        );

        if (newExercises.length > 0) {
          // Automatically update the progress document with new exercises
          try {
            const updateResponse = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/workout-progress/${progress.progressId}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  userId: progress.userId,
                  planId: progress.planId,
                  routineId: progress.routineId,
                  date: progress.date,
                  dayOfWeek: progress.dayOfWeek,
                  exercises: mergedExercises,
                  isCompleted: progress.isCompleted,
                  markedBy: progress.markedBy,
                }),
              }
            );

            if (updateResponse.ok) {
              const updatedProgress = await updateResponse.json();
              setSelectedProgress(updatedProgress);
              console.log(`Added ${newExercises.length} new exercise(s) to progress`);
              
              // Refresh the workout progress list
              await fetchWorkoutProgress();
            }
          } catch (err) {
            console.error('Failed to auto-update progress with new exercises', err);
          }
        }

        setFormData({
          userId: progress.userId,
          planId: progress.planId,
          routineId: progress.routineId,
          date: progress.date.split('T')[0],
          dayOfWeek: progress.dayOfWeek,
          exercises: mergedExercises,
          isCompleted: progress.isCompleted,
          markedBy: progress.markedBy,
        });
      }
    } catch (err) {
      console.error('Failed to fetch routine for edit', err);
      // Fallback to original exercises if routine fetch fails
      setFormData({
        userId: progress.userId,
        planId: progress.planId,
        routineId: progress.routineId,
        date: progress.date.split('T')[0],
        dayOfWeek: progress.dayOfWeek,
        exercises: progress.exercises,
        isCompleted: progress.isCompleted,
        markedBy: progress.markedBy,
      });
    }
    
    setShowFormModal(true);
  };

  const handleViewDetails = (progress: WorkoutProgress) => {
    setSelectedProgress(progress);
    setShowDetailsModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.userId || !formData.planId || !formData.routineId || !formData.date || !formData.markedBy) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.exercises.length === 0) {
      setError('Please add at least one exercise');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editMode
        ? `${import.meta.env.VITE_BACKEND_URL}/workout-progress/${selectedProgress?.progressId}`
        : `${import.meta.env.VITE_BACKEND_URL}/workout-progress`;

      // For edit mode, preserve the original date; for create mode, use current time
      const dateWithTime = editMode && selectedProgress
        ? selectedProgress.date
        : new Date(formData.date + 'T' + new Date().toTimeString().split(' ')[0]).toISOString();

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          date: dateWithTime
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save workout progress');
      }

      setShowFormModal(false);
      fetchWorkoutProgress();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExerciseChange = (index: number, field: keyof ExerciseCompletion, value: any) => {
    const updatedExercises = [...formData.exercises];
    (updatedExercises[index] as any)[field] = value;
    setFormData({ ...formData, exercises: updatedExercises });
  };

  const calculateExerciseNutrition = (index: number, setsCompleted?: number, repsPerSet?: number[]) => {
    const exercise = exercises.find(ex => ex.exerciseId === formData.exercises[index].exerciseId);
    if (exercise) {
      const updatedExercises = [...formData.exercises];
      const currentExercise = updatedExercises[index];
      
      // Use provided values or current values
      const sets = setsCompleted !== undefined ? setsCompleted : currentExercise.setsCompleted;
      const reps = repsPerSet !== undefined ? repsPerSet : currentExercise.repsPerSet;
      
      // Calculate total reps actually performed
      const totalRepsPerformed = reps.reduce((sum, rep) => sum + rep, 0);
      
      // Get default reps from exercise
      const defaultReps = exercise.defaultReps || 8;
      
      // Calculate average reps per set performed
      const avgRepsPerSet = sets > 0 ? totalRepsPerformed / sets : 0;
      
      // Calculate nutrition adjustment factor based on reps difference
      // If user does same reps as default: factor = 1
      // If user does more reps: factor > 1, if less: factor < 1
      const repsFactor = avgRepsPerSet / defaultReps;
      
      // Final calculation: (PerSetValue × NumberOfSets × RepsFactor)
      updatedExercises[index] = {
        ...currentExercise,
        setsCompleted: sets,
        repsPerSet: reps,
        caloriesBurned: parseFloat((exercise.caloriesBurnedPerSet * sets * repsFactor).toFixed(2)),
        proteinBurned: parseFloat((exercise.proteinBurnedPerSet * sets * repsFactor).toFixed(2)),
        carbsBurned: parseFloat((exercise.carbsBurnedPerSet * sets * repsFactor).toFixed(2)),
        fatsBurned: parseFloat((exercise.fatsBurnedPerSet * sets * repsFactor).toFixed(2)),
        waterLoss: parseFloat((exercise.waterLossPerSet * sets * repsFactor).toFixed(3)),
      };
      setFormData({ ...formData, exercises: updatedExercises });
    }
  };

  const handleSaveSingleExercise = async (index: number) => {
    const exercise = formData.exercises[index];
    
    if (!exercise.exerciseId) {
      setError('Exercise ID is missing');
      return;
    }

    if (!selectedProgress || !selectedProgress.progressId) {
      setError('Please save the workout progress first before saving individual exercises');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/workout-progress/${selectedProgress.progressId}/exercise/${exercise.exerciseId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(exercise),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save exercise');
      }

      const updatedProgress = await response.json();
      setSelectedProgress(updatedProgress);
      
      // Update the form with the latest data
      if (updatedProgress.exercises) {
        setFormData({ ...formData, exercises: updatedProgress.exercises });
      }

      // Refresh the workout progress list to show updated counts
      await fetchWorkoutProgress();

      alert(`${exercise.exerciseName} saved successfully!`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProgress = async (progressId: string) => {
    if (!confirm('Are you sure you want to delete this workout progress?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/workout-progress/${progressId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete workout progress');
      }

      fetchWorkoutProgress();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredProgress = workoutProgress.filter(progress => {
    const matchesSearch = 
      progress.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.progressId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateString = (date: Date | string | any) => {
    let d: Date;
    
    if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else if (date && typeof date === 'object' && (date._seconds || date.seconds)) {
      // Firestore Timestamp object (can have _seconds or seconds)
      const seconds = date._seconds || date.seconds;
      d = new Date(seconds * 1000);
    } else if (date && typeof date === 'object' && date.toDate) {
      // Firestore Timestamp with toDate method
      d = date.toDate();
    } else {
      console.error('Invalid date format:', date);
      return '';
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="workout-progress-page">
      <div className="page-header">
        <div>
          <h1>Workout Progress</h1>
          <p>Track user workout completions and performance</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <MdCalendarToday />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <MdViewList />
            </button>
          </div>
          <button onClick={() => handleAddProgress()} className="add-button">
            <MdAdd /> Add Progress
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {viewMode === 'list' && (
        <div className="controls-section">
          <div className="search-bar">
            <MdSearch />
            <input
              type="text"
              placeholder="Search by user, day, or progress ID..."
              value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
)}

      {viewMode === 'list' && loading ? (
        <div className="loading">Loading workout progress...</div>
      ) : viewMode === 'list' ? (
        <div className="progress-list">
          {filteredProgress.length === 0 ? (
            <div className="no-data">No workout progress found</div>
          ) : (
            filteredProgress.map((progress) => (
              <div key={progress.progressId} className="progress-card">
                <div className="progress-header">
                  <div>
                    <h3>{progress.dayOfWeek}</h3>
                    <p className="progress-date">{formatDate(progress.date)} at {formatTime(progress.date)}</p>
                    <p className="progress-user">User: {progress.userId}</p>
                  </div>
                  <div className="progress-actions">
                    <button
                      className="btn-icon btn-view"
                      onClick={() => handleViewDetails(progress)}
                      title="View Details"
                    >
                      <MdSearch />
                    </button>
                    <button
                      className="workout-edit-btn"
                      onClick={() => handleEditProgress(progress)}
                      title="Edit"
                    >
                      <MdEdit />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDeleteProgress(progress.progressId)}
                      title="Delete"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>

                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-label">Completion</span>
                    <span className="stat-value">{progress.completionPercentage}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Exercises</span>
                    <span className="stat-value">{progress.completedExercises}/{progress.totalExercises}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Calories</span>
                    <span className="stat-value">{progress.totalCaloriesBurned}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Status</span>
                    <span className={`badge ${progress.isCompleted ? 'badge-completed' : 'badge-incomplete'}`}>
                      {progress.isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progress.completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {viewMode === 'calendar' && (
        <div className="calendar-view">
          <Calendar
            value={selectedDate}
            onChange={(value) => {
              const date = value as Date;
              setSelectedDate(date);
              setShowDayModal(true);
            }}
            tileClassName={({ date }) => {
              const dateStr = getLocalDateString(date);
              const hasProgress = workoutProgress.some(p => {
                const progressDateStr = getLocalDateString(p.date);
                return progressDateStr === dateStr;
              });
              return hasProgress ? 'has-progress' : '';
            }}
            tileContent={({ date }) => {
              const dateStr = getLocalDateString(date);
              const dayProgress = workoutProgress.filter(p => {
                const progressDateStr = getLocalDateString(p.date);
                return progressDateStr === dateStr;
              });
              if (dayProgress.length > 0) {
                return <div className="progress-indicator">{dayProgress.length}</div>;
              }
              return null;
            }}
          />
        </div>
      )}

      {showDayModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Workouts on {formatDate(selectedDate.toISOString())}</h2>
              <button className="btn-close" onClick={() => setShowDayModal(false)}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <button 
                  onClick={() => {
                    setShowDayModal(false);
                    handleAddProgress(selectedDate);
                  }}
                  className="add-button"
                  style={{ width: '100%' }}
                >
                  <MdAdd /> Add Progress for this Day
                </button>
              </div>
              
              {(() => {
                const dateStr = getLocalDateString(selectedDate);
                const dayProgress = workoutProgress.filter(p => {
                  const progressDateStr = getLocalDateString(p.date);
                  return progressDateStr === dateStr;
                });
                
                if (dayProgress.length === 0) {
                  return <div className="no-data">No workouts on this day</div>;
                }

                return (
                  <div className="progress-list">
                    {dayProgress.map((progress) => (
                      <div key={progress.progressId} className="progress-card">
                        <div className="progress-header">
                          <div>
                            <h3>{progress.dayOfWeek}</h3>
                            <p className="progress-date">{formatDate(progress.date)} at {formatTime(progress.date)}</p>
                            <p className="progress-user">User: {progress.userId}</p>
                          </div>
                          <div className="progress-actions">
                            <button
                              className="btn-icon btn-view"
                              onClick={() => {
                                setShowDayModal(false);
                                handleViewDetails(progress);
                              }}
                              title="View Details"
                            >
                              <MdSearch />
                            </button>
                            <button
                              className="workout-edit-btn"
                              onClick={() => {
                                setShowDayModal(false);
                                handleEditProgress(progress);
                              }}
                              title="Edit"
                            >
                              <MdEdit />
                            </button>
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleDeleteProgress(progress.progressId)}
                              title="Delete"
                            >
                              <MdDelete />
                            </button>
                          </div>
                        </div>

                        <div className="progress-stats">
                          <div className="stat-item">
                            <span className="stat-label">Completion</span>
                            <span className="stat-value">{progress.completionPercentage}%</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Exercises</span>
                            <span className="stat-value">{progress.completedExercises}/{progress.totalExercises}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Calories</span>
                            <span className="stat-value">{progress.totalCaloriesBurned}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Status</span>
                            <span className={`status-badge ${progress.isCompleted ? 'completed' : 'incomplete'}`}>
                              {progress.isCompleted ? <><MdCheckCircle /> Completed</> : <><MdCancel /> Incomplete</>}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedProgress && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Workout Details - {selectedProgress.dayOfWeek}</h2>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              <div className="details-summary">
                <div className="summary-item">
                  <span className="label">Date:</span>
                  <span>{formatDate(selectedProgress.date)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">User:</span>
                  <span>{selectedProgress.userId}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Completion:</span>
                  <span>{selectedProgress.completionPercentage}%</span>
                </div>
              </div>

              <div className="totals-grid">
                <div className="total-card">
                  <span className="total-label">Calories Burned</span>
                  <span className="total-value">{selectedProgress.totalCaloriesBurned}</span>
                </div>
                <div className="total-card">
                  <span className="total-label">Protein Burned</span>
                  <span className="total-value">{selectedProgress.totalProteinBurned}g</span>
                </div>
                <div className="total-card">
                  <span className="total-label">Carbs Burned</span>
                  <span className="total-value">{selectedProgress.totalCarbsBurned}g</span>
                </div>
                <div className="total-card">
                  <span className="total-label">Fats Burned</span>
                  <span className="total-value">{selectedProgress.totalFatsBurned}g</span>
                </div>
                <div className="total-card">
                  <span className="total-label">Water Loss</span>
                  <span className="total-value">{selectedProgress.totalWaterLoss}L</span>
                </div>
              </div>

              <h3 className="exercises-title">Exercises</h3>
              <div className="exercises-list">
                {selectedProgress.exercises.map((exercise, index) => (
                  <div key={index} className={`exercise-item ${exercise.isCompleted ? 'completed' : 'skipped'}`}>
                    <div className="exercise-header">
                      <div className="exercise-name">
                        {exercise.isCompleted ? (
                          <MdCheckCircle className="icon-completed" />
                        ) : (
                          <MdCancel className="icon-skipped" />
                        )}
                        <span>{exercise.exerciseName}</span>
                      </div>
                      {exercise.completedAt && (
                        <span className="exercise-time">{formatTime(exercise.completedAt)}</span>
                      )}
                    </div>

                    {exercise.isCompleted && (
                      <div className="exercise-details">
                        <div className="detail">
                          <span className="detail-label">Sets:</span>
                          <span>{exercise.setsCompleted}</span>
                        </div>
                        <div className="detail">
                          <span className="detail-label">Reps:</span>
                          <span>{exercise.repsPerSet.join(', ')}</span>
                        </div>
                        <div className="detail">
                          <span className="detail-label">Calories:</span>
                          <span>{exercise.caloriesBurned}</span>
                        </div>
                        {exercise.notes && (
                          <div className="exercise-notes">
                            <span className="detail-label">Notes:</span>
                            <span>{exercise.notes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!exercise.isCompleted && exercise.notes && (
                      <div className="exercise-notes">
                        <span className="detail-label">Reason:</span>
                        <span>{exercise.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Workout Progress' : 'Add Workout Progress'}</h2>
              <button onClick={() => setShowFormModal(false)} className="close-button">
                <MdClose />
              </button>
            </div>
            {error && <div className="error-message-modal">{error}</div>}
            <form onSubmit={handleSubmitForm} className="workout-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>User *</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    required
                    disabled={editMode}
                  >
                    <option value="">Select User</option>
                    {users.map(user => {
                      const hasProgress = usersWithProgress.has(user.uid);
                      const hasActivePlan = subscriptions.some(
                        sub => sub.userId === user.uid && sub.isActive === true
                      );
                      return (
                        <option 
                          key={user.uid} 
                          value={user.uid}
                          disabled={hasProgress || !hasActivePlan}
                        >
                          {user.fullName} ({user.email}) {hasProgress ? '- Already has progress for this date' : !hasActivePlan ? '- Needs active plan' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label>Plan *</label>
                  <input
                    type="text"
                    value={plans.find(p => p.planId === formData.planId)?.planName || 'Auto-selected from user subscription'}
                    readOnly
                    className="readonly-field"
                    placeholder="Will be auto-populated"
                  />
                </div>

                <div className="form-group">
                  <label>Routine *</label>
                  <input
                    type="text"
                    value={routines.find(r => r.routineId === formData.routineId)?.routineName || 'Auto-selected from plan'}
                    readOnly
                    className="readonly-field"
                    placeholder="Will be auto-populated"
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={async (e) => {
                      const newDate = e.target.value;
                      // Fix timezone issue: create date in local timezone
                      const [year, month, day] = newDate.split('-').map(Number);
                      const localDate = new Date(year, month - 1, day);
                      const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' });
                      
                      // Check which users have progress for this new date
                      if (!editMode) {
                        checkUsersWithProgress(newDate);
                      }
                      
                      // Refresh exercises when day changes
                      if (formData.routineId && selectedRoutine && formData.userId) {
                        const token = localStorage.getItem('adminToken');
                        const dayExercises = selectedRoutine.dailyExercises?.[dayOfWeek] || [];
                        const routineExerciseIds = dayExercises.map((ex: any) => ex.exerciseId);
                        const filtered = exercises.filter(ex => routineExerciseIds.includes(ex.exerciseId));
                        setAvailableExercises(filtered);

                        // Check if there's existing progress for this date
                        let existingProgress = null;
                        try {
                          const progressResponse = await fetch(
                            `${import.meta.env.VITE_BACKEND_URL}/workout-progress/user/${formData.userId}/date/${newDate}`,
                            {
                              headers: { 'Authorization': `Bearer ${token}` },
                            }
                          );
                          if (progressResponse.ok) {
                            existingProgress = await progressResponse.json();
                          }
                        } catch (err) {
                          console.log('No existing progress found for this date');
                        }

                        let initializedExercises: ExerciseCompletion[];

                        if (existingProgress) {
                          // Switch to edit mode if progress exists
                          setEditMode(true);
                          setSelectedProgress(existingProgress);
                          
                          // Merge with existing completion data
                          initializedExercises = filtered.map(exercise => {
                            const existingExercise = existingProgress.exercises.find(
                              (ex: any) => ex.exerciseId === exercise.exerciseId
                            );
                            
                            if (existingExercise) {
                              return existingExercise;
                            } else {
                              return {
                                exerciseId: exercise.exerciseId,
                                exerciseName: exercise.exerciseName,
                                isCompleted: false,
                                setsCompleted: 0,
                                repsPerSet: [],
                                caloriesBurned: 0,
                                proteinBurned: 0,
                                carbsBurned: 0,
                                fatsBurned: 0,
                                waterLoss: 0,
                                notes: '',
                              };
                            }
                          });
                        } else {
                          // No existing progress, stay in add mode
                          setEditMode(false);
                          setSelectedProgress(null);
                          
                          // Initialize empty
                          initializedExercises = filtered.map(exercise => ({
                            exerciseId: exercise.exerciseId,
                            exerciseName: exercise.exerciseName,
                            isCompleted: false,
                            setsCompleted: 0,
                            repsPerSet: [],
                            caloriesBurned: 0,
                            proteinBurned: 0,
                            carbsBurned: 0,
                            fatsBurned: 0,
                            waterLoss: 0,
                            notes: '',
                          }));
                        }

                        setFormData({ 
                          ...formData, 
                          date: newDate, 
                          dayOfWeek, 
                          exercises: initializedExercises,
                          isCompleted: existingProgress?.isCompleted || false,
                        });
                      } else {
                        setFormData({ ...formData, date: newDate, dayOfWeek });
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Day of Week</label>
                  <input
                    type="text"
                    value={formData.dayOfWeek}
                    readOnly
                    className="readonly-field"
                  />
                </div>

                <div className="form-group">
                  <label>Marked By *</label>
                  <input
                    type="text"
                    value={formData.markedBy}
                    readOnly
                    className="readonly-field"
                    placeholder="Auto-populated from logged-in user"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isCompleted}
                      onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                    />
                    Mark as Completed
                  </label>
                </div>
              </div>

              <div className="exercises-section">
                <div className="exercises-header">
                  <h3>Required Exercises for {formData.dayOfWeek}</h3>
                </div>

                {formData.exercises.length === 0 ? (
                  <div className="no-exercises-message">
                    <p>Please select a user to load their required exercises for this day.</p>
                  </div>
                ) : (
                  <div className="exercises-list">
                    {formData.exercises.map((exercise, index) => (
                      <div key={index} className="exercise-form-item">
                        <div className="exercise-form-header">
                          <h4>{exercise.exerciseName || `Exercise ${index + 1}`}</h4>
                        </div>

                        <div className="exercise-form-grid">
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={exercise.isCompleted}
                              onChange={(e) => handleExerciseChange(index, 'isCompleted', e.target.checked)}
                            />
                            Completed
                          </label>
                        </div>

                        {exercise.exerciseId && (
                          <div className="form-group full-width">
                            <label>Default Values (for reference)</label>
                            <input
                              type="text"
                              value={`${exercises.find(ex => ex.exerciseId === exercise.exerciseId)?.defaultSets || 0} sets × ${exercises.find(ex => ex.exerciseId === exercise.exerciseId)?.defaultReps || 0} reps each`}
                              readOnly
                              className="readonly-field"
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Sets Completed *</label>
                          <input
                            type="number"
                            value={exercise.setsCompleted}
                            onChange={(e) => {
                              const sets = parseInt(e.target.value) || 0;
                              handleExerciseChange(index, 'setsCompleted', sets);
                              
                              // Adjust repsPerSet array to match number of sets
                              const currentReps = exercise.repsPerSet;
                              let newReps: number[] = [];
                              
                              if (sets > currentReps.length) {
                                // Add more entries with default value (0 or last value)
                                newReps = [...currentReps, ...Array(sets - currentReps.length).fill(0)];
                              } else {
                                // Trim to match sets
                                newReps = currentReps.slice(0, sets);
                              }
                              
                              handleExerciseChange(index, 'repsPerSet', newReps);
                              calculateExerciseNutrition(index, sets, newReps);
                            }}
                            min="0"
                            required
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Reps Per Set (one input per set)</label>
                          <div className="reps-per-set-grid">
                            {Array.from({ length: exercise.setsCompleted || 0 }).map((_, setIndex) => (
                              <div key={setIndex} className="rep-input-item">
                                <label className="rep-label">Set {setIndex + 1}</label>
                                <input
                                  type="number"
                                  value={exercise.repsPerSet[setIndex] || 0}
                                  onChange={(e) => {
                                    const newReps = [...exercise.repsPerSet];
                                    newReps[setIndex] = parseInt(e.target.value) || 0;
                                    handleExerciseChange(index, 'repsPerSet', newReps);
                                    // Recalculate nutrition when reps change
                                    calculateExerciseNutrition(index, exercise.setsCompleted, newReps);
                                  }}
                                  min="0"
                                  placeholder="Reps"
                                  className="rep-input"
                                />
                              </div>
                            ))}
                            {exercise.setsCompleted === 0 && (
                              <p className="no-sets-message">Enter number of sets first</p>
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Calories Burned</label>
                          <input
                            type="number"
                            value={exercise.caloriesBurned}
                            readOnly
                            className="readonly-field"
                          />
                        </div>

                        <div className="form-group">
                          <label>Protein Burned</label>
                          <input
                            type="number"
                            value={exercise.proteinBurned}
                            readOnly
                            className="readonly-field"
                          />
                        </div>

                        <div className="form-group">
                          <label>Carbs Burned</label>
                          <input
                            type="number"
                            value={exercise.carbsBurned}
                            readOnly
                            className="readonly-field"
                          />
                        </div>

                        <div className="form-group">
                          <label>Fats Burned</label>
                          <input
                            type="number"
                            value={exercise.fatsBurned}
                            readOnly
                            className="readonly-field"
                          />
                        </div>

                        <div className="form-group">
                          <label>Water Loss (ml)</label>
                          <input
                            type="number"
                            value={exercise.waterLoss}
                            readOnly
                            className="readonly-field"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Notes</label>
                          <textarea
                            value={exercise.notes || ''}
                            onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                            placeholder="Additional notes or reason for skipping"
                            rows={2}
                          />
                        </div>

                        {editMode && selectedProgress && (
                          <div className="form-group full-width">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleExercise(index)}
                              className="save-exercise-button"
                            >
                              <MdCheckCircle /> Save {exercise.exerciseName}
                            </button>
                          </div>
                        )}

                        {!editMode && (
                          <div className="form-group full-width">
                            <div className="save-hint">
                              💡 Tip: Create the workout first, then you can save each exercise individually
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowFormModal(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {editMode ? 'Update' : 'Create'} Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutProgressPage;
